import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  output, Signal,
  signal,
  viewChild,
} from '@angular/core';
import { coerceBooleanProperty } from '@angular/cdk/coercion';
import { MatSort, MatSortModule, Sort, SortDirection } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatCheckboxModule } from '@angular/material/checkbox';
import {MatMenu, MatMenuModule} from '@angular/material/menu';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Level } from '../level/level';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { RarityClassPipe } from '../../../pipes/rarity-class.pipe';
import { RarityPipe } from '../../../pipes/rarity.pipe';
import { DataGridStateService } from '../../../services/data-grid-state.service';
import {
  SortType,
  DataGridColumn,
  ActiveSort,
  CheckboxSelection
} from './data-grid.types';
import {EffectValuePipe} from '../../../pipes/effect-value.pipe';
import { SkillDisplay } from '../skill-display/skill-display';
import { RarityStarsPipe } from '../../../pipes/rarity-stars.pipe';
import {ImagekitioAngularModule} from 'imagekitio-angular';
import {SnakeToTitlePipe} from '../../../pipes/snake-to-title.pipe';



@Component({
  selector: 'app-data-grid',
  standalone: true,
  imports: [
    MatTableModule,
    MatSortModule,
    MatCheckboxModule,
    MatMenuModule,
    FormsModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    Level,
    MatPaginatorModule,
    RarityPipe,
    RarityClassPipe,
    EffectValuePipe,
    SkillDisplay,
    ImagekitioAngularModule,
    SnakeToTitlePipe
  ],
  templateUrl: './data-grid.html',
  styleUrl: './data-grid.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DataGrid<T> implements AfterViewInit {
  private dataGridStateService = inject(DataGridStateService);

  data = input<T[]>([]);
  columns = input<DataGridColumn[]>([]);
  multiSort = input(false, { transform: coerceBooleanProperty });
  rarityLevelMap = input<any>();
  pageSize = input<number>();
  isFirstTab = input<boolean>(false);
  addMenu = input<MatMenu>();
  tabIndex = input<number>(-1); // Used to identify which tab this grid belongs to
  isActive = input<boolean>(false); // Whether this tab is currently active
  showColumnSelector = input(true);

  levelChanged = output<{ row: T; level: number }>();
  imageClick = output<T>();
  setAllToMax = output();
  addClicked = output<T>();
  removeClicked = output<T>();

  protected readonly allColumnKeys = computed(() => this.columns().map((c) => c.key));
  protected readonly visibleColumns = signal<string[]>([]);
  protected readonly displayedColumns = computed(() => this.visibleColumns());
  readonly columnGroups = computed(() => {
    const rawGroups = this.columns().reduce((acc, col) => {
      const name = col.group;
      if (!name) return acc;

      const colWidth = parseInt(col.width || '0') || 0;
      const last = acc[acc.length - 1];

      if (last?.name === name) {
        last.colspan++;
        last.totalWidth += colWidth;
      } else {
        acc.push({ name, colspan: 1, totalWidth: colWidth });
      }
      return acc;
    }, [] as { name: string; colspan: number; totalWidth: number }[]);

    return rawGroups.map(g => ({
      name: g.name,
      colspan: g.colspan,
      width: g.totalWidth ? `${g.totalWidth}px` : 'auto'
    }));
  });

  readonly notGroupedColumns: Signal<string[]> = computed(() => {
    return [...new Set(this.columns().map(col => col.group || col.key))];
  });

  readonly groupedColumns: Signal<string[]> = computed(() => {
    return this.columns().filter((c) => c.group).map((c) => c.key);
  });
  protected readonly dataSource = new MatTableDataSource<T>([]);
  protected readonly activeSorts = signal<ActiveSort[]>([]);
  protected readonly selection = signal<CheckboxSelection>({});
  protected readonly isAllSelected = computed(() => {
    const numSelected = Object.values(this.selection()).filter(selected => selected).length;
    const numRows = this.data().length;
    return numRows > 0 && numSelected === numRows;
  });
  protected readonly isSomeSelected = computed(() => {
    const numSelected = Object.values(this.selection()).filter(selected => selected).length;
    return numSelected > 0 && numSelected < this.data().length;
  });

  sort = viewChild(MatSort);
  paginator = viewChild(MatPaginator);

  private readonly currentTabIndex = signal<number>(-1);

  constructor() {
    // Initialize selection state from service immediately
    const initialTabIndex = this.tabIndex();
    const initialTabState = this.dataGridStateService.getTabState(initialTabIndex);
    this.selection.set(initialTabState.selection || {});
    this.currentTabIndex.set(initialTabIndex);

    effect(() => {
      this.dataSource.data = this.data();
      // Clean up selection for cards that no longer exist
      this.cleanupSelection();
    });
    effect(() => {
      this.visibleColumns.set(this.allColumnKeys());
    });

    // Effect for tab changes - load selection when grid becomes active
    effect(() => {
      if (this.isActive()) {
        // Load selection from service when this grid becomes active
        const tabState = this.dataGridStateService.getTabState(this.tabIndex());
        this.selection.set(tabState.selection || {});
        this.activeSorts.set(tabState.sort);
        this.currentTabIndex.set(this.tabIndex());
      }
    });

    // Effect for selection changes - only save to service
    effect(() => {
      const selection = this.selection();
      const tabIndex = this.tabIndex();

      // Only save if we're on the correct tab
      if (this.currentTabIndex() === tabIndex) {
        this.dataGridStateService.updateTabSelection(tabIndex, selection);
      }
    });
  }

  ngAfterViewInit(): void {
    const sortRef = this.sort();
    const paginatorRef = this.paginator();

    if (this.multiSort() && sortRef) {
      this.dataSource.sort = sortRef;
      this.dataSource.sortData = (data, sort) => this.sortData(data, sort);
    } else {
      this.dataSource.sort = sortRef ?? null;
    }

    if (paginatorRef) {
      this.dataSource.paginator = paginatorRef;
    }

    // Initialize sort state from service
    this.initializeSortFromService();
  }

  private initializeSortFromService(): void {
    const tabIndex = this.tabIndex();
    const sortRef = this.sort();
    if (sortRef) {
      const tabState = this.dataGridStateService.getTabState(tabIndex);
      if (tabState.sort && tabState.sort.length > 0) {
        // Use setTimeout to ensure MatSort is fully initialized
        setTimeout(() => {
          const primarySort = tabState.sort[0];
          const currentSortRef = this.sort();
          if (primarySort && currentSortRef) {
            // Initialize MatSort with the saved state
            currentSortRef.active = primarySort.key;
            currentSortRef.direction = primarySort.direction;
            // Trigger the sort to update visual indicators
            currentSortRef.sortChange.emit({
              active: primarySort.key,
              direction: primarySort.direction
            });
          }
        });
      }
    }
  }

  protected handleSort(sort: Sort): void {
    const tabIndex = this.tabIndex();
    const sortRef = this.sort();

    if (this.multiSort()) {
      const newSort: ActiveSort = { key: sort.active, direction: sort.direction };
      this.activeSorts.update(sorts => {
        const index = sorts.findIndex(s => s.key === newSort.key);
        if (newSort.direction === '') {
          if (index > -1) {
            sorts.splice(index, 1);
          }
        } else {
          if (index > -1) {
            sorts[index] = newSort;
          }
          else {
            sorts.push(newSort);
          }
        }
        const updatedSorts = [...sorts];
        // Update service instead of emitting
        this.dataGridStateService.updateTabSort(tabIndex, updatedSorts);
        return updatedSorts;
      });
      this.dataSource._updateChangeSubscription();
    } else if (sortRef) {
      sortRef.active = sort.active;
      sortRef.direction = sort.direction;
      this.dataSource.sort = sortRef;

      const singleSort: ActiveSort[] = sort.direction ? [{ key: sort.active, direction: sort.direction }] : [];
      // Update service instead of emitting
      this.dataGridStateService.updateTabSort(tabIndex, singleSort);
    }
  }

  protected getSortDirection(key: string): SortDirection {
    if (this.multiSort()) {
      const sort = this.activeSorts().find(s => s.key === key);
      return sort ? sort.direction : '';
    }
    const sortRef = this.sort();
    if (sortRef?.active === key) {
      return sortRef.direction;
    }
    return '';
  }

  protected toggleColumn(key: string): void {
    this.visibleColumns.update(cols => {
      const index = cols.indexOf(key);
      if (index > -1) {
        cols.splice(index, 1);
      }
      else {
        cols.push(key);
      }
      return [...cols];
    });
  }

  protected isColumnVisible(key: string): boolean {
    return this.visibleColumns().includes(key);
  }

  protected onLevelChanged(row: T, level: number): void {
    this.levelChanged.emit({ row, level });
  }

  protected onImageClick(row: T): void {
    this.imageClick.emit(row);
  }

  protected onSetAllToMax(event: Event): void {
    event.stopPropagation();
    this.setAllToMax.emit();
  }

  protected onActionClick(action: string, row: T): void {
    if (action === 'add') {
      this.addClicked.emit(row);
    } else if (action === 'remove') {
      this.removeClicked.emit(row);
    }
  }

  protected removeSort(key: string): void {
    const tabIndex = this.tabIndex();

    this.activeSorts.update(sorts => {
      const index = sorts.findIndex(s => s.key === key);
      if (index > -1) {
        sorts.splice(index, 1);
      }
      const updatedSorts = [...sorts];
      // Update service instead of emitting
      this.dataGridStateService.updateTabSort(tabIndex, updatedSorts);
      return updatedSorts;
    });
    this.dataSource._updateChangeSubscription();
  }

  protected clearSorts(): void {
    const tabIndex = this.tabIndex();

    this.activeSorts.set([]);
    // Update service instead of emitting
    this.dataGridStateService.updateTabSort(tabIndex, []);
    this.dataSource._updateChangeSubscription();
  }

  protected getColumnHeader(key: string): string {
    const column = this.columns().find(c => c.key === key);
    return column ? column.header : '';
  }

  private getSortableValue(value: any): any {
    if (value && typeof value === 'object' && 'value' in value) {
      const parsedValue = parseFloat(value.value);
      return isNaN(parsedValue) ? value.value : parsedValue;
    }
    return value;
  }

  private compare(a: any, b: any, sortType: SortType): number {
    if (sortType === SortType.Number) {
      return (a || 0) - (b || 0);
    }
    if (sortType === SortType.String) {
      return (a || '').localeCompare(b || '');
    }
    return (a < b ? -1 : (a > b ? 1 : 0));
  }


  private sortData(data: T[], sort: MatSort): T[] {
    const activeSorts = this.activeSorts();
    if (!activeSorts.length) {
      return data;
    }

    return data.slice().sort((a, b) => {
      for (const activeSort of activeSorts) {
        const column = this.columns().find(c => c.key === activeSort.key);
        const sortType = column?.sortType || SortType.String;

        const valueA = this.getSortableValue((a as any)[activeSort.key]);
        const valueB = this.getSortableValue((b as any)[activeSort.key]);

        const comparison = this.compare(valueA, valueB, sortType);
        if (comparison !== 0) {
          return activeSort.direction === 'asc' ? comparison : -comparison;
        }
      }
      return 0;
    });
  }

  protected masterToggle(): void {
    const isAllSelected = this.isAllSelected();
    const newSelection: CheckboxSelection = {};

    this.data().forEach(row => {
      const rowId = this.getRowId(row);
      newSelection[rowId] = !isAllSelected;
    });

    this.selection.set(newSelection);
  }

  protected toggleRow(row: T): void {
    const rowId = this.getRowId(row);
    const currentSelection = this.selection();
    const isSelected = currentSelection[rowId] || false;

    this.selection.update(selection => ({
      ...selection,
      [rowId]: !isSelected
    }));
  }

  protected isRowSelected(row: T): boolean {
    const rowId = this.getRowId(row);
    return this.selection()[rowId] || false;
  }

  private getRowId(row: T): string {
    // Try to get support_id or traineeId first, fallback to a generic approach
    return (row as any).support_id?.toString()
      ?? (row as any).traineeId?.toString()
      ?? JSON.stringify(row);
  }

  private cleanupSelection(): void {
    const currentSelection = this.selection();
    const currentDataIds = new Set(this.data().map(row => this.getRowId(row)));

    const cleanedSelection: CheckboxSelection = {};
    for (const [id, selected] of Object.entries(currentSelection)) {
      if (currentDataIds.has(id)) {
        cleanedSelection[id] = selected;
      }
    }

    // Only update if something changed
    if (Object.keys(cleanedSelection).length !== Object.keys(currentSelection).length) {
      // console.log('Cleanup', this.tabIndex(), cleanedSelection);
      this.selection.set(cleanedSelection);
    }
  }

  getSelectedRows(): T[] {
    const selectedIds = Object.entries(this.selection())
      .filter(([, selected]) => selected)
      .map(([id]) => id);

    return this.data().filter(row => {
      const rowId = this.getRowId(row);
      return selectedIds.includes(rowId);
    });
  }

  protected starsArray(rarity: number): number[] {
    return Array.from({ length: rarity });
  }

  protected readonly parseInt = parseInt;
}


