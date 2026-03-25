import {Component, computed, inject, signal, WritableSignal} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../services/admin.service';
import { SupportCard } from '../../../interfaces/support-card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { SupportCardService } from '../../../services/support-card.service';
import { EventChoice, EventReward, UmaEvent, DecodedEvent, DecodedEventsContainer } from '../../../interfaces/event';
import {EventsService, evntTypeConvertFn} from '../../../services/events.service';
import { Trainee } from '../../../interfaces/trainee';
import { TraineeService } from '../../../services/trainee.service';
import { combineLatest } from 'rxjs';
import {cleanNestedArrays} from '../../../utils/helpers';

@Component({
  selector: 'app-event-upload-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    FormsModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './event-upload-dialog.html',
  styleUrls: ['./event-upload-dialog.css'],
})
export class EventUploadDialog {
  private dialogRef = inject(MatDialogRef<EventUploadDialog>);
  private adminService = inject(AdminService);
  private supportCardService = inject(SupportCardService);
  private traineeService = inject(TraineeService);
  private eventsService = inject(EventsService); // New injection
  private snackBar = inject(MatSnackBar);

  entityId = signal('');
  eventJsonString = signal('');

  isChecking = signal(false);
  isJsonChecking = signal(false);
  isUploading = signal(false);

  foundEntity: WritableSignal<SupportCard | Trainee | null> = signal(null);
  entityType: WritableSignal<'card' | 'trainee' | null> = signal(null);
  entityName = computed(() => {
    if (this.entityType() === 'card') {
      return (this.foundEntity() as SupportCard).url_name;
    } else if (this.entityType() === 'trainee') {
      return (this.foundEntity() as Trainee).itemData?.name_en;
    }
    return '';
  });
  parsedEvents: WritableSignal<any | null> = signal(null);
  decodedEvents: WritableSignal<DecodedEventsContainer | null> = signal(null);
  displayedDecodedEvents= computed(() => evntTypeConvertFn(this.decodedEvents()));

  get isUploadDisabled(): boolean {
    return !this.foundEntity() || !this.parsedEvents();
  }

  checkEntity() {
    const id = this.entityId();
    if (!id) return;

    this.isChecking.set(true);
    this.foundEntity.set(null);
    this.entityType.set(null);
    combineLatest([
      this.supportCardService.getSupportCardById(id),
      this.traineeService.getTraineeById(id)
    ]).subscribe({
      next: ([card, trainee]) => {
        if (card && trainee) {
          this.snackBar.open(`Conflict: Both support card and trainee found with ID: ${id}`, 'Close', { panelClass: 'snackbar-error' });
          console.error('Conflict found - both card and trainee exist:', { card, trainee });
        } else if (card) {
          this.foundEntity.set(card);
          this.entityType.set('card');
          this.snackBar.open(`Found card: ${card.url_name}`, 'Close', { duration: 3000 });
          console.log('Found card:', card);
        } else if (trainee) {
          this.foundEntity.set(trainee);
          this.entityType.set('trainee');
          const traineeId = trainee.itemData?.card_id || id;
          const traineeName = trainee.itemData?.name_en || `Trainee ${traineeId}`;
          this.snackBar.open(`Found trainee: ${traineeName}`, 'Close', { duration: 3000 });
          console.log('Found trainee:', trainee);
        } else {
          this.snackBar.open('No support card or trainee found with this ID.', 'Close', { panelClass: 'snackbar-error' });
        }
        this.isChecking.set(false);
      },
      error: (err) => {
        this.snackBar.open(`Error checking entity: ${err.message}`, 'Close', { panelClass: 'snackbar-error' });
        this.isChecking.set(false);
      }
    });
  }

  checkJson() {
    const jsonStr = this.eventJsonString();
    if (!jsonStr) return;

    this.isJsonChecking.set(true);
    this.parsedEvents.set(null);
    this.decodedEvents.set(null);

    try {
      let parsed = JSON.parse(jsonStr);

      // Handle double-stringified JSON
      if (typeof parsed === 'string') {
        parsed = JSON.parse(parsed);
      }

      this.parsedEvents.set(this.eventsService.filterParsedEventData(parsed));
      const decodedEvnts = this.eventsService.decodeEvents(this.parsedEvents());
      this.decodedEvents.set(decodedEvnts); // Changed call
      const eventGroups = evntTypeConvertFn(decodedEvnts);
      if (!eventGroups?.length || !eventGroups.map(group  => group.events).flat()?.length) {
        throw new Error('No events found in the JSON.');
      }
      this.snackBar.open('JSON parsed and decoded successfully!', 'Close', { duration: 3000 });
    } catch (error: any) {
      this.snackBar.open(`Invalid JSON: ${error.message}`, 'Close', { panelClass: 'snackbar-error' });
      console.log(error);
    } finally {
      this.isJsonChecking.set(false);
    }
  }

  uploadEvents() {
    const entity = this.foundEntity();
    const entityType = this.entityType();
    const events = this.parsedEvents();

    if (!entity || !entityType || !events) {
      this.snackBar.open('Entity not verified or JSON not parsed.', 'Close', { panelClass: 'snackbar-error' });
      return;
    }

    let entityId: string;
    if (entityType === 'card') {
      entityId = (entity as SupportCard).support_id.toString();
    } else if (entityType === 'trainee') {
      entityId = (entity as Trainee).itemData?.card_id?.toString() || this.entityId();
    } else {
      this.snackBar.open('Unknown entity type.', 'Close', { panelClass: 'snackbar-error' });
      return;
    }

    this.isUploading.set(true);
    const cleanedEvents = cleanNestedArrays(events);
    this.adminService.uploadEvents(entityId, cleanedEvents).subscribe({
      next: () => {
        this.isUploading.set(false);
        const entityTypeName = entityType === 'card' ? 'support card' : 'trainee';
        this.snackBar.open(`Events uploaded successfully for ${entityTypeName}!`, 'Close', { panelClass: 'snackbar-success' });
        this.dialogRef.close(true);
      },
      error: (err) => {
        this.isUploading.set(false);
        this.snackBar.open(`Upload failed: ${err.message}`, 'Close', { panelClass: ['snackbar-error'] });
        console.log(err);
      }
    });
  }
}
