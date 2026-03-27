import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'rarityStars',
  standalone: true,
})
export class RarityStarsPipe implements PipeTransform {
  transform(rarity: number): number[] {
    return Array.from({ length: rarity });
  }
}
