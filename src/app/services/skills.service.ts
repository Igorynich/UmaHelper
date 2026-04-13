import { inject, Injectable } from '@angular/core';
import {collection, doc, Firestore, getDoc, getDocs, query, setDoc, where} from '@angular/fire/firestore';
import {combineLatest, forkJoin, from, Observable, of, shareReplay} from 'rxjs';
import { Skill } from '../interfaces/skill';
import { SkillMap } from '../interfaces/skill-map';
import {map, mergeMap, tap} from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class SkillsService {
  private firestore = inject(Firestore);
  private readonly SKILLS_COLLECTION = 'skills';
  private readonly SKILL_MAPS_COLLECTION = 'skill_maps';
  // private CURRENT_VERSION = 210051;

  private filteredSkillsCache$: Observable<Skill[]> | null = null;
  private rawSkillsCache$: Observable<Skill[]> | null = null;
  private individualSkillCache = new Map<string, { data$: Observable<Skill | null>, timestamp: number }>();
  private lastFetchTime = {raw: 0, filtered: 0};
  private readonly CACHE_DURATION = 60 * 60 * 1000; // 1 час в мс


  // 400 should be
  getSkills(): Observable<Skill[]> {
    const currentTime = Date.now();

    if (this.filteredSkillsCache$ && (currentTime - this.lastFetchTime.filtered < this.CACHE_DURATION)) {
      console.log('Returning filtered skills cache');
      return this.filteredSkillsCache$;
    }

    if (this.rawSkillsCache$ && (currentTime - this.lastFetchTime.raw < this.CACHE_DURATION)) {
      console.log('Returning raw skills cache');
      return this.rawSkillsCache$!.pipe(map(skills => this.filterValidSkills(skills)));
    }

    const skillsCollection = collection(this.firestore, this.SKILLS_COLLECTION);
    // Only filter out null values at the database level
    const q = query(skillsCollection, where('name_en', '!=', null));
    this.filteredSkillsCache$ =  from(getDocs(q)).pipe(
      map(snapshot => {
        const skills = snapshot.docs.map(doc => doc.data() as Skill);
        return this.filterValidSkills(skills);
      }),
      tap(() => this.lastFetchTime.filtered = Date.now()),
      shareReplay(1)
    );
    console.log('Fetched filtered skills');
    return this.filteredSkillsCache$;
  }

  getRawSkills(): Observable<Skill[]> {
    const currentTime = Date.now();

    if (this.rawSkillsCache$ && (currentTime - this.lastFetchTime.raw < this.CACHE_DURATION)) {
      console.log('Returning raw skills cache');
      return this.rawSkillsCache$;
    }
    const skillsCollection = collection(this.firestore, this.SKILLS_COLLECTION);
    this.rawSkillsCache$ = from(getDocs(skillsCollection)).pipe(
      map(snapshot => snapshot.docs.map(doc => doc.data() as Skill)),
      tap(() => this.lastFetchTime.raw = Date.now()),
      shareReplay(1)
    );
    console.log('Fetched raw skills');
    return this.rawSkillsCache$;
  }

  getSkillsByIds(ids: number[]): Observable<Skill[]> {
    if (!ids || ids.length === 0) {
      return of([]);
    }

    const currentTime = Date.now();

    if (this.rawSkillsCache$ && (currentTime - this.lastFetchTime.raw < this.CACHE_DURATION)) {
      console.log('Returning from raw skills cache');
      return this.rawSkillsCache$.pipe(
        map(rawSkills => {
          const filteredSkills = this.filterValidSkills(rawSkills);     // filtering to avoid displaying invalid skills
          return filteredSkills.filter(s => ids.includes(s.id));
        }
      ));
    }

    if (this.filteredSkillsCache$ && (currentTime - this.lastFetchTime.filtered < this.CACHE_DURATION)) {
      console.log('Returning from filtered skills cache');
      return this.filteredSkillsCache$.pipe(
        map(filteredSkills => {
            return filteredSkills.filter(s => ids.includes(s.id));
          }
        ));
    }

    let cachedIds: number[] = [];
    let uncachedIds: number[] = [];
    const cachedArr = ids.reduce((arr, id) => {
      const cached = this.individualSkillCache.get(id.toString());
      if (cached && (currentTime - cached.timestamp < this.CACHE_DURATION)) {
        cachedIds.push(id);
        return [...arr, cached];
      }
      uncachedIds.push(id);
      return arr;
    }, [] as { data$: Observable<Skill | null>, timestamp: number }[]);

    console.log(`Cached ${cachedIds.length} skills, uncached ${uncachedIds.length} skills`, ids);
    if (cachedIds.length === ids.length) {
      console.log('Returning all skills individual cache');
      return forkJoin(cachedArr.map(c => c.data$ as Observable<Skill>));    // combineLatest if fails
    }

    const requestIds = uncachedIds.length ? uncachedIds : ids;    // should always be uncachedIds if we got here
    // Firestore 'in' query is limited to 30 elements.
    const chunkSize = 30;
    const chunks: number[][] = [];
    for (let i = 0; i < requestIds.length; i += chunkSize) {
      chunks.push(requestIds.slice(i, i + chunkSize));
    }

    const skillsCollection = collection(this.firestore, this.SKILLS_COLLECTION);

    const chunkObservables = chunks.map(chunk => {
      const q = query(skillsCollection, where('id', 'in', chunk));
      return from(getDocs(q)).pipe(
        map(snapshot => snapshot.docs.map(doc => doc.data() as Skill)),
        // tap(value => console.log('Chunk', value)),
      );
    });

    const partCached = cachedArr.map(c => c.data$ as Observable<Skill>);
    const skills$ = forkJoin([...partCached, ...chunkObservables]).pipe(
      mergeMap(chunkResults => {
        const allSkills = this.filterValidSkills(chunkResults.flat());
        allSkills.forEach((skill: Skill) => {
          const cachedSkill = this.individualSkillCache.get(skill.id.toString());
          const cachedSkillTimestamp = cachedSkill?.timestamp || 0;
          const isTimestampUpdateRequired = (currentTime - cachedSkillTimestamp) > this.CACHE_DURATION;
          // updating timestamp only if cached skill is stale, if skill is cached and timestamp still valid - keep that timestamp
          this.individualSkillCache.set(skill.id.toString(), { data$: of(skill), timestamp: isTimestampUpdateRequired ? currentTime : cachedSkillTimestamp });
        });
        return of(allSkills
          .sort((a, b) => {
            const aIndex = ids.findIndex((id) => id === a.id);
            const bIndex = ids.findIndex((id) => id === b.id);
            return aIndex - bIndex;
          }))
      }),
      shareReplay(1)
    );
    console.log('Fetched skills by ids', requestIds);
    return skills$;
  }

  /**
   * Saves an array of SkillMaps to the Firebase skill_maps collection
   * Each SkillMap is saved independently - failures don't stop other saves
   * @param skillMaps - Array of SkillMap objects to save
   * @returns Observable with array of results: {id: number, success: boolean, error?: string}
   */
  saveSkillMaps(skillMaps: SkillMap[]): Observable<{id: number, success: boolean, error?: string}[]> {
    if (!skillMaps || skillMaps.length === 0) {
      return of([]);
    }

    const saveObservables = skillMaps.map(skillMap =>
      from(this.saveSingleSkillMap(skillMap)).pipe(
        map(result => ({ id: skillMap.id, ...result }))
      )
    );

    return forkJoin(saveObservables);
  }

  private async saveSingleSkillMap(skillMap: SkillMap): Promise<{success: boolean, error?: string}> {
    try {
      const docRef = doc(this.firestore, this.SKILL_MAPS_COLLECTION, skillMap.id.toString());
      await setDoc(docRef, skillMap);
      console.log(`Saved skill map ${skillMap.id} to Firebase`);
      return { success: true };
    } catch (error) {
      console.error(`Failed to save skill map ${skillMap.id}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Fetches a skill map by skill ID from the skill_maps collection
   * @param skillId - The skill ID to fetch the skill map for
   * @returns Observable<SkillMap | null> - The skill map or null if not found
   */
  getSkillMapById(skillId: number): Observable<SkillMap | null> {
    const docRef = doc(this.firestore, this.SKILL_MAPS_COLLECTION, skillId.toString());
    return from(getDoc(docRef)).pipe(
      map(docSnap => {
        if (docSnap.exists()) {
          return docSnap.data() as SkillMap;
        } else {
          return null;
        }
      })
    );
  }

  private filterValidSkills(skills: Skill[]): Skill[] {
    return skills.filter(skill =>
      skill.name_en &&           // Not null/undefined
      skill.name_en.trim() !== '' // Not empty or whitespace
    );
  }

  /*private isCurrentVersion(skillVersions: number[]): boolean {
    return true;
    return skillVersions ? skillVersions.some(version => version <= this.CURRENT_VERSION) : true;
  }*/
}
