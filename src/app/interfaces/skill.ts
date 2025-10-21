export interface Effect {
  type: number;
  value: number;
}

export interface ConditionGroup {
  base_time: number;
  condition: string;
  effects: Effect[];
  precondition?: string;
}

export interface GeneVersion {
  activation: number;
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
  rarity: number;
}

export interface LocDetails {
  char: number[];
  condition_groups?: ConditionGroup[];
  gene_version?: {
    condition_groups: ConditionGroup[];
  };
  type?: string[];
}

export interface Loc {
  en: LocDetails;
  ko: LocDetails;
  zh_tw: LocDetails;
}

export interface Skill {
  activation: number;
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
  rarity: number;
  type: string[];
}