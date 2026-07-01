import {inject, Injectable} from '@angular/core';
import {doc, Firestore, getDoc} from '@angular/fire/firestore';
import {combineLatest, defaultIfEmpty, filter, forkJoin, from, map, Observable, of, switchMap} from 'rxjs';
import {
  DecodedEvent,
  DecodedEventsContainer,
  EventChoice, EventConditionType,
  EventReward, EventRewardDataType,
  EventRewardType,
  UmaEvent
} from '../interfaces/event';
import {Skill} from '../interfaces/skill';
import {SkillsService} from './skills.service';
import {TraineeService} from './trainee.service';
import {catchError} from 'rxjs/operators';
import {Trainee} from '../interfaces/trainee';
import {RACES} from '../interfaces/races';
import {YEAR} from '../interfaces/year';
import {DISTANCE} from '../interfaces/distance';
import {TRACK} from '../interfaces/track';

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

        const skillIds = allEventRewards.filter(reward => (reward.t === 'sk' || reward.t === 'sg' || reward.t === 'ps_h' || reward.t === 'ps_nh') && reward.d)
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
      hp: 'Heal Negative Skill',    // ?
      se: 'Get Status Effect',     // 'Get Charming ○ status',
      sg: 'Skill Gain',
      sr: 'Skill Random',    // TODO: make custom template
      '5s': 'All Stats',
      rs: 'Random Stat(s)',
      fe: 'Full Energy Recovery',
      no: 'Nothing Happens',
      ct: 'Chance of Practice Perfect ○ status',      // ??? 'condition trigger' mb
      nl: 'New Line',
      sc: 'Switch Condition',
      rc: 'Race Change',
      s_nore: 'Randomly Either',
      highest_facility: 'Highest Facility',
      fa: 'Fans',
      fd: 'Random Training Facilities Disabled',
      rr: 'Race Rewards',      // ?
      expensive_races: 'Racing consumes more energy',
      result_good: 'Good Result',
      result_bad: 'Bad Result',
      ps_h: 'PS healed',
      ps_nh: 'PS not healed'
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

    const conditionsMap: { [key: string]: string } = {
      [EventConditionType.autumn_triple_crown_senior]: 'Win the senior Autumn Triple Crown (Tenno Sho (Autumn) (Senior), Japan Cup (Senior), Arima Kinen (Senior))',
      [EventConditionType.autumn_triple_crown_same_year]: 'Win the Autumn Triple Crown (Tenno Sho (Autumn) (Senior), Japan Cup (Senior), Arima Kinen (Senior)) in the SAME year',
      [EventConditionType.spring_triple_crown]: 'Win the Spring Triple Crown (Osaka Hai, Tenno Sho (Spring), Takarazuka Kinen (Senior))',
      [EventConditionType.win]: 'Win',
      [EventConditionType.lose]: 'Lose',
      [EventConditionType.do_not_race]: 'Do Not Race',
      [EventConditionType.obj]: '(Objective Related, Event will Vary Based On Your Result)',
      [EventConditionType.triple_tiara]: 'Win the Triple Tiara (Oka Sho, Japanese Oaks, Shuka Sho)',
      [EventConditionType.triple_crown]: 'Win the Triple Crown (Satsuki Sho, Tokyo Yushun (Japanese Derby), Kikuka Sho)',
      [EventConditionType.lose_to_rival]: 'Lose to Rival',
      [EventConditionType.participate]: 'Participate',
      [EventConditionType.date]: 'Triggers'
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
    const conditionsSet = new Set();
    const mapEvent = (event: UmaEvent): DecodedEvent => {
      return {
        name: event.n,
        alt_placement: event.alt_placement?.map(altPlacement => {
          const [placement1, placement2] = altPlacement.placement;
          const altPlacementString = !placement2 ? `${placement1} place and below` : `${placement1} - ${placement2} place`;
          return {data: mapEvent(altPlacement.data), placementString: altPlacementString}}),
        conditions: event.conditions?.map(c => {
          let decoded: string | string[] = c;
          try {
            decoded = JSON.parse(c) as string[];
          } catch (error) {
            // If it's a regular string, return it as is
            decoded = c;
          }
          const conditionEncryptedName = (Array.isArray(decoded) ? decoded[0] : decoded) as EventConditionType;
          const conditionName = conditionsMap[conditionEncryptedName];
          let resultString = conditionName || c;
          console.log('decoded', decoded);
          switch (conditionEncryptedName) {
            case EventConditionType.win:
            case EventConditionType.lose:
              const [raceId, yearId] = decoded[1].toString().indexOf('|') > -1 ? decoded[1].split('|') : [decoded[1], ''];
              return {conditionType: conditionEncryptedName, raceId: Number(raceId), yearId: Number(yearId)}
            case EventConditionType.do_not_race:
            case EventConditionType.date: {
              const [conditionType, year, month, half] = decoded;
              const yearName = YEAR[Number(year)];
              const monthName = new Date(2000, Number(month) - 1, 1).toLocaleString('en', { month: 'long' });
              const halfName = Number(half) === 1 ? 'Early' : 'Late';
              resultString = `${conditionName} in ${halfName} ${monthName}(${yearName} Year)`;
              break;
            }
            case EventConditionType.lose_to_rival:
            case EventConditionType.beat_rival: {
              const [conditionType, raceId, rivalTraineeShortId] = decoded;
              const race = RACES.find(r => r.id === Number(raceId));
              // const raceName = race?.name_en || `Race ${raceId}`;
              console.log('Data', data);
              return {
                conditionType: conditionEncryptedName,
                raceId: Number(raceId),
                rivalId: Number(`${rivalTraineeShortId}01`)
              }
            }
            case EventConditionType.win_g1_year: {
              const [conditionType, yearId, racesAmount] = decoded;
              const yearName = YEAR[Number(yearId)];
              return `Win ${racesAmount}+ G1 Races in ${yearName} Year`;
            }
            case EventConditionType.participate:
            case EventConditionType.do_not_participate: {
              const [conditionType, eventOrRaceIdAndYearId] = decoded;
              const eventsMap: Record<string, string> = {
                debut: 'Make Debut',
              };
              if (eventsMap[eventOrRaceIdAndYearId]) {
                return `Participate in ${eventsMap[eventOrRaceIdAndYearId]}`;
              }
              const [raceId, yearId] = eventOrRaceIdAndYearId.toString().indexOf('|') > -1 ? eventOrRaceIdAndYearId.split('|') : [eventOrRaceIdAndYearId, ''];
              return {conditionType: conditionEncryptedName, raceId: Number(raceId), yearId: Number(yearId)};
            }
            case EventConditionType.win_as_strat:
            case EventConditionType.win_as_not_strat: {
              const [conditionType, raceIdAndYearId, strategyId] = decoded;
              const [raceId, yearId] = raceIdAndYearId.toString().indexOf('|') > -1 ? raceIdAndYearId.split('|') : [raceIdAndYearId, ''];
              return {conditionType: conditionEncryptedName, raceId: Number(raceId), yearId: Number(yearId), strategyId: Number(strategyId)}
            }
            case EventConditionType.pick_and_win:
            case EventConditionType.dont_pick_and_win: {
              const [conditionType, raceIdAndYearId] = decoded;
              const [raceId, yearId] = raceIdAndYearId.toString().indexOf('|') > -1 ? raceIdAndYearId.split('|') : [raceIdAndYearId, ''];
              return {conditionType: conditionEncryptedName, raceId: Number(raceId), yearId: Number(yearId)}
            }
            case EventConditionType.third_any_non_objective: {
              return 'Finish 3rd in Any Non-Objective Race';
            }
            case EventConditionType.win_or: {
              const [conditionType, race1IdAndYear1Id, race2IdAndYear2Id] = decoded;
              const [race1Id, year1Id] = race1IdAndYear1Id.toString().indexOf('|') > -1 ? race1IdAndYear1Id.split('|') : [race1IdAndYear1Id, ''];
              const [race2Id, year2Id] = race2IdAndYear2Id.toString().indexOf('|') > -1 ? race2IdAndYear2Id.split('|') : [race2IdAndYear2Id, ''];
              return {conditionType: conditionEncryptedName, race1Id: Number(race1Id), year1Id: Number(year1Id), race2Id: Number(race2Id), year2Id: Number(year2Id)}
            }
            case EventConditionType.rn_race_w: {
              const [conditionType, opponentsString, amountOfRaces] = decoded;
              const opponentIds: number[] = JSON.parse(opponentsString);
              return {conditionType: conditionEncryptedName, opponentIds: opponentIds.map(id => `${id.toString()}01`), amountOfRaces: Number(amountOfRaces)}
            }
            case EventConditionType['3_crown_route']: {
              return 'Select the Triple Crown route';
            }
            case EventConditionType.win_g1_cnt_class_distance: {
              const [conditionType, amountOfRaces, yearId, distanceIdsString] = decoded;
              console.log('distanceIdsString', distanceIdsString);
              const distanceIds: number[] = JSON.parse(distanceIdsString);
              console.log('Distance IDs', distanceIds);
              return {conditionType: conditionEncryptedName, amountOfRaces: Number(amountOfRaces), yearId: Number(yearId), distanceIds: distanceIds};
            }
            case EventConditionType.dist_wins_branch: {
              const [conditionType, distanceId] = decoded;
              console.log('distanceId', distanceId);
              return `Reward depends on amount of ${DISTANCE[Number(distanceId)]} wins`;
            }
            case EventConditionType.win_g1_track: {
              const [conditionType, trackId, amountOfRaces] = decoded;
              return `Win ${amountOfRaces} G1 races at ${TRACK[Number(trackId)]} track`;
            }
            case EventConditionType.win_g1: {
              const [conditionType, amountOfRaces] = decoded;
              let amount: number | number[];
              try {
                amount = JSON.parse(amountOfRaces) as number[];
              } catch (error) {
                // If it's a regular string, return it as is
                amount = Number(amountOfRaces);
              }
              const amountString = Array.isArray(amount) ? `${amount[0]} - ${amount[1]}` : amount.toString();
              return `Win ${amountString} G1 races`;
            }
            case EventConditionType.rt_race_w: {
              const [conditionType, trackId, amountOfRaces] = decoded;
              return `Win ${amountOfRaces} race at ${TRACK[Number(trackId)]} track`;
            }
            case EventConditionType.race_pn: {
              const [conditionType, raceIdAndYearId, position] = decoded;
              const [raceId, yearId] = raceIdAndYearId.toString().indexOf('|') > -1 ? raceIdAndYearId.split('|') : [raceIdAndYearId, ''];
              return {conditionType: conditionEncryptedName, raceId: Number(raceId), yearId: Number(yearId), position: Number(position)}
            }
            case EventConditionType.ev: {
              const [conditionType, eventId] = decoded;
              const eventsMap: {[key: number]: string} = {
                501023520: '[Battle With a Raging Dragon]'
              };
              return `Trigger the ${eventsMap[Number(eventId)]} training event`;
            }
          }
          return resultString;   // placeholder
        }),
        choices: event.c.map((choice: EventChoice) => ({
          text: choice.o,
          rewards: choice.r.map((reward: EventReward) => {
            switch (reward.t) {
              case 'sk':
                // console.log(`Unknown Skill Reward`, reward, event.n);
                if (reward.d) {
                  const skill = data?.skills?.get(reward.d);      // TODO: probly return id only
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
              case 'sg': {
                if (reward.d) {
                  const skill = data?.skills?.get(reward.d);
                  if (skill) {
                    return {
                      type: EventRewardType.data,
                      dataType: EventRewardDataType.skill,
                      data: skill,
                      prefix: 'Gain'
                    };
                  }
                }
                console.warn(`Unknown Skill Gain Reward`, reward, event.n);
                return {
                  type: EventRewardType.simpleString,
                  value: 'Unknown Skill Gain Reward'
                };
              }
              case 'ps_h': {
                if (reward.d) {
                  const skill = data?.skills?.get(reward.d);
                  if (skill) {
                    return {
                      type: EventRewardType.supportStringWithData,
                      dataType: EventRewardDataType.skill,
                      data: skill,
                      prefix: '※',
                      suffix: 'Healed'
                    };
                  }
                }
                console.warn(`Unknown ps_h Reward`, reward, event.n);
                return {
                  type: EventRewardType.simpleString,
                  value: 'Unknown ps_h Reward'
                };
              }
              case 'ps_nh': {
                if (reward.d) {
                  const skill = data?.skills?.get(reward.d);
                  if (skill) {
                    return {
                      type: EventRewardType.supportStringWithData,
                      dataType: EventRewardDataType.skill,
                      data: skill,
                      prefix: '※',
                      suffix: 'Not Healed'
                    };
                  }
                }
                console.warn(`Unknown ps_nh Reward`, reward, event.n);
                return {
                  type: EventRewardType.simpleString,
                  value: 'Unknown ps_nh Reward'
                };
              }
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
                const raceId: number | undefined = reward.d;
                if (!raceId) {
                  console.warn(`Unknown Race Change Reward`, reward, event.n);
                }
                const raceName: string = RACES.find(r => r.id === raceId)?.name_en || 'Unknown Race';
                return {
                  type: EventRewardType.simpleString,
                  value: `Objective Race Changed to ${raceName}`
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
                return {
                  type: EventRewardType.supportString,
                  value: `${text}${chancesText}`
                };
              }
              case 'rr': {
                // console.warn(`Unknown Race Reward`, reward, event.n);
                if (!reward.d) {
                  return {
                    type: EventRewardType.simpleString,
                    value: `Standard Race Rewards`
                  };
                }
                const [energy, randomStat, skillPoints] = reward.d?.toString().split('_')!;
                return {
                  type: EventRewardType.simpleString,
                  value: `Energy ${energy}, 1 Random Stat ${Number(randomStat) > 0 ? '+' : ''}${randomStat}, Skill Points ${Number(skillPoints) > 0 ? '+' : ''}${skillPoints}`    // mb make a type for array of rewards?
                };
              }
              case 'hp': {
                if (reward.d) {
                  const skill = data?.skills?.get(reward.d);      // TODO: probly return id only
                  if (skill) {
                    return {
                      type: EventRewardType.data,
                      dataType: EventRewardDataType.skill,
                      data: skill,
                      prefix: `Heal`
                    };
                  }
                }
                console.warn('Unknown HP Reward', reward, event.n);
                return {
                  type: EventRewardType.simpleString,
                  value: 'Unknown Heal Reward'
                };
              }
              case 'ct': {
                console.warn('CHECK CT Reward', reward, event.n);
                return {
                  type: EventRewardType.supportString,
                  value: `${reward.d} wins`
                };
              }
              case 'result_good':
              case 'result_bad': {
                return {
                  type: EventRewardType.supportString,
                  value: `※ ${rewardMap[reward.t]}`
                };
              }
              default:
                const type = rewardMap[reward.t];
                if (!type) {
                  console.warn(`Unknown reward type encountered: ${reward.t} in ${event.n}`, event);
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
    console.warn('conditionsSet', conditionsSet);

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
