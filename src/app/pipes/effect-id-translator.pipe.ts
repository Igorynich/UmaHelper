import { Pipe, PipeTransform } from '@angular/core';
import { EffectId } from '../interfaces/effect-id.enum';
import { effectMap } from '../maps/effect.map';

@Pipe({
  name: 'effectIdTranslator',
  standalone: true
})
export class EffectIdTranslatorPipe implements PipeTransform {
  transform(effectId: EffectId): string {
    return effectMap[effectId]?.long || `Unknown Effect (${effectId})`;
  }
}
