import {Component, computed, effect, inject, signal, Signal, WritableSignal} from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import {DisplaySupportCard, Rarity} from '../../../interfaces/display-support-card';
import { SkillsService } from '../../../services/skills.service';
import { Skill } from '../../../interfaces/skill';
import { take } from 'rxjs';
import { CommonModule } from '@angular/common';
import { SkillDisplay } from '../../common/skill-display/skill-display';
import {MatCard} from '@angular/material/card';
import { EventsService } from '../../../services/events.service';
import { DecodedEventsContainer, DecodedSkillReward } from '../../../interfaces/event';
import { SupportCardEffectData } from '../../../interfaces/support-card';
import { SupportCardService, rarityLevelMap } from '../../../services/support-card.service';
import { EffectId } from '../../../interfaces/effect-id.enum';
import { Level } from '../../common/level/level';
import { EffectIdTranslatorPipe } from '../../../pipes/effect-id-translator.pipe';
import { effectMap } from '../../../maps/effect.map';
import {MatIconButton} from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import {MatCheckboxModule} from '@angular/material/checkbox';
import { MatExpansionModule } from '@angular/material/expansion';
import {effectTypeMap} from '../../../maps/skill-effect.map'; // New import

@Component({
  selector: 'app-support-card-info',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatIconModule, SkillDisplay, MatCard, Level, EffectIdTranslatorPipe, MatIconButton, MatTooltipModule, MatExpansionModule, MatCheckboxModule],
  templateUrl: './support-card-info.html',
  styleUrl: './support-card-info.css'
})
export class SupportCardInfo {
  protected readonly rawCardData: Signal<DisplaySupportCard> = signal(inject(MAT_DIALOG_DATA) as DisplaySupportCard);
  protected readonly dialogRef = inject(MatDialogRef<SupportCardInfo>);
  private readonly skillsService = inject(SkillsService);
  private readonly eventsService = inject(EventsService);
  private readonly supportCardService = inject(SupportCardService);

  protected readonly rarityLevelMap = rarityLevelMap;
  protected readonly level: WritableSignal<number> = signal(this.rawCardData().level || rarityLevelMap[this.rawCardData().rarity].default);
  protected hintSkills = signal<Skill[]>([]);
  protected statGains = signal<string[]>([]);
  protected eventSkills = signal<Skill[]>([]);
  protected trainingEvents = signal<DecodedEventsContainer | null>(null);

  // Stat difference feature
  protected readonly showStatDifferences = signal(true);
  protected readonly previousProcessedData = signal<SupportCardEffectData | null>(null);

  protected readonly processedCardData: Signal<SupportCardEffectData> = computed(() => {
    const currentLevel = this.level();
    const card = this.rawCardData();
    const cardWithDynamicLevel = { ...card, level: currentLevel };
    return this.supportCardService.mapToSupportCardEffectData(cardWithDynamicLevel);
  });

  protected readonly presentEffectIds = computed(() => {
    const processed = this.processedCardData();
    const effectIdsPresent: EffectId[] = [];

    for (const key in processed) {
      if (processed.hasOwnProperty(key)) {
        const effectId = parseInt(key, 10);
        if (!isNaN(effectId) && Object.values(EffectId).includes(effectId) && (processed as any)[key] !== undefined && (processed as any)[key] !== null) {
          effectIdsPresent.push(effectId);
        }
      }
    }
    return effectIdsPresent.sort((a, b) => a - b);
  });

  protected readonly typeImageUrl = computed(() => {
    return `assets/types/${this.processedCardData().type.toLowerCase()}.png`;
  });

  protected readonly statDifferences = computed(() => {
    if (!this.showStatDifferences()) return {}; // Don't calculate if disabled

    const current = this.processedCardData();
    const previous = this.previousProcessedData();
    console.log('current', current);
    console.log('previous', previous);
    if (!previous) return {}; // No previous data

    const differences: Record<string, number> = {};
    for (const key in current) {
      const currentValue = (current as any)[key];
      const prevValue = (previous as any)[key];

      // Helper function to extract numeric value
      const getNumericValue = (value: any): number => {
        if (typeof value === 'number') {
          return value;
        }
        if (typeof value === 'object' && value !== null && 'value' in value) {
          const objValue = value.value;
          return typeof objValue === 'number' ? objValue : 0;
        }
        return 0;
      };

      const currentNum = getNumericValue(currentValue);
      const prevNum = getNumericValue(prevValue);

      const diff = currentNum - prevNum;
      if (diff !== 0) {
        differences[key] = diff;
      }
    }
    return differences;
  });

  constructor() {
    effect(() => {
      // console.log('Rawdata', this.rawCardData());
      // console.log('Processed data', this.processedCardData());
      // console.log('trainingEvents', this.trainingEvents());
      console.log('statGains', this.statGains());
    });
    const rarityClass = this.getRarityClass();
    if (rarityClass) {
      this.dialogRef.addPanelClass(rarityClass);
    }

    this.processHints();
    this.processEventSkills();
    this.processTrainingEvents();
  }

  protected onLevelChange(newLevel: number): void {
    this.previousProcessedData.set(this.processedCardData());
    this.level.set(newLevel);
  }

  protected toggleStatDifferences(): void {
    this.showStatDifferences.set(!this.showStatDifferences());
  }

  protected isString(reward: any): reward is string {
    return typeof reward === 'string';
  }

  protected isSkillReward(reward: any): reward is DecodedSkillReward {
    return typeof reward === 'object' && reward.type === 'skill';
  }

  protected isLockedEffectData(value: any): value is { value: string; isLocked: boolean; } {
    return typeof value === 'object' && value !== null && 'isLocked' in value;
  }

  protected isUniqueEffectData(value: any): value is { value: number | string; tooltip: string; hasUnique: boolean; } {
    return typeof value === 'object' && value !== null && 'hasUnique' in value;
  }

  private processTrainingEvents(): void {
    if (this.rawCardData().support_id) {
      this.eventsService.getAndDecodeEvents(this.rawCardData().support_id.toString())
        .pipe(take(1))
        .subscribe(decodedEvents => {
          this.trainingEvents.set(decodedEvents);
        });
    }
  }

  private processEventSkills(): void {
    if (this.processedCardData().event_skills?.length > 0) {
      this.skillsService.getSkillsByIds(this.processedCardData().event_skills).pipe(take(1)).subscribe(foundSkills => {
        this.eventSkills.set(foundSkills);
      });
    }
  }

  private processHints(): void {
    if (this.processedCardData().hints) {
      if (this.processedCardData().hints.hint_skills?.length > 0) {
        this.skillsService.getSkillsByIds(this.processedCardData().hints.hint_skills).pipe(take(1)).subscribe(foundSkills => {
          this.hintSkills.set(foundSkills);
        });
      }

      if (this.processedCardData().hints.hint_others?.length > 0) {
        const gains = this.processedCardData().hints.hint_others.map((hint: { hint_type: number, hint_value: number }) => {
          const effectName: string = effectTypeMap[hint.hint_type as keyof typeof effectTypeMap] || `Unknown Stat (${hint.hint_type})`;
          return `${effectName} +${hint.hint_value}`;
        });
        this.statGains.set(gains);
      }
    }
  }

  private getRarityClass(): string {
    switch (this.rawCardData().rarity) {
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

