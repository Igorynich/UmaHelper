import {Component, inject, computed, input, ResourceRef} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { ImagekitioAngularModule } from 'imagekitio-angular';
import { MatTooltip } from '@angular/material/tooltip';
import { Trainee } from '../../../interfaces/trainee';
import { SupportCard } from '../../../interfaces/support-card';
import { TraineeService } from '../../../services/trainee.service';
import { SupportCardService } from '../../../services/support-card.service';
import {rxResource} from '@angular/core/rxjs-interop';
import {Observable, of} from 'rxjs';
import {RACES} from '../../../interfaces/races';
import {Race} from '../../../interfaces/race';
import {YEAR} from '../../../interfaces/year';

export type DisplayMode = 'text' | 'img';
export type EntityType = 'trainee' | 'support-card' | 'race';

@Component({
  selector: 'app-entity-display',
  standalone: true,
  imports: [CommonModule, MatCardModule, ImagekitioAngularModule, MatTooltip],
  templateUrl: './entity-display.html',
  styleUrl: './entity-display.css'
})
export class EntityDisplay {
  // Input signals
  trainee = input<Trainee | undefined>(undefined);
  supportCard = input<SupportCard | undefined>(undefined);
  traineeId = input<string | undefined>(undefined);
  supportCardId = input<string | undefined>(undefined);
  raceId = input<string | number| undefined>(undefined);
  yearId = input<string | number | undefined>(undefined);
  mode = input<DisplayMode>('text');

  protected entityResource: ResourceRef<Trainee | SupportCard | Race | null | undefined> = rxResource({
    params: () => ({
      id: (this.traineeId() || this.supportCardId() || this.raceId())?.toString()
    }),
    stream: ({ params }) => {
      if (!params.id) return of(null);
      let request: Observable<Trainee | SupportCard | Race | null> = of(null);
      if (this.traineeId()) {
        request = this.traineeService.getTraineeById(params.id);
      }
      if (this.supportCardId()) {
        request = this.supportCardService.getSupportCardById(params.id);
      }
      if (this.raceId()) {
        request = of(RACES.find(r => r.id === Number(params.id)) || null);
      }
      return request;
    }
  });

  // Services
  private traineeService = inject(TraineeService);
  private supportCardService = inject(SupportCardService);

  readonly traineeSignal = computed(() => {
    const inputTrainee = this.trainee();
    if (inputTrainee) {
      return inputTrainee;
    }
    return this.traineeId() ? this.entityResource.value() as Trainee : undefined;
  });

  readonly supportCardSignal = computed(() => {
    const inputSupportCard = this.supportCard();
    if (inputSupportCard) {
      return inputSupportCard;
    }
    return this.supportCardId() ? this.entityResource.value() as SupportCard : undefined;
  });

  readonly raceSignal = computed(() => {
    return this.raceId() ? this.entityResource.value() as Race : undefined;
  });

  readonly entityType = computed(() => {
    if (this.traineeSignal()) {
      return 'trainee' as EntityType;
    }
    if (this.supportCardSignal()) {
      return 'support-card' as EntityType;
    }
    if (this.raceSignal()) {
      return 'race' as EntityType;
    }
    return null;
  });

  readonly displayName = computed(() => {
    const trainee = this.traineeSignal();
    const supportCard = this.supportCardSignal();
    const race = this.raceSignal();

    if (trainee) {
      return trainee.itemData.name_en;
    }
    if (supportCard) {
      return supportCard.char_name;
    }
    if (race) {
      if (this.yearId()) {
        const yearName = YEAR[Number(this.yearId())];
        return `${race.name_en} (${yearName})`;
      }
      return race.name_en;
    }
    return 'Unknown Entity';
  });

  readonly displayImage = computed(() => {
    const trainee = this.traineeSignal();
    const supportCard = this.supportCardSignal();

    if (trainee) {
      return this.traineeService.getTraineeImageUrl(trainee);
    }
    if (supportCard) {
      return this.supportCardService.getSupportCardImageUrl(supportCard.support_id);
    }
    return null;
  });
}
