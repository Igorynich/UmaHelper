import {ChangeDetectionStrategy, Component, computed, inject, input, Signal} from '@angular/core';
import {MatExpansionModule} from '@angular/material/expansion';
import {SkillDisplay, SkillDisplayMode} from '../skill-display/skill-display';
import {rxResource} from '@angular/core/rxjs-interop';
import {of} from 'rxjs';
import {EventsService, evntTypeConvertFn} from '../../../services/events.service';
import {
  EventConditionType,
  EventRewardDataType,
  EventRewardType
} from '../../../interfaces/event';
import {NgTemplateOutlet} from '@angular/common';
import {MatChip} from '@angular/material/chips';
import {EntityDisplay} from '../entity-display/entity-display';
import {STRATEGY} from '../../../interfaces/strategy';

@Component({
  selector: 'app-training-events',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatExpansionModule, SkillDisplay, NgTemplateOutlet, MatChip, EntityDisplay],
  templateUrl: './training-events.html',
  styleUrl: './training-events.css'
})
export class TrainingEventsComponent {
  private readonly eventsService = inject(EventsService);

  readonly entityId = input.required<number | string>();

  protected SkillDisplayMode = SkillDisplayMode;

  protected readonly trainingEventsResource = rxResource({
    params: () => ({ cardId: this.entityId() }),
    stream: ({ params }) => {
      if (!params.cardId) return of(null);
      return this.eventsService.getAndDecodeEvents(params.cardId.toString());
    }
  });

  protected readonly displayedTrainingEvents = computed(() => {
    console.log('displayedTrainingEvents', this.trainingEventsResource.value());
    return evntTypeConvertFn(this.trainingEventsResource.value() ?? null);
  });

  protected readonly EventRewardDataType = EventRewardDataType;
  protected readonly EventRewardType = EventRewardType;
  protected readonly Object = Object;
  protected readonly EventConditionType = EventConditionType;
  protected readonly STRATEGY = STRATEGY;
}
