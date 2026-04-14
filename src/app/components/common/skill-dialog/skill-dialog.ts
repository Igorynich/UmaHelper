import {CommonModule} from '@angular/common';
import {Component, computed, inject} from '@angular/core';
import {
  MAT_DIALOG_DATA,
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
import {combineLatest, of} from 'rxjs';
import {rxResource} from '@angular/core/rxjs-interop';
import {map} from 'rxjs/operators';
import {SkillMap} from '../../../interfaces/skill-map';
import {SupportCardService} from '../../../services/support-card.service';
import {SupportCard} from '../../../interfaces/support-card';

export interface SkillDialogData {
  skill: Skill;
  skillMap: SkillMap | null | undefined;
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
  readonly displayedProps = ['desc_en', 'endesc', 'char', 'supCardEvents', 'supCardHints', 'rarity', 'activation', 'cost'];

  private traineeService = inject(TraineeService);
  private supportCardService = inject(SupportCardService);

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
        result.push({ key: 'effects', value: group.effects });
      }
      return result;
    });
  });
}

