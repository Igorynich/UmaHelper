import {Injectable} from '@angular/core';
import { ActiveSort, CheckboxSelection } from '../components/common/data-grid/data-grid.types';
import { SupportCardFilter } from '../interfaces/user-support-cards-data';

export interface TabState {
  filter?: SupportCardFilter;
  sort?: ActiveSort[];
  page?: number;
  pageSize?: number;
  selection?: CheckboxSelection;
}

@Injectable({
  providedIn: 'root'
})
export class DataGridStateService {
  private tabStates = new Map<number, TabState>();
  private readonly DEFAULT_STATE: TabState = { sort: [] };

  getTabState(tabIndex: number): TabState {
    return this.tabStates.get(tabIndex) || this.DEFAULT_STATE;
  }

  updateTabFilter(tabIndex: number, filter: SupportCardFilter): void {
    const currentState = this.tabStates.get(tabIndex) || this.DEFAULT_STATE;
    this.tabStates.set(tabIndex, { ...currentState, filter });
  }

  updateTabSort(tabIndex: number, sort: ActiveSort[]): void {
    const currentState = this.tabStates.get(tabIndex) || this.DEFAULT_STATE;
    this.tabStates.set(tabIndex, { ...currentState, sort });
  }

  updateTabPageData(tabIndex: number, page?: number, pageSize?: number): void {
    const currentState = this.tabStates.get(tabIndex) || this.DEFAULT_STATE;
    this.tabStates.set(tabIndex, { ...currentState, page, pageSize });
  }

  updateTabSelection(tabIndex: number, selection: CheckboxSelection): void {
    const currentState = this.tabStates.get(tabIndex) || this.DEFAULT_STATE;
    this.tabStates.set(tabIndex, { ...currentState, selection });
  }

  getTabData(tabIndex: number): TabState {
    return this.tabStates.get(tabIndex) || this.DEFAULT_STATE;
  }

  getTabSelection(tabIndex: number): CheckboxSelection {
    return this.tabStates.get(tabIndex)?.selection || {};
  }

  clearTabSelection(tabIndex: number): void {
    const currentState = this.tabStates.get(tabIndex) || this.DEFAULT_STATE;
    this.tabStates.set(tabIndex, { ...currentState, selection: {} });
  }

  getTabSelectedCount(tabIndex: number): number {
    const selection = this.getTabSelection(tabIndex);
    return Object.values(selection).filter(selected => selected).length;
  }

  hasTabSelections(tabIndex: number): boolean {
    return this.getTabSelectedCount(tabIndex) > 0;
  }

  loadTabStates(states: Map<number, TabState>): void {
    this.tabStates = new Map(states);
  }

  getAllTabStates(): Map<number, TabState> {
    return this.tabStates;
  }

  removeTabState(tabIndex: number): void {
    this.tabStates.delete(tabIndex);
    const newStates = new Map<number, TabState>();
    this.tabStates.forEach((tabState, key) => {
      if (key > tabIndex) {
        newStates.set(key - 1, tabState);
      } else {
        newStates.set(key, tabState);
      }
    });
    this.tabStates = newStates;
  }
}
