import { Pipe, PipeTransform } from '@angular/core';
import { Rarity } from '../interfaces/display-support-card';

@Pipe({
  name: 'rarityClass',
  standalone: true,
})
export class RarityClassPipe implements PipeTransform {
  transform(rarity: Rarity): string {
    switch (rarity) {
      case Rarity.SSR:
        return 'rarity-ssr';
      case Rarity.SR:
        return 'rarity-sr';
      case Rarity.R:
        return 'rarity-r';
      default:
        return '';
    }
  }
}
