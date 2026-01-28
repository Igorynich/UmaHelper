import { Component, computed, inject, signal, ViewChild } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { SupportCardService } from '../../services/support-card.service';
import { DisplaySupportCard, Rarity } from '../../interfaces/display-support-card';
import { SupportCard } from '../../interfaces/support-card';
import { MatTabsModule } from '@angular/material/tabs';
import {
  SupportCardListViewComponent,
  SupportCardEffectData
} from './support-card-list-view/support-card-list-view';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { NewTabDialogComponent } from './new-tab-dialog/new-tab-dialog';
import { filter } from 'rxjs';
import { ConfirmationDialog } from '../../components/common/confirmation-dialog/confirmation-dialog';
import { map } from 'rxjs/operators';
import { MatTooltip } from '@angular/material/tooltip';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatMenuModule, MatMenuTrigger } from '@angular/material/menu';

@Component({
  selector: 'app-support-cards',
  standalone: true,
  imports: [
    MatTabsModule,
    SupportCardListViewComponent,
    MatIconModule,
    MatButtonModule,
    MatTooltip,
    MatMenuModule,
  ],
  templateUrl: './support-cards.html',
  styleUrl: './support-cards.css'
})
export class SupportCards {
  private supportCardService = inject(SupportCardService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  protected allCards = toSignal<SupportCard[], SupportCard[]>(
    this.supportCardService.getRawSupportCards().pipe(
      map(cards => cards.filter(card => card.release_en).sort((a: SupportCard, b: SupportCard) => {
        if (a.rarity !== b.rarity) {
          return b.rarity - a.rarity;
        }
        return new Date(b.release_en!).getTime() - new Date(a.release_en!).getTime();
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

  protected readonly rarityLevelMap = {
    [Rarity.R]: { default: 20, max: 40 },
    [Rarity.SR]: { default: 25, max: 45 },
    [Rarity.SSR]: { default: 30, max: 50 },
  };

  protected selectedTabIndex = signal(0);
  protected selectedCard = signal<SupportCardEffectData | null>(null);

  @ViewChild('addMenuTrigger') addMenuTrigger!: MatMenuTrigger;

  protected availableTabs = computed(() => {
    return this.dynamicTabs()
      .map((tab, index) => ({ name: tab.name, index }))
      .filter(tab => tab.index !== this.selectedTabIndex() - 1);
  });

  protected onTabChange(newIndex: number): void {
    this.selectedTabIndex.set(newIndex);
  }

  protected addTab(): void {
    this.dialog.open(NewTabDialogComponent).afterClosed().pipe(filter(name => !!name)).subscribe(name => {
      this.dynamicTabs.update(tabs => [...tabs, { name, cards: [] }]);
      this.onTabChange(this.hydratedTabsData().length);
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
      if (this.selectedTabIndex() > index + 1) {
        this.selectedTabIndex.update(prev => prev - 1);
      } else if (this.selectedTabIndex() === index + 1) {
        this.selectedTabIndex.set(0);
      }
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
  }

  protected onAddCard(card: SupportCardEffectData): void {
    this.selectedCard.set(card);
    if (this.availableTabs().length > 0) {
      this.addMenuTrigger?.openMenu();
    } else {
      this.snackBar.open('No other tabs available to add this card.', 'Dismiss', {
        duration: 3000
      });
    }
  }

  protected addCardToTab(card: SupportCardEffectData | null, targetTabIndex: number): void {
    if (!card) return;

    this.dynamicTabs.update(tabs => {
      const newTabs = [...tabs];
      const tabToUpdate = { ...newTabs[targetTabIndex] };

      const cardExists = tabToUpdate.cards.some(c => c.id === card.support_id);

      if (!cardExists) {
        tabToUpdate.cards = [...tabToUpdate.cards, {
          id: card.support_id,
          level: card.level ?? this.rarityLevelMap[card.rarity].default
        }];
        newTabs[targetTabIndex] = tabToUpdate;

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
      this.snackBar.open(`Removed "${card.char_name}" from tab.`, 'Dismiss', {
        duration: 3000
      });
    });
  }
}
