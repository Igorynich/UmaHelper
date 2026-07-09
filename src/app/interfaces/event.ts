import { Skill } from './skill';
import {Trainee} from './trainee';

export enum EventRewardType {
  simpleString,
  data,
  supportString,
  supportStringWithData
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
    type: EventRewardType.data | EventRewardType.supportStringWithData;
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
  [EventRewardType.supportStringWithData]: EventRewardData;
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
  'triple_crown' = 'triple_crown',
  'lose_to_rival' = 'lose_to_rival',
  'beat_rival' = 'beat_rival',
  'win_g1_year' = 'win_g1_year',
  'participate' = 'participate',
  'do_not_participate' = 'do_not_participate',
  'win_as_strat' = 'win_as_strat',
  'win_as_not_strat' = 'win_as_not_strat',
  'pick_and_win' = 'pick_and_win',
  'dont_pick_and_win' = 'dont_pick_and_win',
  'date' = 'date',
  'third_any_non_objective' = 'third_any_non_objective',
  'win_or' = 'win_or',
  'rn_race_w' = 'rn_race_w',
  '3_crown_route' = '3_crown_route',
  'win_g1_cnt_class_distance' = 'win_g1_cnt_class_distance',
  'dist_wins_branch' = 'dist_wins_branch',
  'spring_triple_crown' = 'spring_triple_crown',
  'win_g1_track' = 'win_g1_track',
  'win_g1_strat' = 'win_g1_strat',
  'win_g1' = 'win_g1',
  'race_pn' = 'race_pn',
  'autumn_triple_crown_same_year' = 'autumn_triple_crown_same_year',
  'ev' = 'ev',
  'rt_race_w' = 'rt_race_w',
  'rival_draw' = 'rival_draw',
  'racetrack_wins_branch' = 'racetrack_wins_branch',
  'fan' = 'fan',
  'fans_before_finals' = 'fans_before_finals',
  'y_dt_gn_race_no_w' = 'y_dt_gn_race_no_w',
  'brian_five' = 'brian_five',
  'win_connect_live' = 'win_connect_live',   // smart falcon
  'win_streak_graded' = 'win_streak_graded',
  'win_on_streak' = 'win_on_streak',
  'race_w2' = 'race_w2',
  'ct' = 'ct'
}

export interface EventConditionDataType {
  [EventConditionType.win]: {conditionType: EventConditionType.win, raceId: number, yearId: number},
  [EventConditionType.race_w2]: {conditionType: EventConditionType.race_w2, raceId: number},
  [EventConditionType.lose]: {conditionType: EventConditionType.lose, raceId: number, yearId: number},
  [EventConditionType.win_on_streak]: {conditionType: EventConditionType.win_on_streak, raceId: number, yearId: number},
  [EventConditionType.participate]: {conditionType: EventConditionType.participate, raceId: number, yearId: number} | string,
  [EventConditionType.do_not_participate]: {conditionType: EventConditionType.do_not_participate, raceId: number, yearId: number} | string,
  [EventConditionType.lose_to_rival]: {conditionType: EventConditionType.lose_to_rival, raceId: number, yearId: number, rivalId: number},
  [EventConditionType.beat_rival]: {conditionType: EventConditionType.beat_rival, raceId: number, yearId: number, rivalId: number},
  [EventConditionType.rival_draw]: {conditionType: EventConditionType.rival_draw, raceId: number, yearId: number, rivalId: number},
  [EventConditionType.win_as_strat]: {conditionType: EventConditionType.win_as_strat, raceId: number, yearId: number, strategyId: number},
  [EventConditionType.win_g1_strat]: {conditionType: EventConditionType.win_g1_strat, strategyId: number, amountOfRaces?: number},
  [EventConditionType.win_as_not_strat]: {conditionType: EventConditionType.win_as_not_strat, raceId: number, yearId: number, strategyId: number},
  [EventConditionType.pick_and_win]: {conditionType: EventConditionType.pick_and_win, raceId: number, yearId: number},
  [EventConditionType.dont_pick_and_win]: {conditionType: EventConditionType.dont_pick_and_win, raceId: number, yearId: number},
  [EventConditionType.win_or]: {conditionType: EventConditionType.win_or, race1Id: number, year1Id: number, race2Id: number, year2Id: number},
  [EventConditionType.rn_race_w]: {conditionType: EventConditionType.rn_race_w, opponentIds: string[], amountOfRaces: number},
  [EventConditionType.win_g1_cnt_class_distance]: {conditionType: EventConditionType.win_g1_cnt_class_distance, amountOfRaces: number, yearId: number, distanceIds: number[]},
  [EventConditionType.dist_wins_branch]: {conditionType: EventConditionType.dist_wins_branch, distanceId: number},
  [EventConditionType.race_pn]: {conditionType: EventConditionType.race_pn, raceId: number, yearId: number, position: number},
  [EventConditionType.fan]: {conditionType: EventConditionType.fan, fanAmount: number},
  [EventConditionType.fans_before_finals]: {conditionType: EventConditionType.fans_before_finals, fanAmount: number},
  [EventConditionType.y_dt_gn_race_no_w]: {conditionType: EventConditionType.y_dt_gn_race_no_w, yearId: number, criteriaName: string, criteriaValue: number, criteriaBranch: number, numberOfRaces: number},     // y_dt_gn_race_no_w",3,"dist",0,"g",2 - bamboo memory
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
