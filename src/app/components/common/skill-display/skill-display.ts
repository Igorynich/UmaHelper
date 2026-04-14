import { Component, inject, computed, input, booleanAttribute } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { ImagekitioAngularModule } from 'imagekitio-angular';
import { Skill, Rarity } from '../../../interfaces/skill';
import { MatDialog } from '@angular/material/dialog';
import { SkillDialogComponent } from '../skill-dialog/skill-dialog';
import { MatIconButton } from '@angular/material/button';
import { SkillsService } from '../../../services/skills.service';
import {rxResource} from '@angular/core/rxjs-interop';
import {forkJoin, of} from 'rxjs';
import {map} from 'rxjs/operators';
import {SkillMap} from '../../../interfaces/skill-map';

@Component({
  selector: 'app-skill-display',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule, ImagekitioAngularModule, MatIconButton],
  templateUrl: './skill-display.html',
  styleUrls: ['./skill-display.css']
})
export class SkillDisplay {
  skill = input<Skill | undefined>(undefined);
  skillId = input<number | undefined>(undefined);
  simpleView = input(false, { transform: booleanAttribute });

  private skillResource = rxResource({
    params: () => ({
      skillId: this.skillId(),
      skill: this.skill()
    }),
    stream: ({params}) => {
      const skillId = params.skillId || params.skill?.id;
      if (!skillId) return of(undefined);
      const skill$ = params.skill ? of(params.skill) : this.skillsService.getSkillsByIds([skillId]).pipe(map(skills => skills[0]));
      return forkJoin([skill$, this.skillsService.getSkillMapById(skillId)]).pipe(map(([skill, skillMap]: [Skill, SkillMap | null]) => ({skill, skillMap})));
    }
  });

  private skillsService = inject(SkillsService);
  private dialog = inject(MatDialog);

  readonly isLoading = this.skillResource.isLoading;

  readonly skillSignal = computed(() => {
    return this.skillResource.value()?.skill;
  });

  readonly skillMapSignal = computed(() => {
    return this.skillResource.value()?.skillMap;
  });

  readonly rarityClass = computed(() => {
    const skill = this.skillSignal();
    if (!skill) return '';

    const rarity = skill.rarity;
    const baseClass = this.simpleView() ? 'simple-skill-view' : 'skill-card';
    const raritySuffix = this.simpleView() ? '-simple' : '';

    if (rarity === Rarity.Normal) {
      return `${baseClass} rarity${raritySuffix}-normal`;
    } else if (rarity === Rarity.Rare) {
      return `${baseClass} rarity${raritySuffix}-rare`;
    } else if (rarity === Rarity.Unique) {
      return `${baseClass} rarity${raritySuffix}-unique`;
    } else if (rarity === Rarity.Upgraded_Unique) {
      return `${baseClass} rarity${raritySuffix}-upgraded-unique`;
    } else if (rarity > Rarity.Upgraded_Unique) {
      return `${baseClass} rarity${raritySuffix}-unique`;
    }

    return baseClass;
  });

  openSkillDialog(skill: Skill, skillMap: SkillMap | null | undefined): void {
    this.dialog.open(SkillDialogComponent, {
      data: {
        skill,
        skillMap
        // props: Object.keys(skill),
        // displayedProps: ['desc_en', 'endesc', 'rarity', 'activation', 'cost'],
        // excludedProps: ['jpdesc', 'desc_ko', 'name_ko', 'name_tw', 'desc_tw', 'jpname']
      }
    });
  }
}
