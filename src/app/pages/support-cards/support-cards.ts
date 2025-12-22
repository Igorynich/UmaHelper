import { Component, computed, DestroyRef, inject, Signal, signal } from '@angular/core';
import { toSignal, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DataGrid, DataGridColumn, SortType } from '../../components/common/data-grid/data-grid';
import { DisplaySupportCard, Rarity } from '../../interfaces/display-support-card';
import { effectMap } from '../../maps/effect.map';
import { EffectId } from '../../interfaces/effect-id.enum';
import { SupportCardService } from '../../services/support-card.service';
import { SupportCard } from '../../interfaces/support-card';
import { debounceTime, map, startWith, tap } from 'rxjs';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { RarityPipe } from '../../pipes/rarity.pipe';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import {SupportCardType} from '../../interfaces/support-card-type.enum';
import { IMAGEKIT_CONFIG } from '../../imagekit.config';
import { MatDialog } from '@angular/material/dialog';
import { SupportCardInfo } from '../../components/dialogs/support-card-info/support-card-info';

type Operator = '>=' | '<=' | '>' | '<' | '=';

interface SupportCardEffectData {
  support_id: number;
  char_name: string;
  level?: number | undefined;
  rarity: Rarity;
  type: SupportCardType,
  characterImageUrl: string;
  uniqueDisplayData?: UniqueColumnDisplayData;
  [key: string]: number | string | undefined | { value: string; isLocked: boolean } | {
    value: number;
    tooltip: string;
    hasUnique: boolean
  } | UniqueColumnDisplayData;
}

export interface UniqueColumnDisplayData {
  levelDisplay: string;
  effectsDisplay: { shortName: string; value: number; isLocked: boolean; }[];
  isCardUniqueLocked: boolean;
  tooltip: string;
}

const LEVEL_TO_INDEX_MAP: { [level: number]: number } = {
  1: 1, 5: 2, 10: 3, 15: 4, 20: 5, 25: 6, 30: 7, 35: 8, 40: 9, 45: 10, 50: 11,
};

@Component({
  selector: 'app-support-cards',
  standalone: true,
  imports: [
    DataGrid,
    ReactiveFormsModule,
    RarityPipe,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule
  ],
  templateUrl: './support-cards.html',
  styleUrl: './support-cards.css'
})
export class SupportCards {
  private supportCardService = inject(SupportCardService);
  private destroyRef = inject(DestroyRef);

  protected readonly Rarity = Rarity;
  protected readonly rarityLevelMap = {
    [Rarity.R]: { default: 20, max: 40 },
    [Rarity.SR]: { default: 25, max: 45 },
    [Rarity.SSR]: { default: 30, max: 50 },
  };
  protected readonly operatorOptions: { label: string, value: Operator }[] = [
    { label: '>=', value: '>=' },
    { label: '<=', value: '<=' },
    { label: '>', value: '>' },
    { label: '<', value: '<' },
    { label: '=', value: '=' },
  ];

  protected readonly SupportCardType = SupportCardType;

  protected readonly filterForm = new FormGroup({
    name: new FormControl('', { nonNullable: true }),
    rarity: new FormControl<Rarity[]>([], { nonNullable: true }),
    type: new FormControl<SupportCardType[]>([], { nonNullable: true }),
    effectId: new FormControl<EffectId | ''>('', { nonNullable: true }),
    operator: new FormControl<Operator>('>=', { nonNullable: true }),
    value: new FormControl<number | null>(null)
  });

  private readonly filters = toSignal(
    this.filterForm.valueChanges.pipe(
      startWith(this.filterForm.getRawValue()),
      debounceTime(300),
      takeUntilDestroyed(this.destroyRef)
    )
  );

  protected readonly supportCards: Signal<SupportCard[]> = toSignal(
    this.supportCardService.getRawSupportCards().pipe(
      map(cards => cards.filter(card => card.release_en).sort((a, b) => {
        if (a.rarity !== b.rarity) {
          return b.rarity - a.rarity;
        }
        return new Date(b.release_en!).getTime() - new Date(a.release_en!).getTime();
      })), tap(a => console.log(a))
    ),
    { initialValue: [] as SupportCard[] }
  );
  protected readonly levelChanges = signal<Map<number, number>>(new Map());

  protected readonly supportCardsWithLevels = computed((): DisplaySupportCard[] => {
    const cards = this.supportCards();
    const changes = this.levelChanges();
    // console.log('changes', changes);

    return cards.map(card => {
      const changedLevel = changes.get(card.support_id);
      return { ...card, level: changedLevel };
    });
  });

  protected readonly dynamicColumns = computed((): DataGridColumn[] => {
    const allEffectIds = this.supportCardsWithLevels()
      .flatMap(card => {
        const regularEffects = card.effects.map(effect => effect[0] as EffectId);
        const uniqueEffects = card.unique?.effects.map(effect => effect.type as EffectId) || [];
        return [ ...regularEffects, ...uniqueEffects ];
      })
      .filter((value, index, self) => self.indexOf(value) === index)
      .sort((a, b) => a - b); // Sort effect IDs for consistent column order

    const effectColumns: DataGridColumn[] = allEffectIds.map(id => ({
      key: id.toString(),
      header: effectMap[id]?.short || `Effect ${id}`,
      tooltip: effectMap[id]?.long || `Unknown Effect ${id}`,
      width: '50px',
      type: 'effect',
      sortType: SortType.Number,
    }));

    return [
      { key: 'char_name', header: 'Character', tooltip: 'Character Name', width: '120px', sortType: SortType.String, type: 'characterImage' },
      { key: 'rarity', header: 'Rarity', width: '40px', type: 'rarity', sortType: SortType.Number },
      { key: 'type', header: 'Type', width: '80px', type: 'type', sortType: SortType.String },
      { key: 'level', header: 'Level', width: '100px', type: 'level', sortType: SortType.Number },
      { key: 'unique', header: 'Unique', width: '100px', type: 'unique', sortType: SortType.String },
      ...effectColumns,
      { key: 'actions', header: 'Actions', width: '70px', type: 'actions', stickyEnd: true },
    ];
  });

  protected readonly allEffects = computed(() => {
    return this.dynamicColumns()
      .filter(c => c.type === 'effect')
      .map(c => ({ id: c.key, name: c.header, tooltip: c.tooltip }));
  });

  protected readonly processedData = computed((): SupportCardEffectData[] => {
    const columns = this.dynamicColumns();
    const effectIds = columns.filter(c => c.type === 'effect').map(c => Number(c.key));

    return this.supportCardsWithLevels().map(card => {
      const data: SupportCardEffectData = {
        support_id: card.support_id,
        char_name: card.char_name,
        level: card.level,
        rarity: card.rarity,
        type: card.type,
        characterImageUrl: `${IMAGEKIT_CONFIG.urlEndpoint}/sup_cards/tex_support_card_${card.support_id}.png`,
      };
      const currentLevel = card.level || this.rarityLevelMap[card.rarity].default;

      // Logic for the 'unique' column
      if (card.unique) {
        const uniqueLevel = card.unique.level;
        const isCardUniqueLocked = currentLevel < uniqueLevel;

        const effectsDisplay = card.unique.effects.map(ue => ({
          shortName: effectMap[ue.type as EffectId]?.short || `Effect ${ue.type}`,
          value: ue.value,
          isLocked: isCardUniqueLocked, // Each unique effect also individually locked/unlocked
        }));

        data.uniqueDisplayData = {
          levelDisplay: `Lvl ${uniqueLevel}`,
          effectsDisplay: effectsDisplay,
          isCardUniqueLocked: isCardUniqueLocked,
          tooltip: isCardUniqueLocked ? `Unique effects unlock at Lvl ${uniqueLevel}` : card.unique.unique_desc || `Unique effects unlock at Lvl ${uniqueLevel}`,
        };
      }

      for (const effectId of effectIds) {
        const effectIdStr = effectId.toString();
        const effect = card.effects.find(e => e[0] === effectId);
        const baseValue = effect ? this.calculateEffectValue(effect, currentLevel) : 0;
        let uniqueValue = 0;

        if (card.unique && currentLevel >= card.unique.level) {
          const uniqueEffect = card.unique.effects.find(e => e.type === effectId);
          if (uniqueEffect) {
            uniqueValue = uniqueEffect.value;
          }
        }

        if (baseValue > 0 || uniqueValue > 0) {
          if (uniqueValue > 0) {
            data[effectIdStr] = {
              value: baseValue + uniqueValue,
              tooltip: `${baseValue}+${uniqueValue}u`,
              hasUnique: true,
            };
          } else {
            data[effectIdStr] = baseValue;
          }
        } else if (effect) { // Only show locked status for base effects, not for unique-only effects that are not yet unlocked.
          const unlockInfo = this.findUnlockInfo(effect);
          if (unlockInfo) {
            data[effectIdStr] = {
              value: `${unlockInfo.value}(Lvl ${unlockInfo.level})`,
              isLocked: true,
            };
          }
        }
      }
      return data;
    });
  });

  protected readonly filteredData = computed(() => {
    const data = this.processedData();
    const filters = this.filters();

    const name = filters?.name?.toLowerCase() || '';
    const rarities = filters?.rarity || [];
    const types = filters?.type || [];
    const effectId = filters?.effectId || '';
    const operator = filters?.operator || '>=';
    const value = filters?.value;

    return data.filter(card => {
      const nameMatch = !name || card.char_name.toLowerCase().includes(name);
      const rarityMatch = rarities.length === 0 || rarities.includes(card.rarity);
      const typeMatch = types.length === 0 || types.includes(card.type);

      let effectMatch = true;
      if (effectId && value != null) {
        const cardEffectData = card[effectId.toString()];
        let effectValue = 0;

        if (typeof cardEffectData === 'number') {
          effectValue = cardEffectData;
        } else if (typeof cardEffectData === 'object' && cardEffectData !== null && 'value' in cardEffectData && typeof cardEffectData.value === 'number') {
          effectValue = cardEffectData.value;
        }

        switch (operator) {
          case '>=':
            effectMatch = effectValue >= value;
            break;
          case '<=':
            effectMatch = effectValue <= value;
            break;
          case '>':
            effectMatch = effectValue > value;
            break;
          case '<':
            effectMatch = effectValue < value;
            break;
          case '=':
            effectMatch = effectValue === value;
            break;
        }
      }

      return nameMatch && rarityMatch && typeMatch && effectMatch;
    });
  });

  protected readonly visibleColumns = computed(() => {
    const allCols = this.dynamicColumns();
    const filtered = this.filteredData();

    if (filtered.length === 0) {
      return allCols;
    }

    const effectColumns = allCols.filter(c => c.type === 'effect');
    const actionsColumn = allCols.find(c => c.type === 'actions');
    const nonEffectColumns = allCols.filter(c => c.type !== 'effect' && c.type !== 'actions');

    const visibleEffectColumns = effectColumns.filter(col => {
      const effectId = col.key;
      // Check if the effect property exists on any card in the filtered data,
      // this includes active, unique, and locked effects.
      return filtered.some(card => card[effectId] !== undefined);
    });

    const result = [ ...nonEffectColumns, ...visibleEffectColumns ];
    if (actionsColumn) {
      result.push(actionsColumn);
    }
    return result;
  });

  protected onLevelChanged({ row, level }: { row: SupportCardEffectData; level: number }): void {
    // console.log('onLevelChanged ', row, level);
    this.levelChanges.update(m => {
      const newM = new Map<number, number>(m);
      newM.set(row.support_id, level);
      return newM;
    });
  }

  // Method to reset all filters
  protected resetFilters(): void {
    this.filterForm.reset({
      name: '',
      rarity: [],
      type: [],
      effectId: '',
      operator: '>=',
      value: null
    });
  }

  private findUnlockInfo(effect: number[]): { value: number; level: number } | null {
    const levels = Object.keys(LEVEL_TO_INDEX_MAP).map(Number);
    for (const level of levels) {
      const value = effect[LEVEL_TO_INDEX_MAP[level]];
      if (value !== -1) {
        return { value, level };
      }
    }
    return null;
  }

  private calculateEffectValue(effect: number[], level: number): number {
    const levels = Object.keys(LEVEL_TO_INDEX_MAP).map(Number);
    let startLevel = 1, startValue = -1;

    for (let i = 0; i < levels.length; i++) {
      const currentLevel = levels[i];
      if (currentLevel > level) break;
      const val = effect[LEVEL_TO_INDEX_MAP[currentLevel]];
      if (val !== -1) {
        startLevel = currentLevel;
        startValue = val;
      }
    }

    if (startValue === -1) return 0; // Effect not active at this level yet
    if (level === startLevel) return startValue;

    let endLevel = startLevel;
    let endValue = startValue;

    for (let i = levels.indexOf(startLevel) + 1; i < levels.length; i++) {
      const currentLevel = levels[i];
      const val = effect[LEVEL_TO_INDEX_MAP[currentLevel]];
      if (val !== -1) {
        endLevel = currentLevel;
        endValue = val;
        break;
      }
    }

    if (endLevel === startLevel) { // No further defined level, use startValue
      return startValue;
    }

    if (level >= endLevel) {
      return endValue;
    }

    // Linear interpolation
    const levelDiff = endLevel - startLevel;
    const valueDiff = endValue - startValue;
    const progress = (level - startLevel) / levelDiff;
    const interpolatedValue = startValue + (valueDiff * progress);

    return Math.floor(interpolatedValue);
  }

  protected readonly Object = Object;
  private dialog = inject(MatDialog);

  protected openImageModal(cardData: any): void {
    this.dialog.open(SupportCardInfo, {
      data: cardData,
      maxWidth: '90vw',
      maxHeight: '90vh',
    });
  }

  protected onSetAllFilteredToMax(): void {
    const filtered = this.filteredData();
    if (filtered.length === 0) return;

    this.levelChanges.update(currentChanges => {
      const newChanges = new Map(currentChanges);
      for (const card of filtered) {
        const maxLevel = this.rarityLevelMap[card.rarity].max;
        newChanges.set(card.support_id, maxLevel);
      }
      return newChanges;
    });
  }
}
