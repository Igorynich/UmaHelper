import { SupportCardType } from './support-card-type.enum';

export interface SupportCardFilter {
  name: string;
  rarity: number[];
  type: SupportCardType[];
  effectId: number | '';
  operator: '>=' | '<=' | '>' | '<' | '=';
  value: number | null;
  showUpcomingCards: boolean;
  skillName: string;
  skillDesc: string;
  skillTypes: string[];
}

export interface SupportCardTab {
  name: string;
  cards: { id: number; level: number }[];
}

export interface UserSupportCardsData {
  tabs: SupportCardTab[];
  selectedTabIndex: number;
  lastUpdated: Date;
}
