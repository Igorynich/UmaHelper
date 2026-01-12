import { inject, Injectable } from '@angular/core';
import { collection, collectionData, doc, Firestore, getDoc } from '@angular/fire/firestore';
import { from, Observable } from 'rxjs';
import { SupportCard } from '../interfaces/support-card';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class SupportCardService {
  private firestore = inject(Firestore);

  getRawSupportCards(): Observable<SupportCard[]> {
    const supportCardsCollection = collection(this.firestore, 'support_cards');
    return (collectionData(supportCardsCollection) as Observable<any[]>).pipe(
      map(supportCards => supportCards.map(sc => this.prepareSupportCardForDisplay(sc)))
    );
  }

  getSupportCardById(id: string): Observable<SupportCard | null> {
    const supportCardDocRef = doc(this.firestore, `support_cards/${id}`);
    return from(getDoc(supportCardDocRef)).pipe(
      map(docSnap => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          // Assuming prepareSupportCardForDisplay is what you want to do
          return this.prepareSupportCardForDisplay(data) as SupportCard;
        } else {
          return null;
        }
      })
    );
  }

  private prepareSupportCardForDisplay(supportCard: any): SupportCard {
    const { effects, ...rest } = supportCard;
    if (effects && Array.isArray(effects)) {
      const effectsAsArrays = effects.map((effect: any) => effect.values || []);
      return { ...rest, effects: effectsAsArrays } as SupportCard;
    }
    return supportCard as SupportCard;
  }
}
