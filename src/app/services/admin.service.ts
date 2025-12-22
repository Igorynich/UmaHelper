import { inject, Injectable } from '@angular/core';
import {
  collection,
  doc,
  Firestore,
  setDoc,
} from '@angular/fire/firestore';
import { HttpClient } from '@angular/common/http';
import { Skill } from '../interfaces/skill';
import { concatMap, forkJoin, from, map, Observable, of, take, tap } from 'rxjs';
import { SkillsService } from './skills.service';
import { SupportCard } from '../interfaces/support-card';
import { z, ZodError } from 'zod';
import { SupportCardSchema } from '../interfaces/support-card.schema';
import { SkillSchema } from '../interfaces/skill.schema';
import { SupportCardService } from './support-card.service';

export interface UploadProgress {
  completed: number;
  total: number;
  successful: number;
  failed: number;
}

export interface SkillComparison {
  added: Skill[];
  changed: { skillId: number; changes: any; newSkill: Skill }[];
}

export interface SupportCardComparison {
  added: SupportCard[];
  changed: { supportCardId: number; changes: any; newSupportCard: SupportCard }[];
}

@Injectable({
  providedIn: 'root',
})
export class AdminService {
  private firestore = inject(Firestore);
  private http = inject(HttpClient);
  private skillsService = inject(SkillsService);
  private supportCardService = inject(SupportCardService);

  uploadSkills(skills: Skill[]): Observable<UploadProgress> {
    return this._uploadCollection(
      skills,
      'skills',
      (item) => this.prepareSkillForUpload(item),
      (item) => item.id.toString()
    );
  }

  compareSkills(localSkills: Skill[]): Observable<SkillComparison> {
    return forkJoin({
      firebaseSkills: this.skillsService.getRawSkills().pipe(take(1)),
    }).pipe(
      map(({ firebaseSkills }) => {
        const sortedLocalSkills = localSkills.sort((a, b) => +a.id - +b.id);
        const sortedFirebaseSkills = firebaseSkills.sort((a, b) => +a.id - +b.id);

        const localSkillMap = new Map(sortedLocalSkills.map(skill => [skill.id, skill]));
        const firebaseSkillMap = new Map(sortedFirebaseSkills.map(skill => [skill.id, skill]));

        const added: Skill[] = [];
        const changed: { skillId: number; changes: any; newSkill: Skill }[] = [];

        for (const [id, localSkill] of localSkillMap.entries()) {
          if (!firebaseSkillMap.has(id)) {
            added.push(localSkill);
          } else {
            const firebaseSkill = firebaseSkillMap.get(id);

            const differences = this.deepDiff(firebaseSkill, localSkill);
            if (Object.keys(differences).length > 0) {
              changed.push({ skillId: id, changes: differences, newSkill: localSkill });
            }
          }
        }

        return { added, changed };
      })
    );
  }

  uploadChanges(changes: SkillComparison): Observable<UploadProgress> {
    const skillsToUpload = [
      ...changes.added,
      ...changes.changed.map(c => c.newSkill)
    ];
    return this.uploadSkills(skillsToUpload);
  }

  compareSupportCards(localSupportCards: SupportCard[]): Observable<SupportCardComparison> {
    return forkJoin({
      firebaseSupportCards: this.supportCardService.getRawSupportCards().pipe(take(1)),
    }).pipe(
      map(({ firebaseSupportCards }) => {
        const sortedLocalSupportCards = localSupportCards.sort((a, b) => +a.support_id - +b.support_id);
        const sortedFirebaseSupportCards = firebaseSupportCards.sort((a, b) => +a.support_id - +b.support_id);

        const localSupportCardMap = new Map(sortedLocalSupportCards.map(sc => [sc.support_id, sc]));
        const firebaseSupportCardMap = new Map(sortedFirebaseSupportCards.map(sc => [sc.support_id, sc]));

        const added: SupportCard[] = [];
        const changed: { supportCardId: number; changes: any; newSupportCard: SupportCard }[] = [];

        for (const [id, localSupportCard] of localSupportCardMap.entries()) {
          if (!firebaseSupportCardMap.has(id)) {
            added.push(localSupportCard);
          } else {
            const firebaseSupportCard = firebaseSupportCardMap.get(id);

            const differences = this.deepDiff(firebaseSupportCard, localSupportCard);
            if (Object.keys(differences).length > 0) {
              changed.push({ supportCardId: id, changes: differences, newSupportCard: localSupportCard });
            }
          }
        }

        return { added, changed };
      })
    );
  }

  uploadSupportCardChanges(changes: SupportCardComparison): Observable<UploadProgress> {
    const supportCardsToUpload = [
      ...changes.added,
      ...changes.changed.map(c => c.newSupportCard)
    ];
    return this.uploadSupportCards(supportCardsToUpload);
  }

  uploadSupportCards(supportCards: SupportCard[]): Observable<UploadProgress> {
    return this._uploadCollection(
      supportCards,
      'support_cards',
      (item) => this.prepareSupportCardForUpload(item),
      (item) => item.support_id.toString()
    );
  }

  private _uploadCollection<T>(
    items: T[],
    collectionName: string,
    prepareFn: (item: T) => any,
    idSelector: (item: T) => string
  ): Observable<UploadProgress> {
    if (!items || items.length === 0) {
      return of({ completed: 0, total: 0, successful: 0, failed: 0 });
    }

    const collectionRef = collection(this.firestore, collectionName);
    let completed = 0;
    let successful = 0;
    let failed = 0;
    const total = items.length;

    return from(items).pipe(
      concatMap(item => {
        const itemToUpload = prepareFn(item);
        const docId = idSelector(item);
        const docRef = doc(collectionRef, docId);

        return from(setDoc(docRef, itemToUpload)).pipe(
          tap({
            next: () => {
              successful++;
              completed++;
            },
            error: (err) => {
              console.error(`Failed to upload item ${docId}:`, err);
              failed++;
              completed++;
            },
          }),
          map(() => ({ completed, total, successful, failed }))
        );
      })
    );
  }

  private prepareSkillForUpload(skill: Skill): Partial<Skill> {
    const allowedKeys: (keyof Skill)[] = [
      'id', 'activation', 'char', 'condition_groups', 'cost', 'desc_en', 'desc_ko',
      'desc_tw', 'endesc', 'enname', 'iconid', 'jpdesc', 'jpname', 'name_en',
      'name_ko', 'name_tw', 'rarity', 'type'
    ];

    return allowedKeys.reduce((acc, key) => {
      const value = skill[key];
      if (value !== undefined) {
        // The 'as any' is needed here because TypeScript can't quite follow
        // the dynamic assignment to the accumulator 'acc'.
        (acc as any)[key] = value;
      }
      return acc;
    }, {} as Partial<Skill>);
  }

  private prepareSupportCardForUpload(supportCard: SupportCard): any {
    const { effects, ...rest } = supportCard;
    const effectsAsObjects = effects.map(effectArray => ({ values: effectArray }));
    return { ...rest, effects: effectsAsObjects };
  }

  private deepDiff(obj1: any, obj2: any): any {
    const changes: { [key: string]: any } = {};

    const buildPath = (path: string, key: string) => (path ? `${path}.${key}` : key);

    const findDifferences = (o1: any, o2: any, path = '') => {
      if (o1 === o2) return;

      if (o1 === null || o2 === null || typeof o1 !== 'object' || typeof o2 !== 'object') {
        if (o1 !== o2) {
          changes[path] = { oldValue: o1, newValue: o2 };
        }
        return;
      }

      const keys1 = new Set(Object.keys(o1));
      const keys2 = new Set(Object.keys(o2));

      for (const key of keys1) {
        const currentPath = buildPath(path, key);
        if (!keys2.has(key)) {
          changes[currentPath] = { oldValue: o1[key], newValue: undefined };
        } else {
          findDifferences(o1[key], o2[key], currentPath);
        }
      }

      for (const key of keys2) {
        const currentPath = buildPath(path, key);
        if (!keys1.has(key)) {
          changes[currentPath] = { oldValue: undefined, newValue: o2[key] };
        }
      }
    };

    findDifferences(obj1, obj2);
    return changes;
  }

  public validateData<T>(data: T[], schema: z.Schema<T>): T[] {
    try {
      return data.map(item => schema.parse(item));
    } catch (error) {
      if (error instanceof ZodError) {
        console.error('Zod Validation Error:', error); // Log the full ZodError object
        throw new Error(`Data validation failed: ${error.issues.map(e => `[${e.path.join('.')}] ${e.message}`).join(', ')}`);
      }
      throw error;
    }
  }
}
