import { Pipe, PipeTransform } from '@angular/core';
import { effectMap } from '../maps/effect.map';
import { isLockedEffectData, isUniqueEffectData } from '../utils/effect-data-utils';
import {EffectId} from '../interfaces/effect-id.enum';

@Pipe({ name: 'effectValue', standalone: true })
export class EffectValuePipe implements PipeTransform {
  transform(value: any, effectId: EffectId | string): { value: string; cssClass?: string } {
    if (!value) {
      return {
        value: ''
      };
    }
    // Convert string to EffectId if needed
    const id = typeof effectId === 'string' ? parseInt(effectId, 10) as EffectId : effectId;

    if (isLockedEffectData(value)) {
      return { value: this.formatValue(value.value, id), cssClass: 'locked-effect' };
    }
    if (isUniqueEffectData(value)) {
      return { value: this.formatValue(value.value, id), cssClass: 'unique-effect' };
    }
    return { value: this.formatValue(value, id) };
  }

  private formatValue(value: number | string, effectId: EffectId): string {
    const effectInfo = effectMap[effectId];
    const unit = effectInfo?.unit;
    if (typeof value === 'number' && unit) {
      if (unit === 'Lv') return `${unit}${value}`;
      return `${value}${unit}`;
    }
    return typeof value === 'string' ? value : value.toString();
  }
}
