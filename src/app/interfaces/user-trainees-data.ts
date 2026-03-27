import { TraineeRarity } from './trainee-rarity.enum';
import { TrainingType } from './training-type.enum';
import { SurfaceAptitude, DistanceAptitude, StrategyAptitude, AptitudeGrade } from './aptitude.enum';
import { ActiveSort } from '../components/common/data-grid/data-grid.types';

export type FilterOperator = '>=' | '<=' | '>' | '<' | '=';

export interface TraineeStatBonusFilter {
  stat: TrainingType | '';
  operator: FilterOperator;
  value: number | null;
}

export interface TraineeAptitudeFilter {
  stat: SurfaceAptitude | DistanceAptitude | StrategyAptitude | '';
  operator: FilterOperator;
  value: AptitudeGrade | '';
}

export interface TraineeFilter {
  name: string;
  rarity: TraineeRarity[];
  statBonus: TraineeStatBonusFilter;
  aptitude: TraineeAptitudeFilter;
  uniqName: string;
}

export interface TraineeTab {
  name: string;
  cards: { id: number }[];
  filter?: TraineeFilter;
  sort?: ActiveSort[];
}

export interface UserTraineesData {
  tabs: TraineeTab[];
  selectedTabIndex: number;
}
