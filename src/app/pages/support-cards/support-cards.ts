import {Component, computed, effect, inject, signal} from '@angular/core';
import {rxResource, toSignal} from '@angular/core/rxjs-interop';
import {ActivatedRoute, Router} from '@angular/router';
import {rarityLevelMap, SupportCardService} from '../../services/support-card.service';
import {SupportCardsDataService} from '../../services/support-cards-data.service';
import {DisplaySupportCard} from '../../interfaces/display-support-card';
import {SupportCard, SupportCardEffectData} from '../../interfaces/support-card';
import {SupportCardFilter} from '../../interfaces/user-support-cards-data';
import {NgpTabset, NgpTabList, NgpTabButton, NgpTabPanel} from 'ng-primitives/tabs';
import {
  SupportCardListViewComponent
} from './support-card-list-view/support-card-list-view';
import {MatIcon} from '@angular/material/icon';
import {MatButton, MatButtonModule} from '@angular/material/button';
import {MatDialog} from '@angular/material/dialog';
import {NewTabDialogComponent} from './new-tab-dialog/new-tab-dialog';
import {filter} from 'rxjs';
import {ConfirmationDialog} from '../../components/common/confirmation-dialog/confirmation-dialog';
import {map} from 'rxjs/operators';
import {MatSnackBar} from '@angular/material/snack-bar';
import {MatMenu, MatMenuItem, MatMenuTrigger} from '@angular/material/menu';
import {DataGridStateService, TabState} from '../../services/data-grid-state.service';
import {MatTooltip} from '@angular/material/tooltip';
import {MatProgressSpinner} from '@angular/material/progress-spinner';

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
    MatProgressSpinner,
  ],
  templateUrl: './support-cards.html',
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

  protected allCards = toSignal<SupportCard[], SupportCard[]>(
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
  protected selectedTabValue = signal(this.ALL_CARDS_TAB_VALUE);
  protected selectedCard = signal<SupportCardEffectData | null>(null);
  protected firstTabSupportCardsWithLevels = signal<DisplaySupportCard[]>([]);
  protected currentPage = signal(0);
  protected currentPageSize = signal(20);

  private readonly queryParams = toSignal(
    this.route.queryParamMap.pipe(
      map(params => {
        console.log('queryParams toSignal', params);
        const tabValue = params.get('tabValue');
        // if (tabValue) this.selectedTabValue.set(tabValue);
        const page = params.get('page') ? Number(params.get('page')) - 1 : null;
        // if (page !== null) this.currentPage.set(page - 1);
        const pageSize = params.get('pageSize') ? Number(params.get('pageSize')) : null;
        // if (pageSize !== null) this.currentPageSize.set(pageSize);
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
      return this.supportCardsDataService.userSupportCardsData$;
    }
  });

  constructor() {
    effect(onCleanup => {
      console.log('selectedTabValue', this.selectedTabValue());
    });
    effect(onCleanup => {
      console.log('hydratedTabsData', this.hydratedTabsData());
    });
    effect(onCleanup => {
      console.log('savedDataResource', this.savedDataResource.isLoading(), this.savedDataResource.value());
    });

    effect(() => {
      if (this.savedDataResource.isLoading()) {
        return;
      }
      const savedData = this.savedDataResource.value();
      if (savedData) {
        console.log('savedData', savedData);
        this.dynamicTabs.set(savedData.tabs);
        const tabValue = savedData.selectedTabIndex !== undefined ? this.getTabValueFromIndex(savedData.selectedTabIndex) : this.ALL_CARDS_TAB_VALUE;
        this.selectedTabValue.set(tabValue);

        // Load filter and sort states into the service
        const tabStates = new Map<number, TabState>();

        // Preserve existing selection states from service
        const existingStates = this.dataGridStateService.getAllTabStates();   // TODO rewrite to use single(current) tab state

        // Add state for "All Cards" tab (this.ALL_CARDS_TAB_VALUE) - preserve existing selection or use empty
        const existingAllCardsState = existingStates.get(this.ALL_CARDS_TAB_INDEX);
        const allCardsTabState: TabState = {
          sort: [],
          selection: existingAllCardsState?.selection || {}
        };
        // Ignore stale allCardsSelection from Firebase - we don't persist selection anymore
        tabStates.set(this.ALL_CARDS_TAB_INDEX, allCardsTabState);

        savedData.tabs.forEach((tab, index) => {
          const existingTabState = existingStates.get(index);
          const tabState: TabState = {
            sort: tab.sort || [],
            selection: existingTabState?.selection || {} // Preserve existing selection
          };
          if (tab.filter) {
            tabState.filter = tab.filter;
          }
          // Ignore stale tab.selection from Firebase - we don't persist selection anymore
          tabStates.set(index, tabState);
        });
        this.dataGridStateService.loadTabStates(tabStates);

      } else {
        console.log('NO savedData');
        this.dynamicTabs.set([]);
        const tabValue = this.ALL_CARDS_TAB_VALUE;
        this.selectedTabValue.set(tabValue);

        // Initialize service with empty states
        const tabStates = new Map<number, TabState>();
        // Add empty state for "All Cards" tab (this.ALL_CARDS_TAB_INDEX)
        tabStates.set(this.ALL_CARDS_TAB_INDEX, {sort: [], selection: {}});
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
        this.selectedTabValue.set(this.queryParams().tabValue || this.ALL_CARDS_TAB_VALUE);
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
        tabValue: currentTabValue !== this.ALL_CARDS_TAB_VALUE ? currentTabValue : null,
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

  protected availableTabs = computed(() => {
    return this.dynamicTabs()
      .map((tab, index) => ({name: tab.name, index: index, value: this.getTabValueFromIndex(index)}))
      .filter(tab => tab.value !== this.selectedTabValue());
  });

  protected onTabChange(newValue: string): void {
    console.log('onTabChange', newValue);
    this.selectedTabValue.set(newValue);
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
        this.selectedTabValue.set(this.ALL_CARDS_TAB_VALUE);
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
      const selectedCards = this.getSelectedCardsFromCurrentGrid();
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

  protected onFilterChanged(tabIndex: number, filter: SupportCardFilter): void {
    // Update service with filter state
    this.dataGridStateService.updateTabFilter(tabIndex, filter);
    this.saveData();
  }

  protected hasSelectedCards(): boolean {
    const currentTabIndex = this.getTabIndexFromValue(this.selectedTabValue());
    return this.dataGridStateService.getTabSelectedCount(currentTabIndex) > 0;
  }


  protected onBulkRemove(tabIndex: number): void {
    const selectedCards = this.getSelectedCardsFromCurrentGrid();
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
    // Clear selection?
    const currentTabIndex = this.getTabIndexFromValue(this.selectedTabValue());
    this.dataGridStateService.clearTabSelection(currentTabIndex);
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

    // Clear selection after successful bulk remove
    this.dataGridStateService.clearTabSelection(tabIndex);
  }

  private getSelectedCardsFromCurrentGrid(): SupportCardEffectData[] {
    const currentTabIndex = this.getTabIndexFromValue(this.selectedTabValue());
    const currentSelection = this.dataGridStateService.getTabSelection(currentTabIndex);

    if (currentTabIndex === this.ALL_CARDS_TAB_INDEX) {
      // All Cards tab
      return this.firstTabSupportCardsWithLevels().filter(card =>
        currentSelection[card.support_id.toString()]
      ).map(card => ({
        support_id: card.support_id,
        char_name: card.char_name,
        level: card.level,
        rarity: card.rarity,
        type: card.type,
        characterImageUrl: this.supportCardService.getSupportCardImageUrl(card.support_id),   // TODO some sus duplicated mapping going on
        event_skills: card.event_skills,
        hints: card.hints,
      } as SupportCardEffectData));
    } else {
      // Dynamic tab
      const tabData = this.hydratedTabsData()[currentTabIndex];
      if (tabData) {
        return tabData.cards.filter(card =>
          currentSelection[card.support_id.toString()]
        ).map(card => ({
          support_id: card.support_id,
          char_name: card.char_name,
          level: card.level,
          rarity: card.rarity,
          type: card.type,
          characterImageUrl: this.supportCardService.getSupportCardImageUrl(card.support_id),      // TODO some sus duplicated mapping going on
          event_skills: card.event_skills,
          hints: card.hints,
        } as SupportCardEffectData));
      }
    }
    return [];
  }

  async saveData(manualTrigger: boolean = false): Promise<void> {
    // enable save only on manual trigger
    if (!manualTrigger) {
      return;
    }

    if (this.savedDataResource.isLoading()) return;

    try {
      const tabsWithFiltersAndSorts = this.dynamicTabs().map((tab, index) => {
        // const filter = this.tabFilters().get(index);
        const tabState = this.dataGridStateService.getTabState(index);
        const result: any = {...tab};
        if (tabState.filter) result.filter = tabState.filter;
        if (tabState.sort && tabState.sort.length > 0) result.sort = tabState.sort;
        // Intentionally exclude selection from being saved to Firebase
        return result;
      });

      await this.supportCardsDataService.saveUserSupportCardsData({
        tabs: tabsWithFiltersAndSorts,
        selectedTabIndex: this.getTabIndexFromValue(this.selectedTabValue())
        // Intentionally exclude allCardsSelection from being saved to Firebase
      });
    } catch (error) {
      console.error('Failed to save support cards data:', error);
      this.snackBar.open('Failed to save your changes', 'Dismiss', {
        duration: 3000
      });
    }
  }

  protected onSupportCardsWithLevelsChanged(cards: DisplaySupportCard[]) {
    this.firstTabSupportCardsWithLevels.set(cards);
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

  protected setSelectedTabValue(value: string | undefined) {
    this.selectedTabValue.set(value ?? this.ALL_CARDS_TAB_VALUE);
  }
}
