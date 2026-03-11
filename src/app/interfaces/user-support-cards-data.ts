import { SupportCardType } from './support-card-type.enum';
import { ActiveSort } from '../components/common/data-grid/data-grid.types';

export interface SupportCardFilter {
  name: string;
  rarity: number[];
  type: SupportCardType[];
  effectId: number | '';
  operator: '>=' | '<=' | '>' | '<' | '=';
  value: number | null;
  showUpcomingCards: boolean;
}

export interface SupportCardTab {
  name: string;
  cards: { id: number; level: number }[];
  filter?: SupportCardFilter;
  sort?: ActiveSort[];
  selection?: { [key: string]: boolean };
}

export interface UserSupportCardsData {
  tabs: SupportCardTab[];
  selectedTabIndex: number;
  lastUpdated: Date;
  allCardsSelection?: { [key: string]: boolean };
}
