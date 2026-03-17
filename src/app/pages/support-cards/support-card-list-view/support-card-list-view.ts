import {Component, computed, DestroyRef, effect, inject, input, signal, contentChild, output} from '@angular/core';
import { toSignal, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DataGrid } from '../../../components/common/data-grid/data-grid';
import { DataGridColumn, SortType } from '../../../components/common/data-grid/data-grid.types';
import { DisplaySupportCard, Rarity } from '../../../interfaces/display-support-card';
import { effectMap } from '../../../maps/effect.map';
import {EffectId, UniqEffectId} from '../../../interfaces/effect-id.enum';
import { SupportCardFilter } from '../../../interfaces/user-support-cards-data';
import { debounceTime, startWith } from 'rxjs';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { RarityPipe } from '../../../pipes/rarity.pipe';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatIconButton } from '@angular/material/button';
import { SupportCardType } from '../../../interfaces/support-card-type.enum';
import { MatDialog } from '@angular/material/dialog';
import { SupportCardInfo } from '../../../components/dialogs/support-card-info/support-card-info';
import {SupportCardRatings} from '../../../components/dialogs/support-card-ratings/support-card-ratings';
import {MatMenu} from '@angular/material/menu';
import { DataGridStateService } from '../../../services/data-grid-state.service';
import { SupportCardEffectData }
from '../../../interfaces/support-card';
import {rarityLevelMap, SupportCardService } from '../../../services/support-card.service';
import {RatingsService} from '../../../services/ratings.service';
import { matchesNameFilter } from '../../../utils/name-filter.utils';

type Operator = '>=' | '<=' | '>' | '<' | '=';

@Component({
  selector: 'app-support-card-list-view',
  standalone: true,
  imports: [
    DataGrid,
    ReactiveFormsModule,
    RarityPipe,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatCheckboxModule,
    MatIconModule,
    MatIconButton
  ],
  templateUrl: './support-card-list-view.html',
  styleUrl: './support-card-list-view.css'
})
export class SupportCardListViewComponent {
  private destroyRef = inject(DestroyRef);
  private dialog = inject(MatDialog);
  private dataGridStateService = inject(DataGridStateService);
  private supportCardService = inject(SupportCardService);
  private readonly ratingsService = inject(RatingsService);

  cards = input<DisplaySupportCard[]>([]);
  isFirstTab = input<boolean>(false);
  addMenu = input<MatMenu>();
  filterState = input<SupportCardFilter | null>(null);
  tabIndex = input<number>(-1); // Used to identify which tab this grid belongs to
  isActive = input<boolean>(false); // Whether this tab is currently active

  // Modern output functions instead of @Output decorators
  levelChangedInTab = output<{ id: number; level: number }>();
  add = output<SupportCardEffectData>();
  remove = output<SupportCardEffectData>();
  filterChanged = output<SupportCardFilter>();
  levelsChangedInFirstTab = output< DisplaySupportCard[]>();

  // Modern ViewChild using contentChild for better performance
  dataGrid = contentChild(DataGrid<SupportCardEffectData>);

  constructor() {
    effect(() => {
      if (this.isFirstTab()) {
        this.levelsChangedInFirstTab.emit(this.supportCardsWithLevels());
      }
    });

    effect(() => {
      // Initialize levelChanges when cards input changes
      const newCards = this.cards();
      const initialLevels = new Map<number, number>();
      for (const card of newCards) {
        if (card.level !== undefined) {
          initialLevels.set(card.support_id, card.level);
        }
      }
      this.levelChanges.set(initialLevels);
    });

    effect(() => {
      const filter = this.filterState();
      if (filter) {
        this.filterForm.patchValue(filter, { emitEvent: false });
      }
    });

    effect(() => {
      // Sync filter state with service when tab changes
      const tabIndex = this.tabIndex();
      const tabState = this.dataGridStateService.getTabState(tabIndex);
      if (tabState.filter) {
        this.filterForm.patchValue(tabState.filter, { emitEvent: false });
      }
    });

    effect(() => {
      const filterValue = this.filters();
      if (filterValue) {
        const completeFilter: SupportCardFilter = {
          name: filterValue.name || '',
          rarity: filterValue.rarity || [],
          type: filterValue.type || [],
          effectId: filterValue.effectId || '',
          operator: filterValue.operator || '>=',
          value: filterValue.value ?? null,
          showUpcomingCards: filterValue.showUpcomingCards ?? false
        };
        this.filterChanged.emit(completeFilter);
      }
    });
  }

  protected readonly Rarity = Rarity;
  protected readonly rarityLevelMap = rarityLevelMap;
  protected readonly operatorOptions: { label: string, value: Operator }[] = [
    { label: '>=', value: '>=' },
    { label: '<=', value: '<=' },
    { label: '>', value: '>' },
    { label: '<', value: '<' },
    { label: '=', value: '=' },
  ];

  protected readonly SupportCardType = SupportCardType;

  private readonly allSupportTypes = Object.values(SupportCardType) as SupportCardType[];
  private readonly allRarities = [Rarity.SSR, Rarity.SR, Rarity.R] as const;

  protected readonly filterForm = new FormGroup({
    name: new FormControl('', { nonNullable: true }),
    rarity: new FormControl<Rarity[]>([...this.allRarities], { nonNullable: true }),
    type: new FormControl<SupportCardType[]>([...this.allSupportTypes], { nonNullable: true }),
    effectId: new FormControl<EffectId | ''>('', { nonNullable: true }),
    operator: new FormControl<Operator>('>=', { nonNullable: true }),
    value: new FormControl<number | null>(null),
    showUpcomingCards: new FormControl<boolean>(false, { nonNullable: true })
  });

  protected readonly rarityOptions = [...this.allRarities];

  protected toggleFilterItem(controlName: 'rarity', item: Rarity): void;
  protected toggleFilterItem(controlName: 'type', item: SupportCardType): void;
  protected toggleFilterItem(
    controlName: 'rarity' | 'type',
    item: Rarity | SupportCardType
  ): void {
    if (controlName === 'rarity') {
      const control = this.filterForm.get('rarity');
      const current = control?.value ?? [];
      const updated = current.includes(item as Rarity)
        ? current.filter(value => value !== item)
        : [...current, item as Rarity];
      control?.setValue(updated);
      return;
    }

    const control = this.filterForm.get('type');
    const current = control?.value ?? [];
    const updated = current.includes(item as SupportCardType)
      ? current.filter(value => value !== item)
      : [...current, item as SupportCardType];
    control?.setValue(updated);
  }

  protected isFilterItemSelected(controlName: 'rarity', item: Rarity): boolean;
  protected isFilterItemSelected(controlName: 'type', item: SupportCardType): boolean;
  protected isFilterItemSelected(
    controlName: 'rarity' | 'type',
    item: Rarity | SupportCardType
  ): boolean {
    if (controlName === 'rarity') {
      return this.filterForm.get('rarity')?.value.includes(item as Rarity) ?? false;
    }

    return this.filterForm.get('type')?.value.includes(item as SupportCardType) ?? false;
  }

  private readonly filters = toSignal(
    this.filterForm.valueChanges.pipe(
      startWith(this.filterForm.getRawValue()),
      debounceTime(300),
      takeUntilDestroyed(this.destroyRef)
    )
  );

  protected readonly levelChanges = signal<Map<number, number>>(new Map());
  protected readonly selectedCards = computed(() => {
    const dataGridRef = this.dataGrid();
    return dataGridRef ? dataGridRef.getSelectedRows() : [];
  });
  protected readonly hasSelectedCards = computed(() => {
    return this.selectedCards().length > 0;
  });
  protected readonly selectedCardsCount = computed(() => {
    return this.selectedCards().length;
  });

  protected readonly filteredCards = computed(() => {
    return this.filteredData();
  });

  protected readonly allEffects = computed(() => {
    return this.dynamicColumns()
      .filter(c => c.type === 'effect')
      .map(c => ({ id: c.key, name: c.header, tooltip: c.tooltip }));
  });

  protected readonly supportCardsWithLevels = computed((): DisplaySupportCard[] => {
    const cards = this.cards();
    const changes = this.levelChanges();

    return cards.map(card => {
      const changedLevel = changes.get(card.support_id);
      return { ...card, level: changedLevel ?? card.level };
    });
  });

  protected readonly dynamicColumns = computed((): DataGridColumn[] => {
    const allEffectIds = this.supportCardsWithLevels()
      .flatMap(card => {
        const regularEffects = card.effects.map(effect => effect[0] as EffectId);
        const uniqueEffects = card.unique?.effects
          .map(effect => effect.type as EffectId | UniqEffectId)
          .filter(type => !Object.values(UniqEffectId).includes(type as UniqEffectId)) || [];
        return [ ...regularEffects, ...uniqueEffects ];
      })
      .filter((value, index, self) => self.indexOf(value) === index)
      .sort((a, b) => a - b);

    const effectColumns: DataGridColumn[] = allEffectIds.map(id => ({
      key: id.toString(),
      header: effectMap[id as EffectId]?.short || `Effect ${id}`,
      tooltip: effectMap[id as EffectId]?.long || `Unknown Effect ${id}`,
      width: '50px',
      type: 'effect',
      sortType: SortType.Number,
    }));

    return [
      { key: 'select', header: '', width: '50px', type: 'checkbox' },
      { key: 'char_name', header: 'Character', tooltip: 'Character Name', width: '120px', sortType: SortType.String, type: 'characterImage' },
      { key: 'rarity', header: 'Rarity', width: '40px', type: 'rarity', sortType: SortType.Number },
      { key: 'type', header: 'Type', width: '80px', type: 'type', sortType: SortType.String },
      { key: 'level', header: 'Level', width: '100px', type: 'level', sortType: SortType.Number },
      { key: 'unique', header: 'Unique', width: '100px', type: 'unique', sortType: SortType.String },
      ...effectColumns,
      { key: 'actions', header: 'Actions', width: '70px', type: 'actions', stickyEnd: true },
    ];
  });

  protected readonly processedData = computed((): SupportCardEffectData[] => {
    const columns = this.dynamicColumns();
    const effectIds = columns.filter(c => c.type === 'effect').map(c => Number(c.key));

    return this.supportCardsWithLevels().map(card => this.supportCardService.mapToSupportCardEffectData(card, effectIds));
  });

  protected readonly filteredData = computed(() => {
    const data = this.processedData();
    const filters = this.filters();

    const name = filters?.name || '';
    const rarities = filters?.rarity || [];
    const types = filters?.type || [];
    const effectId = filters?.effectId || '';
    const operator = filters?.operator || '>=';
    const value = filters?.value;
    const showUpcomingCards = filters?.showUpcomingCards ?? false;

    return data.filter(card => {
      const nameMatch = matchesNameFilter(name, card.char_name);
      const rarityMatch = rarities.length === 0 || rarities.includes(card.rarity);
      const typeMatch = types.length === 0 || types.includes(card.type);

      // Filter by release_en - show upcoming cards (no release_en) only if checkbox is checked
      const upcomingMatch = showUpcomingCards || card.release_en;

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
          case '>=': effectMatch = effectValue >= value; break;
          case '<=': effectMatch = effectValue <= value; break;
          case '>': effectMatch = effectValue > value; break;
          case '<': effectMatch = effectValue < value; break;
          case '=': effectMatch = effectValue === value; break;
        }
      }

      return nameMatch && rarityMatch && typeMatch && upcomingMatch && effectMatch;
    });
  });

  protected readonly visibleColumns = computed(() => {
    const allCols = this.dynamicColumns();
    const filtered = this.filteredCards();

    if (filtered.length === 0) return allCols;

    const effectColumns = allCols.filter(c => c.type === 'effect');
    const actionsColumn = allCols.find(c => c.type === 'actions');
    const nonEffectColumns = allCols.filter(c => c.type !== 'effect' && c.type !== 'actions');

    const visibleEffectColumns = effectColumns.filter(col => {
      const effectId = col.key;
      return filtered.some(card => card[effectId] !== undefined);
    });

    const result = [ ...nonEffectColumns, ...visibleEffectColumns ];
    if (actionsColumn) {
      result.push(actionsColumn);
    }
    return result;
  });

  protected onLevelChanged({ row, level }: { row: SupportCardEffectData; level: number }): void {
    this.levelChanges.update(m => {
      const newM = new Map<number, number>(m);
      newM.set(row.support_id, level);
      return newM;
    });
    this.levelChangedInTab.emit({ id: row.support_id, level });
  }

  protected resetFilters(): void {
    this.filterForm.reset({
      name: '',
      rarity: [...this.allRarities],
      type: [...this.allSupportTypes],
      effectId: '',
      operator: '>=',
      value: null,
      showUpcomingCards: false
    });
  }

  protected clearNameFilter(): void {
    this.filterForm.get('name')?.setValue('');
  }

  protected readonly Object = Object;

  protected openImageModal(cardData: SupportCardEffectData): void {
    const fullCardData = this.supportCardsWithLevels().find(card => card.support_id === cardData.support_id);
    if (fullCardData) {
      this.dialog.open(SupportCardInfo, {
        data: fullCardData,
        maxWidth: '90vw',
        maxHeight: '90vh',
      });
    }
  }

  protected openRatingsModal(): void {
    const dialogRef = this.dialog.open(SupportCardRatings, {
      data: { cards: this.filteredCards, fullCards: this.supportCardsWithLevels },
      maxWidth: '90vw',
      maxHeight: '90vh',
    });
  }

  protected onSetAllFilteredToMax(): void {
    const filtered = this.filteredCards();
    if (filtered.length === 0) return;

    this.levelChanges.update(currentChanges => {
      const newChanges = new Map(currentChanges);
      for (const card of filtered) {
        const maxLevel = this.rarityLevelMap[card.rarity].max;
        newChanges.set(card.support_id, maxLevel);
        this.levelChangedInTab.emit({ id: card.support_id, level: maxLevel });
      }
      return newChanges;
    });
  }

  protected onAdd(card: SupportCardEffectData): void {
    this.add.emit(card);
  }

  protected onRemove(card: SupportCardEffectData): void {
    this.remove.emit(card);
  }
}
