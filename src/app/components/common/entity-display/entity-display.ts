import { Component, inject, signal, computed, input, effect, output, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { ImagekitioAngularModule } from 'imagekitio-angular';
import { MatTooltip } from '@angular/material/tooltip';
import { Trainee } from '../../../interfaces/trainee';
import { SupportCard } from '../../../interfaces/support-card';
import { TraineeService } from '../../../services/trainee.service';
import { SupportCardService } from '../../../services/support-card.service';

export type DisplayMode = 'text' | 'img';
export type EntityType = 'trainee' | 'support-card';

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
  mode = input<DisplayMode>('text');

  // Output signals
  loading = output<boolean>();

  // Services
  private traineeService = inject(TraineeService);
  private supportCardService = inject(SupportCardService);
  private destroyRef = inject(DestroyRef);

  // State signals
  private traineeLoaded = signal(false);
  private supportCardLoaded = signal(false);
  internalLoading = signal(false);
  private loadedTrainee = signal<Trainee | undefined>(undefined);
  private loadedSupportCard = signal<SupportCard | undefined>(undefined);

  private safeEmitLoading(isLoading: boolean): void {
    if (!this.destroyRef.destroyed) {
      this.loading.emit(isLoading);
    }
  }

  constructor() {
    effect(() => {
      const traineeId = this.traineeId();
      const supportCardId = this.supportCardId();
      const inputTrainee = this.trainee();
      const inputSupportCard = this.supportCard();

      // Handle trainee data
      if (inputTrainee) {
        this.loadedTrainee.set(undefined);
        this.traineeLoaded.set(true);
      } else if (traineeId !== undefined && !this.traineeLoaded()) {
        this.internalLoading.set(true);
        this.safeEmitLoading(true);
        this.loadTrainee(traineeId);
      }

      // Handle support card data
      if (inputSupportCard) {
        this.loadedSupportCard.set(undefined);
        this.supportCardLoaded.set(true);
      } else if (supportCardId !== undefined && !this.supportCardLoaded()) {
        this.internalLoading.set(true);
        this.safeEmitLoading(true);
        this.loadSupportCard(supportCardId);
      }
    });
  }

  private loadTrainee(id: string): void {
    this.traineeService.getTraineeById(id).subscribe({
      next: (trainee) => {
        if (trainee) {
          this.loadedTrainee.set(trainee);
        }
        this.traineeLoaded.set(true);
        this.updateLoadingState();
      },
      error: () => {
        this.traineeLoaded.set(true);
        this.updateLoadingState();
      },
      complete: () => {
        this.internalLoading.set(false);
        this.safeEmitLoading(false);
      }
    });
  }

  private loadSupportCard(id: string): void {
    this.supportCardService.getSupportCardById(id).subscribe({
      next: (supportCard) => {
        if (supportCard) {
          this.loadedSupportCard.set(supportCard);
        }
        this.supportCardLoaded.set(true);
        this.updateLoadingState();
      },
      error: () => {
        this.supportCardLoaded.set(true);
        this.updateLoadingState();
      },
      complete: () => {
        this.internalLoading.set(false);
        this.safeEmitLoading(false);
      }
    });
  }

  private updateLoadingState(): void {
    if (this.traineeLoaded() && this.supportCardLoaded()) {
      this.internalLoading.set(false);
      this.safeEmitLoading(false);
    }
  }

  readonly traineeSignal = computed(() => {
    const inputTrainee = this.trainee();
    if (inputTrainee) {
      return inputTrainee;
    }
    return this.loadedTrainee();
  });

  readonly supportCardSignal = computed(() => {
    const inputSupportCard = this.supportCard();
    if (inputSupportCard) {
      return inputSupportCard;
    }
    return this.loadedSupportCard();
  });

  readonly entityType = computed(() => {
    if (this.traineeSignal()) {
      return 'trainee' as EntityType;
    }
    if (this.supportCardSignal()) {
      return 'support-card' as EntityType;
    }
    return null;
  });

  readonly displayName = computed(() => {
    const trainee = this.traineeSignal();
    const supportCard = this.supportCardSignal();

    if (trainee) {
      return trainee.itemData.name_en;
    }
    if (supportCard) {
      return supportCard.char_name;
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
