// src/app/pages/trainees/trainees.ts
import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { TraineeService } from '../../services/trainee.service';
import { TraineesDataService } from '../../services/trainees-data.service';
import { DisplayTrainee } from '../../interfaces/display-trainee';
import { Trainee } from '../../interfaces/trainee';
import { TraineeTab, UserTraineesData } from '../../interfaces/user-trainees-data';
import { MatTab, MatTabGroup, MatTabLabel } from '@angular/material/tabs';
import { MatIcon } from '@angular/material/icon';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatMenu, MatMenuItem, MatMenuTrigger } from '@angular/material/menu';
import { MatTooltip } from '@angular/material/tooltip';
import { filter } from 'rxjs';
import { NewTabDialogComponent } from '../support-cards/new-tab-dialog/new-tab-dialog';
import { ConfirmationDialog } from '../../components/common/confirmation-dialog/confirmation-dialog';
import { DataGridStateService, TabState } from '../../services/data-grid-state.service';
import { TraineeListViewComponent } from './trainee-list-view/trainee-list-view';
import { IMAGEKIT_CONFIG } from '../../imagekit.config';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-trainees',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatTabGroup,
    MatTab,
    MatTabLabel,
    TraineeListViewComponent,
    MatIcon,
    MatButton,
    MatIconButton,
    MatTooltip,
    MatMenu,
    MatMenuItem,
    MatMenuTrigger,
  ],
  templateUrl: './trainees.html',
  styleUrl: './trainees.css'
})
export class Trainees {
  private traineeService = inject(TraineeService);
  private traineesDataService = inject(TraineesDataService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  private dataGridStateService = inject(DataGridStateService);

  protected allTrainees = toSignal<DisplayTrainee[], DisplayTrainee[]>(
    this.traineeService.getRawTrainees().pipe(
      map(trainees => trainees
        .sort((a, b) => {
          if (a.itemData.rarity !== b.itemData.rarity) return b.itemData.rarity - a.itemData.rarity;
          const dateA = a.itemData.release_en ? new Date(a.itemData.release_en).getTime() : new Date(a.itemData.release).getTime();
          const dateB = b.itemData.release_en ? new Date(b.itemData.release_en).getTime() : new Date(b.itemData.release).getTime();
          return dateB - dateA;
        })
        .map(t => this.toDisplayTrainee(t))
      )
    ),
    { initialValue: [] }
  );

  protected dynamicTabs = signal<TraineeTab[]>([]);
  private isLoadingData = signal(true);

  protected hydratedTabsData = computed(() => {
    const allMap = new Map(this.allTrainees().map(t => [t.traineeId, t]));
    return this.dynamicTabs().map(tab => ({
      name: tab.name,
      cards: tab.cards.map(c => allMap.get(c.id)).filter((t): t is DisplayTrainee => t != null)
    }));
  });

  readonly ALL_TAB_INDEX = -1;
  protected selectedTabIndex = signal(this.ALL_TAB_INDEX);
  protected selectedTrainee = signal<DisplayTrainee | null>(null);

  constructor() {
    effect(() => {
      const savedData = this.traineesDataService.userTraineesData();
      if (savedData === undefined) return; // still loading

      if (savedData) {
        this.dynamicTabs.set(savedData.tabs);
        this.selectedTabIndex.set(savedData.selectedTabIndex ?? this.ALL_TAB_INDEX);

        const tabStates = new Map<number, TabState>();
        const existing = this.dataGridStateService.getAllTabStates();

        tabStates.set(this.ALL_TAB_INDEX, { sort: [], selection: existing.get(this.ALL_TAB_INDEX)?.selection || {} });

        savedData.tabs.forEach((tab, index) => {
          const existingState = existing.get(index);
          const state: TabState = {
            sort: tab.sort || [],
            selection: existingState?.selection || {}
          };
          if (tab.filter) state.filter = tab.filter as any;
          tabStates.set(index, state);
        });

        this.dataGridStateService.loadTabStates(tabStates);
      } else {
        this.dynamicTabs.set([]);
        this.selectedTabIndex.set(this.ALL_TAB_INDEX);
        const tabStates = new Map<number, TabState>();
        tabStates.set(this.ALL_TAB_INDEX, { sort: [], selection: {} });
        this.dataGridStateService.loadTabStates(tabStates);
      }

      this.isLoadingData.set(false);
    });
  }

  protected availableTabs = computed(() =>
    this.dynamicTabs()
      .map((tab, index) => ({ name: tab.name, index }))
      .filter(tab => tab.index !== this.selectedTabIndex())
  );

  protected onTabChange(newIndex: number): void {
    this.selectedTabIndex.set(newIndex - 1);
    this.saveData();
  }

  protected addTab(): void {
    this.dialog.open(NewTabDialogComponent).afterClosed()
      .pipe(filter(name => !!name))
      .subscribe(name => {
        this.dynamicTabs.update(tabs => [...tabs, { name, cards: [] }]);
        this.onTabChange(this.hydratedTabsData().length + 1);
        this.saveData();
      });
  }

  protected removeTab(event: MouseEvent, index: number): void {
    event.stopPropagation();
    const tab = this.dynamicTabs()[index];
    this.dialog.open(ConfirmationDialog, {
      data: { title: 'Confirm Deletion', message: `Are you sure you want to delete the tab "${tab.name}"?` }
    }).afterClosed().pipe(filter(confirmed => confirmed)).subscribe(() => {
      this.dynamicTabs.update(tabs => tabs.filter((_, i) => i !== index));
      if (this.selectedTabIndex() >= index) {
        this.selectedTabIndex.update(prev => prev - 1);
      }
      this.dataGridStateService.removeTabState(index);
      this.saveData();
    });
  }

  protected hasSelectedCards(): boolean {
    return this.dataGridStateService.getTabSelectedCount(this.selectedTabIndex()) > 0;
  }

  protected onAddTrainee(trainee: DisplayTrainee): void {
    this.selectedTrainee.set(trainee);
  }

  protected addTraineeToTab(trainee: DisplayTrainee | null, targetTabIndex: number): void {
    if (!trainee && this.hasSelectedCards()) {
      const selected = this.getSelectedFromCurrentGrid();
      this.addMultipleToTab(selected, targetTabIndex);
      return;
    }
    if (!trainee) return;

    this.dynamicTabs.update(tabs => {
      const newTabs = [...tabs];
      const tab = { ...newTabs[targetTabIndex] };
      if (!tab.cards.some(c => c.id === trainee.traineeId)) {
        tab.cards = [...tab.cards, { id: trainee.traineeId }];
        newTabs[targetTabIndex] = tab;
        this.snackBar.open(`Added "${trainee.itemData.name_en}" to tab "${tab.name}"`, 'Dismiss', { duration: 3000 });
      } else {
        this.snackBar.open(`"${trainee.itemData.name_en}" is already in tab "${tab.name}"`, 'Dismiss', { duration: 3000 });
      }
      return newTabs;
    });
    this.saveData();
  }

  protected onRemoveTrainee(tabIndex: number, trainee: DisplayTrainee): void {
    this.dialog.open(ConfirmationDialog, {
      data: { title: 'Confirm Removal', message: `Are you sure you want to remove "${trainee.itemData.name_en}" from this tab?` }
    }).afterClosed().pipe(filter(confirmed => confirmed)).subscribe(() => {
      this.dynamicTabs.update(tabs => {
        const newTabs = [...tabs];
        const tab = { ...newTabs[tabIndex] };
        tab.cards = tab.cards.filter(c => c.id !== trainee.traineeId);
        newTabs[tabIndex] = tab;
        return newTabs;
      });
      this.saveData();
      this.snackBar.open(`Removed "${trainee.itemData.name_en}" from tab.`, 'Dismiss', { duration: 3000 });
    });
  }

  protected onBulkRemove(tabIndex: number): void {
    const selected = this.getSelectedFromCurrentGrid();
    if (!selected.length) return;

    this.dialog.open(ConfirmationDialog, {
      data: { title: 'Confirm Bulk Removal', message: `Remove ${selected.length} selected trainees from this tab?` }
    }).afterClosed().pipe(filter(confirmed => confirmed)).subscribe(() => {
      const ids = new Set(selected.map(t => t.traineeId));
      this.dynamicTabs.update(tabs => {
        const newTabs = [...tabs];
        const tab = { ...newTabs[tabIndex] };
        tab.cards = tab.cards.filter(c => !ids.has(c.id));
        newTabs[tabIndex] = tab;
        return newTabs;
      });
      this.saveData();
      this.snackBar.open(`Removed ${selected.length} trainees from tab.`, 'Dismiss', { duration: 3000 });
      this.dataGridStateService.clearTabSelection(tabIndex);
    });
  }

  private addMultipleToTab(trainees: DisplayTrainee[], targetTabIndex: number): void {
    this.dynamicTabs.update(tabs => {
      const newTabs = [...tabs];
      const tab = { ...newTabs[targetTabIndex] };
      let added = 0;
      trainees.forEach(t => {
        if (!tab.cards.some(c => c.id === t.traineeId)) {
          tab.cards = [...tab.cards, { id: t.traineeId }];
          added++;
        }
      });
      newTabs[targetTabIndex] = tab;
      this.snackBar.open(
        added > 0 ? `Added ${added} trainees to tab "${tab.name}"` : 'All selected trainees are already in the tab',
        'Dismiss', { duration: 3000 }
      );
      return newTabs;
    });
    this.saveData();
    this.dataGridStateService.clearTabSelection(this.selectedTabIndex());
  }

  private getSelectedFromCurrentGrid(): DisplayTrainee[] {
    const idx = this.selectedTabIndex();
    const selection = this.dataGridStateService.getTabSelection(idx);

    const pool = idx === this.ALL_TAB_INDEX
      ? this.allTrainees()
      : this.hydratedTabsData()[idx]?.cards ?? [];

    return pool.filter(t => selection[t.traineeId.toString()]);
  }

  private toDisplayTrainee(t: Trainee): DisplayTrainee {
    return {
      ...t,
      traineeId: t.itemData.card_id,
      imageUrl: `${IMAGEKIT_CONFIG.urlEndpoint}/trainees/char_${t.itemData.char_id}_${t.itemData.card_id}.png`,     // char_1033_103301.png
    };
  }

  async saveData(manualTrigger: boolean = false): Promise<void> {
    if (!manualTrigger) return;
    if (this.isLoadingData()) return;

    try {
      await this.traineesDataService.saveUserTraineesData({
        tabs: this.dynamicTabs(),
        selectedTabIndex: this.selectedTabIndex()
      });
    } catch {
      this.snackBar.open('Failed to save your changes', 'Dismiss', { duration: 3000 });
    }
  }
}
