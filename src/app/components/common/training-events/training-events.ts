import {ChangeDetectionStrategy, Component, computed, inject, input, Signal} from '@angular/core';
import {MatExpansionModule} from '@angular/material/expansion';
import {SkillDisplay, SkillDisplayMode} from '../skill-display/skill-display';
import {rxResource} from '@angular/core/rxjs-interop';
import {of} from 'rxjs';
import {EventsService, evntTypeConvertFn} from '../../../services/events.service';
import {
  EventRewardDataType,
  EventRewardType
} from '../../../interfaces/event';

@Component({
  selector: 'app-training-events',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatExpansionModule, SkillDisplay],
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
    return evntTypeConvertFn(this.trainingEventsResource.value() ?? null);
  });

  protected readonly EventRewardDataType = EventRewardDataType;
  protected readonly EventRewardType = EventRewardType;
}
