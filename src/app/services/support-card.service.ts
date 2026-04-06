import { inject, Injectable } from '@angular/core';
import { collection, collectionData, doc, Firestore, getDoc } from '@angular/fire/firestore';
import { from, Observable } from 'rxjs';
import { SupportCard, SupportCardEffectData } from '../interfaces/support-card';
import { map } from 'rxjs/operators';
import { DisplaySupportCard, Rarity } from '../interfaces/display-support-card';
import {effectMap, uniqEffectMap} from '../maps/effect.map';
import {EffectId, UniqEffectId} from '../interfaces/effect-id.enum';
import { IMAGEKIT_CONFIG } from '../imagekit.config';
import { SupportCardType } from '../interfaces/support-card-type.enum';

const LEVEL_TO_INDEX_MAP: { [level: number]: number } = {
  1: 1, 5: 2, 10: 3, 15: 4, 20: 5, 25: 6, 30: 7, 35: 8, 40: 9, 45: 10, 50: 11,
};

export const rarityLevelMap = {
  [Rarity.R]: { default: 20, max: 40 },
  [Rarity.SR]: { default: 25, max: 45 },
  [Rarity.SSR]: { default: 30, max: 50 },
};

@Injectable({
  providedIn: 'root'
})
export class SupportCardService {
  private firestore = inject(Firestore);
  private effectDataCache = new Map<string, SupportCardEffectData>();

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

  /**
   * Returns the ImageKit URL of the support card image.
   * @param supportCardOrId - The support card object or its ID.
   * @returns The URL of the support card image.
   */
  getSupportCardImageUrl(supportCardOrId: DisplaySupportCard | number): string {
    const id = typeof supportCardOrId === 'object' ? supportCardOrId.support_id : supportCardOrId;
    return `/sup_cards/tex_support_card_${id}.png`;
  }

  mapToSupportCardEffectData(card: DisplaySupportCard, effIds?: number[]): SupportCardEffectData {
    const effectIds = effIds ?? (Object.values(EffectId).filter(value => typeof value === 'number') as number[]);
    const level = card.level ?? rarityLevelMap[card.rarity].default;
    const cacheKey = `${card.support_id}_${level}`;

    const cached = this.effectDataCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    // console.log('card', card);
    const data: SupportCardEffectData = {
      support_id: card.support_id,
      char_name: card.char_name,
      level: card.level,
      rarity: card.rarity,
      type: card.type,
      characterImageUrl: this.getSupportCardImageUrl(card.support_id), //`/sup_cards/tex_support_card_${card.support_id}.png`,
      event_skills: card.event_skills,
      hints: card.hints,
      release_en: card.release_en,
    };
    const currentLevel = card.level || rarityLevelMap[card.rarity].default;

    if (card.unique) {
      // console.log('Uniq', card.unique);
      const uniqueLevel = card.unique.level;
      const isCardUniqueLocked = currentLevel < uniqueLevel;

      const effectsDisplay = card.unique.effects.map(ue => {
        if (Object.values(UniqEffectId).includes(ue.type as UniqEffectId)) {
          // if uniq complex effect
          return {
            shortName: uniqEffectMap[ue.type as UniqEffectId]?.short(ue) || `UniqEffect ${ue.type}`,
            longName: uniqEffectMap[ue.type as UniqEffectId]?.long(ue) || `UniqEffect ${ue.type}`,
          }
        }
        return {
          shortName: effectMap[ue.type as EffectId]?.short || `Effect ${ue.type}`,
          longName: effectMap[ue.type as EffectId]?.long || `Effect ${ue.type}`,
          value: ue.value,
        }
      });

      data.uniqueDisplayData = {
        levelDisplay: `Lvl ${uniqueLevel}`,
        effectsDisplay: effectsDisplay,
        isCardUniqueLocked: isCardUniqueLocked,
        tooltip: isCardUniqueLocked ? `Unique effects unlock at Lvl ${uniqueLevel}` : card.unique.unique_desc || `Unique effects unlock at Lvl ${uniqueLevel}`,
      };
    }

    for (const effectId of effectIds) {
      const effectIdStr = effectId.toString();
      const effect = card.effects.find(e => e[0] === effectId);
      const baseValue = effect ? this.calculateEffectValue(effect, currentLevel) : 0;
      let uniqueValue = 0;

      if (card.unique && currentLevel >= card.unique.level) {
        const uniqueEffect = card.unique.effects.find(e => e.type === effectId);
        if (uniqueEffect) {
          uniqueValue = uniqueEffect.value;
        }
      }

      if (baseValue > 0 || uniqueValue > 0) {
        if (uniqueValue > 0) {
          data[effectIdStr] = {
            value: baseValue + uniqueValue,
            tooltip: `${baseValue}+${uniqueValue}u`,
            hasUnique: true,
          };
        } else {
          data[effectIdStr] = baseValue;
        }
      } else if (effect) {
        const unlockInfo = this.findUnlockInfo(effect);
        if (unlockInfo) {
          data[effectIdStr] = {
            value: `${unlockInfo.value}(Lvl ${unlockInfo.level})`,
            isLocked: true,
          };
        }
      }
    }
    // console.log('data', data)
    this.effectDataCache.set(cacheKey, data);
    return data;
  }

  private prepareSupportCardForDisplay(supportCard: any): SupportCard {
    const { effects, ...rest } = supportCard;
    if (effects && Array.isArray(effects)) {
      const effectsAsArrays = effects.map((effect: any) => effect.values || []);
      return { ...rest, effects: effectsAsArrays } as SupportCard;
    }
    return supportCard as SupportCard;
  }

  private findUnlockInfo(effect: number[]): { value: number; level: number } | null {
    const levels = Object.keys(LEVEL_TO_INDEX_MAP).map(Number);
    for (const level of levels) {
      const value = effect[LEVEL_TO_INDEX_MAP[level]];
      if (value !== -1) return { value, level };
    }
    return null;
  }

  private calculateEffectValue(effect: number[], level: number): number {
    const levels = Object.keys(LEVEL_TO_INDEX_MAP).map(Number);
    let startLevel = 1, startValue = -1;

    for (let i = 0; i < levels.length; i++) {
      const currentLevel = levels[i];
      if (currentLevel > level) break;
      const val = effect[LEVEL_TO_INDEX_MAP[currentLevel]];
      if (val !== -1) {
        startLevel = currentLevel;
        startValue = val;
      }
    }

    if (startValue === -1) return 0;
    if (level === startLevel) return startValue;

    let endLevel = startLevel, endValue = startValue;

    for (let i = levels.indexOf(startLevel) + 1; i < levels.length; i++) {
      const currentLevel = levels[i];
      const val = effect[LEVEL_TO_INDEX_MAP[currentLevel]];
      if (val !== -1) {
        endLevel = currentLevel;
        endValue = val;
        break;
      }
    }

    if (endLevel === startLevel) return startValue;
    if (level >= endLevel) return endValue;

    const levelDiff = endLevel - startLevel;
    const valueDiff = endValue - startValue;
    const progress = (level - startLevel) / levelDiff;
    const interpolatedValue = startValue + (valueDiff * progress);

    return Math.floor(interpolatedValue);
  }
}
