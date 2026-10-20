import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal
} from '@angular/core';
import {rxResource, toSignal} from '@angular/core/rxjs-interop';
import {ActivatedRoute, Params, Router} from '@angular/router';
import {PageEvent} from '@angular/material/paginator';
import {TraineeService} from '../../services/trainee.service';
import {TraineesDataService} from '../../services/trainees-data.service';
import {DisplayTrainee} from '../../interfaces/display-trainee';
import {Trainee} from '../../interfaces/trainee';
import {TraineeFilter, TraineeTab} from '../../interfaces/user-trainees-data';
import {NgpTabset, NgpTabList, NgpTabButton, NgpTabPanel} from 'ng-primitives/tabs';
import {TraineeListViewComponent, TraineeRow} from './trainee-list-view/trainee-list-view';
import {MatIcon} from '@angular/material/icon';
import {MatButton, MatButtonModule} from '@angular/material/button';
import {MatDialog} from '@angular/material/dialog';
import {NewTabDialogComponent} from '../support-cards/new-tab-dialog/new-tab-dialog';
import {filter} from 'rxjs';
import {ConfirmationDialog} from '../../components/common/confirmation-dialog/confirmation-dialog';
import {tap, map} from 'rxjs/operators';
import {MatSnackBar} from '@angular/material/snack-bar';
import {MatMenu, MatMenuItem, MatMenuTrigger} from '@angular/material/menu';
import {DataGridStateService} from '../../services/data-grid-state.service';
import {MatTooltip} from '@angular/material/tooltip';
import {MatProgressSpinner} from '@angular/material/progress-spinner';
import {ActiveSort} from '../../components/common/data-grid/data-grid.types';

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

  readonly ALL_TAB_INDEX: number = -1;
  readonly ALL_TAB_VALUE: string = 'all-trainees';
  protected selectedTrainee = signal<DisplayTrainee | null>(null);
  protected currentSelectedTrainees = signal<TraineeRow[]>([]);

  // Query params as the single source of truth
  private queryParams = toSignal(this.route.queryParams.pipe(tap(params => {
    console.warn('Query params changed', params);
  })), {initialValue: {} as Params});

  // State computed from queryParams
  protected selectedTabValue = computed(() => {
    const tabValue = this.queryParams()['tabValue'] as string | undefined;
    return tabValue || this.ALL_TAB_VALUE;
  });

  protected currentPage = computed(() => {
    const page = this.queryParams()['page'] as string | undefined;
    return page ? Number(page) - 1 : 0;
  });

  protected currentPageSize = computed(() => {
    const pageSize = this.queryParams()['pageSize'] as string | undefined;
    return pageSize ? Number(pageSize) : 20;
  });

  protected filterParams = computed(() => {
    const queries = this.queryParams();
    console.log('queries filter', queries);
    return {
      name: queries['name'] || '',
      rarity: queries['rarity']?.split(',').map(Number) || [],
      statBonus: {
        stat: queries['statBonusStat'] || '',
        operator: queries['statBonusOperator'] || '>=',
        value: queries['statBonusValue'] != null && queries['statBonusValue'] !== '' ? Number(queries['statBonusValue']) : null,
      },
      aptitude: {
        stat: queries['aptitudeStat'] || '',
        operator: queries['aptitudeOperator'] || '>=',
        value: queries['aptitudeValue'] || '',
      },
      uniqName: queries['uniqName'] || '',
      skillName: queries['skillName'] || '',
      skillDesc: queries['skillDesc'] || '',
      skillTypes: queries['skillTypes']?.split(',') || []
    };
  });

  protected sortParams = computed(() => {
    const sort = this.queryParams()['sort'] as any;
    console.log('queries sort', sort);
    if (!sort) return [];
    return sort.split(',').map((s: string) => {
      const [key, direction] = s.split(':');
      return { key, direction };
    });
  });

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
      } else {
        console.log('NO savedData');
        this.dynamicTabs.set([]);
      }
    });
  }

  protected availableTabs = computed(() =>
    this.dynamicTabs()
      .map((tab, index) => ({name: tab.name, index, value: this.getTabValueFromIndex(index)}))
      .filter(tab => tab.value !== this.selectedTabValue())
  );

  protected onTabChange(newValue: string): void {
    console.log('onTabChange', newValue);
    this.updateQueryParams({ tabValue: newValue === this.ALL_TAB_VALUE ? null : newValue });
    this.saveData();
  }

  protected addTab(): void {
    this.dialog.open(NewTabDialogComponent).afterClosed().pipe(filter(name => !!name)).subscribe(name => {
      this.dynamicTabs.update(tabs => [...tabs, {name, cards: []}]);
      const newIndex = this.hydratedTabsData().length;
      this.onTabChange(this.getTabValueFromIndex(newIndex));
      this.saveData();
    });
  }

  protected removeTab(event: MouseEvent, index: number): void {
    event.stopPropagation();
    const tabToRemove = this.dynamicTabs()[index];
    const dialogRef = this.dialog.open(ConfirmationDialog, {
      data: {
        title: 'Confirm Deletion',
        message: `Are you sure you want to delete the tab "${tabToRemove.name}"?`
      }
    });

    dialogRef.afterClosed().pipe(filter(confirmed => confirmed)).subscribe(() => {
      console.log('Removing tab', index);
      const removedTabValue = this.getTabValueFromIndex(index);
      if (this.selectedTabValue() === removedTabValue) {
        this.onTabChange(this.ALL_TAB_VALUE);
      }
      this.dynamicTabs.update(tabs => tabs.filter((_, i) => i !== index));

      this.dataGridStateService.removeTabState(index);
      this.saveData();
    });
  }

  protected onFilterChanged(filter: TraineeFilter): void {
    const currentTabIndex = this.getTabIndexFromValue(this.selectedTabValue());
    console.log('On Filter changed:', filter, currentTabIndex);
    this.dataGridStateService.updateTabFilter(currentTabIndex, filter);
    this.updateFilterQueryParams(filter);
  }

  protected onSortChanged(sort: ActiveSort[]): void {
    const currentTabIndex = this.getTabIndexFromValue(this.selectedTabValue());
    console.log('On Sort changed:', sort, currentTabIndex);
    this.dataGridStateService.updateTabSort(currentTabIndex, sort);
    this.updateSortQueryParams(sort);
  }

  protected onPageChanged(event: PageEvent): void {
    const currentTabIndex = this.getTabIndexFromValue(this.selectedTabValue());
    console.log('On Page changed', event);
    this.dataGridStateService.updateTabPageData(currentTabIndex, event.pageIndex, event.pageSize);
    this.updateQueryParams({
      page: event.pageIndex !== 0 ? event.pageIndex + 1 : null,
      pageSize: event.pageSize !== 20 ? event.pageSize : null
    });
  }

  protected onTabChanged(tabValue: string | undefined): void {
    console.warn('Tab changed full map', this.dataGridStateService.getAllTabStates(), tabValue);
    const tabData = this.dataGridStateService.getTabData(this.getTabIndexFromValue(tabValue!));

    this.updateQueryParams({
      tabValue: tabValue === this.ALL_TAB_VALUE ? undefined : tabValue,
      ...this.getFilterQueryParams(tabData.filter as TraineeFilter),
      ...this.getSortQueryParams(tabData.sort || []),
      page: tabData.page ? tabData.page + 1 : undefined,
      pageSize: tabData.pageSize !== 20 ? tabData.pageSize : undefined
    });
  }

  private updateQueryParams(params: Record<string, any>): void {
    console.log('Updating queries', params);
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: params,
      queryParamsHandling: 'merge'
    }).then(value => console.log('Queries updated', value));
  }

  private getFilterQueryParams(filter: TraineeFilter | undefined): Params {
    if (!filter) return {
      name: undefined,
      rarity: undefined,
      statBonusStat: undefined,
      statBonusOperator: undefined,
      statBonusValue: undefined,
      aptitudeStat: undefined,
      aptitudeOperator: undefined,
      aptitudeValue: undefined,
      uniqName: undefined,
      skillName: undefined,
      skillDesc: undefined,
      skillTypes: undefined
    };
    const hasStatBonusFilter = filter.statBonus?.stat && filter.statBonus.value != null;
    const hasAptitudeFilter = filter.aptitude?.stat && filter.aptitude.value;
    return {
      name: filter.name || undefined,
      rarity: filter.rarity.length > 0 ? filter.rarity.join(',') : undefined,
      statBonusStat: hasStatBonusFilter ? filter.statBonus.stat : undefined,
      statBonusOperator: hasStatBonusFilter ? filter.statBonus.operator : undefined,
      statBonusValue: hasStatBonusFilter ? filter.statBonus.value : undefined,
      aptitudeStat: hasAptitudeFilter ? filter.aptitude.stat : undefined,
      aptitudeOperator: hasAptitudeFilter ? filter.aptitude.operator : undefined,
      aptitudeValue: hasAptitudeFilter ? filter.aptitude.value : undefined,
      uniqName: filter.uniqName || undefined,
      skillName: filter.skillName || undefined,
      skillDesc: filter.skillDesc || undefined,
      skillTypes: filter.skillTypes.length > 0 ? filter.skillTypes.join(',') : undefined
    };
  }

  private getSortQueryParams(sort: ActiveSort[]): Params {
    const sortData = sort.map(s => {
      if (s.key && s.direction) {
        return `${s.key}:${s.direction}`;
      }
      return '';
    }).join(',');
    return {sort: sortData || undefined};
  }

  private updateFilterQueryParams(filter: TraineeFilter): void {
    const filterData = this.getFilterQueryParams(filter);
    this.updateQueryParams({
      ...filterData
    });
  }

  private updateSortQueryParams(sort: ActiveSort[]): void {
    this.updateQueryParams(this.getSortQueryParams(sort));
  }

  protected hasSelectedCards(): boolean {
    return this.currentSelectedTrainees().length > 0;
  }

  protected onAddTrainee(trainee: DisplayTrainee): void {
    this.selectedTrainee.set(trainee);
  }

  protected addTraineeToTab(trainee: DisplayTrainee | null, targetTabIndex: number): void {
    const tabIndex = targetTabIndex;
    if (!trainee && this.hasSelectedCards()) {
      const selected = this.getSelectedFromCurrentGrid();
      this.addMultipleToTab(selected, tabIndex);
      return;
    }
    if (!trainee) return;

    this.dynamicTabs.update(tabs => {
      const newTabs = [...tabs];
      const tab = {...newTabs[tabIndex]};
      if (!tab.cards.some(c => c.id === trainee.traineeId)) {
        tab.cards = [...tab.cards, {id: trainee.traineeId}];
        newTabs[tabIndex] = tab;
        this.snackBar.open(`Added "${trainee.itemData.name_en}" to tab "${tab.name}"`, 'Dismiss', {duration: 3000});
      } else {
        this.snackBar.open(`"${trainee.itemData.name_en}" is already in tab "${tab.name}"`, 'Dismiss', {duration: 3000});
      }
      return newTabs;
    });
    this.saveData();
  }

  protected onRemoveTrainee(tabIndex: number, trainee: DisplayTrainee): void {
    const dialogRef = this.dialog.open(ConfirmationDialog, {
      data: {
        title: 'Confirm Removal',
        message: `Are you sure you want to remove "${trainee.itemData.name_en}" from this tab?`
      }
    });
    dialogRef.afterClosed().pipe(filter(confirmed => confirmed)).subscribe(() => {
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

    const dialogRef = this.dialog.open(ConfirmationDialog, {
      data: {title: 'Confirm Bulk Removal', message: `Are you sure you want to remove ${selected.length} selected trainees from this tab?`}
    });
    dialogRef.afterClosed().pipe(filter(confirmed => confirmed)).subscribe(() => {
      this.removeMultipleTraineesFromTab(tabIndex, selected);
    });
  }

  private addMultipleToTab(trainees: TraineeRow[], targetTabIndex: number): void {
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
      if (added > 0) {
        this.snackBar.open(`Added ${added} trainees to tab "${tab.name}"`, 'Dismiss', {duration: 3000});
      } else {
        this.snackBar.open('All selected trainees are already in the target tab', 'Dismiss', {duration: 3000});
      }
      return newTabs;
    });
    this.saveData();
  }

  private removeMultipleTraineesFromTab(tabIndex: number, trainees: TraineeRow[]): void {
    this.dynamicTabs.update(tabs => {
      const newTabs = [...tabs];
      const tab = {...newTabs[tabIndex]};
      const traineeIdsToRemove = trainees.map(t => t.traineeId);
      tab.cards = tab.cards.filter(c => !traineeIdsToRemove.includes(c.id));
      newTabs[tabIndex] = tab;
      return newTabs;
    });
    this.saveData();
    this.snackBar.open(`Removed ${trainees.length} trainees from tab.`, 'Dismiss', {duration: 3000});
  }

  private getSelectedFromCurrentGrid(): TraineeRow[] {
    return this.currentSelectedTrainees();
  }

  private toDisplayTrainee(t: Trainee): DisplayTrainee {
    return {
      ...t,
      traineeId: t.itemData.card_id,
      imageUrl: this.traineeService.getTraineeImageUrl(t)
    };
  }

  async saveData(): Promise<void> {
    if (this.savedDataResource.isLoading()) return;

    try {
      const tabsWithOnlyCards = this.dynamicTabs().map(tab => ({
        ...tab
      }));

      await this.traineesDataService.saveUserTraineesData({
        tabs: tabsWithOnlyCards,
        selectedTabIndex: this.getTabIndexFromValue(this.selectedTabValue())
      });
    } catch (error) {
      console.error('Failed to save trainees data:', error);
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
