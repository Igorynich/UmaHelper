import { Component, inject, computed, signal, WritableSignal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatIconModule } from '@angular/material/icon';
import { AdminService, SkillComparison, SupportCardComparison, UploadProgress } from '../../services/admin.service';
import { ConfirmationDialog } from '../../components/common/confirmation-dialog/confirmation-dialog';
import { Skill } from '../../interfaces/skill';
import { SupportCard } from '../../interfaces/support-card';
import { SkillSchema } from '../../interfaces/skill.schema';
import { SupportCardSchema } from '../../interfaces/support-card.schema';
import { ImagekitioAngularModule } from 'imagekitio-angular';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatProgressBarModule, MatIconModule, ImagekitioAngularModule],
  templateUrl: './admin.html',
  styleUrls: ['./admin.css']
})
export class AdminComponent {
  private adminService = inject(AdminService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  loadedSkills = signal<Skill[] | null>(null);
  skillFileName = signal<string | null>(null);
  isSkillLoading = signal(false);
  skillUploadProgress = signal<UploadProgress | null>(null);
  skillComparisonResult: WritableSignal<SkillComparison | null> = signal(null);

  loadedSupportCards = signal<SupportCard[] | null>(null);
  supportCardFileName = signal<string | null>(null);
  isSupportCardLoading = signal(false);
  supportCardUploadProgress = signal<UploadProgress | null>(null);
  supportCardComparisonResult: WritableSignal<SupportCardComparison | null> = signal(null);

  hasSkillChanges = computed(() => {
    const result = this.skillComparisonResult();
    return result && (result.added.length > 0 || result.changed.length > 0);
  });

  hasSupportCardChanges = computed(() => {
    const result = this.supportCardComparisonResult();
    return result && (result.added.length > 0 || result.changed.length > 0);
  });

  onFileSelected(event: Event, type: 'skills' | 'support-cards') {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) {
      return;
    }

    const file = input.files[0];
    const reader = new FileReader();

    reader.onload = () => {
      try {
        const rawData = JSON.parse(reader.result as string);
        if (type === 'skills') {
          const validatedData = this.adminService.validateData(rawData, SkillSchema);
          this.loadedSkills.set(validatedData);
          this.skillFileName.set(file.name);
          this.skillComparisonResult.set(null); // Clear previous comparison results
          this.snackBar.open(`Successfully loaded and validated ${file.name} (${validatedData.length} skills).`, 'Close', { duration: 3000 });
        } else {
          const validatedData = this.adminService.validateData(rawData, SupportCardSchema);
          this.loadedSupportCards.set(validatedData);
          this.supportCardFileName.set(file.name);
          this.supportCardComparisonResult.set(null); // Clear previous comparison results
          this.snackBar.open(`Successfully loaded and validated ${file.name} (${validatedData.length} support cards).`, 'Close', { duration: 3000 });
        }
      } catch (error: any) {
        this.snackBar.open(`Error processing ${file.name}: ${error.message}`, 'Close', { panelClass: 'snackbar-error' });
        if (type === 'skills') {
          this.clearSkillData();
        } else {
          this.clearSupportCardData();
        }
      }
    };

    reader.onerror = () => {
      this.snackBar.open(`Error reading file ${file.name}.`, 'Close', { panelClass: 'snackbar-error' });
      if (type === 'skills') {
        this.clearSkillData();
      } else {
        this.clearSupportCardData();
      }
    };

    reader.readAsText(file);
  }

  clearSkillData() {
    this.loadedSkills.set(null);
    this.skillFileName.set(null);
    this.skillComparisonResult.set(null);
    this.skillUploadProgress.set(null);
  }

  clearSupportCardData() {
    this.loadedSupportCards.set(null);
    this.supportCardFileName.set(null);
    this.supportCardComparisonResult.set(null);
    this.supportCardUploadProgress.set(null);
  }
  onUploadSkills() {
    const skills = this.loadedSkills();
    if (!skills) {
      this.snackBar.open('No skill data loaded. Please load a file first.', 'Close', { panelClass: 'snackbar-error' });
      return;
    }
    this.dialog
      .open(ConfirmationDialog, {
        data: {
          title: 'Bulk Upload All Skills',
          message:
            'Are you sure you want to perform a bulk upload? This will overwrite all skills in Firebase.',
        },
      })
      .afterClosed()
      .subscribe((result) => {
        if (result) {
          this.isSkillLoading.set(true);
          this.skillUploadProgress.set({ completed: 0, total: 0, successful: 0, failed: 0 });
          this.adminService.uploadSkills(skills).subscribe({
            next: (progress) => {
              this.skillUploadProgress.set(progress);
              if (progress.completed === progress.total) {
                this.snackBar.open(
                  `Upload complete: ${progress.successful} successful, ${progress.failed} failed.`,
                  'Close',
                  { panelClass: progress.failed > 0 ? ['snackbar-error'] : ['snackbar-success'] }
                );
                this.isSkillLoading.set(false);
              }
            },
            error: (err) => {
              this.snackBar.open(`Upload failed: ${err.message}`, 'Close', {
                panelClass: ['snackbar-error'],
              });
              this.isSkillLoading.set(false);
            },
          });
        }
      });
  }

  onCompareSkills() {
    const skills = this.loadedSkills();
    if (!skills) {
      this.snackBar.open('No skill data loaded. Please load a file first.', 'Close', { panelClass: 'snackbar-error' });
      return;
    }
    this.isSkillLoading.set(true);
    this.skillComparisonResult.set(null); // Reset previous results
    this.adminService.compareSkills(skills).subscribe({
      next: (result) => {
        this.isSkillLoading.set(false);
        this.skillComparisonResult.set(result);
        console.log('Added skills:', result.added);
        console.log('Changed skills:', result.changed);
        this.snackBar.open('Comparison complete. Check the console for details.', 'Close', {
          duration: 3000,
        });
      },
      error: (err) => {
        this.isSkillLoading.set(false);
        this.snackBar.open(`Comparison failed: ${err.message}`, 'Close', {
          panelClass: ['snackbar-error'],
        });
      },
    });
  }

  onUploadSkillChanges() {
    const result = this.skillComparisonResult();
    if (!result) return;

    this.dialog
      .open(ConfirmationDialog, {
        data: {
          title: 'Upload Skill Changes',
          message: `Are you sure you want to upload ${result.added.length} new and ${result.changed.length} changed skills?`,
        },
      })
      .afterClosed()
      .subscribe((confirmed) => {
        if (confirmed) {
          this.isSkillLoading.set(true);
          this.skillUploadProgress.set({ completed: 0, total: 0, successful: 0, failed: 0 });
          this.adminService.uploadChanges(result).subscribe({
            next: (progress) => {
              this.skillUploadProgress.set(progress);
              if (progress.completed === progress.total) {
                this.snackBar.open(
                  `Upload complete: ${progress.successful} successful, ${progress.failed} failed.`,
                  'Close',
                  { panelClass: progress.failed > 0 ? ['snackbar-error'] : ['snackbar-success'] }
                );
                this.isSkillLoading.set(false);
                this.skillComparisonResult.set(null); // Reset after successful upload
              }
            },
            error: (err) => {
              this.snackBar.open(`Upload failed: ${err.message}`, 'Close', {
                panelClass: ['snackbar-error'],
              });
              this.isSkillLoading.set(false);
            },
          });
        }
      });
  }

  onUploadSupportCards() {
    const supportCards = this.loadedSupportCards();
    if (!supportCards) {
      this.snackBar.open('No support card data loaded. Please load a file first.', 'Close', { panelClass: 'snackbar-error' });
      return;
    }
    this.dialog
      .open(ConfirmationDialog, {
        data: {
          title: 'Bulk Upload All Support Cards',
          message:
            'Are you sure you want to perform a bulk upload? This will overwrite all support cards in Firebase.',
        },
      })
      .afterClosed()
      .subscribe((result) => {
        if (result) {
          this.isSupportCardLoading.set(true);
          this.supportCardUploadProgress.set({ completed: 0, total: 0, successful: 0, failed: 0 });
          this.adminService.uploadSupportCards(supportCards).subscribe({
            next: (progress) => {
              this.supportCardUploadProgress.set(progress);
              if (progress.completed === progress.total) {
                this.snackBar.open(
                  `Upload complete: ${progress.successful} successful, ${progress.failed} failed.`,
                  'Close',
                  { panelClass: progress.failed > 0 ? ['snackbar-error'] : ['snackbar-success'] }
                );
                this.isSupportCardLoading.set(false);
              }
            },
            error: (err) => {
              this.snackBar.open(`Upload failed: ${err.message}`, 'Close', {
                panelClass: ['snackbar-error'],
              });
              this.isSupportCardLoading.set(false);
            },
          });
        }
      });
  }

  onCompareSupportCards() {
    const supportCards = this.loadedSupportCards();
    if (!supportCards) {
      this.snackBar.open('No support card data loaded. Please load a file first.', 'Close', { panelClass: 'snackbar-error' });
      return;
    }
    this.isSupportCardLoading.set(true);
    this.supportCardComparisonResult.set(null); // Reset previous results
    this.adminService.compareSupportCards(supportCards).subscribe({
      next: (result) => {
        this.isSupportCardLoading.set(false);
        this.supportCardComparisonResult.set(result);
        console.log('Added support cards:', result.added);
        console.log('Changed support cards:', result.changed);
        this.snackBar.open('Comparison complete. Check the console for details.', 'Close', {
          duration: 3000,
        });
      },
      error: (err) => {
        this.isSupportCardLoading.set(false);
        this.snackBar.open(`Comparison failed: ${err.message}`, 'Close', {
          panelClass: ['snackbar-error'],
        });
      },
    });
  }

  onUploadSupportCardChanges() {
    const result = this.supportCardComparisonResult();
    if (!result) return;

    this.dialog
      .open(ConfirmationDialog, {
        data: {
          title: 'Upload Support Card Changes',
          message: `Are you sure you want to upload ${result.added.length} new and ${result.changed.length} changed support cards?`,
        },
      })
      .afterClosed()
      .subscribe((confirmed) => {
        if (confirmed) {
          this.isSupportCardLoading.set(true);
          this.supportCardUploadProgress.set({ completed: 0, total: 0, successful: 0, failed: 0 });
          this.adminService.uploadSupportCardChanges(result).subscribe({
            next: (progress) => {
              this.supportCardUploadProgress.set(progress);
              if (progress.completed === progress.total) {
                this.snackBar.open(
                  `Upload complete: ${progress.successful} successful, ${progress.failed} failed.`,
                  'Close',
                  { panelClass: progress.failed > 0 ? ['snackbar-error'] : ['snackbar-success'] }
                );
                this.isSupportCardLoading.set(false);
                this.supportCardComparisonResult.set(null); // Reset after successful upload
              }
            },
            error: (err) => {
              this.snackBar.open(`Upload failed: ${err.message}`, 'Close', {
                panelClass: ['snackbar-error'],
              });
              this.isSupportCardLoading.set(false);
            },
          });
        }
      });
  }
}
