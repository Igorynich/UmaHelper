import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject, signal,
  Signal
} from '@angular/core';
import {rxResource} from '@angular/core/rxjs-interop';
import {of} from 'rxjs';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatIconButton } from '@angular/material/button';
import { ImagekitioAngularModule } from 'imagekitio-angular';
import {Rarity} from '../../../interfaces/display-support-card';
import {MatTableModule} from '@angular/material/table';
import {MatTooltip} from '@angular/material/tooltip';
import { DatePipe } from '@angular/common';
import { SkillsService } from '../../../services/skills.service';
import { SkillDisplay, SkillDisplayMode } from '../../common/skill-display/skill-display';
import { TrainingEventsComponent } from '../../common/training-events/training-events';
import {Trainee} from '../../../interfaces/trainee';
import {TraineeService} from '../../../services/trainee.service';

export interface TraineeInfoDialogData {
  mode?: 'full' | 'mini';
  trainee: Trainee;
}

@Component({
  selector: 'app-trainee-info',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ImagekitioAngularModule, MatDialogModule, MatIconButton, MatIconModule, MatTableModule, MatTooltip, SkillDisplay, TrainingEventsComponent, DatePipe],
  templateUrl: './trainee-info.html',
  styleUrl: './trainee-info.css'
})
export class TraineeInfo {

  private readonly traineeService = inject(TraineeService);

  protected readonly dialogData = signal(inject(MAT_DIALOG_DATA) as TraineeInfoDialogData);
  protected readonly trainee = computed(() => this.dialogData().trainee);
  protected readonly mode = signal<'full' | 'mini'>(this.dialogData().mode || 'full');
  protected readonly SkillDisplayMode = SkillDisplayMode;

  protected readonly dialogRef = inject(MatDialogRef<TraineeInfo>);
  private readonly skillsService = inject(SkillsService);

  protected readonly title = computed(() => this.trainee().itemData.title_en_gl);
  protected readonly name = computed(() => this.trainee().itemData.name_en);
  protected readonly version = computed(() => this.trainee().itemData.version);
  protected readonly imageUrl = computed(() => this.traineeService.getTraineeImageUrl(this.trainee()));

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

  protected readonly uniqueSkills = computed(() => this.uniqueSkillsResource.value() ?? []);
  protected readonly innateSkills = computed(() => this.innateSkillsResource.value() ?? []);
  protected readonly awakeningSkills = computed(() => this.awakeningSkillsResource.value() ?? []);
  protected readonly eventSkills = computed(() => this.eventSkillsResource.value() ?? []);

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

  protected switchMode(newMode: 'full' | 'mini'): void {
    this.mode.set(newMode);
  }
}
