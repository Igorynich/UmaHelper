export enum Rarity {
  Normal = 1,
  Rare = 2,
  Unique = 3,
  E1 = 4,
  E2 = 5,
  E3 = 6
}

export enum SkillEffect {
  SpeedStat = 1,
  StaminaStat = 2,
  PowerStat = 3,
  GutsStat = 4,
  WitsStat = 5,
  ChangeStrategy = 6,
  FieldOfView = 8,
  Stamina = 9,
  StartReactionTime = 10,
  RushTime = 13,
  StartDelay = 14,
  CurrentSpeedDecrease = 21,
  CurrentSpeedIncrease = 22,
  TargetSpeed = 27,
  LaneMovementSpeed = 28,
  RushChance = 29,
  Acceleration = 31,
  ChangeLane = 35,
  CarnivalPointGain = 501,
  AllStatsIncreasedDuringCarnival = 502,
  MoodMaxedDuringCarnival = 503,
}

export enum Activation {
  Guaranteed = 0,
  WitCheck = 1,
}

/*export enum SkillType {
  FinalCorner = 'f_c',
  FinalStraight = 'f_s',
  Corner = 'cor',
  Straight = 'str',
  MiddleLeg1 = 'l_1',
  MiddleLeg2 = 'l_2',
  MiddleLeg3 = 'l_3',
  None = 'nac',
}*/

export interface Effect {
  type: SkillEffect;
  value: number;
  value_scale?: number; // TODO: This is likely an enum, but its values are unknown.
}

export interface ConditionGroup {
  base_time: number;
  condition: string;
  cd?: number;
  effects: Effect[];
  precondition?: string;
}

export interface Skill {
  activation: Activation;
  char?: number[];
  condition_groups: ConditionGroup[];
  cost?: number;
  desc_en?: string;
  desc_ko?: string;
  desc_tw?: string;
  endesc: string;
  enname: string;
  iconid: number;
  id: number;
  jpdesc: string;
  jpname: string;
  name_en?: string;
  name_ko?: string;
  name_tw?: string;
  rarity: Rarity;
  type: string[];
}
