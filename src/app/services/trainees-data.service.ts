import { inject, Injectable, signal } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import { doc, Firestore, getDoc, setDoc } from '@angular/fire/firestore';
import { UserTraineesData } from '../interfaces/user-trainees-data';
import { authState } from '@angular/fire/auth';
import { toSignal } from '@angular/core/rxjs-interop';
import { switchMap, from, of } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class TraineesDataService {
  private firestore = inject(Firestore);
  private auth = inject(Auth);

  private readonly COLLECTION = 'user_trainees_data';

  readonly userTraineesData = toSignal<UserTraineesData | null>(
    authState(this.auth).pipe(
      switchMap(user => {
        if (!user) return of(null);
        const ref = doc(this.firestore, `${this.COLLECTION}/${user.uid}`);
        return from(getDoc(ref)).pipe(
          map(snap => snap.exists() ? (snap.data() as UserTraineesData) : null)
        );
      })
    ),
    { initialValue: undefined }
  );

  async saveUserTraineesData(data: Omit<UserTraineesData, 'lastUpdated'>): Promise<void> {
    const user = this.auth.currentUser;
    if (!user) return;
    const ref = doc(this.firestore, `${this.COLLECTION}/${user.uid}`);
    await setDoc(ref, { ...data, lastUpdated: new Date() });
  }
}
