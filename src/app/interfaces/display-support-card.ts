import { SupportCard } from './support-card';

export enum Rarity {
  R = 1,
  SR = 2,
  SSR = 3,
}

export interface DisplaySupportCard extends SupportCard {
  level?: number | undefined;
}
