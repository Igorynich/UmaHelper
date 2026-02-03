import { inject, Injectable } from '@angular/core';
import { doc, docData, Firestore, getDoc, setDoc, updateDoc } from '@angular/fire/firestore';
import { toSignal } from '@angular/core/rxjs-interop';
import { Observable, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { UserSupportCardsData, SupportCardTab, SupportCardFilter } from '../interfaces/user-support-cards-data';

@Injectable({
  providedIn: 'root'
})
export class SupportCardsDataService {
  private firestore: Firestore = inject(Firestore);
  private authService = inject(AuthService);

  private readonly userSupportCardsData$: Observable<UserSupportCardsData | null> = this.authService.user$.pipe(
    switchMap(user => {
      if (user) {
        console.log('Loading user support cards data for user:', user.uid);
        return docData(doc(this.firestore, 'users_sc_data', user.uid)) as Observable<UserSupportCardsData>;
      } else {
        return of(null);
      }
    })
  );
  readonly userSupportCardsData = toSignal(this.userSupportCardsData$);

  async saveUserSupportCardsData(data: Omit<UserSupportCardsData, 'lastUpdated'>): Promise<void> {
    const user = this.authService.user();
    if (!user) {
      throw new Error('User not authenticated');
    }

    const userDocRef = doc(this.firestore, 'users_sc_data', user.uid);
    const fullData: UserSupportCardsData = {
      ...data,
      lastUpdated: new Date()
    };

    try {
      console.log('Saving user support cards data for user:', user.uid);
      await setDoc(userDocRef, fullData, { merge: true });
    } catch (error) {
      console.error('Error saving user support cards data:', error);
      throw error;
    }
  }

  async updateUserSupportCardsData(updates: Partial<UserSupportCardsData>): Promise<void> {
    const user = this.authService.user();
    if (!user) {
      throw new Error('User not authenticated');
    }

    const userDocRef = doc(this.firestore, 'users_sc_data', user.uid);

    try {
      await updateDoc(userDocRef, {
        ...updates,
        lastUpdated: new Date()
      });
    } catch (error) {
      console.error('Error updating user support cards data:', error);
      throw error;
    }
  }

  async resetUserSupportCardsData(): Promise<void> {
    const user = this.authService.user();
    if (!user) {
      throw new Error('User not authenticated');
    }

    const userDocRef = doc(this.firestore, 'users_sc_data', user.uid);
    const defaultData: UserSupportCardsData = {
      tabs: [],
      selectedTabIndex: 0,
      lastUpdated: new Date()
    };

    try {
      await setDoc(userDocRef, defaultData);
    } catch (error) {
      console.error('Error resetting user support cards data:', error);
      throw error;
    }
  }
}
