import {Component, inject, computed, signal, WritableSignal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {MatCardModule} from '@angular/material/card';
import {MatButtonModule} from '@angular/material/button';
import {MatDialog} from '@angular/material/dialog';
import {MatSnackBar} from '@angular/material/snack-bar';
import {MatProgressBarModule} from '@angular/material/progress-bar';
import {MatIconModule} from '@angular/material/icon';
import {AdminService, SkillComparison, SupportCardComparison, UploadProgress} from '../../services/admin.service';
import {ConfirmationDialog} from '../../components/common/confirmation-dialog/confirmation-dialog';
import {Skill} from '../../interfaces/skill';
import {SupportCard} from '../../interfaces/support-card';
import {SkillSchema} from '../../interfaces/skill.schema';
import {SupportCardSchema} from '../../interfaces/support-card.schema';
import {ImagekitioAngularModule} from 'imagekitio-angular';
import {EventUploadDialog} from '../../components/dialogs/event-upload-dialog/event-upload-dialog';
import {TraineeSchema} from '../../interfaces/trainee.schema';
import {Trainee} from '../../interfaces/trainee';
import {SkillMap} from '../../interfaces/skill-map';
import {SkillsService} from '../../services/skills.service';
import {SupportCardService} from '../../services/support-card.service';
import {forkJoin, of} from 'rxjs';
import {catchError, map, switchMap, tap} from 'rxjs/operators';
import {EventsService, evntTypeConvertFn} from '../../services/events.service';
import {cleanNestedArrays} from '../../utils/helpers';
import {MatProgressSpinner} from '@angular/material/progress-spinner';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatProgressBarModule, MatIconModule, ImagekitioAngularModule, MatProgressSpinner],
  templateUrl: './admin.html',
  styleUrls: ['./admin.css']
})
export class AdminComponent {
  private adminService = inject(AdminService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  private skillsService = inject(SkillsService);
  private supportCardService = inject(SupportCardService);
  private eventsService = inject(EventsService);

  private readonly SNACKBAR_DURATION = 5000;

  loadedSkills = signal<Skill[] | null>(null);
  skillFileName = signal<string | null>(null);
  isSkillLoading = signal(false);
  skillUploadProgress = signal<UploadProgress | null>(null);
  skillComparisonResult: WritableSignal<SkillComparison | null> = signal(null);

  loadedSupportCards = signal<SupportCard[] | null>(null);
  loadedTrainee = signal<Trainee & { eventData: { en: string } } | null>(null);
  supportCardFileName = signal<string | null>(null);
  traineeFileName = signal<string | null>(null);
  isSupportCardLoading = signal(false);
  isTraineeLoading = signal(false);
  supportCardUploadProgress = signal<UploadProgress | null>(null);
  traineeUploadProgress = signal<{success: boolean, failed: boolean} | null>(null);
  traineeEventsUploadProgress = signal<{success: boolean, failed: boolean} | null>(null);
  supportCardComparisonResult: WritableSignal<SupportCardComparison | null> = signal(null);
  traineeComparisonResult: WritableSignal<SupportCardComparison | null> = signal(null);

  // Skill Maps related signals
  isGeneratingSkillMaps = signal(false);
  generatedSkillMaps = signal<SkillMap[] | null>(null);
  isSavingSkillMaps = signal(false);

  hasSkillChanges = computed(() => {
    const result = this.skillComparisonResult();
    return result && (result.added.length > 0 || result.changed.length > 0);
  });

  hasSupportCardChanges = computed(() => {
    const result = this.supportCardComparisonResult();
    return result && (result.added.length > 0 || result.changed.length > 0);
  });
  hasTraineeChanges = computed(() => {
    const result = this.traineeComparisonResult();
    return result && (result.added.length > 0 || result.changed.length > 0);
  });

  onFileSelected(event: Event, type: 'skills' | 'support-cards' | 'trainee') {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) {
      return;
    }

    const file = input.files[0];
    const reader = new FileReader();

    reader.onload = () => {
      try {
        const rawData = JSON.parse(reader.result as string);
        switch (type) {
          case "skills": {
            const validatedData = this.adminService.validateData(rawData, SkillSchema);
            this.loadedSkills.set(validatedData);
            console.log(`${type} validated Data`, validatedData);
            this.skillFileName.set(file.name);
            this.skillComparisonResult.set(null); // Clear previous comparison results
            this.snackBar.open(`Successfully loaded and validated ${file.name} (${validatedData.length} skills).`, 'Close', {
              duration: this.SNACKBAR_DURATION,
              panelClass: 'snackbar-success'
            });
            break;
          }

          case "support-cards": {
            const validatedData = this.adminService.validateData(rawData, SupportCardSchema);
            this.loadedSupportCards.set(validatedData);
            console.log(`${type} validated Data`, validatedData);
            this.supportCardFileName.set(file.name);
            this.supportCardComparisonResult.set(null); // Clear previous comparison results
            this.snackBar.open(`Successfully loaded and validated ${file.name} (${validatedData.length} support cards).`, 'Close', {
              duration: this.SNACKBAR_DURATION,
              panelClass: 'snackbar-success'
            });
            break;
          }

          case "trainee": {
            const validatedData = this.adminService.validateTraineeData(rawData, TraineeSchema);
            this.loadedTrainee.set(validatedData);
            console.log(`${type} validated Data`, validatedData);
            this.traineeFileName.set(file.name);
            this.traineeComparisonResult.set(null); // Clear previous comparison results
            this.snackBar.open(`Successfully loaded and validated ${file.name}.`, 'Close', {
              duration: this.SNACKBAR_DURATION,
              panelClass: 'snackbar-success'
            });
            break;
          }
        }
      } catch (error: any) {
        this.snackBar.open(`Error processing ${file.name}: ${error.message}`, 'Close', {panelClass: 'snackbar-error'});
        switch (type) {
          case "skills":
            this.clearSkillData();
            break;
          case "support-cards":
            this.clearSupportCardData();
            break;
          case "trainee":
            this.clearTraineeData();
            break;
        }
      }
    };

    reader.onerror = () => {
      this.snackBar.open(`Error reading file ${file.name}.`, 'Close', {panelClass: 'snackbar-error'});
      switch (type) {
        case "skills":
          this.clearSkillData();
          break;
        case "support-cards":
          this.clearSupportCardData();
          break;
        case "trainee":
          this.clearTraineeData();
          break;
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

  clearTraineeData() {
    this.loadedTrainee.set(null);
    this.traineeFileName.set(null);
    this.traineeComparisonResult.set(null);
    this.traineeUploadProgress.set(null);
  }

  onUploadSkills() {
    const skills = this.loadedSkills();
    if (!skills) {
      this.snackBar.open('No skill data loaded. Please load a file first.', 'Close', {panelClass: 'snackbar-error'});
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
          this.skillUploadProgress.set({completed: 0, total: 0, successful: 0, failed: 0});
          this.adminService.uploadSkills(skills).subscribe({
            next: (progress) => {
              this.skillUploadProgress.set(progress);
              if (progress.completed === progress.total) {
                this.snackBar.open(
                  `Upload complete: ${progress.successful} successful, ${progress.failed} failed.`,
                  'Close',
                  {panelClass: progress.failed > 0 ? ['snackbar-error'] : ['snackbar-success']}
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
      this.snackBar.open('No skill data loaded. Please load a file first.', 'Close', {panelClass: 'snackbar-error'});
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
          duration: this.SNACKBAR_DURATION,
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
          this.skillUploadProgress.set({completed: 0, total: 0, successful: 0, failed: 0});
          this.adminService.uploadChanges(result).subscribe({
            next: (progress) => {
              this.skillUploadProgress.set(progress);
              if (progress.completed === progress.total) {
                this.snackBar.open(
                  `Upload complete: ${progress.successful} successful, ${progress.failed} failed.`,
                  'Close',
                  {panelClass: progress.failed > 0 ? ['snackbar-error'] : ['snackbar-success']}
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
      this.snackBar.open('No support card data loaded. Please load a file first.', 'Close', {panelClass: 'snackbar-error'});
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
          this.supportCardUploadProgress.set({completed: 0, total: 0, successful: 0, failed: 0});
          this.adminService.uploadSupportCards(supportCards).subscribe({
            next: (progress) => {
              this.supportCardUploadProgress.set(progress);
              if (progress.completed === progress.total) {
                this.snackBar.open(
                  `Upload complete: ${progress.successful} successful, ${progress.failed} failed.`,
                  'Close',
                  {panelClass: progress.failed > 0 ? ['snackbar-error'] : ['snackbar-success']}
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

  onUploadTrainees() {
    const trainee = this.loadedTrainee();
    if (!trainee) {
      this.snackBar.open('No trainee data loaded. Please load a file first.', 'Close', {panelClass: 'snackbar-warning'});
      return;
    }
    this.dialog
      .open(ConfirmationDialog, {
        data: {
          title: `Upload "${trainee.charData.en_name}" Data`,
          message:
            'Are you sure you want to perform an upload? This will overwrite the data in Firebase.',
        },
      })
      .afterClosed()
      .pipe(switchMap((result) => {
        if (result) {
          this.isTraineeLoading.set(true);
          const cleanedEvents = cleanNestedArrays(this.getTraineeEvents(trainee));
          const traineeId = trainee.itemData.card_id;
          return forkJoin([
            this.adminService.uploadTrainee(trainee).pipe(tap({
              next: (progress) => {
                this.traineeUploadProgress.set({
                  success: true,
                  failed: false
                });
                console.log('Trainee upload progress:', this.traineeUploadProgress());
              },
              error: (err) => {
                this.snackBar.open(`Trainee Upload failed: ${err.message}`, 'Close', {
                  panelClass: ['snackbar-error'],
                });
                this.traineeUploadProgress.set({
                  success: false,
                  failed: true
                });
              },
            })),
            this.adminService.uploadEvents(traineeId.toString(), cleanedEvents).pipe(tap({next: () => {
                this.traineeEventsUploadProgress.set({
                  success: true,
                  failed: false
                });
                console.log('Trainee upload progress:', this.traineeEventsUploadProgress());
              }, error: (err) => {
                this.snackBar.open(`Trainee !EVENTS! Upload failed: ${err.message}`, 'Close', {
                  panelClass: ['snackbar-error'],
                });
                this.traineeEventsUploadProgress.set({
                  success: false,
                  failed: true
                });
              }}))
          ]);
        }
        return of(null);
      })).subscribe({complete: () => {
        if (this.traineeUploadProgress()?.success && this.traineeEventsUploadProgress()?.success) {
          this.snackBar.open(
            `Successfully uploaded both Trainee(${trainee!.itemData.name_en}) and her Events`,
            'Close',
            {panelClass: 'snackbar-success', duration: this.SNACKBAR_DURATION}
          );
        }
        this.isTraineeLoading.set(false);
      }});
  }

  getTraineeEvents(trainee: Trainee & { eventData: { en: string } }) {
    const jsonStr = trainee.eventData.en;
    if (!jsonStr) return;

    try {
      let parsed = JSON.parse(jsonStr);

      // Handle double-stringified JSON
      if (typeof parsed === 'string') {
        parsed = JSON.parse(parsed);
      }

      return this.eventsService.filterParsedEventData(parsed);
    } catch (error: any) {
      this.snackBar.open(`Trainee Events Parse Error: ${error.message}`, 'Close', {panelClass: 'snackbar-error'});
      console.log(error);
    }
    return undefined;
  }

  onCompareSupportCards() {
    const supportCards = this.loadedSupportCards();
    if (!supportCards) {
      this.snackBar.open('No support card data loaded. Please load a file first.', 'Close', {panelClass: 'snackbar-error'});
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
          duration: this.SNACKBAR_DURATION,
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
          this.supportCardUploadProgress.set({completed: 0, total: 0, successful: 0, failed: 0});
          this.adminService.uploadSupportCardChanges(result).subscribe({
            next: (progress) => {
              this.supportCardUploadProgress.set(progress);
              if (progress.completed === progress.total) {
                this.snackBar.open(
                  `Upload complete: ${progress.successful} successful, ${progress.failed} failed.`,
                  'Close',
                  {panelClass: progress.failed > 0 ? ['snackbar-error'] : ['snackbar-success']}
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

  openEventUploadDialog() {
    this.dialog.open(EventUploadDialog, {
      width: '800px',
      maxWidth: '95vw',
    });
  }

  onGenerateSkillMaps() {
    this.isGeneratingSkillMaps.set(true);
    this.generatedSkillMaps.set(null);

    // Fetch both skills and support cards in parallel
    forkJoin({
      skills: this.skillsService.getSkills(),
      supportCards: this.supportCardService.getSortedSupportCards(true).pipe(
        map(cards => cards.filter(card => !!card.release_en))
      )
    }).subscribe({
      next: ({skills, supportCards}) => {
        console.log('Fetched skills:', skills.length);
        console.log('Fetched support cards:', supportCards.length);

        // Generate skill maps
        const skillMaps = this.generateSkillMapsFromData(skills, supportCards);
        console.log('Generated skill maps:', skillMaps);
        this.generatedSkillMaps.set(skillMaps);
        this.isGeneratingSkillMaps.set(false);
        this.snackBar.open(`Generated ${skillMaps.length} skill maps successfully. Check console for details.`, 'Close', {duration: this.SNACKBAR_DURATION});
      },
      error: (err) => {
        console.error('Error fetching data:', err);
        this.snackBar.open(`Error fetching data: ${err.message}`, 'Close', {panelClass: ['snackbar-error']});
        this.isGeneratingSkillMaps.set(false);
      }
    });
  }

  private generateSkillMapsFromData(skills: Skill[], supportCards: SupportCard[]): SkillMap[] {
    const skillMaps: SkillMap[] = [];

    skills.forEach(skill => {
      const skillMap: SkillMap = {
        id: skill.id,
        supCards: {
          events: [],
          hints: []
        }
      };

      supportCards.forEach(supportCard => {
        // Check if skill is in event_skills
        if (supportCard.event_skills && supportCard.event_skills.includes(skill.id)) {
          skillMap.supCards.events.push(supportCard.support_id);
        }

        // Check if skill is in hints.hint_skills
        if (supportCard.hints && supportCard.hints.hint_skills.some(hint_skill => +hint_skill === +skill.id)) {
          skillMap.supCards.hints.push(supportCard.support_id);
        }
      });

      skillMaps.push(skillMap);
    });

    return skillMaps;
  }

  onSaveSkillMaps() {
    const skillMaps = this.generatedSkillMaps();
    if (!skillMaps || skillMaps.length === 0) {
      this.snackBar.open('No skill maps to save. Please generate skill maps first.', 'Close', {panelClass: ['snackbar-error']});
      return;
    }

    this.dialog
      .open(ConfirmationDialog, {
        data: {
          title: 'Save Skill Maps',
          message: `Are you sure you want to save ${skillMaps.length} skill maps to Firebase?`,
        },
      })
      .afterClosed()
      .pipe(
        switchMap(confirmed => {
          if (!confirmed) return of(null);

          this.isSavingSkillMaps.set(true);

          return this.skillsService.saveSkillMaps(skillMaps).pipe(
            tap(results => {
              const successful = results.filter(r => r.success).length;
              const failed = results.filter(r => !r.success).length;

              this.snackBar.open(
                `Save complete: ${successful} successful, ${failed} failed.`,
                'Close',
                {panelClass: failed > 0 ? ['snackbar-error'] : ['snackbar-success']}
              );
              this.isSavingSkillMaps.set(false);

              if (failed === 0) {
                this.generatedSkillMaps.set(null); // Clear after successful save
              }
            }),
            catchError(err => {
              this.snackBar.open(`Save failed: ${err.message}`, 'Close', {
                panelClass: ['snackbar-error'],
              });
              this.isSavingSkillMaps.set(false);
              return of(null);
            })
          );
        })
      )
      .subscribe();
  }
}
