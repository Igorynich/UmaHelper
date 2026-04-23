import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject, signal,
  Signal
} from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatIconButton } from '@angular/material/button';
import { ImagekitioAngularModule } from 'imagekitio-angular';
import { DisplayTrainee } from '../../../interfaces/display-trainee';
import { Rarity } from '../../../interfaces/display-support-card';
import {MatTableModule} from '@angular/material/table';
import {MatTooltip} from '@angular/material/tooltip';
import {MatExpansionModule} from '@angular/material/expansion';
import { DatePipe } from '@angular/common';
import { SkillsService } from '../../../services/skills.service';
import { SkillDisplay } from '../../common/skill-display/skill-display';
import {rxResource} from '@angular/core/rxjs-interop';
import {of} from 'rxjs';
import { EventsService, evntTypeConvertFn } from '../../../services/events.service';
import { DecodedSkillReward } from '../../../interfaces/event';


@Component({
  selector: 'app-trainee-info',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ImagekitioAngularModule, MatDialogModule, MatIconButton, MatIconModule, MatTableModule, MatTooltip, SkillDisplay, MatExpansionModule, DatePipe],
  templateUrl: './trainee-info.html',
  styleUrl: './trainee-info.css'
})
export class TraineeInfo {
  protected readonly trainee: Signal<DisplayTrainee> = signal(inject(MAT_DIALOG_DATA) as DisplayTrainee);
  protected readonly dialogRef = inject(MatDialogRef<TraineeInfo>);
  private readonly skillsService = inject(SkillsService);
  private readonly eventsService = inject(EventsService);

  protected readonly title = computed(() => this.trainee().itemData.title_en_gl);
  protected readonly name = computed(() => this.trainee().itemData.name_en);
  protected readonly version = computed(() => this.trainee().itemData.version);

  protected readonly uniqueSkillsResource = rxResource({
    params: () => ({ skillIds: this.trainee().itemData.skills_unique }),
    stream: ({ params }) => {
      if (!params.skillIds || params.skillIds.length === 0) return of([]);
      return this.skillsService.getSkillsByIds(params.skillIds);
    }
  });

  protected readonly innateSkillsResource = rxResource({
    params: () => ({ skillIds: this.trainee().itemData.skills_innate }),
    stream: ({ params }) => {
      if (!params.skillIds || params.skillIds.length === 0) return of([]);
      return this.skillsService.getSkillsByIds(params.skillIds);
    }
  });

  protected readonly awakeningSkillsResource = rxResource({
    params: () => ({ skillIds: this.trainee().itemData.skills_awakening }),
    stream: ({ params }) => {
      if (!params.skillIds || params.skillIds.length === 0) return of([]);
      return this.skillsService.getSkillsByIds(params.skillIds);
    }
  });

  protected readonly eventSkillsResource = rxResource({
    params: () => ({ skillIds: this.trainee().itemData.skills_event }),
    stream: ({ params }) => {
      if (!params.skillIds || params.skillIds.length === 0) return of([]);
      return this.skillsService.getSkillsByIds(params.skillIds);
    }
  });

  protected readonly trainingEventsResource = rxResource({
    params: () => ({ cardId: this.trainee().itemData.card_id }),
    stream: ({ params }) => {
      if (!params.cardId) return of(null);
      return this.eventsService.getAndDecodeEvents(params.cardId.toString());
    }
  });

  protected readonly uniqueSkills = computed(() => this.uniqueSkillsResource.value() ?? []);
  protected readonly innateSkills = computed(() => this.innateSkillsResource.value() ?? []);
  protected readonly awakeningSkills = computed(() => this.awakeningSkillsResource.value() ?? []);
  protected readonly eventSkills = computed(() => this.eventSkillsResource.value() ?? []);
  protected readonly displayedTrainingEvents = computed(() => evntTypeConvertFn(this.trainingEventsResource.value() ?? null));

  protected readonly statColumns = ['label', 'speed', 'stamina', 'power', 'guts', 'wits'];
  protected readonly statsData = computed(() => {
    const t = this.trainee().itemData;
    return [
      { label: `${t.rarity}★`, stats: t.base_stats },
      { label: '4★', stats: t.four_star_stats },
      { label: '5★', stats: t.five_star_stats },
      { label: '%', stats: t.stat_bonus, isBonus: true }
    ];
  });

  protected readonly surfaceColumns = ['label', 'turf', 'dirt'];
  protected readonly surfaceData = computed(() => {
    const t = this.trainee().itemData;
    return [
      { label: 'Surface', turf: t.aptitude[0] ?? '-', dirt: t.aptitude[1] ?? '-' }
    ];
  });

  protected readonly distanceColumns = ['label', 'sprint', 'mile', 'medium', 'long'];
  protected readonly distanceData = computed(() => {
    const t = this.trainee().itemData;
    return [
      { label: 'Distance', sprint: t.aptitude[2] ?? '-', mile: t.aptitude[3] ?? '-', medium: t.aptitude[4] ?? '-', long: t.aptitude[5] ?? '-' }
    ];
  });

  protected readonly strategyColumns = ['label', 'front', 'pace', 'late', 'end'];
  protected readonly strategyData = computed(() => {
    const t = this.trainee().itemData;
    return [
      { label: 'Strategy', front: t.aptitude[6] ?? '-', pace: t.aptitude[7] ?? '-', late: t.aptitude[8] ?? '-', end: t.aptitude[9] ?? '-' }
    ];
  });

  protected isString(reward: any): reward is string {
    return typeof reward === 'string';
  }

  protected isSkillReward(reward: any): reward is DecodedSkillReward {
    return typeof reward === 'object' && reward.type === 'skill';
  }

  private getRarityClass(): string {
    switch (this.trainee().itemData.rarity) {
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

  constructor() {
    const rarityClass = this.getRarityClass();
    if (rarityClass) {
      this.dialogRef.addPanelClass(rarityClass);
    }
  }

  protected close(): void {
    this.dialogRef.close();
  }
}
