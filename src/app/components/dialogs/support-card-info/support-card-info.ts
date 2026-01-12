import { Component, inject, signal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { Rarity } from '../../../interfaces/display-support-card';
import { SkillsService } from '../../../services/skills.service';
import { Skill } from '../../../interfaces/skill';
import { take } from 'rxjs';
import { effectTypeMap } from '../../../maps/skill-effect.map';
import { CommonModule } from '@angular/common';
import { SkillDisplay } from '../../common/skill-display/skill-display';
import {MatCard} from '@angular/material/card';
import { EventsService } from '../../../services/events.service'; // New Import
import { DecodedEventsContainer, DecodedSkillReward } from '../../../interfaces/event'; // New Import

@Component({
  selector: 'app-support-card-info',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatIconModule, SkillDisplay, MatCard],
  templateUrl: './support-card-info.html',
  styleUrl: './support-card-info.css'
})
export class SupportCardInfo {
  protected readonly data: any = inject(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<SupportCardInfo>);
  private readonly skillsService = inject(SkillsService);
  private readonly eventsService = inject(EventsService); // New injection

  protected readonly Rarity = Rarity;
  protected hintSkills = signal<Skill[]>([]);
  protected statGains = signal<string[]>([]);
  protected eventSkills = signal<Skill[]>([]);
  protected trainingEvents = signal<DecodedEventsContainer | null>(null); // New signal

  constructor() {
    console.log('data', this.data);
    const rarityClass = this.getRarityClass();
    if (rarityClass) {
      this.dialogRef.addPanelClass(rarityClass);
    }

    this.processHints();
    this.processEventSkills();
    this.processTrainingEvents(); // New call
  }

  protected isString(reward: any): reward is string {
    return typeof reward === 'string';
  }

  protected isSkillReward(reward: any): reward is DecodedSkillReward {
    return typeof reward === 'object' && reward.type === 'skill';
  }

  private processTrainingEvents(): void {
    if (this.data.support_id) {
      this.eventsService.getAndDecodeEvents(this.data.support_id.toString())
        .pipe(take(1))
        .subscribe(decodedEvents => {
          this.trainingEvents.set(decodedEvents);
        });
    }
  }

  private processEventSkills(): void {
    if (this.data.event_skills?.length > 0) {
      this.skillsService.getSkillsByIds(this.data.event_skills).pipe(take(1)).subscribe(foundSkills => {
        this.eventSkills.set(foundSkills);
      });
    }
  }

  private processHints(): void {
    if (this.data.hints) {
      // Process hint_skills
      if (this.data.hints.hint_skills?.length > 0) {
        this.skillsService.getSkillsByIds(this.data.hints.hint_skills).pipe(take(1)).subscribe(foundSkills => {
          this.hintSkills.set(foundSkills);
        });
      }

      // Process hint_others for stat gains
      if (this.data.hints.hint_others?.length > 0) {
        const gains = this.data.hints.hint_others.map((hint: { hint_type: number, hint_value: number }) => {
          const effectName = effectTypeMap[hint.hint_type as keyof typeof effectTypeMap] || `Unknown Stat (${hint.hint_type})`;
          return `${effectName} +${hint.hint_value}`;
        });
        this.statGains.set(gains);
      }
    }
  }

  private getRarityClass(): string {
    switch (this.data.rarity) {
      case Rarity.SSR:
        return 'rarity-ssr-dialog';
      case Rarity.SR:
        return 'rarity-sr-dialog';
      case Rarity.R:
        return 'rarity-r-dialog';
      default:
        return '';
    }
  }

  protected close(): void {
    this.dialogRef.close();
  }
}

