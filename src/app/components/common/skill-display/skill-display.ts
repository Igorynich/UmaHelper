import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { ImagekitioAngularModule } from 'imagekitio-angular';
import { Skill, Rarity } from '../../../interfaces/skill';
import { MatDialog } from '@angular/material/dialog';
import {SkillDialogComponent} from '../skill-dialog/skill-dialog';
import {MatIconButton} from '@angular/material/button';

@Component({
  selector: 'app-skill-display',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule, ImagekitioAngularModule, MatIconButton],
  templateUrl: './skill-display.html',
  styleUrls: ['./skill-display.css']
})
export class SkillDisplay {
  @Input({ required: true }) skill!: Skill;
  @Input() simpleView: boolean = false;

  constructor(private dialog: MatDialog) {}

  getRarityClass(): string {
    const rarity = this.skill.rarity;
    const baseClass = this.simpleView ? 'simple-skill-view' : 'skill-card';
    const raritySuffix = this.simpleView ? '-simple' : '';

    if (rarity === Rarity.Normal) {
      return `${baseClass} rarity${raritySuffix}-normal`;
    } else if (rarity === Rarity.Rare) {
      return `${baseClass} rarity${raritySuffix}-rare`;
    } else if (rarity >= Rarity.Unique) {
      return `${baseClass} rarity${raritySuffix}-unique`;
    }

    return baseClass;
  }

  openSkillDialog(skill: Skill): void {
    this.dialog.open(SkillDialogComponent, {
      data: {
        skill,
        props: Object.keys(skill),
        displayedProps: ['desc_en', 'endesc', 'rarity', 'activation', 'cost'],
        // excludedProps: ['jpdesc', 'desc_ko', 'name_ko', 'name_tw', 'desc_tw', 'jpname']
      }
    });
  }
}
