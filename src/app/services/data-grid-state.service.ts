import {Injectable} from '@angular/core';
import { ActiveSort, CheckboxSelection } from '../components/common/data-grid/data-grid.types';
import { SupportCardFilter } from '../interfaces/user-support-cards-data';

export interface TabState {
  filter?: SupportCardFilter;
  sort: ActiveSort[];
  selection?: CheckboxSelection;
}

@Injectable({
  providedIn: 'root'
})
export class DataGridStateService {
  // Per-tab state management
  private tabStates: Map<number, TabState> = new Map();
  private readonly DEFAULT_STATE: TabState = { sort: [] };

  // Get state for specific tab
  getTabState(tabIndex: number): TabState {
    return this.tabStates.get(tabIndex) || this.DEFAULT_STATE;
  }

  // Update filter for specific tab
  updateTabFilter(tabIndex: number, filter: SupportCardFilter): void {
    const currentState = this.tabStates.get(tabIndex) || this.DEFAULT_STATE;
    this.tabStates.set(tabIndex, { ...currentState, filter });
    // console.log(`tabStates after FILTER tab ${tabIndex} update`, new Map(this.tabStates));
  }

  // Update sort for specific tab
  updateTabSort(tabIndex: number, sort: ActiveSort[]): void {
    const currentState = this.tabStates.get(tabIndex) || this.DEFAULT_STATE;
    this.tabStates.set(tabIndex, { ...currentState, sort });
    // console.log(`tabStates after SORT tab ${tabIndex} update`, new Map(this.tabStates));
  }

  // Update selection for specific tab
  updateTabSelection(tabIndex: number, selection: CheckboxSelection): void {
    const currentState = this.tabStates.get(tabIndex) || this.DEFAULT_STATE;
    this.tabStates.set(tabIndex, { ...currentState, selection });
    // console.log(`tabStates after SELECTION tab ${tabIndex} update`, new Map(this.tabStates));
  }

  // Get selection for specific tab
  getTabSelection(tabIndex: number): CheckboxSelection {
    return this.tabStates.get(tabIndex)?.selection || {};
  }

  // Clear selection for specific tab
  clearTabSelection(tabIndex: number): void {
    const currentState = this.tabStates.get(tabIndex) || this.DEFAULT_STATE;
    this.tabStates.set(tabIndex, { ...currentState, selection: {} });
    // console.log(`tabStates after CLEAR SELECTION tab ${tabIndex}`, new Map(this.tabStates));
  }

  // Get selected count for specific tab
  getTabSelectedCount(tabIndex: number): number {
    const selection = this.getTabSelection(tabIndex);
    return Object.values(selection).filter(selected => selected).length;
  }


  // Check if tab has any selections
  hasTabSelections(tabIndex: number): boolean {
    return this.getTabSelectedCount(tabIndex) > 0;
  }

  // Load all tab states (for persistence)
  loadTabStates(states: Map<number, TabState>): void {
    this.tabStates = new Map(states);
    // console.log('tabStates after LOAD', new Map(this.tabStates));
  }

  // Get all tab states (for persistence)
  getAllTabStates(): Map<number, TabState> {
    return this.tabStates;
  }

  removeTabState(tabIndex: number): void {
    this.tabStates.delete(tabIndex);
    this.tabStates.forEach((tabState, key) => {
      if (key > tabIndex) {
        this.tabStates.set(key - 1, tabState);
        this.tabStates.delete(key);
      }
    });
    // console.log(`tabStates after REMOVE tab ${tabIndex}`, new Map(this.tabStates));
  }
}
