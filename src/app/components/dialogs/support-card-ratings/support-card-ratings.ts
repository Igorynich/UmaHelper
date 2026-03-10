import {Component, computed, effect, inject, Signal, signal} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialog, MatDialogModule} from '@angular/material/dialog';
import {MatButtonModule} from '@angular/material/button';
import {DataGrid} from '../../common/data-grid/data-grid';
import {DataGridColumn, SortType} from '../../common/data-grid/data-grid.types';
import {SupportCardEffectData} from '../../../interfaces/support-card';
import {RatingsService, SCENARIO, STRATEGY} from '../../../services/ratings.service';
import {rarityLevelMap, SupportCardService} from '../../../services/support-card.service';
import {SupportCardInfo} from '../support-card-info/support-card-info';
import {DisplaySupportCard} from '../../../interfaces/display-support-card';
import {MatIconModule} from '@angular/material/icon';
import {MatFormField, MatLabel} from '@angular/material/input';
import {MatOption, MatSelect} from '@angular/material/select';

interface RatingsDialogData {
  cards: Signal<SupportCardEffectData[]>;
  fullCards: Signal<DisplaySupportCard[]>;
}

@Component({
  selector: 'app-support-card-ratings',
  standalone: true,
  imports: [
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    DataGrid,
    MatFormField,
    MatLabel,
    MatSelect,
    MatOption,
  ],
  templateUrl: './support-card-ratings.html',
  styleUrl: './support-card-ratings.css'
})
export class SupportCardRatings {
  private ratingsService = inject(RatingsService);
  private dialog = inject(MatDialog);
  private readonly supportCardService = inject(SupportCardService);

  protected readonly rarityLevelMap = rarityLevelMap;
  protected readonly data = signal<RatingsDialogData>(inject(MAT_DIALOG_DATA) as RatingsDialogData);

  protected readonly cardsSignal = this.data().cards;
  protected readonly fullCardsSignal = this.data().fullCards;
  protected readonly localCards = signal(this.cardsSignal());

  protected readonly scenarioOptions = Object.values(SCENARIO);
  protected readonly strategyOptions = Object.values(STRATEGY);
  protected readonly selectedScenarioSig = signal(this.ratingsService.selectedScenario);
  protected readonly selectedStrategySig = signal(this.ratingsService.selectedStrategy);

  protected readonly cardsWithRatings = computed(() => {
    return this.localCards().map(card => {
      const ratings = this.ratingsService.getRatings(card, this.selectedStrategySig(), this.selectedScenarioSig());
      return {
        ...card,
        rating: ratings.allStatsDiffSumRating,
        rating1: ratings.specRating
      }
    });
  });

  constructor() {
    effect(() => {
      this.localCards.set(this.cardsSignal());
    });
  }

  protected readonly columns: DataGridColumn[] = [
    {
      key: 'char_name',
      header: 'Character',
      tooltip: 'Character Name',
      width: '120px',
      sortType: SortType.String,
      type: 'characterImage'
    },
    {key: 'rarity', header: 'Rarity', width: '40px', type: 'rarity', sortType: SortType.Number},
    {key: 'type', header: 'Type', width: '80px', type: 'type', sortType: SortType.String},
    {key: 'level', header: 'Level', width: '100px', type: 'level', sortType: SortType.Number},
    {key: 'rating', header: 'Rating', width: '100px', sortType: SortType.Number, type: 'string'},
    {key: 'rating1', header: 'Spec Rating', width: '100px', sortType: SortType.Number, type: 'string'},
  ];

  protected onLevelChanged({row, level}: { row: SupportCardEffectData; level: number }): void {
    this.localCards.update(current => current.map(card => {
        if (card.support_id === row.support_id) {
          const fullCard = this.fullCardsSignal().find(value => value.support_id === card.support_id);
          const fullCardWithLevel = {...fullCard!, level};
          return this.supportCardService.mapToSupportCardEffectData(fullCardWithLevel);
        }
        return card;
      }
    ));
  }

  protected onImageClick(cardData: SupportCardEffectData): void {
    const fullCardData = this.data().fullCards().find(card => card.support_id === cardData.support_id);
    if (fullCardData) {
      this.dialog.open(SupportCardInfo, {
        data: fullCardData,
        maxWidth: '90vw',
        maxHeight: '90vh',
      });
    }
  }

  protected onScenarioChange(value: SCENARIO): void {
    this.selectedScenarioSig.set(value);
  }

  protected onStrategyChange(value: STRATEGY): void {
    this.selectedStrategySig.set(value);
  }
}
