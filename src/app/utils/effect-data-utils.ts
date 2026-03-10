/**
 * Utility functions for effect data type checking
 */

import { EffectValue } from '../services/ratings.service';

export function isLockedEffectData(value: any): value is { value: string; isLocked: boolean; } {
  return typeof value === 'object' && value !== null && 'isLocked' in value;
}

export function isUniqueEffectData(value: any): value is { value: number | string; tooltip: string; hasUnique: boolean; } {
  return typeof value === 'object' && value !== null && 'hasUnique' in value;
}

export function getEffectValueFn(cardEffect: EffectValue): number {
  return typeof cardEffect === 'number' ? cardEffect :
    (typeof cardEffect === 'object' && cardEffect && 'value' in cardEffect && typeof cardEffect?.value === 'number') ?
      cardEffect.value : 0;
}
