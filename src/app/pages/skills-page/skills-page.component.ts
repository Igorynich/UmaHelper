import { Component, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { AdminService, UploadProgress } from '../../services/admin.service';
import { AbilityService } from '../../services/ability.service';
import { AbilityAction, AbilitySubject } from '../../interfaces/ability';
import { ConfirmationDialog } from '../../components/common/confirmation-dialog/confirmation-dialog';
import { SpinnerComponent } from '../../components/common/spinner/spinner';

@Component({
  selector: 'app-skills-page',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatProgressBarModule],
  templateUrl: './skills-page.component.html',
  styleUrl: './skills-page.component.css',
})
export class SkillsPageComponent {
  private adminService = inject(AdminService);
  private abilityService = inject(AbilityService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  isLoading = signal(false);
  uploadProgress = signal<UploadProgress | null>(null);

  canManageSkills = computed(() =>
    this.abilityService.ability().can(AbilityAction.Manage, AbilitySubject.All)
  );

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
