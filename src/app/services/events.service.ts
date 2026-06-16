import {inject, Injectable} from '@angular/core';
import {doc, Firestore, getDoc} from '@angular/fire/firestore';
import {combineLatest, defaultIfEmpty, filter, forkJoin, from, map, Observable, of, switchMap} from 'rxjs';
import {
  DecodedEvent,
  DecodedEventsContainer,
  EventChoice,
  EventReward, EventRewardDataType,
  EventRewardType,
  UmaEvent
} from '../interfaces/event';
import {Skill} from '../interfaces/skill';
import {SkillsService} from './skills.service';
import {TraineeService} from './trainee.service';
import {catchError} from 'rxjs/operators';
import {Trainee} from '../interfaces/trainee';

export const eventTypes: Record<string, { name: string }> = {
  random: {
    name: 'Random Events'
  },
  arrows: {
    name: 'Chain Events'
  },
  dates: {
    name: 'Dates'
  },
  special: {
    name: 'Special Events'
  },
  dates_random: {
    name: 'Dates'
  },
  // trainee events
  wchoice: {
    name: 'Event With Choices'
  },
  nochoice: {
    name: 'Events Without Choices'
  },
  version: {
    name: 'Costume Events'
  },
  outings: {
    name: 'Date Events'
  },
  secret: {
    name: 'Secret Events'
  }
};

// Reward Types: simpleString(value), data(dataType, data, value?), supportString(value, supportType, prefix?, suffix?)
/*export enum EventRewardTypes {
  skill,
  bond,
  newLine,
  switchCondition
}*/

// DecodedEventsContainer -> {name: string, events:[]}[]
export const evntTypeConvertFn = (container: DecodedEventsContainer | null) => Object.keys(container || {}).map(key => {
  const evName = eventTypes[key]?.name;
  if (!evName) {
    console.log('Unknown Event Group', key);
  }
  return {
    name: evName || 'Unknown Events',
    events: container?.[key] || []
  };
}).sort((a, b) => a.name.localeCompare(b.name));

@Injectable({
  providedIn: 'root'
})
export class EventsService {
  private firestore = inject(Firestore);
  private skillsService = inject(SkillsService);
  private traineeService = inject(TraineeService);

  getAndDecodeEvents(cardId: string): Observable<DecodedEventsContainer | null> {
    return this.getEventsByCardId(cardId).pipe(
      switchMap(rawEvents => {
        console.log('rawEvents', rawEvents);
        if (!rawEvents) return of(null);

        const eventData = rawEvents.en || rawEvents;
        const allEvents: UmaEvent[] = [...Object.values(eventData)?.flat() || []] as UmaEvent[];
        // const allEvents: UmaEvent[] = [...(eventData.random || []), ...(eventData.arrows || [])];

        const allEventRewards = allEvents.flatMap(event => event.c.flatMap(choice => choice.r));

        // let skillReqs$, traineeReqs$;

        const skillIds = allEventRewards.filter(reward => reward.t === 'sk' && reward.d)
          .map(reward => reward.d!);
        const uniqueSkillIds = [...new Set(skillIds)];
        let skillReqs$ = this.skillsService.getSkillsByIds(uniqueSkillIds);
        if (uniqueSkillIds.length === 0) {
          skillReqs$ = of([]);
          // return of(this.decodeEvents(rawEvents, new Map()));
        }

        // bond id vs trainee id: MR CB - 1057 vs 105701(base variant), 105702(new year variant)
        const bondTraineeIds = allEventRewards.filter(reward => reward.t === 'bo' && reward.d)
          .map(reward => reward.d!);
        const uniqueBondIds = [...new Set(bondTraineeIds)];
        let traineeReqs$ = forkJoin(uniqueBondIds.map(bondId =>
          this.traineeService.getTraineeById(`${bondId}01`).pipe(
            filter(trainee => !!trainee)
          )
        )).pipe(
          defaultIfEmpty([])
        );
        if (uniqueBondIds.length === 0) {
          traineeReqs$ = of([]);
        }
        console.log('traineeReqs$', traineeReqs$);
        return forkJoin([skillReqs$, traineeReqs$]).pipe(        // TODO: think about moving fetching to events display component
          map(([skills, trainees]) => {
            const skillMap = new Map(skills.map(s => [s.id, s]));
            const traineesMap = new Map(trainees.map(t => [t.itemData.char_id, t]));
            const data = {skills: skillMap, trainees: traineesMap};
            console.log('data', data);
            return this.decodeEvents(rawEvents, data);
          })
        );
      })
    );
  }

  private getEventsByCardId(cardId: string): Observable<any | null> {
    const eventDocRef = doc(this.firestore, `events/${cardId}`);
    return from(getDoc(eventDocRef)).pipe(
      map(docSnap => {
        if (docSnap.exists()) {
          return docSnap.data();
        } else {
          return null;
        }
      })
    );
  }

  decodeEvents(events: any, data?: {
    skills: Map<number, Skill>,
    trainees: Map<number, Trainee>
  }): DecodedEventsContainer {
    const rewardMap: { [key: string]: string } = {
      sp: 'Speed',
      st: 'Stamina',
      gu: 'Guts',
      in: 'Wit',
      po: 'Power',
      en: 'Energy',
      pt: 'Skill Points',
      bo: 'Bond',
      sk: 'Skill Hint',
      di: '--- OR ---',
      ee: 'Event Ended',
      mo: 'Mood',
      me: 'Maximum Energy',
      brf: 'Branching Result Future',
      brp: 'Branching Result Past',
      ds: 'Can Start Dating',
      ha: 'Heal all negative status effects',
      he: 'Heal a negative status effect',
      se: 'Get Status Effect',     // 'Get Charming ○ status',
      sg: 'Skill Gain',
      sr: 'Skill Random',    // TODO: make custom template
      '5s': 'All Stats',
      rs: 'Random Stat(s)',
      fe: 'Full Energy Recovery',
      no: 'Nothing Happens',
      ct: 'Chance of Practice Perfect ○ status',
      nl: 'New Line',
      sc: 'Switch Condition',
      rc: 'Race Change',
      s_nore: 'Randomly Either',
      highest_facility: 'Highest Facility',
      fa: 'Fans',
      fd: 'Random Training Facilities Disabled'
    };

    const statusEffectsMap: { [key: number]: string } = {
      1: 'Night Owl',
      2: 'Slacker',
      4: 'Slow Metabolism',
      7: 'Fast Learner',
      8: 'Charming ○',
      9: 'Hot Topic',
      10: 'Practice Perfect ○',
      100: 'Pure Passion: Team Sirius'
    };

    const switchConditionMap: { [key: string]: (rewardData: any[]) => string } = {
      // 'G(n) Races Win streak with specific strategy',
      s_gn_race_wn_c: (rewardData: any[]) => {
        const raceType: number = rewardData[1];
        const winPercentage: number = rewardData[2];      // questionable - might be something else
        const racesAmount: number = rewardData[3];
        // Get a Win Streak of 7+ G1 races as Front Runner
        return `Get a Win Streak of ${racesAmount}+ G${raceType} Races as Front Runner`;
      }
    };

    const eventData = events.en || events;

    const mapEvent = (event: UmaEvent): DecodedEvent => {
      if (event.conditions) {
        console.warn('EVENT WITH CONDITIONS', event, event.n);   // TODO: decode conditions
      }
      let diCounter = 0;      // counts --OR--
      return {
        name: event.n,
        conditions: event.conditions,
        choices: event.c.map((choice: EventChoice) => ({
          text: choice.o,
          rewards: choice.r.map((reward: EventReward) => {
            switch (reward.t) {
              case 'sk':
                if (reward.d) {
                  const skill = data?.skills?.get(reward.d);
                  if (skill) {
                    return {
                      type: EventRewardType.data,
                      dataType: EventRewardDataType.skill,
                      data: skill,
                      value: ` Hint ${reward.v}`
                    };
                  }
                }
                console.warn('Unknown Skill Hint Reward', reward, event.n);
                return {
                  type: EventRewardType.simpleString,
                  value: 'Unknown Skill Hint Reward'
                };
              case 'bo':
                if (reward.d) {
                  const bondTrainee = data?.trainees?.get(reward.d);
                  if (bondTrainee) {
                    return {
                      type: EventRewardType.data,
                      dataType: EventRewardDataType.bond,
                      data: bondTrainee,
                      value: ` Bond ${reward.v}`
                    }
                  }
                }
                console.warn('Unresolved Bond Reward', reward, event.n);
                return {
                  type: EventRewardType.simpleString,
                  value: `${rewardMap[reward.t]} ${reward.v}`   // (ID: ${reward.d})
                };
              case 'nl':
                return {
                  type: EventRewardType.supportString
                };
              case 'sc':
                if (Array.isArray(reward.d) && reward.d.length) {
                  const conditionType: string = reward.d[0];
                  const rewardString: string = switchConditionMap[conditionType]?.(reward.d);
                  if (rewardString) {
                    return {
                      type: EventRewardType.supportString,
                      value: rewardString,
                      prefix: 'Condition:'
                    }
                  }
                }
                console.warn('Unresolved Switch Condition Reward', reward, event.n);
                return {
                  type: EventRewardType.simpleString,
                  value: `Unknown Switch Condition`
                };
              case 'rs': {
                const type = rewardMap[reward.t];
                const amount: number = reward.d!;
                const bonus: string = reward.v!;
                return {
                  type: EventRewardType.simpleString,
                  value: `${amount} ${type} ${bonus}`
                };
              }
              case 'se': {
                const effectId: number = reward.d!;
                const effectName: string = statusEffectsMap[effectId] || 'Unknown Effect';
                if (!statusEffectsMap[effectId]) {
                  console.warn(`Unknown status effect ID: ${effectId} in ${event.n}`);
                }
                const isRandom: boolean = !!reward.r;
                return {
                  type: EventRewardType.simpleString,
                  value: `${isRandom ? '(random) ' : ''}Get ${effectName} Status`
                };
              }
              case 'rc': {
                console.warn(`Unknown Race Change Reward`, reward, event.n);
                const raceId: number = reward.d!;
                return {
                  type: EventRewardType.simpleString,
                  value: `Objective Race Changed (id: ${raceId})`
                };
              }
              case 'fd': {
                const amount = reward.d!;
                return {
                  type: EventRewardType.simpleString,
                  value: `${amount} Random Training Facilities Disabled for One Turn`
                };
              }
              case 'di': {
                const chances = reward.d;
                const chancesText = `${chances ? `(${chances}%)` : ''}`;
                const text = rewardMap[reward.t];
                // const mainText = diCounter === 0 ? 'Randomly Either' : '--OR--';
                diCounter++;    // TODO figure out when to use Randomly Either
                return {
                  type: EventRewardType.supportString,
                  value: `${text}${chancesText}`
                };
              }
              default:
                const type = rewardMap[reward.t];
                if (!type) {
                  console.warn(`Unknown reward type encountered: ${reward.t} in ${event.n}`);
                }
                let result = `${type || `Unknown (${reward.t})`}`;
                if (reward.v) result += ` ${reward.v}`;
                if (reward.d) result += ` (ID: ${reward.d})`;
                return {
                  type: EventRewardType.simpleString,
                  value: result
                };
            }
          })
        }))
      };
    };

    return Object.keys(eventData).reduce((acc, key) => {
      if (Array.isArray(eventData[key])) {
        return {
          ...acc,
          [key]: eventData[key].map(mapEvent)
        };
      }
      return acc;
    }, {});
  }

  filterParsedEventData(events: any): Record<string, UmaEvent[]> {
    const eventData = events.en || events;
    return Object.keys(eventData).reduce((acc: Record<string, UmaEvent[]>, eventGroupKey: string) => {
      const eventGroup = eventData[eventGroupKey as keyof typeof eventData];
      if (Array.isArray(eventGroup) && eventGroup.every((event: UmaEvent | any) => typeof event === 'object')) {
        acc[eventGroupKey] = eventGroup;
      }
      return acc;
    }, {} as Record<string, UmaEvent[]>);
  }
}
