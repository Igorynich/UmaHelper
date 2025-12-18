import { inject, Injectable } from '@angular/core';
import { collection, collectionData, Firestore } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { Skill } from '../interfaces/skill';
import { map } from 'rxjs/operators';

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
    return (collectionData(skillsCollection) as Observable<Skill[]>).pipe(
      map(skills => skills.filter(skill => /*!skill.pre_evo && !skill.evo*/ skill.name_en && !this.excludedSkillNames.includes(skill.enname)))
    );
  }

  getRawSkills(): Observable<Skill[]> {
    const skillsCollection = collection(this.firestore, 'skills');
    return (collectionData(skillsCollection) as Observable<Skill[]>);
  }

  private isCurrentVersion(skillVersions: number[]): boolean {
    return true;
    return skillVersions ? skillVersions.some(version => version <= this.CURRENT_VERSION) : true;
  }
}
