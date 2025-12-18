import { Pipe, PipeTransform } from '@angular/core';
import { Rarity } from '../interfaces/display-support-card';

@Pipe({
  name: 'rarity',
  standalone: true,
})
export class RarityPipe implements PipeTransform {
  transform(value: Rarity): string {
    switch (value) {
      case Rarity.R:
        return 'R';
      case Rarity.SR:
        return 'SR';
      case Rarity.SSR:
        return 'SSR';
      default:
        return '';
    }
  }
}
