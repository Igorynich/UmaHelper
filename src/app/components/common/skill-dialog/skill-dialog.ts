import {CommonModule} from '@angular/common';
import {Component, computed, inject} from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialogContent, MatDialogRef,
  MatDialogTitle
} from '@angular/material/dialog';
import {ImagekitioAngularModule} from 'imagekitio-angular';
import {Effect, Skill, SkillEffect} from '../../../interfaces/skill';
import {SkillFieldTranslatorPipe} from '../../../pipes/skill-field-translator.pipe';
import {SkillKeyTranslatorPipe} from '../../../pipes/skill-key-translator.pipe';
import {EntityDisplay} from '../entity-display/entity-display';
import {TraineeService} from '../../../services/trainee.service';
import {Trainee} from '../../../interfaces/trainee';
import {combineLatest, of} from 'rxjs';
import {rxResource} from '@angular/core/rxjs-interop';
import {map} from 'rxjs/operators';
import {SkillMap} from '../../../interfaces/skill-map';
import {SupportCardService} from '../../../services/support-card.service';
import {SupportCard} from '../../../interfaces/support-card';
import {ModalControlService} from '../../../services/modal-control';
import {MatIcon} from '@angular/material/icon';
import {MatIconButton} from '@angular/material/button';
import {NgpTooltip, NgpTooltipTrigger} from 'ng-primitives/tooltip';

export interface SkillDialogData {
  skill: Skill;
  skillMap: SkillMap | null | undefined;
  props: string[];
  displayedProps?: string[];
  excludedProps?: string[];
}

export interface SpecialScalingEffect {
  baseValue?: number,
  scalesWith: string,
  thresholds?: number[],
  thresholdMode?: 'inequality' | 'percentage',      // 'inequality' is default
  multipliers?: number[],
  columnNames?: string[]
}

export interface SpecialConditionSkills {
  scalingEffects: Record<number, Record<number, SpecialScalingEffect>>
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
    EntityDisplay,
    MatIcon,
    MatIconButton,
    NgpTooltipTrigger,
    NgpTooltip
  ],
  templateUrl: './skill-dialog.html',
  styleUrl: './skill-dialog.css',
})
export class SkillDialogComponent {
  private modalControlService = inject(ModalControlService);
  private traineeService = inject(TraineeService);
  private supportCardService = inject(SupportCardService);

  data: SkillDialogData = inject(MAT_DIALOG_DATA);
  protected readonly dialogRef = inject(MatDialogRef<SkillDialogComponent>);
  // filteredProps: string[];
  readonly displayedProps = ['desc_en', 'endesc', 'char', 'supCardEvents', 'supCardHints', 'rarity', 'activation', 'cost'];

  protected readonly SPECIAL_CONDITIONS_SKILLS: SpecialConditionSkills = {
    scalingEffects: {
      // Ticket to Your Dreams!
      110351: {
        [SkillEffect.TargetSpeed]: {
          baseValue: 500,
          scalesWith: 'Activates each time you activate another skill, up to 3 times',
        },
      },
      // Risky Business
      202032: {
        [SkillEffect.Stamina]: {
          scalesWith: 'Selected Randomly',
          thresholds: [60, 30, 10],
          thresholdMode: 'percentage',
          columnNames: ['Chance'],
          multipliers: [0, 0.02, 0.04]
        }
      },
      // Nothing Ventured
      202031: {
        [SkillEffect.Stamina]: {
          scalesWith: 'Selected Randomly',
          thresholds: [60, 30, 10],
          thresholdMode: 'percentage',
          columnNames: ['Chance'],
          multipliers: [0, 0.02, 0.04]
        }
      },
      // Luck Runs My Way
      100981: {
        [SkillEffect.TargetSpeed]: {
          baseValue: 500,
          scalesWith: 'Scales with the number of green skills activated during the race',
          thresholds: [0, 3, 5, 6],
          columnNames: ['Skills'],
          multipliers: [0, 1, 2, 3]
        },
        [SkillEffect.Acceleration]: {
          baseValue: 500,
          scalesWith: 'Scales with the number of green skills activated during the race',
          thresholds: [0, 3, 5, 6],
          columnNames: ['Skills'],
          multipliers: [0, 1, 2, 3]
        }
      },
      // Ignited Spirit GUTS
      210042: {
        [SkillEffect.TargetSpeed]: {
          scalesWith: 'Scales with Your team\'s combined base Guts stat after Mood modifiers but before green skill modifiers',
          thresholds: [0, 1200, 1800, 2600, 3600],
          multipliers: [0.8, 0.9, 1.0, 1.1, 1.2]
        },
        [SkillEffect.Acceleration]: {
          scalesWith: 'Scales with Your team\'s combined base Guts stat after Mood modifiers but before green skill modifiers',
          thresholds: [0, 1200, 1800, 2600, 3600],
          multipliers: [0.8, 0.9, 1.0, 1.1, 1.2]
        }
      },
      // Burning Spirit GUTS
      210041: {
        [SkillEffect.TargetSpeed]: {
          scalesWith: 'Scales with Your team\'s combined base Guts stat after Mood modifiers but before green skill modifiers',
          thresholds: [0, 1200, 1800, 2600, 3600],
          multipliers: [0.8, 0.9, 1.0, 1.1, 1.2]
        },
        [SkillEffect.Acceleration]: {
          scalesWith: 'Scales with Your team\'s combined base Guts stat after Mood modifiers but before green skill modifiers',
          thresholds: [0, 1200, 1800, 2600, 3600],
          multipliers: [0.8, 0.9, 1.0, 1.1, 1.2]
        }
      },
      // Ignited Spirit SPD
      210012: {
        [SkillEffect.TargetSpeed]: {
          scalesWith: 'Scales with Your team\'s combined base Speed stat after Mood modifiers but before green skill modifiers',
          thresholds: [0, 1200, 1800, 2600, 3600],
          multipliers: [0.8, 0.9, 1.0, 1.1, 1.2]
        },
      },
      // Burning Spirit SPD
      210011: {
        [SkillEffect.TargetSpeed]: {
          scalesWith: 'Scales with Your team\'s combined base Speed stat after Mood modifiers but before green skill modifiers',
          thresholds: [0, 1200, 1800, 2600, 3600],
          multipliers: [0.8, 0.9, 1.0, 1.1, 1.2]
        },
      },
      // Ignited Spirit STA
      210022: {
        [SkillEffect.Stamina]: {
          scalesWith: 'Scales with Your team\'s combined base Stamina stat after Mood modifiers but before green skill modifiers',
          thresholds: [0, 1200, 1800, 2600, 3600],
          multipliers: [0.8, 0.9, 1.0, 1.1, 1.2]
        },
      },
      // Burning Spirit STA
      210021: {
        [SkillEffect.Stamina]: {
          scalesWith: 'Scales with Your team\'s combined base Stamina stat after Mood modifiers but before green skill modifiers',
          thresholds: [0, 1200, 1800, 2600, 3600],
          multipliers: [0.8, 0.9, 1.0, 1.1, 1.2]
        },
      },
      // Ignited Spirit PWR
      210032: {
        [SkillEffect.Acceleration]: {
          scalesWith: 'Scales with Your team\'s combined base Power stat after Mood modifiers but before green skill modifiers',
          thresholds: [0, 1200, 1800, 2600, 3600],
          multipliers: [0.8, 0.9, 1.0, 1.1, 1.2]
        }
      },
      // Burning Spirit PWR
      210031: {
        [SkillEffect.Acceleration]: {
          scalesWith: 'Scales with Your team\'s combined base Power stat after Mood modifiers but before green skill modifiers',
          thresholds: [0, 1200, 1800, 2600, 3600],
          multipliers: [0.8, 0.9, 1.0, 1.1, 1.2]
        }
      },
      // Ignited Spirit WIT
      210052: {
        [SkillEffect.LaneMovementSpeed]: {
          scalesWith: 'Scales with Your team\'s combined base Wit stat after Mood modifiers but before green skill modifiers',
          thresholds: [0, 1200, 1800, 2600, 3600],
          multipliers: [0.8, 0.9, 1.0, 1.1, 1.2]
        },
        [SkillEffect.FieldOfView]: {
          scalesWith: 'Scales with Your team\'s combined base Wit stat after Mood modifiers but before green skill modifiers',
          thresholds: [0, 1200, 1800, 2600, 3600],
          multipliers: [0.8, 0.9, 1.0, 1.1, 1.2]
        }
      },
      // Burning Spirit WIT
      210051: {
        [SkillEffect.LaneMovementSpeed]: {
          scalesWith: 'Scales with Your team\'s combined base Wit stat after Mood modifiers but before green skill modifiers',
          thresholds: [0, 1200, 1800, 2600, 3600],
          multipliers: [0.8, 0.9, 1.0, 1.1, 1.2]
        },
        [SkillEffect.FieldOfView]: {
          scalesWith: 'Scales with Your team\'s combined base Wit stat after Mood modifiers but before green skill modifiers',
          thresholds: [0, 1200, 1800, 2600, 3600],
          multipliers: [0.8, 0.9, 1.0, 1.1, 1.2]
        }
      },
      // Glittering Star
      210062: {
        [SkillEffect.TargetSpeed]: {
          scalesWith: 'Scales with the number of races won',
          columnNames: ['Wins'],
          thresholds: [0, 6, 14, 18, 25],
          multipliers: [0.8, 0.9, 1.0, 1.1, 1.2]
        },
        [SkillEffect.Acceleration]: {
          scalesWith: 'Scales with the number of races won',
          columnNames: ['Wins'],
          thresholds: [0, 6, 14, 18, 25],
          multipliers: [0.8, 0.9, 1.0, 1.1, 1.2]
        },
        [SkillEffect.Stamina]: {
          scalesWith: 'Scales with the number of races won',
          columnNames: ['Wins'],
          thresholds: [0, 6, 14, 18, 25],
          multipliers: [0.8, 0.9, 1.0, 1.1, 1.2]
        }
      },
      // Radiant Star
      210061: {
        [SkillEffect.TargetSpeed]: {
          scalesWith: 'Scales with the number of races won',
          columnNames: ['Wins'],
          thresholds: [0, 6, 14, 18, 25],
          multipliers: [0.8, 0.9, 1.0, 1.1, 1.2]
        },
        [SkillEffect.Acceleration]: {
          scalesWith: 'Scales with the number of races won',
          columnNames: ['Wins'],
          thresholds: [0, 6, 14, 18, 25],
          multipliers: [0.8, 0.9, 1.0, 1.1, 1.2]
        },
        [SkillEffect.Stamina]: {
          scalesWith: 'Scales with the number of races won',
          columnNames: ['Wins'],
          thresholds: [0, 6, 14, 18, 25],
          multipliers: [0.8, 0.9, 1.0, 1.1, 1.2]
        }
      },
      // On the Way to Our Dream
      210072: {
        [SkillEffect.TargetSpeed]: {
          scalesWith: 'Scales with your fan count',
          columnNames: ['Fans'],
          thresholds: [0, 20000, 50000, 100000, 160000],
          multipliers: [0.8, 0.9, 1.0, 1.1, 1.2]
        },
        [SkillEffect.Acceleration]: {
          scalesWith: 'Scales with your fan count',
          columnNames: ['Fans'],
          thresholds: [0, 20000, 50000, 100000, 160000],
          multipliers: [0.8, 0.9, 1.0, 1.1, 1.2]
        }
      },
      // I Wanna Win with You
      210071: {
        [SkillEffect.TargetSpeed]: {
          scalesWith: 'Scales with your fan count',
          columnNames: ['Fans'],
          thresholds: [0, 20000, 50000, 100000, 160000],
          multipliers: [0.8, 0.9, 1.0, 1.1, 1.2]
        },
        [SkillEffect.Acceleration]: {
          scalesWith: 'Scales with your fan count',
          columnNames: ['Fans'],
          thresholds: [0, 20000, 50000, 100000, 160000],
          multipliers: [0.8, 0.9, 1.0, 1.1, 1.2]
        }
      },
      // Eyes on the Goal
      210082: {
        [SkillEffect.TargetSpeed]: {
          scalesWith: 'Scales with the highest base value among your five stats',
          columnNames: ['Highest Stat'],
          thresholds: [0, 600, 800, 1000, 1100],
          multipliers: [0.8, 0.9, 1.0, 1.1, 1.2]
        },
      },
      // Past My Limits
      210081: {
        [SkillEffect.TargetSpeed]: {
          scalesWith: 'Scales with the highest base value among your five stats',
          columnNames: ['Highest Stat'],
          thresholds: [0, 600, 800, 1000, 1100],
          multipliers: [0.8, 0.9, 1.0, 1.1, 1.2]
        },
      }
    }
  }

  private traineesResource = rxResource({
    params: () => ({
      ids: (this.data.skill['char'] || [])
    }),
    stream: ({ params }) => {
      if (params.ids.length === 0) return of([]);

      const requests = params.ids.map(id =>
        this.traineeService.getTraineeById(id.toString())
      );

      return combineLatest(requests).pipe(
        map(results => results.filter((t): t is Trainee => !!t))
      );
    }
  });

  private supCardsResource = rxResource({
    params: () => {
      const eventIds = this.data.skillMap?.supCards.events || [];
      const hintIds = this.data.skillMap?.supCards.hints || [];
      return {
        eventIds,
        hintIds
      }
    },
    stream: ({ params }) => {
      const allIds = [...params.eventIds, ...params.hintIds];
      if (allIds.length === 0) return of([]);

      const requests = allIds.map(id =>
        this.supportCardService.getSupportCardById(id.toString())
      );

      return combineLatest(requests).pipe(
        map(results => results.filter((sc): sc is SupportCard => !!sc)));
    }
  });

  readonly supCardEvents = computed(() => {
    return this.data.skillMap?.supCards.events || [];
  });

  readonly supCardHints = computed(() => {
    return this.data.skillMap?.supCards.hints || [];
  });

  // Состояние загрузки теперь берется напрямую из ресурса
  readonly isLoading = computed(() => this.traineesResource.isLoading() && this.supCardsResource.isLoading());

  // Данные фильтруются автоматически
  readonly characterTrainees = computed(() => {
    const trainees = this.traineesResource.value() || [];
    return trainees.filter((t): t is Trainee => !!t);
  });

  readonly supCards = computed(() => {
    const supCardsArr = this.supCardsResource.value() || [];
    return supCardsArr.reduce((prev, cur) => {
      if (!cur) {
        return prev;
      }
      return {
        ...prev,
        [cur.support_id]: cur
      }
    }, {} as Record<string, SupportCard>);
  });

  processedConditionGroups = computed(() => {
    const conditionGroups = this.data.skill.condition_groups;
    if (!conditionGroups || conditionGroups.length === 0) {
      return [];
    }


    console.log('Skill', this.data.skill);
    console.log('SkillMap', this.data.skillMap);

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
        result.push({ key: 'effects', value: (group.effects as Effect[]) });
      }
      return result;
    });
  });

  protected openTraineeDetailModal(trainee: Trainee): void {
    if (trainee) {
      this.modalControlService.open('traineeInfo', {
        data: { mode: 'mini', trainee }
      });
    }
  }

  protected openSupCardDetailModal(cardData: SupportCard): void {
    if (cardData) {
      this.modalControlService.open('supportCardInfo', {
        data: { mode: 'mini', card: cardData }
      });
    }
  }

  protected close(): void {
    this.dialogRef.close();
  }

  protected asEffects(value: any): Effect[] {
    return value as Effect[];
  }
}

