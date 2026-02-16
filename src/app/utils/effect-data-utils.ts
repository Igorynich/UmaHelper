/**
 * Utility functions for effect data type checking
 */

export function isLockedEffectData(value: any): value is { value: string; isLocked: boolean; } {
  return typeof value === 'object' && value !== null && 'isLocked' in value;
}

export function isUniqueEffectData(value: any): value is { value: number | string; tooltip: string; hasUnique: boolean; } {
  return typeof value === 'object' && value !== null && 'hasUnique' in value;
}
