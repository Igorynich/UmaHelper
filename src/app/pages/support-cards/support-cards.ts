import { Component, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {rarityLevelMap, SupportCardService} from '../../services/support-card.service';
import { SupportCardsDataService } from '../../services/support-cards-data.service';
import { DisplaySupportCard } from '../../interfaces/display-support-card';
import {SupportCard, SupportCardEffectData} from '../../interfaces/support-card';
import { SupportCardFilter } from '../../interfaces/user-support-cards-data';
import {MatTab, MatTabGroup, MatTabLabel} from '@angular/material/tabs';
import {
  SupportCardListViewComponent
} from './support-card-list-view/support-card-list-view';
import {MatIcon} from '@angular/material/icon';
import {MatButton, MatButtonModule} from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { NewTabDialogComponent } from './new-tab-dialog/new-tab-dialog';
import { filter } from 'rxjs';
import { ConfirmationDialog } from '../../components/common/confirmation-dialog/confirmation-dialog';
import { map } from 'rxjs/operators';
import { MatSnackBar } from '@angular/material/snack-bar';
import {MatMenu, MatMenuItem, MatMenuTrigger} from '@angular/material/menu';
import { DataGridStateService, TabState } from '../../services/data-grid-state.service';
import { MatTooltip } from '@angular/material/tooltip';
import { IMAGEKIT_CONFIG } from '../../imagekit.config';

@Component({
  selector: 'app-support-cards',
  standalone: true,
  imports: [
    MatTabGroup,
    MatTab,
    MatTabLabel,
    SupportCardListViewComponent,
    MatIcon,
    MatButton,
    MatButtonModule,
    MatTooltip,
    MatMenu,
    MatMenuItem,
    MatMenuTrigger,
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

  protected allCards = toSignal<SupportCard[], SupportCard[]>(
    this.supportCardService.getRawSupportCards().pipe(
      map(cards => cards.sort((a: SupportCard, b: SupportCard) => {
        if (a.rarity !== b.rarity) {
          return b.rarity - a.rarity;
        }
        // Cards without release_en (upcoming) go first
        if (!a.release_en && b.release_en) return -1;
        if (a.release_en && !b.release_en) return 1;
        // Both have release_en or both don't - sort by date descending (latest first)
        const dateA = a.release_en ? new Date(a.release_en).getTime() : new Date(a.release).getTime();
        const dateB = b.release_en ? new Date(b.release_en).getTime() : new Date(b.release).getTime();
        return dateB - dateA;
      }))
    ),
    { initialValue: [] }
  );

  protected allCardsWithDefaults = computed((): DisplaySupportCard[] => {
    return this.allCards().map(card => ({
      ...card,
      level: this.rarityLevelMap[card.rarity].default
    }));
  });

  protected dynamicTabs = signal<{ name: string; cards: { id: number; level: number }[] }[]>([]);
  private isLoadingData = signal(true);

  protected hydratedTabsData = computed(() => {
    const allCardsMap = new Map(this.allCards().map(c => [c.support_id, c]));
    return this.dynamicTabs().map(tab => {
      const hydratedCards = tab.cards
        .map(c => {
          const fullCard = allCardsMap.get(c.id);
          return fullCard ? { ...fullCard, level: c.level } : null;
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
  protected selectedTabIndex = signal(this.ALL_CARDS_TAB_INDEX);
  protected selectedCard = signal<SupportCardEffectData | null>(null);
  protected firstTabSupportCardsWithLevels = signal<DisplaySupportCard[]>([]);

  constructor() {
    effect(() => {
      const savedData = this.supportCardsDataService.userSupportCardsData();
      if (savedData) {
        this.dynamicTabs.set(savedData.tabs);
        this.selectedTabIndex.set(savedData.selectedTabIndex || this.ALL_CARDS_TAB_INDEX);

        // Load filter and sort states into the service
        const tabStates = new Map<number, TabState>();

        // Preserve existing selection states from service
        const existingStates = this.dataGridStateService.getAllTabStates();   // TODO rewrite to use single(current) tab state

        // Add state for "All Cards" tab (this.ALL_CARDS_TAB_INDEX) - preserve existing selection or use empty
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

        this.isLoadingData.set(false);
      } else {
        this.dynamicTabs.set([]);
        this.selectedTabIndex.set(this.ALL_CARDS_TAB_INDEX);

        // Initialize service with empty states
        const tabStates = new Map<number, TabState>();
        // Add empty state for "All Cards" tab (this.ALL_CARDS_TAB_INDEX)
        tabStates.set(this.ALL_CARDS_TAB_INDEX, { sort: [], selection: {} });
        this.dataGridStateService.loadTabStates(tabStates);

        this.isLoadingData.set(false);
      }
    });
  }

  protected availableTabs = computed(() => {
    return this.dynamicTabs()
      .map((tab, index) => ({ name: tab.name, index: index }))
      .filter(tab => tab.index !== this.selectedTabIndex());
  });

  protected onTabChange(newIndex: number): void {
    // console.log('onTabChange', newIndex - 1);
    this.selectedTabIndex.set(newIndex - 1);    // -1 needed bc $event of mat-tab-group !== $index of hydratedTabsData(), $event: 0 - All Cards, $index: -1 - All Cards
    this.saveData();
  }

  protected addTab(): void {
    this.dialog.open(NewTabDialogComponent).afterClosed().pipe(filter(name => !!name)).subscribe(name => {
      this.dynamicTabs.update(tabs => [...tabs, { name, cards: [] }]);
      this.onTabChange(this.hydratedTabsData().length + 1);
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
      this.dynamicTabs.update(tabs => tabs.filter((_, i) => i !== index));
      if (this.selectedTabIndex() >= index) {
        this.selectedTabIndex.update(prev => prev - 1);
      }
      this.dataGridStateService.removeTabState(index);
      this.saveData();
    });
  }

  protected onLevelChangedInDynamicTab(tabIndex: number, event: { id: number; level: number }): void {
    this.dynamicTabs.update(tabs => {
      const newTabs = [...tabs];
      const tabToUpdate = { ...newTabs[tabIndex] };
      const cardToUpdateIndex = tabToUpdate.cards.findIndex(c => c.id === event.id);

      if (cardToUpdateIndex > -1) {
        const newCards = [...tabToUpdate.cards];
        newCards[cardToUpdateIndex] = { ...newCards[cardToUpdateIndex], level: event.level };
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
      const tabToUpdate = { ...newTabs[tabIndex] };

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
        const tabToUpdate = { ...newTabs[tabIndex] };
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
    const currentTabIndex = this.selectedTabIndex();
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
      const tabToUpdate = { ...newTabs[targetTabIndex] };
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
    const currentTabIndex = this.selectedTabIndex();
    this.dataGridStateService.clearTabSelection(currentTabIndex);
  }

  private removeMultipleCardsFromTab(tabIndex: number, cards: SupportCardEffectData[]): void {
    this.dynamicTabs.update(tabs => {
      const newTabs = [...tabs];
      const tabToUpdate = { ...newTabs[tabIndex] };
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
    const currentTabIndex = this.selectedTabIndex();
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
        characterImageUrl: `/sup_cards/tex_support_card_${card.support_id}.png`,      // TODO some sus duplicated mapping going on
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
          characterImageUrl: `/sup_cards/tex_support_card_${card.support_id}.png`,      // TODO some sus duplicated mapping going on
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

    if (this.isLoadingData()) return;

    try {
      const tabsWithFiltersAndSorts = this.dynamicTabs().map((tab, index) => {
        // const filter = this.tabFilters().get(index);
        const tabState = this.dataGridStateService.getTabState(index);
        const result: any = { ...tab };
        if (tabState.filter) result.filter = filter;
        if (tabState.sort && tabState.sort.length > 0) result.sort = tabState.sort;
        // Intentionally exclude selection from being saved to Firebase
        return result;
      });

      await this.supportCardsDataService.saveUserSupportCardsData({
        tabs: tabsWithFiltersAndSorts,
        selectedTabIndex: this.selectedTabIndex()
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
}
