import { inject, Injectable } from '@angular/core';
import { collection, collectionData, Firestore } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
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

  private prepareSupportCardForDisplay(supportCard: any): SupportCard {
    const { effects, ...rest } = supportCard;
    if (effects && Array.isArray(effects)) {
      const effectsAsArrays = effects.map((effect: any) => effect.values || []);
      return { ...rest, effects: effectsAsArrays } as SupportCard;
    }
    return supportCard as SupportCard;
  }
}
