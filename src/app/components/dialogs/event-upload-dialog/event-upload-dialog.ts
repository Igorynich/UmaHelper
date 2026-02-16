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
import { EventChoice, EventReward, UmaEvent, DecodedEvent, DecodedEventsContainer } from '../../../interfaces/event'; // Updated import
import {EventsService, evntTypeConvertFn} from '../../../services/events.service';
import {group} from '@angular/animations'; // New import

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
  private eventsService = inject(EventsService); // New injection
  private snackBar = inject(MatSnackBar);

  supportCardId = signal('');
  eventJsonString = signal('');

  isCardChecking = signal(false);
  isJsonChecking = signal(false);
  isUploading = signal(false);

  foundCard: WritableSignal<SupportCard | null> = signal(null);
  parsedEvents: WritableSignal<any | null> = signal(null);
  decodedEvents: WritableSignal<DecodedEventsContainer | null> = signal(null);
  displayedDecodedEvents= computed(() => evntTypeConvertFn(this.decodedEvents()));

  get isUploadDisabled(): boolean {
    return !this.foundCard() || !this.parsedEvents();
  }

  checkCard() {
    const id = this.supportCardId();
    if (!id) return;

    this.isCardChecking.set(true);
    this.foundCard.set(null);
    this.supportCardService.getSupportCardById(id).subscribe({
      next: (card) => {
        if (card) {
          this.foundCard.set(card);
          this.snackBar.open(`Found card: ${card.url_name}`, 'Close', { duration: 3000 });
          console.log('Found card:', card);
        } else {
          this.snackBar.open('Support card with this ID does not exist.', 'Close', { panelClass: 'snackbar-error' });
        }
        this.isCardChecking.set(false);
      },
      error: (err) => {
        this.snackBar.open(`Error checking card: ${err.message}`, 'Close', { panelClass: 'snackbar-error' });
        this.isCardChecking.set(false);
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

      this.parsedEvents.set(parsed);
      console.log('parsedEvents', this.parsedEvents());
      const decodedEvnts = this.eventsService.decodeEvents(parsed);
      this.decodedEvents.set(decodedEvnts); // Changed call
      console.log('decodedEvents', this.decodedEvents());
      const eventGroups = evntTypeConvertFn(decodedEvnts);
      if (!eventGroups?.length || !eventGroups.map(group  => group.events).flat()?.length) {
        throw new Error('No events found in the JSON.');
      }
      this.snackBar.open('JSON parsed and decoded successfully!', 'Close', { duration: 3000 });
    } catch (error: any) {
      this.snackBar.open(`Invalid JSON: ${error.message}`, 'Close', { panelClass: 'snackbar-error' });
    } finally {
      this.isJsonChecking.set(false);
    }
  }

  uploadEvents() {
    const cardId = this.foundCard()?.support_id;
    const events = this.parsedEvents();

    if (!cardId || !events) {
      this.snackBar.open('Card ID not verified or JSON not parsed.', 'Close', { panelClass: 'snackbar-error' });
      return;
    }

    this.isUploading.set(true);
    this.adminService.uploadEvents(cardId.toString(), events).subscribe({
      next: () => {
        this.isUploading.set(false);
        this.snackBar.open('Events uploaded successfully!', 'Close', { panelClass: 'snackbar-success' });
        this.dialogRef.close(true);
      },
      error: (err) => {
        this.isUploading.set(false);
        this.snackBar.open(`Upload failed: ${err.message}`, 'Close', { panelClass: ['snackbar-error'] });
      }
    });
  }
}
