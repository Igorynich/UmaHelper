import { Component, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { AdminService, UploadProgress } from '../../services/admin.service';
import { ConfirmationDialog } from '../../components/common/confirmation-dialog/confirmation-dialog';

import { ImagekitioAngularModule } from 'imagekitio-angular';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatProgressBarModule, ImagekitioAngularModule],
  templateUrl: './admin.html',
  styleUrls: ['./admin.css']
})
export class AdminComponent {
  private adminService = inject(AdminService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  isLoading = signal(false);
  uploadProgress = signal<UploadProgress | null>(null);
  skillImages = signal([
    { name: 'skill1.jpg', path: '/skills/skill1.jpg' },
    { name: 'skill2.jpg', path: '/skills/skill2.jpg' },
    { name: 'skill3.jpg', path: '/skills/skill3.jpg' },
  ]);

  onUploadSkills() {
    this.dialog
      .open(ConfirmationDialog, {
        data: {
          title: 'Upload Skills',
          message: 'Are you sure you want to upload skills to Firebase?',
        },
      })
      .afterClosed()
      .subscribe((result) => {
        if (result) {
          this.isLoading.set(true);
          this.uploadProgress.set({ completed: 0, total: 0, successful: 0, failed: 0 });
          this.adminService.uploadSkills().subscribe({
            next: (progress) => {
              this.uploadProgress.set(progress);
              if (progress.completed === progress.total) {
                this.snackBar.open(
                  `Upload complete: ${progress.successful} successful, ${progress.failed} failed.`,
                  'Close',
                  { panelClass: progress.failed > 0 ? ['snackbar-error'] : ['snackbar-success'] }
                );
                this.isLoading.set(false);
              }
            },
            error: (err) => {
              this.snackBar.open(`Upload failed: ${err.message}`, 'Close', {
                panelClass: ['snackbar-error'],
              });
              this.isLoading.set(false);
            },
            complete: () => {
              // This complete block might not be strictly necessary if next handles final state
              // But it's good practice to have it.
              if (this.isLoading()) { // Only set false if not already set by next (for final progress update)
                this.isLoading.set(false);
              }
            },
          });
        }
      });
  }
}