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
  }
}

export interface DecodedEvent {
  name: string;
  choices: {
    text: string;
    rewards: DecodedEventReward[];
  }[];
  conditions?: string[];
}

export interface DecodedEventsContainer {
  [key: string]: DecodedEvent[];
}
