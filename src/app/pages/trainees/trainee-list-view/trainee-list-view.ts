// src/app/pages/trainees/trainee-list-view/trainee-list-view.ts
import {
  ChangeDetectionStrategy, Component, computed, DestroyRef,
  effect, inject, input, output
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, tap } from 'rxjs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatMenu } from '@angular/material/menu';
import { DataGrid } from '../../../components/common/data-grid/data-grid';
import { DataGridColumn, SortType } from '../../../components/common/data-grid/data-grid.types';
import { DataGridStateService } from '../../../services/data-grid-state.service';
import { DisplayTrainee } from '../../../interfaces/display-trainee';
import { TraineeRarity } from '../../../interfaces/trainee-rarity.enum';
import { TrainingType } from '../../../interfaces/training-type.enum';
import {
  AptitudeGrade, APTITUDE_GRADE_ORDER,
  DistanceAptitude, StrategyAptitude, SurfaceAptitude
} from '../../../interfaces/aptitude.enum';
import { TraineeAptitudeFilter, TraineeFilter, TraineeStatBonusFilter, FilterOperator } from '../../../interfaces/user-trainees-data';
import { matchesNameFilter } from '../../../utils/name-filter.utils';
import {TitleCasePipe} from '@angular/common';

type AptitudeStat = SurfaceAptitude | DistanceAptitude | StrategyAptitude;

export interface TraineeRow {
  traineeId: number;
  name: string;
  imageUrl: string;
  rarity: number;
  skills_unique: number[];
  speed: number;
  stamina: number;
  power: number;
  guts: number;
  wits: number;
  turf: string;
  dirt: string;
  sprint: string;
  mile: string;
  medium: string;
  long: string;
  front: string;
  pace: string;
  late: string;
  end: string;
  release_en?: string;
}

@Component({
  selector: 'app-trainee-list-view',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DataGrid,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatCheckboxModule,
    MatIconModule,
    TitleCasePipe,
  ],
  templateUrl: './trainee-list-view.html',
  styleUrl: './trainee-list-view.css'
})
export class TraineeListViewComponent {
  private destroyRef = inject(DestroyRef);
  private dataGridStateService = inject(DataGridStateService);

  trainees = input<DisplayTrainee[]>([]);
  isFirstTab = input<boolean>(false);
  addMenu = input<MatMenu>();
  tabIndex = input<number>(-1);
  isActive = input<boolean>(false);

  add = output<DisplayTrainee>();
  remove = output<DisplayTrainee>();
  filterChanged = output<TraineeFilter>();

  protected readonly TraineeRarity = TraineeRarity;
  protected readonly TrainingType = TrainingType;
  protected readonly SurfaceAptitude = SurfaceAptitude;
  protected readonly DistanceAptitude = DistanceAptitude;
  protected readonly StrategyAptitude = StrategyAptitude;
  protected readonly AptitudeGrade = AptitudeGrade;

  protected readonly rarityOptions = [
    // TraineeRarity.FiveStar,
    // TraineeRarity.FourStar,
    TraineeRarity.ThreeStar,
    TraineeRarity.TwoStar,
    TraineeRarity.OneStar,
  ];

  protected readonly trainingTypeOptions = Object.values(TrainingType);

  protected readonly aptitudeGroups: { label: string; options: { label: string; value: AptitudeStat }[] }[] = [
    {
      label: 'Surface',
      options: [
        { label: 'Turf', value: SurfaceAptitude.Turf },
        { label: 'Dirt', value: SurfaceAptitude.Dirt },
      ]
    },
    {
      label: 'Distance',
      options: [
        { label: 'Sprint', value: DistanceAptitude.Sprint },
        { label: 'Mile', value: DistanceAptitude.Mile },
        { label: 'Medium', value: DistanceAptitude.Medium },
        { label: 'Long', value: DistanceAptitude.Long },
      ]
    },
    {
      label: 'Strategy',
      options: [
        { label: 'Front', value: StrategyAptitude.Front },
        { label: 'Pace', value: StrategyAptitude.Pace },
        { label: 'Late', value: StrategyAptitude.Late },
        { label: 'End', value: StrategyAptitude.End },
      ]
    },
  ];

  protected readonly gradeOptions = [...APTITUDE_GRADE_ORDER].reverse(); // A first

  protected readonly operatorOptions: { label: string; value: FilterOperator }[] = [
    { label: '>=', value: '>=' },
    { label: '<=', value: '<=' },
    { label: '>', value: '>' },
    { label: '<', value: '<' },
    { label: '=', value: '=' },
  ];

  protected readonly filterForm = new FormGroup({
    name: new FormControl('', { nonNullable: true }),
    rarity: new FormControl<TraineeRarity[]>([], { nonNullable: true }),
    statBonusStat: new FormControl<TrainingType | ''>('', { nonNullable: true }),
    statBonusOperator: new FormControl<FilterOperator>('>=', { nonNullable: true }),
    statBonusValue: new FormControl<number | null>(null),
    aptitudeStat: new FormControl<AptitudeStat | ''>('', { nonNullable: true }),
    aptitudeOperator: new FormControl<FilterOperator>('>=', { nonNullable: true }),
    aptitudeValue: new FormControl<AptitudeGrade | ''>('', { nonNullable: true }),
    uniqName: new FormControl('', { nonNullable: true }),
  });

  constructor() {
    effect(() => {
      const tabIndex = this.tabIndex();
      const tabState = this.dataGridStateService.getTabState(tabIndex);
      if (tabState.filter) {
        const f = tabState.filter as unknown as TraineeFilter;
        this.filterForm.patchValue({
          name: f.name || '',
          rarity: f.rarity || [],
          statBonusStat: f.statBonus?.stat || '',
          statBonusOperator: f.statBonus?.operator || '>=',
          statBonusValue: f.statBonus?.value ?? null,
          aptitudeStat: f.aptitude?.stat || '',
          aptitudeOperator: f.aptitude?.operator || '>=',
          aptitudeValue: f.aptitude?.value || '',
          uniqName: f.uniqName || '',
        }, { emitEvent: false });
      }
    });
  }

  private readonly filters = toSignal(
    this.filterForm.valueChanges.pipe(
      debounceTime(300),
      tap(v => {
        const f: TraineeFilter = {
          name: v.name || '',
          rarity: v.rarity || [],
          statBonus: {
            stat: v.statBonusStat || '',
            operator: v.statBonusOperator || '>=',
            value: v.statBonusValue ?? null,
          },
          aptitude: {
            stat: v.aptitudeStat || '',
            operator: v.aptitudeOperator || '>=',
            value: v.aptitudeValue || '',
          },
          uniqName: v.uniqName || '',
        };
        this.filterChanged.emit(f);
      }),
      takeUntilDestroyed(this.destroyRef)
    )
  );

  protected readonly processedRows = computed((): TraineeRow[] =>
    this.trainees().map(t => ({
      traineeId: t.traineeId,
      name: t.itemData.name_en,
      imageUrl: t.imageUrl,
      rarity: t.itemData.rarity,
      skills_unique: t.itemData.skills_unique,
      speed: t.itemData.stat_bonus[0] ?? 0,
      stamina: t.itemData.stat_bonus[1] ?? 0,
      power: t.itemData.stat_bonus[2] ?? 0,
      guts: t.itemData.stat_bonus[3] ?? 0,
      wits: t.itemData.stat_bonus[4] ?? 0,
      turf: t.itemData.aptitude[0] ?? '-',
      dirt: t.itemData.aptitude[1] ?? '-',
      sprint: t.itemData.aptitude[2] ?? '-',
      mile: t.itemData.aptitude[3] ?? '-',
      medium: t.itemData.aptitude[4] ?? '-',
      long: t.itemData.aptitude[5] ?? '-',
      front: t.itemData.aptitude[6] ?? '-',
      pace: t.itemData.aptitude[7] ?? '-',
      late: t.itemData.aptitude[8] ?? '-',
      end: t.itemData.aptitude[9] ?? '-',
      release_en: t.itemData.release_en,
      title: t.itemData.title_en_gl,
      version: t.itemData.version,
    }))
  );

  protected readonly filteredRows = computed((): TraineeRow[] => {
    const rows = this.processedRows();
    const v = this.filters();

    const name = v?.name || '';
    const rarities = v?.rarity || [];
    const statStat = v?.statBonusStat || '';
    const statOp = v?.statBonusOperator || '>=';
    const statVal = v?.statBonusValue ?? null;
    const aptStat = v?.aptitudeStat || '';
    const aptOp = v?.aptitudeOperator || '>=';
    const aptVal = v?.aptitudeValue || '';
    const uniqName = v?.uniqName || '';

    return rows.filter(row => {
      if (name && !matchesNameFilter(name, row.name)) return false;
      if (rarities.length && !rarities.includes(row.rarity as TraineeRarity)) return false;
      if (uniqName) {
        // uniqName filter: will be implemented when skill name lookup is available
        // For now, we skip this filter client-side
      }
      if (statStat && statVal != null) {
        const val = (row as any)[statStat] as number;
        if (!this.compareNumbers(val, statOp, statVal)) return false;
      }
      if (aptStat && aptVal) {
        const grade = (row as any)[aptStat] as string;
        const gradeNum = APTITUDE_GRADE_ORDER.indexOf(grade as AptitudeGrade);
        const filterNum = APTITUDE_GRADE_ORDER.indexOf(aptVal as AptitudeGrade);
        if (!this.compareNumbers(gradeNum, aptOp, filterNum)) return false;
      }
      return true;
    });
  });

  protected readonly columns = computed((): DataGridColumn[] => [
    { key: 'select', header: '', width: '50px', type: 'checkbox' },
    { key: 'name', header: 'Trainee', width: '160px', type: 'traineeImage', sortType: SortType.String },
    { key: 'rarity', header: 'Rarity', width: '50px', type: 'traineeRarity', sortType: SortType.Number },
    { key: 'skills_unique', header: 'Uniq', width: '120px', type: 'traineeUniq' },
    { key: 'speed', header: 'Spd', tooltip: 'Speed Bonus', width: '50px', type: 'statBonus', sortType: SortType.Number, group: 'Stat Bonuses' },
    { key: 'stamina', header: 'Stm', tooltip: 'Stamina Bonus', width: '50px', type: 'statBonus', sortType: SortType.Number, group: 'Stat Bonuses' },
    { key: 'power', header: 'Pwr', tooltip: 'Power Bonus', width: '50px', type: 'statBonus', sortType: SortType.Number, group: 'Stat Bonuses' },
    { key: 'guts', header: 'Gts', tooltip: 'Guts Bonus', width: '50px', type: 'statBonus', sortType: SortType.Number, group: 'Stat Bonuses' },
    { key: 'wits', header: 'Wts', tooltip: 'Wits Bonus', width: '50px', type: 'statBonus', sortType: SortType.Number, group: 'Stat Bonuses' },
    { key: 'turf', header: 'Turf', tooltip: 'Surface: Turf', width: '44px', type: 'aptitude', sortType: SortType.String, group: 'Surface' },
    { key: 'dirt', header: 'Dirt', tooltip: 'Surface: Dirt', width: '44px', type: 'aptitude', sortType: SortType.String, group: 'Surface' },
    { key: 'sprint', header: 'Spr', tooltip: 'Distance: Sprint', width: '44px', type: 'aptitude', sortType: SortType.String, group: 'Distance' },
    { key: 'mile', header: 'Mile', tooltip: 'Distance: Mile', width: '44px', type: 'aptitude', sortType: SortType.String, group: 'Distance' },
    { key: 'medium', header: 'Med', tooltip: 'Distance: Medium', width: '44px', type: 'aptitude', sortType: SortType.String, group: 'Distance' },
    { key: 'long', header: 'Long', tooltip: 'Distance: Long', width: '44px', type: 'aptitude', sortType: SortType.String, group: 'Distance' },
    { key: 'front', header: 'Frt', tooltip: 'Strategy: Front', width: '44px', type: 'aptitude', sortType: SortType.String, group: 'Strategy' },
    { key: 'pace', header: 'Pace', tooltip: 'Strategy: Pace', width: '44px', type: 'aptitude', sortType: SortType.String, group: 'Strategy' },
    { key: 'late', header: 'Late', tooltip: 'Strategy: Late', width: '44px', type: 'aptitude', sortType: SortType.String, group: 'Strategy'},
    { key: 'end', header: 'End', tooltip: 'Strategy: End', width: '44px', type: 'aptitude', sortType: SortType.String, group: 'Strategy' },
    { key: 'actions', header: 'Actions', width: '70px', type: 'actions', stickyEnd: true },
  ]);

  private compareNumbers(a: number, op: FilterOperator, b: number): boolean {
    switch (op) {
      case '>=': return a >= b;
      case '<=': return a <= b;
      case '>': return a > b;
      case '<': return a < b;
      case '=': return a === b;
    }
  }

  protected toggleRarity(r: TraineeRarity): void {
    const ctrl = this.filterForm.get('rarity')!;
    const cur = ctrl.value;
    ctrl.setValue(cur.includes(r) ? cur.filter(x => x !== r) : [...cur, r]);
  }

  protected isRaritySelected(r: TraineeRarity): boolean {
    return this.filterForm.get('rarity')!.value.includes(r);
  }

  protected resetFilters(): void {
    this.filterForm.reset({
      name: '',
      rarity: [],
      statBonusStat: '',
      statBonusOperator: '>=',
      statBonusValue: null,
      aptitudeStat: '',
      aptitudeOperator: '>=',
      aptitudeValue: '',
      uniqName: '',
    });
  }

  protected clearNameFilter(): void {
    this.filterForm.get('name')?.setValue('');
  }

  protected clearUniqFilter(): void {
    this.filterForm.get('uniqName')?.setValue('');
  }

  protected onAdd(row: TraineeRow): void {
    const t = this.trainees().find(x => x.traineeId === row.traineeId);
    if (t) this.add.emit(t);
  }

  protected onRemove(row: TraineeRow): void {
    const t = this.trainees().find(x => x.traineeId === row.traineeId);
    if (t) this.remove.emit(t);
  }
}
