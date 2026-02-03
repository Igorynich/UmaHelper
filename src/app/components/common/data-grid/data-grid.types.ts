import { SortDirection } from '@angular/material/sort';

export enum SortType {
  String = 'string',
  Number = 'number',
}

export interface DataGridColumn {
  key: string;
  header: string;
  tooltip?: string;
  width?: string;
  type?: string;
  sortType?: SortType;
  stickyEnd?: boolean;
}

export interface ActiveSort {
  key: string;
  direction: SortDirection;
}

export interface LockedEffectData {
  value: string;
  isLocked: boolean;
}

export interface UniqueEffectData {
  value: number;
  tooltip: string;
  hasUnique: boolean;
}

export interface CheckboxSelection {
  [key: string]: boolean;
}
