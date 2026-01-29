import { Injectable, signal } from '@angular/core';
import { ActiveSort } from '../components/common/data-grid/data-grid.types';
import { SupportCardFilter } from '../interfaces/user-support-cards-data';

export interface TabState {
  filter?: SupportCardFilter;
  sort: ActiveSort[];
}

@Injectable({
  providedIn: 'root'
})
export class DataGridStateService {
  // Per-tab state management
  private readonly tabStates = signal<Map<number, TabState>>(new Map());
  
  // Current active tab
  private readonly activeTab = signal<number>(-1);

  // Get state for specific tab
  getTabState(tabIndex: number): TabState {
    return this.tabStates().get(tabIndex) || { sort: [] };
  }

  // Update filter for specific tab
  updateTabFilter(tabIndex: number, filter: SupportCardFilter): void {
    this.tabStates.update(states => {
      const newStates = new Map(states);
      const currentState = newStates.get(tabIndex) || { sort: [] };
      newStates.set(tabIndex, { ...currentState, filter });
      return newStates;
    });
  }

  // Update sort for specific tab
  updateTabSort(tabIndex: number, sort: ActiveSort[]): void {
    this.tabStates.update(states => {
      const newStates = new Map(states);
      const currentState = newStates.get(tabIndex) || { sort: [] };
      newStates.set(tabIndex, { ...currentState, sort });
      return newStates;
    });
  }

  // Get current active tab
  getActiveTab(): number {
    return this.activeTab();
  }

  // Set active tab
  setActiveTab(tabIndex: number): void {
    this.activeTab.set(tabIndex);
  }

  // Get state for current active tab
  getCurrentTabState(): TabState {
    return this.getTabState(this.activeTab());
  }

  // Load all tab states (for persistence)
  loadTabStates(states: Map<number, TabState>): void {
    this.tabStates.set(states);
  }

  // Get all tab states (for persistence)
  getAllTabStates(): Map<number, TabState> {
    return this.tabStates();
  }

  // Clear state for specific tab
  clearTabState(tabIndex: number): void {
    this.tabStates.update(states => {
      const newStates = new Map(states);
      newStates.delete(tabIndex);
      return newStates;
    });
  }

  // Clear all states
  clearAllStates(): void {
    this.tabStates.set(new Map());
  }
}
