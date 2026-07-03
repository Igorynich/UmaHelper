import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal
} from '@angular/core';
import {rxResource, toSignal} from '@angular/core/rxjs-interop';
import {ActivatedRoute, Router} from '@angular/router';
import {TraineeService} from '../../services/trainee.service';
import {TraineesDataService} from '../../services/trainees-data.service';
import {DisplayTrainee} from '../../interfaces/display-trainee';
import {Trainee} from '../../interfaces/trainee';
import {TraineeTab} from '../../interfaces/user-trainees-data';
import {NgpTabset, NgpTabList, NgpTabButton, NgpTabPanel} from 'ng-primitives/tabs';
import {MatIcon} from '@angular/material/icon';
import {MatButton, MatButtonModule, MatIconButton} from '@angular/material/button';
import {MatDialog} from '@angular/material/dialog';
import {MatSnackBar} from '@angular/material/snack-bar';
import {MatMenu, MatMenuItem, MatMenuTrigger} from '@angular/material/menu';
import {MatTooltip} from '@angular/material/tooltip';
import {MatProgressSpinner} from '@angular/material/progress-spinner';
import {filter, map} from 'rxjs';
import {NewTabDialogComponent} from '../support-cards/new-tab-dialog/new-tab-dialog';
import {ConfirmationDialog} from '../../components/common/confirmation-dialog/confirmation-dialog';
import {DataGridStateService, TabState} from '../../services/data-grid-state.service';
import {TraineeListViewComponent} from './trainee-list-view/trainee-list-view';
import {tap} from 'rxjs/operators';

@Component({
  selector: 'app-trainees',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    NgpTabset,
    NgpTabList,
    NgpTabButton,
    NgpTabPanel,
    TraineeListViewComponent,
    MatIcon,
    MatButton,
    MatButtonModule,
    MatTooltip,
    MatMenu,
    MatMenuItem,
    MatMenuTrigger,
    MatProgressSpinner
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
  private route = inject(ActivatedRoute);
  private router = inject(Router);

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
    {initialValue: []}
  );

  protected dynamicTabs = signal<TraineeTab[]>([]);

  protected hydratedTabsData = computed(() => {
    const allMap = new Map(this.allTrainees().map(t => [t.traineeId, t]));
    return this.dynamicTabs().map(tab => ({
      name: tab.name,
      cards: tab.cards.map(c => allMap.get(c.id)).filter((t): t is DisplayTrainee => t != null)
    }));
  });

  readonly ALL_TAB_INDEX = -1;
  readonly ALL_TAB_VALUE = 'all-trainees';
  protected selectedTabValue = signal(this.ALL_TAB_VALUE);
  protected selectedTrainee = signal<DisplayTrainee | null>(null);
  protected currentPage = signal(0);
  protected currentPageSize = signal(20);

  private readonly queryParams = toSignal(
    this.route.queryParamMap.pipe(
      map(params => {
        console.log('queryParams toSignal', params);
        const tabValue = params.get('tabValue');
        const page = params.get('page') ? Number(params.get('page')) - 1 : null;
        const pageSize = params.get('pageSize') ? Number(params.get('pageSize')) : null;
        return {
          tabValue,
          page,
          pageSize
        };
      })
    ),
    {initialValue: {tabValue: null, page: null, pageSize: null}}
  );

  protected savedDataResource = rxResource({
    stream: () => {
      return this.traineesDataService.userTraineesData$;
    }
  });

  constructor() {
    effect(() => {
      if (this.savedDataResource.isLoading()) {
        return;
      }
      const savedData = this.savedDataResource.value();
      if (savedData) {
        console.log('savedData', savedData);
        this.dynamicTabs.set(savedData.tabs);
        const tabValue = savedData.selectedTabIndex !== undefined ? this.getTabValueFromIndex(savedData.selectedTabIndex) : this.ALL_TAB_VALUE;
        this.selectedTabValue.set(tabValue);

        const tabStates = new Map<number, TabState>();
        const existing = this.dataGridStateService.getAllTabStates();

        tabStates.set(this.ALL_TAB_INDEX, {sort: [], selection: existing.get(this.ALL_TAB_INDEX)?.selection || {}});

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
        console.log('NO savedData');
        this.dynamicTabs.set([]);
        const tabValue = this.ALL_TAB_VALUE;
        this.selectedTabValue.set(tabValue);
        const tabStates = new Map<number, TabState>();
        tabStates.set(this.ALL_TAB_INDEX, {sort: [], selection: {}});
        this.dataGridStateService.loadTabStates(tabStates);
      }
    });

    effect(() => {
      if (this.savedDataResource.isLoading()) {
        return;
      }
      if (this.queryParams().page) {
        this.currentPage.set(this.queryParams().page || 0);
      }
      if (this.queryParams().pageSize) {
        this.currentPageSize.set(this.queryParams().pageSize || 20);
      }
      if (this.queryParams().tabValue) {
        this.selectedTabValue.set(this.queryParams().tabValue || this.ALL_TAB_VALUE);
      }
    });

    effect(() => {
      if (this.savedDataResource.isLoading()) {
        return;
      }
      const currentTabValue = this.selectedTabValue();
      const currentPageNum = this.currentPage();
      const currentPageSizeNum = this.currentPageSize();

      const queryParams: Record<string, string | null> = {
        tabValue: currentTabValue !== this.ALL_TAB_VALUE ? currentTabValue : null,
        page: currentPageNum !== 0 ? (currentPageNum + 1).toString() : null,
        pageSize: currentPageSizeNum !== 20 ? currentPageSizeNum.toString() : null
      };

      this.router.navigate([], {
        relativeTo: this.route,
        queryParams,
        queryParamsHandling: 'merge'
      });
    });
  }

  protected availableTabs = computed(() =>
    this.dynamicTabs()
      .map((tab, index) => ({name: tab.name, index, value: this.getTabValueFromIndex(index)}))
      .filter(tab => tab.value !== this.selectedTabValue())
  );

  protected onTabChange(newValue: string): void {
    console.log('onTabChange', newValue);
    this.selectedTabValue.set(newValue);
    this.saveData();
  }

  protected addTab(): void {
    this.dialog.open(NewTabDialogComponent).afterClosed()
      .pipe(filter(name => !!name))
      .subscribe(name => {
        this.dynamicTabs.update(tabs => [...tabs, {name, cards: []}]);
        const newIndex = this.hydratedTabsData().length;
        this.onTabChange(this.getTabValueFromIndex(newIndex));
        this.saveData();
      });
  }

  protected removeTab(event: MouseEvent, index: number): void {
    event.stopPropagation();
    const tab = this.dynamicTabs()[index];
    this.dialog.open(ConfirmationDialog, {
      data: {title: 'Confirm Deletion', message: `Are you sure you want to delete the tab "${tab.name}"?`}
    }).afterClosed().pipe(filter(confirmed => confirmed)).subscribe(() => {
      const removedTabValue = this.getTabValueFromIndex(index);
      if (this.selectedTabValue() === removedTabValue) {
        this.selectedTabValue.set(this.ALL_TAB_VALUE);
      }
      this.dynamicTabs.update(tabs => tabs.filter((_, i) => i !== index));
      this.dataGridStateService.removeTabState(index);
      this.saveData();
    });
  }

  protected hasSelectedCards(): boolean {
    const currentTabIndex = this.getTabIndexFromValue(this.selectedTabValue());
    return this.dataGridStateService.getTabSelectedCount(currentTabIndex) > 0;
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
      const tab = {...newTabs[targetTabIndex]};
      if (!tab.cards.some(c => c.id === trainee.traineeId)) {
        tab.cards = [...tab.cards, {id: trainee.traineeId}];
        newTabs[targetTabIndex] = tab;
        this.snackBar.open(`Added "${trainee.itemData.name_en}" to tab "${tab.name}"`, 'Dismiss', {duration: 3000});
      } else {
        this.snackBar.open(`"${trainee.itemData.name_en}" is already in tab "${tab.name}"`, 'Dismiss', {duration: 3000});
      }
      return newTabs;
    });
    this.saveData();
  }

  protected onRemoveTrainee(tabIndex: number, trainee: DisplayTrainee): void {
    this.dialog.open(ConfirmationDialog, {
      data: {
        title: 'Confirm Removal',
        message: `Are you sure you want to remove "${trainee.itemData.name_en}" from this tab?`
      }
    }).afterClosed().pipe(filter(confirmed => confirmed)).subscribe(() => {
      this.dynamicTabs.update(tabs => {
        const newTabs = [...tabs];
        const tab = {...newTabs[tabIndex]};
        tab.cards = tab.cards.filter(c => c.id !== trainee.traineeId);
        newTabs[tabIndex] = tab;
        return newTabs;
      });
      this.saveData();
      this.snackBar.open(`Removed "${trainee.itemData.name_en}" from tab.`, 'Dismiss', {duration: 3000});
    });
  }

  protected onBulkRemove(tabIndex: number): void {
    const selected = this.getSelectedFromCurrentGrid();
    if (!selected.length) return;

    this.dialog.open(ConfirmationDialog, {
      data: {title: 'Confirm Bulk Removal', message: `Remove ${selected.length} selected trainees from this tab?`}
    }).afterClosed().pipe(filter(confirmed => confirmed)).subscribe(() => {
      const ids = new Set(selected.map(t => t.traineeId));
      this.dynamicTabs.update(tabs => {
        const newTabs = [...tabs];
        const tab = {...newTabs[tabIndex]};
        tab.cards = tab.cards.filter(c => !ids.has(c.id));
        newTabs[tabIndex] = tab;
        return newTabs;
      });
      this.saveData();
      this.snackBar.open(`Removed ${selected.length} trainees from tab.`, 'Dismiss', {duration: 3000});
      this.dataGridStateService.clearTabSelection(tabIndex);
    });
  }

  private addMultipleToTab(trainees: DisplayTrainee[], targetTabIndex: number): void {
    this.dynamicTabs.update(tabs => {
      const newTabs = [...tabs];
      const tab = {...newTabs[targetTabIndex]};
      let added = 0;
      trainees.forEach(t => {
        if (!tab.cards.some(c => c.id === t.traineeId)) {
          tab.cards = [...tab.cards, {id: t.traineeId}];
          added++;
        }
      });
      newTabs[targetTabIndex] = tab;
      this.snackBar.open(
        added > 0 ? `Added ${added} trainees to tab "${tab.name}"` : 'All selected trainees are already in the tab',
        'Dismiss', {duration: 3000}
      );
      return newTabs;
    });
    this.saveData();
    this.dataGridStateService.clearTabSelection(this.getTabIndexFromValue(this.selectedTabValue()));
  }

  private getSelectedFromCurrentGrid(): DisplayTrainee[] {
    const currentTabIndex = this.getTabIndexFromValue(this.selectedTabValue());
    const selection = this.dataGridStateService.getTabSelection(currentTabIndex);

    const pool = currentTabIndex === this.ALL_TAB_INDEX
      ? this.allTrainees()
      : this.hydratedTabsData()[currentTabIndex]?.cards ?? [];

    return pool.filter(t => selection[t.traineeId.toString()]);
  }

  private toDisplayTrainee(t: Trainee): DisplayTrainee {
    return {
      ...t,
      traineeId: t.itemData.card_id,
      imageUrl: this.traineeService.getTraineeImageUrl(t)
    };
  }

  async saveData(manualTrigger: boolean = false): Promise<void> {
    if (!manualTrigger) return;
    if (this.savedDataResource.isLoading()) return;

    try {
      await this.traineesDataService.saveUserTraineesData({
        tabs: this.dynamicTabs(),
        selectedTabIndex: this.getTabIndexFromValue(this.selectedTabValue())
      });
    } catch {
      this.snackBar.open('Failed to save your changes', 'Dismiss', {duration: 3000});
    }
  }

  protected getTabValueFromIndex(index: number): string {
    if (index === this.ALL_TAB_INDEX) return this.ALL_TAB_VALUE;
    return `tab-${index}`;
  }

  protected getTabIndexFromValue(value: string): number {
    if (value === this.ALL_TAB_VALUE) return this.ALL_TAB_INDEX;
    const match = value.match(/^tab-(\d+)$/);
    return match ? parseInt(match[1], 10) : this.ALL_TAB_INDEX;
  }
}
