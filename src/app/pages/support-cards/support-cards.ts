import {Component, computed, effect, inject, signal, ChangeDetectionStrategy} from '@angular/core';
import {rxResource, toSignal} from '@angular/core/rxjs-interop';
import {ActivatedRoute, Params, Router} from '@angular/router';
import {PageEvent} from '@angular/material/paginator';
import {rarityLevelMap, SupportCardService} from '../../services/support-card.service';
import {SupportCardsDataService} from '../../services/support-cards-data.service';
import {DisplaySupportCard} from '../../interfaces/display-support-card';
import {SupportCard, SupportCardEffectData} from '../../interfaces/support-card';
import {SupportCardFilter} from '../../interfaces/user-support-cards-data';
import {NgpTabButton, NgpTabList, NgpTabPanel, NgpTabset} from 'ng-primitives/tabs';
import {SupportCardListViewComponent} from './support-card-list-view/support-card-list-view';
import {MatIcon} from '@angular/material/icon';
import {MatButton, MatButtonModule} from '@angular/material/button';
import {MatDialog} from '@angular/material/dialog';
import {NewTabDialogComponent} from './new-tab-dialog/new-tab-dialog';
import {filter} from 'rxjs';
import {ConfirmationDialog} from '../../components/common/confirmation-dialog/confirmation-dialog';
import {tap} from 'rxjs/operators';
import {MatSnackBar} from '@angular/material/snack-bar';
import {MatMenu, MatMenuItem, MatMenuTrigger} from '@angular/material/menu';
import {DataGridStateService} from '../../services/data-grid-state.service';
import {MatTooltip} from '@angular/material/tooltip';
import {MatProgressSpinner} from '@angular/material/progress-spinner';
import {ActiveSort} from '../../components/common/data-grid/data-grid.types';

@Component({
  selector: 'app-support-cards',
  standalone: true,
  imports: [
    NgpTabset,
    NgpTabList,
    NgpTabButton,
    NgpTabPanel,
    SupportCardListViewComponent,
    MatIcon,
    MatButton,
    MatButtonModule,
    MatTooltip,
    MatMenu,
    MatMenuItem,
    MatMenuTrigger,
    MatProgressSpinner
  ],
  templateUrl: './support-cards.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './support-cards.css'
})
export class SupportCards {
  private supportCardService = inject(SupportCardService);
  private supportCardsDataService = inject(SupportCardsDataService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  private dataGridStateService = inject(DataGridStateService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  protected allCards = toSignal<SupportCard[], SupportCard[]>(    //TODO: make a resource
    this.supportCardService.getSortedSupportCards(),
    {initialValue: []}
  );

  protected allCardsWithDefaults = computed((): DisplaySupportCard[] => {
    return this.allCards().map(card => ({
      ...card,
      level: this.rarityLevelMap[card.rarity].default
    }));
  });

  protected dynamicTabs = signal<{ name: string; cards: { id: number; level: number }[] }[]>([]);

  protected hydratedTabsData = computed(() => {
    const allCardsMap = new Map(this.allCards().map(c => [c.support_id, c]));
    return this.dynamicTabs().map(tab => {
      const hydratedCards = tab.cards
        .map(c => {
          const fullCard = allCardsMap.get(c.id);
          return fullCard ? {...fullCard, level: c.level} : null;
        })
        .filter((c): c is NonNullable<typeof c> => c !== null);

      return {
        name: tab.name,
        cards: hydratedCards
      };
    });
  });

  protected readonly rarityLevelMap = rarityLevelMap;

  readonly ALL_CARDS_TAB_INDEX: number = -1;
  readonly ALL_CARDS_TAB_VALUE: string = 'all-cards';
  protected selectedCard = signal<SupportCardEffectData | null>(null);
  protected currentSelectedCards = signal<SupportCardEffectData[]>([]);

  // Query params as the single source of truth
  private queryParams = toSignal(this.route.queryParams.pipe(tap(params => {
    console.warn('Query params changed', params);
  })), {initialValue: {} as Params});

  // State computed from queryParams
  protected selectedTabValue = computed(() => {
    const tabValue = this.queryParams()['tabValue'] as string | undefined;
    return tabValue || this.ALL_CARDS_TAB_VALUE;
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
      type: queries['type']?.split(',') || [],
      effectId: queries['effectId'] || '',
      operator: queries['operator'] || '>=',
      value: queries['value'] != null && queries['value'] !== '' ? Number(queries['value']) : null,
      showUpcomingCards: queries['showUpcomingCards'] === 'true' || queries['showUpcomingCards'] === true,
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
      return this.supportCardsDataService.userSupportCardsData$;
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

  protected availableTabs = computed(() => {
    return this.dynamicTabs()
      .map((tab, index) => ({name: tab.name, index: index, value: this.getTabValueFromIndex(index)}))
      .filter(tab => tab.value !== this.selectedTabValue());
  });

  protected onTabChange(newValue: string): void {
    console.log('onTabChange', newValue);
    this.updateQueryParams({ tabValue: newValue === this.ALL_CARDS_TAB_VALUE ? null : newValue });
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
        this.onTabChange(this.ALL_CARDS_TAB_VALUE);
      }
      this.dynamicTabs.update(tabs => tabs.filter((_, i) => i !== index));


      this.dataGridStateService.removeTabState(index);
      this.saveData();
    });
  }

  protected onLevelChangedInDynamicTab(tabIndex: number, event: { id: number; level: number }): void {
    this.dynamicTabs.update(tabs => {
      const newTabs = [...tabs];
      const tabToUpdate = {...newTabs[tabIndex]};
      const cardToUpdateIndex = tabToUpdate.cards.findIndex(c => c.id === event.id);

      if (cardToUpdateIndex > -1) {
        const newCards = [...tabToUpdate.cards];
        newCards[cardToUpdateIndex] = {...newCards[cardToUpdateIndex], level: event.level};
        tabToUpdate.cards = newCards;
        newTabs[tabIndex] = tabToUpdate;
      }

      return newTabs;
    });
    this.saveData();
  }

  protected onAddCard(card: SupportCardEffectData): void {
    this.selectedCard.set(card);
  }

  protected addCardToTab(card: SupportCardEffectData | null, targetTabIndex: number): void {

    const tabIndex = targetTabIndex;
    // Check if this is a bulk operation (no single card selected)
    if (!card && this.hasSelectedCards()) {
      const selectedCards = this.currentSelectedCards();
      this.addMultipleCardsToTab(selectedCards, tabIndex);
      return;
    }

    if (!card) return;

    this.dynamicTabs.update(tabs => {
      const newTabs = [...tabs];
      const tabToUpdate = {...newTabs[tabIndex]};

      const cardExists = tabToUpdate.cards?.some(c => c.id === card.support_id);

      if (!cardExists) {
        tabToUpdate.cards = [...tabToUpdate.cards || [], {
          id: card.support_id,
          level: card.level ?? this.rarityLevelMap[card.rarity].default
        }];
        newTabs[tabIndex] = tabToUpdate;

        this.snackBar.open(`Added "${card.char_name}" to tab "${tabToUpdate.name}"`, 'Dismiss', {
          duration: 3000
        });
      } else {
        this.snackBar.open(`"${card.char_name}" is already in tab "${tabToUpdate.name}"`, 'Dismiss', {
          duration: 3000
        });
      }

      return newTabs;
    });
    this.saveData();
  }

  protected onRemoveCard(tabIndex: number, card: SupportCardEffectData) {
    const dialogRef = this.dialog.open(ConfirmationDialog, {
      data: {
        title: 'Confirm Removal',
        message: `Are you sure you want to remove "${card.char_name}" from this tab?`
      }
    });

    dialogRef.afterClosed().pipe(filter(confirmed => confirmed)).subscribe(() => {
      this.dynamicTabs.update(tabs => {
        const newTabs = [...tabs];
        const tabToUpdate = {...newTabs[tabIndex]};
        tabToUpdate.cards = tabToUpdate.cards.filter(c => c.id !== card.support_id);
        newTabs[tabIndex] = tabToUpdate;
        return newTabs;
      });
      this.saveData();
      this.snackBar.open(`Removed "${card.char_name}" from tab.`, 'Dismiss', {
        duration: 3000
      });
    });
  }

  protected onFilterChanged(filter: SupportCardFilter): void {
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
      tabValue: tabValue === this.ALL_CARDS_TAB_VALUE ? undefined : tabValue,
      ...this.getFilterQueryParams(tabData.filter as SupportCardFilter),
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

  private getFilterQueryParams(filter: SupportCardFilter | undefined): Params {
    if (!filter) return {
      name: undefined,
      rarity: undefined,
      type: undefined,
      effectId: undefined,
      operator: undefined,
      value: undefined,
      showUpcomingCards: undefined,
      skillName: undefined,
      skillDesc: undefined,
      skillTypes: undefined
    };
    const hasEffectFilter = filter?.effectId && filter.value;
    return {
      name: filter.name || undefined,
      rarity: filter.rarity.length > 0 ? filter.rarity.join(',') : undefined,
      type: filter.type.length > 0 ? filter.type.join(',') : undefined,
      showUpcomingCards: filter.showUpcomingCards || undefined,
      effectId: hasEffectFilter ? filter.effectId : undefined,
      operator: hasEffectFilter ? filter.operator : undefined,
      value: hasEffectFilter ? filter.value : undefined,
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

  private updateFilterQueryParams(filter: SupportCardFilter): void {
    const filterData = this.getFilterQueryParams(filter);
    this.updateQueryParams({
      ...filterData
    });
  }

  private updateSortQueryParams(sort: ActiveSort[]): void {
    this.updateQueryParams(this.getSortQueryParams(sort));
  }

  protected hasSelectedCards(): boolean {
    return this.currentSelectedCards().length > 0;
  }

  protected onBulkRemove(tabIndex: number): void {
    const selectedCards = this.currentSelectedCards();
    if (selectedCards.length === 0) return;

    const dialogRef = this.dialog.open(ConfirmationDialog, {
      data: {
        title: 'Confirm Bulk Removal',
        message: `Are you sure you want to remove ${selectedCards.length} selected cards from this tab?`
      }
    });

    dialogRef.afterClosed().pipe(filter(confirmed => confirmed)).subscribe(() => {
      this.removeMultipleCardsFromTab(tabIndex, selectedCards);
    });
  }

  private addMultipleCardsToTab(cards: SupportCardEffectData[], targetTabIndex: number): void {
    this.dynamicTabs.update(tabs => {
      const newTabs = [...tabs];
      const tabToUpdate = {...newTabs[targetTabIndex]};
      let addedCount = 0;

      cards.forEach(card => {
        const cardExists = tabToUpdate.cards.some(c => c.id === card.support_id);
        if (!cardExists) {
          tabToUpdate.cards = [...tabToUpdate.cards, {
            id: card.support_id,
            level: card.level ?? this.rarityLevelMap[card.rarity].default
          }];
          addedCount++;
        }
      });

      newTabs[targetTabIndex] = tabToUpdate;

      if (addedCount > 0) {
        this.snackBar.open(`Added ${addedCount} cards to tab "${tabToUpdate.name}"`, 'Dismiss', {
          duration: 3000
        });
      } else {
        this.snackBar.open('All selected cards are already in the target tab', 'Dismiss', {
          duration: 3000
        });
      }

      return newTabs;
    });
    this.saveData();
  }

  private removeMultipleCardsFromTab(tabIndex: number, cards: SupportCardEffectData[]): void {
    this.dynamicTabs.update(tabs => {
      const newTabs = [...tabs];
      const tabToUpdate = {...newTabs[tabIndex]};
      const cardIdsToRemove = cards.map(c => c.support_id);

      tabToUpdate.cards = tabToUpdate.cards.filter(c => !cardIdsToRemove.includes(c.id));
      newTabs[tabIndex] = tabToUpdate;
      return newTabs;
    });
    this.saveData();
    this.snackBar.open(`Removed ${cards.length} cards from tab.`, 'Dismiss', {
      duration: 3000
    });
  }

  async saveData(): Promise<void> {
    if (this.savedDataResource.isLoading()) return;

    try {
      const tabsWithOnlyCards = this.dynamicTabs().map(tab => ({
        ...tab
      }));

      await this.supportCardsDataService.saveUserSupportCardsData({
        tabs: tabsWithOnlyCards,
        selectedTabIndex: this.getTabIndexFromValue(this.selectedTabValue())
      });
    } catch (error) {
      console.error('Failed to save support cards data:', error);
      this.snackBar.open('Failed to save your changes', 'Dismiss', {
        duration: 3000
      });
    }
  }

  protected getTabValueFromIndex(index: number): string {
    if (index === this.ALL_CARDS_TAB_INDEX) return this.ALL_CARDS_TAB_VALUE;
    return `tab-${index}`;
  }

  protected getTabIndexFromValue(value: string): number {
    if (value === this.ALL_CARDS_TAB_VALUE) return this.ALL_CARDS_TAB_INDEX;
    const match = value.match(/^tab-(\d+)$/);
    return match ? parseInt(match[1], 10) : this.ALL_CARDS_TAB_INDEX;
  }
}
