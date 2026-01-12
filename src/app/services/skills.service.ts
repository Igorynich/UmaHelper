import { inject, Injectable } from '@angular/core';
import { collection, collectionData, Firestore, getDocs, query, where } from '@angular/fire/firestore';
import { forkJoin, from, Observable, of } from 'rxjs';
import { Skill } from '../interfaces/skill';
import {map, mergeMap, tap} from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class SkillsService {
  private firestore = inject(Firestore);

  private CURRENT_VERSION = 210051;

  private excludedSkillNames: string[] = [
    // 'Voltage Hero',
  ];

  // 400 should be
  getSkills(): Observable<Skill[]> {
    const skillsCollection = collection(this.firestore, 'skills');
    return from(getDocs(skillsCollection)).pipe(
      map(snapshot => {
        const skills = snapshot.docs.map(doc => doc.data() as Skill);
        return this.filterValidSkills(skills);
      })
    );
  }

  getRawSkills(): Observable<Skill[]> {
    const skillsCollection = collection(this.firestore, 'skills');
    return from(getDocs(skillsCollection)).pipe(
      map(snapshot => snapshot.docs.map(doc => doc.data() as Skill))
    );
  }

  getSkillsByIds(ids: number[]): Observable<Skill[]> {
    if (!ids || ids.length === 0) {
      return of([]);
    }

    // Firestore 'in' query is limited to 30 elements.
    const chunkSize = 30;
    const chunks: number[][] = [];
    for (let i = 0; i < ids.length; i += chunkSize) {
      chunks.push(ids.slice(i, i + chunkSize));
    }

    const skillsCollection = collection(this.firestore, 'skills');

    const chunkObservables = chunks.map(chunk => {
      const q = query(skillsCollection, where('id', 'in', chunk));
      return from(getDocs(q)).pipe(
        map(snapshot => snapshot.docs.map(doc => doc.data() as Skill)),
        tap(value => console.log('Chunk', value)),
      );
    });

    return forkJoin(chunkObservables).pipe(
      mergeMap(chunkResults => of(this.filterValidSkills(chunkResults.flat())))
    );
  }

  private filterValidSkills(skills: Skill[]): Skill[] {
    return skills.filter(skill => /*!skill.pre_evo && !skill.evo*/ skill.name_en && !this.excludedSkillNames.includes(skill.enname));
  }

  private isCurrentVersion(skillVersions: number[]): boolean {
    return true;
    return skillVersions ? skillVersions.some(version => version <= this.CURRENT_VERSION) : true;
  }
}
