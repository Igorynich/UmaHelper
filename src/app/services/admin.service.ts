import { inject, Injectable } from '@angular/core';
import {
  collection,
  doc,
  Firestore,
  setDoc,
} from '@angular/fire/firestore';
import { HttpClient } from '@angular/common/http';
import { Skill } from '../interfaces/skill';
import {concatMap, from, map, Observable, of, tap} from 'rxjs';

export interface UploadProgress {
  completed: number;
  total: number;
  successful: number;
  failed: number;
}

@Injectable({
  providedIn: 'root',
})
export class AdminService {
  private firestore = inject(Firestore);
  private http = inject(HttpClient);

  uploadSkills(): Observable<UploadProgress> {
    return this.http.get<Skill[]>('assets/data/skills.json').pipe(
      concatMap(skills => {
        const skillsCollection = collection(this.firestore, 'skills');
        let completed = 0;
        let successful = 0;
        let failed = 0;
        const total = skills.length;

        return from(skills).pipe(
          concatMap(skill => {
            const { gene_version, loc, sup_e, sup_hint, evo_cond, ...skillToUpload } = skill;
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
      })
    );
  }
}
