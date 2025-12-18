export enum Rarity {
  Normal = 1,
  Rare = 2,
  Unique = 3,
  E1 = 4,
  E2 = 5,
  E3 = 6
}

export enum EffectType {
  Stamina = 9,
  TargetVelocity = 22,
  Velocity = 27,
  Acceleration = 31,
}

export enum Activation {
  Guaranteed = 0,
  WitCheck = 1,
}

export enum SkillType {
  FinalCorner = 'f_c',
  FinalStraight = 'f_s',
  Corner = 'cor',
  Straight = 'str',
  MiddleLeg1 = 'l_1',
  MiddleLeg2 = 'l_2',
  MiddleLeg3 = 'l_3',
  None = 'nac',
}

export interface Effect {
  type: EffectType;
  value: number;
}

export interface ConditionGroup {
  base_time: number;
  condition: string;
  cd?: number;
  effects: Effect[];
  precondition?: string;
}

export interface GeneVersion {
  activation: Activation;
  condition_groups: ConditionGroup[];
  cost: number;
  desc_en: string;
  desc_ko: string;
  desc_tw: string;
  iconid: number;
  id: number;
  inherited: boolean;
  name_en: string;
  name_ko: string;
  name_tw: string;
  parent_skills: number[];
  rarity: Rarity;
}

export interface LocDetails {
  char: number[];
  type?: SkillType[];
}

export interface Loc {
  en: LocDetails;
  ko: LocDetails;
  zh_tw: LocDetails;
}

export interface Skill {
  activation: Activation;
  char: number[];
  condition_groups: ConditionGroup[];
  desc_en: string;
  desc_ko: string;
  desc_tw: string;
  endesc: string;
  enname: string;
  gene_version?: GeneVersion;
  iconid: number;
  id: number;
  jpdesc: string;
  jpname: string;
  loc?: Loc;
  name_en: string;
  name_ko: string;
  name_tw: string;
  rarity: Rarity;
  type: SkillType[];
  // some dogshit nested arrays
  sup_e?: any;
  sup_hint?: any;
  evo_cond? :any;
  // possibly wrong version or smth
  pre_evo?: any;
  evo?: any;
  versions?: any;
}
