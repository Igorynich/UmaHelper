import {CommonModule} from '@angular/common';
import {Component, computed, effect, inject, signal} from '@angular/core';
import {MatButton} from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
  MatDialogTitle
} from '@angular/material/dialog';
import {ImagekitioAngularModule} from 'imagekitio-angular';
import {Skill} from '../../../interfaces/skill';
import {SkillFieldTranslatorPipe} from '../../../pipes/skill-field-translator.pipe';
import {SkillKeyTranslatorPipe} from '../../../pipes/skill-key-translator.pipe';
import {EntityDisplay} from '../entity-display/entity-display';
import {TraineeService} from '../../../services/trainee.service';
import {Trainee} from '../../../interfaces/trainee';
import {forkJoin} from 'rxjs';

export interface SkillDialogData {
  skill: Skill;
  props: string[];
  displayedProps?: string[];
  excludedProps?: string[];
}

@Component({
  selector: 'app-skill-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ImagekitioAngularModule,
    MatDialogContent,
    MatDialogTitle,
    SkillFieldTranslatorPipe,
    SkillKeyTranslatorPipe,
    EntityDisplay
  ],
  templateUrl: './skill-dialog.html',
  styleUrl: './skill-dialog.css',
})
export class SkillDialogComponent {
  data: SkillDialogData = inject(MAT_DIALOG_DATA);
  // filteredProps: string[];
  readonly displayedProps = ['desc_en', 'endesc', 'char', 'rarity', 'activation', 'cost'];

  private traineeService = inject(TraineeService);

  // Global loading state
  private globalLoadingOperations = signal<Set<string>>(new Set());
  readonly isLoading = computed(() => this.globalLoadingOperations().size > 0);

  // Helper methods for global loading
  private startLoading(operationId: string): void {
    this.globalLoadingOperations.update(ops => new Set(ops).add(operationId));
  }

  private stopLoading(operationId: string): void {
    this.globalLoadingOperations.update(ops => {
      const newOps = new Set(ops);
      newOps.delete(operationId);
      return newOps;
    });
  }

  // Store loaded trainees
  private loadedTrainees = signal<Map<string, Trainee>>(new Map());
  readonly characterTrainees = computed(() => {
    const traineesMap = this.loadedTrainees();
    const charIds = this.data.skill['char'] || [];
    return charIds.map(id => traineesMap.get(id.toString())).filter(Boolean) as Trainee[];
  });

  processedConditionGroups = computed(() => {
    const conditionGroups = this.data.skill.condition_groups;
    if (!conditionGroups || conditionGroups.length === 0) {
      return [];
    }


    console.log('Skill', this.data.skill);

    return conditionGroups.map(group => {
      const result = [];


      if (group.precondition) {
        result.push({ key: 'precondition', value: group.precondition });
      }
      if (group.condition) {
        result.push({ key: 'condition', value: group.condition });
      }
      if (group.cd !== undefined) {
        result.push({ key: 'cd', value: group.cd });
      }
      if (group.base_time !== undefined) { // base_time can be 0 or negative
        result.push({ key: 'base_time', value: group.base_time });
      }
      if (group.effects && group.effects.length > 0) {
        // For effects, we can stringify for now, or format more nicely later
        result.push({ key: 'effects', value: group.effects });
      }
      return result;
    });
  });

  constructor() {
    // Load all trainees upfront when dialog opens
    this.loadCharacterTrainees();
  }

  private loadCharacterTrainees(): void {
    const charIds = this.data.skill['char'] || [];
    if (charIds.length === 0) return;

    this.startLoading('characters');

    // Load all trainees in parallel
    const traineeRequests = charIds.map(charId =>
      this.traineeService.getTraineeById(charId.toString())
    );

    // Use forkJoin to wait for all requests to complete
    forkJoin(traineeRequests).subscribe({
      next: (trainees) => {
        const traineesMap = new Map<string, Trainee>();
        trainees.forEach((trainee, index) => {
          if (trainee) {
            traineesMap.set(charIds[index].toString(), trainee);
          }
        });
        this.loadedTrainees.set(traineesMap);
        console.log('Loaded trainees:', traineesMap);
        this.stopLoading('characters');
      },
      error: () => {
        this.stopLoading('characters');
      }
    });
  }
}

