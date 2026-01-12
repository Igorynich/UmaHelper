import { Skill } from './skill';

export interface EventReward {
  t: string;
  v?: string;
  d?: number;
}

export interface EventChoice {
  o: string;
  r: EventReward[];
}

export interface UmaEvent {
  n: string;
  c: EventChoice[];
}

export interface DecodedSkillReward {
  type: 'skill';
  skill: Skill;
  value: string;
}

export interface DecodedEvent {
  name: string;
  choices: {
    text: string;
    rewards: (string | DecodedSkillReward)[];
  }[];
}

export interface DecodedEventsContainer {
  random: DecodedEvent[];
  arrows: DecodedEvent[];
}
