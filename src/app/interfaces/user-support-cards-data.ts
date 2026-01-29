import { SupportCardType } from './support-card-type.enum';
import { ActiveSort } from '../components/common/data-grid/data-grid.types';

export interface SupportCardFilter {
  name: string;
  rarity: number[];
  type: SupportCardType[];
  effectId: number | '';
  operator: '>=' | '<=' | '>' | '<' | '=';
  value: number | null;
}

export interface SupportCardTab {
  name: string;
  cards: { id: number; level: number }[];
  filter?: SupportCardFilter;
  sort?: ActiveSort[];
}

export interface UserSupportCardsData {
  tabs: SupportCardTab[];
  selectedTabIndex: number;
  lastUpdated: Date;
}
