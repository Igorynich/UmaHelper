import { Skill } from './skill';
import {Trainee} from './trainee';

export enum EventRewardType {
  simpleString,
  data,
  supportString
}

export enum EventRewardDataType {
  skill,
  bond
}

export interface EventRewardDataTypeMap {
  [EventRewardDataType.skill]: Skill;
  [EventRewardDataType.bond]: Trainee;
}

export type EventRewardData<T extends EventRewardDataType = EventRewardDataType> = {
  [K in T]: {
    type: EventRewardType.data;
    dataType: K;
    data: EventRewardDataTypeMap[K];
    value?: string;
    prefix?: string;
    suffix?: string;
  }
}[T];

export interface EventRewardTypeMap {
  [EventRewardType.simpleString]: {
    type: EventRewardType.simpleString;
    value: string;
  };
  [EventRewardType.data]: EventRewardData;
  [EventRewardType.supportString]: {
    type: EventRewardType.supportString;
    value?: string;
    prefix?: string;
    suffix?: string;
  };
}

export type DecodedEventReward<T extends EventRewardType = EventRewardType> = {
  [K in T]: K extends EventRewardType.data
    ? EventRewardData
    : EventRewardTypeMap[K];
}[T];

export interface EventReward {
  t: string;
  v?: string;
  d?: number;
  r?: boolean;
}

export interface EventChoice {
  o: string;
  r: EventReward[];
}

export interface UmaEvent {
  n: string;
  c: EventChoice[];
  conditions?: string[];        // 0: "[\"participate\",\"202701|2\"]"
  alt_placement?: {
    data: UmaEvent;
    placement: (number | null)[];
  }[];
}

export interface DecodedEvent {
  name: string;
  choices: {
    text: string;
    rewards: DecodedEventReward[];
  }[];
  alt_placement?: {
    data: DecodedEvent;
    placementString: string;
  }[];
  conditions?: EventConditionData[];
}

export enum EventConditionType {
  'autumn_triple_crown_senior' = 'autumn_triple_crown_senior',
  'win' = 'win',
  'lose' = 'lose',
  'do_not_race' = 'do_not_race',
  'obj' = 'obj',
  'triple_tiara' = 'triple_tiara',
  'lose_to_rival' = 'lose_to_rival',
  'beat_rival' = 'beat_rival',
  'win_g1_year' = 'win_g1_year',
  'participate' = 'participate',
  'win_as_strat' = 'win_as_strat',
  'win_as_not_strat' = 'win_as_not_strat',
  'pick_and_win' = 'pick_and_win',
  'dont_pick_and_win' = 'dont_pick_and_win',
  'date' = 'date',
  'third_any_non_objective' = 'third_any_non_objective',
  'win_or' = 'win_or',
  'rn_race_w' = 'rn_race_w'
}

export interface EventConditionDataType {
  [EventConditionType.win]: {conditionType: EventConditionType.win, raceId: number, yearId: number},
  [EventConditionType.lose]: {conditionType: EventConditionType.lose, raceId: number, yearId: number},
  [EventConditionType.lose_to_rival]: {conditionType: EventConditionType.lose_to_rival, raceId: number, rivalId: number},
  [EventConditionType.beat_rival]: {conditionType: EventConditionType.beat_rival, raceId: number, rivalId: number},
  [EventConditionType.win_as_strat]: {conditionType: EventConditionType.win_as_strat, raceId: number, yearId: number, strategyId: number},
  [EventConditionType.win_as_not_strat]: {conditionType: EventConditionType.win_as_not_strat, raceId: number, yearId: number, strategyId: number},
  [EventConditionType.pick_and_win]: {conditionType: EventConditionType.pick_and_win, raceId: number, yearId: number},
  [EventConditionType.dont_pick_and_win]: {conditionType: EventConditionType.dont_pick_and_win, raceId: number, yearId: number},
  [EventConditionType.win_or]: {conditionType: EventConditionType.win_or, race1Id: number, year1Id: number, race2Id: number, year2Id: number},
  [EventConditionType.rn_race_w]: {conditionType: EventConditionType.rn_race_w, opponentIds: string[], amountOfRaces: number},
  // add more if needed
}

export type EventConditionData<T extends EventConditionType = EventConditionType> = {
  [K in T]: K extends keyof EventConditionDataType
    ? EventConditionDataType[K]
    : string;
}[T];

export interface DecodedEventsContainer {
  [key: string]: DecodedEvent[];
}
