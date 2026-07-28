import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  input,
  output,
  signal,
  contentChild
} from '@angular/core';
import { rxResource, takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import {MatAutocompleteModule, MatAutocompleteSelectedEvent} from '@angular/material/autocomplete';
import { MatButtonModule, MatIconButton } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenu } from '@angular/material/menu';
import { MatSelectModule } from '@angular/material/select';
import {debounceTime, delay, map, tap} from 'rxjs/operators';
import { DataGrid } from '../../../components/common/data-grid/data-grid';
import { DataGridColumn, SortType } from '../../../components/common/data-grid/data-grid.types';
import { SkillDialogComponent } from '../../../components/common/skill-dialog/skill-dialog';
import { SupportCardInfo } from '../../../components/dialogs/support-card-info/support-card-info';
import { SupportCardRatings } from '../../../components/dialogs/support-card-ratings/support-card-ratings';
import { TraineeInfo } from '../../../components/dialogs/trainee-info/trainee-info';
import { DisplaySupportCard, Rarity } from '../../../interfaces/display-support-card';
import { EffectId, UniqEffectId } from '../../../interfaces/effect-id.enum';
import { SupportCardEffectData } from '../../../interfaces/support-card';
import { SupportCardType } from '../../../interfaces/support-card-type.enum';
import { SupportCardFilter } from '../../../interfaces/user-support-cards-data';
import { effectMap } from '../../../maps/effect.map';
import { DataGridStateService } from '../../../services/data-grid-state.service';
import { ModalControlService } from '../../../services/modal-control';
import { SkillsService } from '../../../services/skills.service';
import { rarityLevelMap, SupportCardService } from '../../../services/support-card.service';
import { matchesNameFilter } from '../../../utils/name-filter.utils';
import { RarityPipe } from '../../../pipes/rarity.pipe';
import {MatProgressSpinner} from '@angular/material/progress-spinner';
import {MatTooltip} from '@angular/material/tooltip';

type Operator = '>=' | '<=' | '>' | '<' | '=';

@Component({
  selector: 'app-support-card-list-view',
  standalone: true,
  imports: [
    DataGrid,
    MatAutocompleteModule,
    MatButtonModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatIconModule,
    MatIconButton,
    MatInputModule,
    MatSelectModule,
    ReactiveFormsModule,
    RarityPipe,
    MatProgressSpinner,
    MatTooltip,
  ],
  templateUrl: './support-card-list-view.html',
  styleUrl: './support-card-list-view.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SupportCardListViewComponent {
  private destroyRef = inject(DestroyRef);
  private dialog = inject(MatDialog);
  private modalControlService = inject(ModalControlService);
  private dataGridStateService = inject(DataGridStateService);
  private supportCardService = inject(SupportCardService);
  private skillsService = inject(SkillsService);

  cards = input<DisplaySupportCard[]>([]);
  isFirstTab = input<boolean>(false);
  addMenu = input<MatMenu>();
  tabIndex = input<number>(-1);
  isActive = input<boolean>(false);
  pageIndex = input<number>(0);
  pageSize = input<number>(20);

  levelChangedInTab = output<{ id: number; level: number }>();
  add = output<SupportCardEffectData>();
  remove = output<SupportCardEffectData>();
  filterChanged = output<SupportCardFilter>();
  levelsChangedInFirstTab = output<DisplaySupportCard[]>();
  pageChanged = output<number>();
  pageSizeChanged = output<number>();

  dataGrid = contentChild(DataGrid<SupportCardEffectData>);

  protected readonly Rarity = Rarity;
  protected readonly rarityLevelMap = rarityLevelMap;
  protected readonly SupportCardType = SupportCardType;
  protected readonly Object = Object;

  protected readonly showSkillFilters = signal(false);

  protected readonly operatorOptions: { label: string, value: Operator }[] = [
    { label: '>=', value: '>=' },
    { label: '<=', value: '<=' },
    { label: '>', value: '>' },
    { label: '<', value: '<' },
    { label: '=', value: '=' },
  ];

  readonly typeFilters = [
    { name: 'Strategy', values: [{ name: 'Any', value: 'nac' }, { name: 'Front Runner', value: 'run' }, { name: 'Pace Chaser', value: 'ldr' }, { name: 'Late Surger', value: 'btw' }, { name: 'End Closer', value: 'cha' }] },
    { name: 'Distance', values: [{ name: 'Sprint', value: 'sho' }, { name: 'Mile', value: 'mil' }, { name: 'Medium', value: 'med' }, { name: 'Long', value: 'lng' }] },
    { name: 'Surface', values: [{ name: 'Turf', value: 'tur' }, { name: 'Dirt', value: 'dir' }] },
    { name: 'Part of the Race', values: [{ name: 'Early Race', value: 'l_0' }, { name: 'Mid Race', value: 'l_1' }, { name: 'Late Race', value: 'l_2' }, { name: 'Last Spurt', value: 'l_3' }] },
    { name: 'Track Section', values: [{ name: 'Corner', value: 'cor' }, { name: 'Final Corner', value: 'f_c' }, { name: 'Straight', value: 'str' }, { name: 'Final Straight', value: 'f_s' }, { name: 'Slope', value: 'slo' }] },
    { name: 'Skill Type', values: [{ name: 'Debuff', value: 'dbf' }] }
  ];

  readonly allSkillNames = computed(() => {
    const skills = this.skillsResource.value() ?? [];
    return this.skillsService.getSkillNames(skills);
    // return [...new Set(skills.map(s => (s.name_en || s.enname).replace(/[×○◎]/g, '').trim()).filter(Boolean))].sort();
  });

  readonly filteredSkillOptions = computed(() => {
    const filterValue = (this.filters()?.skillName || '').toLowerCase();
    const names = this.allSkillNames();
    if (!filterValue) return names;
    return names.filter(name => matchesNameFilter(filterValue, name));
  });

  protected readonly skillsResource = rxResource({
    params: () => (this.showSkillFilters() ? true : undefined),
    stream: () => {
      return this.skillsService.getSkills().pipe(
        // delay(2000),   // delay for spinner tests
        map(skills => skills.sort((a, b) => a.iconid - b.iconid))
      );
    },
  });

  protected readonly filterForm = new FormGroup({
    name: new FormControl('', { nonNullable: true }),
    rarity: new FormControl<Rarity[]>([], { nonNullable: true }),
    type: new FormControl<SupportCardType[]>([], { nonNullable: true }),
    effectId: new FormControl<EffectId | ''>('', { nonNullable: true }),
    operator: new FormControl<Operator>('>=', { nonNullable: true }),
    value: new FormControl<number | null>(null),
    showUpcomingCards: new FormControl<boolean>(false, { nonNullable: true }),
    skillName: new FormControl('', { nonNullable: true }),
    skillDesc: new FormControl('', { nonNullable: true }),
    skillTypes: new FormControl<string[]>([], { nonNullable: true })
  });

  private readonly allSupportTypes = Object.values(SupportCardType) as SupportCardType[];
  private readonly allRarities = [Rarity.SSR, Rarity.SR, Rarity.R] as const;
  protected readonly rarityOptions = [...this.allRarities];

  // Adjusts the page index to 0 if the filtered data is less than or equal to the page size
  protected adjustedPageIndex = computed(() => {
    if (this.filteredData().length <= this.pageSize() && this.pageIndex() > 0) {
      return 0;
    }
    return this.pageIndex();
  });

  private readonly filters = toSignal(
    this.filterForm.valueChanges.pipe(
      debounceTime(300),
      tap(filterValue => {
        if (filterValue) {
          const completeFilter: SupportCardFilter = {
            name: filterValue.name || '',
            rarity: filterValue.rarity || [],
            type: filterValue.type || [],
            effectId: filterValue.effectId || '',
            operator: filterValue.operator || '>=',
            value: filterValue.value ?? null,
            showUpcomingCards: filterValue.showUpcomingCards ?? false,
            skillName: filterValue.skillName || '',
            skillDesc: filterValue.skillDesc || '',
            skillTypes: filterValue.skillTypes || [],
          };
          this.filterChanged.emit(completeFilter);
        }
      }),
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
    const allSkills = this.skillsResource.value() ?? [];
    const isSkillFilteringActive = this.showSkillFilters();

    const name = filters?.name || '';
    const rarities = filters?.rarity || [];
    const types = filters?.type || [];
    const effectId = filters?.effectId || '';
    const operator = filters?.operator || '>=';
    const value = filters?.value;
    const showUpcomingCards = filters?.showUpcomingCards ?? false;

    // Sub-filtering skills
    let matchedSkillIds: Set<number> | null = null;
    if (isSkillFilteringActive) {
      const sName = (filters?.skillName || '').toLowerCase();
      const sDesc = (filters?.skillDesc || '').toLowerCase();
      const sTypes = filters?.skillTypes || [];

      if (sName || sDesc || sTypes.length > 0) {
        const filteredSkills = allSkills.filter(skill => {
          const matchesName = matchesNameFilter(sName, skill.name_en ?? skill.enname);
          const matchesDesc = matchesNameFilter(sDesc, skill.desc_en ?? '');
          const matchesTypes = sTypes.length === 0 || sTypes.every(t => skill.type.includes(t));
          return matchesName && matchesDesc && matchesTypes;
        });
        matchedSkillIds = new Set(filteredSkills.map(s => s.id));
      }
    }

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

      let skillMatch = true;
      if (matchedSkillIds) {
        const cardSkills = [
          ...(card.event_skills ?? []),
          ...(card.hints?.hint_skills ?? [])
        ];
        skillMatch = cardSkills.some(id => matchedSkillIds!.has(id));
      }

      return nameMatch && rarityMatch && typeMatch && upcomingMatch && effectMatch && skillMatch;
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

  constructor() {
    effect(() => {
      if (this.isFirstTab()) {
        this.levelsChangedInFirstTab.emit(this.supportCardsWithLevels());
      }
    });

    effect(() => {
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
      const tabIndex = this.tabIndex();
      const tabState = this.dataGridStateService.getTabState(tabIndex);
      if (tabState.filter) {
        this.filterForm.patchValue(tabState.filter, { emitEvent: false });
      }
    });

    this.modalControlService.register('supportCardInfo', SupportCardInfo);
    this.modalControlService.register('skillInfo', SkillDialogComponent);
    this.modalControlService.register('traineeInfo', TraineeInfo);
  }

  protected onLevelChanged({ row, level }: { row: SupportCardEffectData; level: number }): void {
    this.levelChanges.update(m => {
      const newM = new Map<number, number>(m);
      newM.set(row.support_id, level);
      return newM;
    });
    this.levelChangedInTab.emit({ id: row.support_id, level });
  }

  protected resetFilters(): void {
    this.filterForm.reset();
  }

  protected clearNameFilter(): void {
    this.filterForm.get('name')?.setValue('');
  }

  protected clearSkillNameFilter(): void {
    this.filterForm.get('skillName')?.setValue('');
  }

  protected clearSkillDescFilter(): void {
    this.filterForm.get('skillDesc')?.setValue('');
  }

  protected openImageModal(cardData: SupportCardEffectData): void {
    const fullCardData = this.supportCardsWithLevels().find(card => card.support_id === cardData.support_id);
    if (fullCardData) {
      this.modalControlService.open('supportCardInfo', {
        data: { card: fullCardData },
        maxWidth: '90vw',
        maxHeight: '90vh',
      });
    }
  }

  protected openRatingsModal(): void {
    this.dialog.open(SupportCardRatings, {
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
    console.log('Adding card:', card);
    this.add.emit(card);
  }

  protected onRemove(card: SupportCardEffectData): void {
    this.remove.emit(card);
  }

  protected isFilterItemSelected(
    controlName: 'rarity' | 'type',
    item: Rarity | SupportCardType
  ): boolean {
    if (controlName === 'rarity') {
      return this.filterForm.get('rarity')?.value.includes(item as Rarity) ?? false;
    }

    return this.filterForm.get('type')?.value.includes(item as SupportCardType) ?? false;
  }

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

  onOptionSelected(event: MatAutocompleteSelectedEvent): void {
    const selectedValue = event.option.value;
    const currentInputValue = this.filters()?.skillName || '';

    const parts = currentInputValue.split(/[&+]/).map(p => p.trim());

    if (parts.length > 0) {
      parts[parts.length - 1] = selectedValue;
    } else {
      parts.push(selectedValue);
    }

    this.filterForm.get('skillName')?.setValue(parts.join('+'));
  }
}
