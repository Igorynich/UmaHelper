import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
  ViewChild,
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
  LockedEffectData, 
  UniqueEffectData 
} from './data-grid.types';


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

  levelChanged = output<{ row: T; level: number }>();
  imageClick = output<T>();
  setAllToMax = output();
  addClicked = output<T>();
  removeClicked = output<T>();

  protected readonly allColumnKeys = computed(() => this.columns().map((c) => c.key));
  protected readonly visibleColumns = signal<string[]>([]);
  protected readonly displayedColumns = computed(() => this.visibleColumns());
  protected readonly dataSource = new MatTableDataSource<T>([]);
  protected readonly activeSorts = signal<ActiveSort[]>([]);

  @ViewChild(MatSort) sort?: MatSort;
  @ViewChild(MatPaginator) paginator?: MatPaginator;

  constructor() {
    effect(() => {
      this.dataSource.data = this.data();
    });
    effect(() => {
      this.visibleColumns.set(this.allColumnKeys());
    });
    effect(() => {
      // Sync sort state with service when tab changes
      const tabIndex = this.tabIndex();
      const tabState = this.dataGridStateService.getTabState(tabIndex);
      this.activeSorts.set(tabState.sort);
    });
  }

  ngAfterViewInit(): void {
    if (this.multiSort() && this.sort) {
      this.dataSource.sort = this.sort;
      this.dataSource.sortData = (data, sort) => this.sortData(data, sort);
    } else {
      this.dataSource.sort = this.sort ?? null;
    }

    if (this.paginator) {
      this.dataSource.paginator = this.paginator;
    }

    // Initialize sort state from service
    this.initializeSortFromService();
  }

  private initializeSortFromService(): void {
    const tabIndex = this.tabIndex();
    if (this.sort) {
      const tabState = this.dataGridStateService.getTabState(tabIndex);
      if (tabState.sort && tabState.sort.length > 0) {
        // Use setTimeout to ensure MatSort is fully initialized
        setTimeout(() => {
          const primarySort = tabState.sort[0];
          if (primarySort && this.sort) {
            // Initialize MatSort with the saved state
            this.sort.active = primarySort.key;
            this.sort.direction = primarySort.direction;
            // Trigger the sort to update visual indicators
            this.sort.sortChange.emit({
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
    } else if (this.sort) {
      this.sort.active = sort.active;
      this.sort.direction = sort.direction;
      this.dataSource.sort = this.sort;
      
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
    if (this.sort?.active === key) {
      return this.sort.direction;
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

  protected isLockedEffectData(value: any): value is LockedEffectData {
    return typeof value === 'object' && value !== null && 'isLocked' in value;
  }

  protected isUniqueEffectData(value: any): value is UniqueEffectData {
    return typeof value === 'object' && value !== null && 'hasUnique' in value;
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
}


