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
    const skillsCollection = collection(this.firestore, 'skills');
    let completed = 0;
    let successful = 0;
    let failed = 0;
    const total = skills.length;

    return from(skills).pipe(
      concatMap(skill => {
        const skillToUpload = this.prepareSkillForUpload(skill);
        const skillDoc = doc(skillsCollection, skillToUpload.id.toString());
        return from(setDoc(skillDoc, skillToUpload)).pipe(
          tap({
            next: () => {
              successful++;
              completed++;
            },
            error: () => {
              failed++;
              completed++;
            },
          }),
          map(() => ({ completed, total, successful, failed }))
        );
      })
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
            const preparedLocalSkill = this.prepareSkillForUpload(localSkill);
            const preparedFirebaseSkill = this.prepareSkillForUpload(firebaseSkill);

            const differences = this.deepDiff(preparedFirebaseSkill, preparedLocalSkill);
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

    const total = skillsToUpload.length;
    if (total === 0) {
      return of({ completed: 0, total: 0, successful: 0, failed: 0 });
    }

    const skillsCollection = collection(this.firestore, 'skills');
    let completed = 0;
    let successful = 0;
    let failed = 0;

    return from(skillsToUpload).pipe(
      concatMap(skill => {
        const skillToUpload = this.prepareSkillForUpload(skill);
        const skillDoc = doc(skillsCollection, skillToUpload.id.toString());
        return from(setDoc(skillDoc, skillToUpload)).pipe(
          tap({
            next: () => {
              successful++;
              completed++;
            },
            error: () => {
              failed++;
              completed++;
            },
          }),
          map(() => ({ completed, total, successful, failed }))
        );
      })
    );
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

    const total = supportCardsToUpload.length;
    if (total === 0) {
      return of({ completed: 0, total: 0, successful: 0, failed: 0 });
    }

    const supportCardsCollection = collection(this.firestore, 'support_cards');
    let completed = 0;
    let successful = 0;
    let failed = 0;

    return from(supportCardsToUpload).pipe(
      concatMap(supportCard => {
        const supportCardToUpload = this.prepareSupportCardForUpload(supportCard);
        const supportCardDoc = doc(supportCardsCollection, supportCardToUpload.support_id.toString());
        return from(setDoc(supportCardDoc, supportCardToUpload)).pipe(
          tap({
            next: () => {
              successful++;
              completed++;
            },
            error: () => {
              failed++;
              completed++;
            },
          }),
          map(() => ({ completed, total, successful, failed }))
        );
      })
    );
  }

  uploadSupportCards(supportCards: SupportCard[]): Observable<UploadProgress> {
    const supportCardsCollection = collection(this.firestore, 'support_cards');
    let completed = 0;
    let successful = 0;
    let failed = 0;
    const total = supportCards.length;

    return from(supportCards).pipe(
      concatMap(supportCard => {
        const supportCardToUpload = this.prepareSupportCardForUpload(supportCard);
        const supportCardDoc = doc(supportCardsCollection, supportCardToUpload.support_id.toString());
        return from(setDoc(supportCardDoc, supportCardToUpload)).pipe(
          tap({
            next: () => {
              successful++;
              completed++;
            },
            error: () => {
              failed++;
              completed++;
            },
          }),
          map(() => ({ completed, total, successful, failed }))
        );
      })
    );
  }

  private prepareSkillForUpload(skill: any): any {
    const { gene_version, loc, sup_e, sup_hint, evo_cond, ...skillToUpload } = skill;
    return skillToUpload;
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
        throw new Error(`Data validation failed: ${error.issues.map((e: z.ZodIssue) => `[${e.path.join('.')}] ${e.message}`).join(', ')}`);
      }
      throw error;
    }
  }
}
