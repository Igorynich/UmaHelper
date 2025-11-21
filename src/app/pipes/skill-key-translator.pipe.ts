import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'skillKeyTranslator',
  standalone: true,
})
export class SkillKeyTranslatorPipe implements PipeTransform {
  transform(key: string): string {
    switch (key) {
      case 'desc_en':
        return 'Description (in-game)';
      case 'endesc':
        return 'Description (detailed)';
      case 'name_en':
        return 'Skill Name';
      case 'precondition':
        return 'Preconditions';
      case 'condition':
        return 'Conditions';
      case 'cd':
        return 'Cooldown';
      case 'base_time':
        return 'Base Duration';
      case 'effects':
        return 'Effect';
      // Add more cases as needed
      default:
        return key;
    }
  }
}
