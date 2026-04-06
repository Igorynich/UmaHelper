import { Component, inject, signal, computed, input, booleanAttribute, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { ImagekitioAngularModule } from 'imagekitio-angular';
import { Skill, Rarity } from '../../../interfaces/skill';
import { MatDialog } from '@angular/material/dialog';
import { SkillDialogComponent } from '../skill-dialog/skill-dialog';
import { MatIconButton } from '@angular/material/button';
import { SkillsService } from '../../../services/skills.service';

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

  private skillsService = inject(SkillsService);
  private dialog = inject(MatDialog);

  private skillLoaded = signal(false);
  loading = signal(false);
  private loadedSkill = signal<Skill | undefined>(undefined);

  constructor() {
    effect(() => {
      const id = this.skillId();
      const inputSkill = this.skill();

      if (inputSkill) {
        this.loadedSkill.set(undefined);
        this.skillLoaded.set(true);
        return;
      }

      if (id !== undefined && !this.skillLoaded()) {
        this.loading.set(true);
        this.loadSkill(id);
      }
    });
  }

  private loadSkill(id: number): void {
    this.skillsService.getSkillsByIds([id]).subscribe({
      next: (skills) => {
        if (skills.length > 0) {
          this.loadedSkill.set(skills[0]);
        }
        this.skillLoaded.set(true);
        this.loading.set(false);
      },
      error: () => {
        this.skillLoaded.set(true);
        this.loading.set(false);
      }
    });
  }

  readonly skillSignal = computed(() => {
    const inputSkill = this.skill();
    if (inputSkill) {
      return inputSkill;
    }

    return this.loadedSkill();
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

  openSkillDialog(skill: Skill): void {
    this.dialog.open(SkillDialogComponent, {
      data: {
        skill,
        // props: Object.keys(skill),
        // displayedProps: ['desc_en', 'endesc', 'rarity', 'activation', 'cost'],
        // excludedProps: ['jpdesc', 'desc_ko', 'name_ko', 'name_tw', 'desc_tw', 'jpname']
      }
    });
  }
}
