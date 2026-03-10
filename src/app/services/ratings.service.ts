import {Injectable} from '@angular/core';
import {SupportCardEffectData} from '../interfaces/support-card';
import {EffectId} from '../interfaces/effect-id.enum';
import {getEffectValueFn} from '../utils/effect-data-utils';

export enum LEVEL {
  lv1 = 'lv1',
  lv2 = 'lv2',
  lv3 = 'lv3',
  lv4 = 'lv4',
  lv5 = 'lv5'
}

export enum TRAINING_TYPE {
  Speed = 'speed',
  Stamina = 'stamina',
  Power = 'power',
  Guts = 'guts',
  Intelligence = 'intelligence',
}

export enum SCENARIO {
  // URA_FINALS,
  UNITY_CUP = 'UNITY CUP',
  // TRAILBLAZER,
}

export enum STRATEGY {
  SPEED_WITS = 'SPEED-WITS',
  SPEER_POWER = 'SPEER-POWER',
  GUTS_WITS = 'GUTS-WITS',
}

enum YEAR {
  Junior = 1,
  Classic = 2,
  Senior = 3
}

interface TrainingStats {
  [TRAINING_TYPE.Speed]?: number;
  [TRAINING_TYPE.Stamina]?: number;
  [TRAINING_TYPE.Power]?: number;
  [TRAINING_TYPE.Guts]?: number;
  [TRAINING_TYPE.Intelligence]?: number;
  energy?: number;
  sp?: number;
}

export type EffectValue = number | string | undefined | { value: string; isLocked: boolean } | {
  value: number;
  tooltip: string;
  hasUnique: boolean
}

@Injectable({
  providedIn: 'root'
})
export class RatingsService {

  readonly AVERAGE_MOOD = 15;
  readonly BASIC_TRAININGS = {
    [SCENARIO.UNITY_CUP]: {
      [LEVEL.lv1]: {
        [TRAINING_TYPE.Speed]: {
          [TRAINING_TYPE.Speed]: 8,
          [TRAINING_TYPE.Power]: 4,
          energy: -19,
          sp: 2
        },
        [TRAINING_TYPE.Stamina]: {
          [TRAINING_TYPE.Stamina]: 7,
          [TRAINING_TYPE.Guts]: 3,
          energy: -17,
          sp: 2
        },
        [TRAINING_TYPE.Power]: {
          [TRAINING_TYPE.Power]: 6,
          [TRAINING_TYPE.Stamina]: 4,
          energy: -18,
          sp: 2
        },
        [TRAINING_TYPE.Guts]: {
          [TRAINING_TYPE.Guts]: 6,
          [TRAINING_TYPE.Speed]: 3,
          [TRAINING_TYPE.Power]: 3,
          energy: -20,
          sp: 2
        },
        [TRAINING_TYPE.Intelligence]: {
          [TRAINING_TYPE.Intelligence]: 6,
          [TRAINING_TYPE.Speed]: 2,
          energy: +5,
          sp: 3
        }
      },
      [LEVEL.lv2]: {
        [TRAINING_TYPE.Speed]: {
          [TRAINING_TYPE.Speed]: 9,
          [TRAINING_TYPE.Power]: 4,
          energy: -20,
          sp: 2
        },
        [TRAINING_TYPE.Stamina]: {
          [TRAINING_TYPE.Stamina]: 8,
          [TRAINING_TYPE.Guts]: 3,
          energy: -18,
          sp: 2
        },
        [TRAINING_TYPE.Power]: {
          [TRAINING_TYPE.Power]: 7,
          [TRAINING_TYPE.Stamina]: 4,
          energy: -19,
          sp: 2
        },
        [TRAINING_TYPE.Guts]: {
          [TRAINING_TYPE.Guts]: 7,
          [TRAINING_TYPE.Speed]: 3,
          [TRAINING_TYPE.Power]: 3,
          energy: -21,
          sp: 2
        },
        [TRAINING_TYPE.Intelligence]: {
          [TRAINING_TYPE.Intelligence]: 7,
          [TRAINING_TYPE.Speed]: 2,
          energy: +5,
          sp: 3
        }
      },
      [LEVEL.lv3]: {
        [TRAINING_TYPE.Speed]: {
          [TRAINING_TYPE.Speed]: 10,
          [TRAINING_TYPE.Power]: 4,
          energy: -21,
          sp: 2
        },
        [TRAINING_TYPE.Stamina]: {
          [TRAINING_TYPE.Stamina]: 9,
          [TRAINING_TYPE.Guts]: 3,
          energy: -19,
          sp: 2
        },
        [TRAINING_TYPE.Power]: {
          [TRAINING_TYPE.Power]: 8,
          [TRAINING_TYPE.Stamina]: 4,
          energy: -20,
          sp: 2
        },
        [TRAINING_TYPE.Guts]: {
          [TRAINING_TYPE.Guts]: 8,
          [TRAINING_TYPE.Speed]: 3,
          [TRAINING_TYPE.Power]: 3,
          energy: -22,
          sp: 2
        },
        [TRAINING_TYPE.Intelligence]: {
          [TRAINING_TYPE.Intelligence]: 8,
          [TRAINING_TYPE.Speed]: 2,
          energy: +5,
          sp: 3
        }
      },
      [LEVEL.lv4]: {
        [TRAINING_TYPE.Speed]: {
          [TRAINING_TYPE.Speed]: 11,
          [TRAINING_TYPE.Power]: 5,
          energy: -23,
          sp: 2
        },
        [TRAINING_TYPE.Stamina]: {
          [TRAINING_TYPE.Stamina]: 10,
          [TRAINING_TYPE.Guts]: 4,
          energy: -21,
          sp: 2
        },
        [TRAINING_TYPE.Power]: {
          [TRAINING_TYPE.Power]: 9,
          [TRAINING_TYPE.Stamina]: 5,
          energy: -22,
          sp: 2
        },
        [TRAINING_TYPE.Guts]: {
          [TRAINING_TYPE.Guts]: 9,
          [TRAINING_TYPE.Speed]: 4,
          [TRAINING_TYPE.Power]: 3,
          energy: -24,
          sp: 2
        },
        [TRAINING_TYPE.Intelligence]: {
          [TRAINING_TYPE.Intelligence]: 9,
          [TRAINING_TYPE.Speed]: 3,
          energy: +5,
          sp: 3
        }
      },
      [LEVEL.lv5]: {
        [TRAINING_TYPE.Speed]: {
          [TRAINING_TYPE.Speed]: 12,
          [TRAINING_TYPE.Power]: 6,
          energy: -25,
          sp: 2
        },
        [TRAINING_TYPE.Stamina]: {
          [TRAINING_TYPE.Stamina]: 11,
          [TRAINING_TYPE.Guts]: 5,
          energy: -23,
          sp: 2
        },
        [TRAINING_TYPE.Power]: {
          [TRAINING_TYPE.Power]: 10,
          [TRAINING_TYPE.Stamina]: 6,
          energy: -24,
          sp: 2
        },
        [TRAINING_TYPE.Guts]: {
          [TRAINING_TYPE.Guts]: 10,
          [TRAINING_TYPE.Speed]: 4,
          [TRAINING_TYPE.Power]: 4,
          energy: -26,
          sp: 2
        },
        [TRAINING_TYPE.Intelligence]: {
          [TRAINING_TYPE.Intelligence]: 10,
          [TRAINING_TYPE.Speed]: 4,
          energy: +5,
          sp: 3
        }
      }
    }
  };
  readonly TRAINING_WEEKS = {
    [SCENARIO.UNITY_CUP]: [{
      amount: 16,
      restingPct: 10,
      trainingLvls: [LEVEL.lv1, LEVEL.lv1, LEVEL.lv1]     // [Primary, Secondary, Tertiary]
    }, {
      amount: 8,
      restingPct: 10,
      trainingLvls: [LEVEL.lv2, LEVEL.lv1, LEVEL.lv1]     // year 1 last 8 weeks
    }, {
      amount: 12,
      restingPct: 10,
      trainingLvls: [LEVEL.lv2, LEVEL.lv2, LEVEL.lv2]     // year 2 first half
    }, {
      amount: 4,
      restingPct: 18,
      trainingLvls: [LEVEL.lv5, LEVEL.lv5, LEVEL.lv5]     // summer 1
    }, {
      amount: 8,
      restingPct: 11,
      trainingLvls: [LEVEL.lv3, LEVEL.lv3, LEVEL.lv2]     // year 2 second half
    }, {
      amount: 12,
      restingPct: 12,
      trainingLvls: [LEVEL.lv4, LEVEL.lv4, LEVEL.lv3]     // year 3 first half
    }, {
      amount: 4,
      restingPct: 18,
      trainingLvls: [LEVEL.lv5, LEVEL.lv5, LEVEL.lv5]     // summer 2
    }, {
      amount: 8,
      restingPct: 13,
      trainingLvls: [LEVEL.lv5, LEVEL.lv4, LEVEL.lv4]     // year 3 second half
    }, {
      amount: 3,
      restingPct: 13,
      trainingLvls: [LEVEL.lv5, LEVEL.lv5, LEVEL.lv4]     // ura finals
    }],
  };

  readonly INITIAL_FRD_GAUGE_MAP: Record<number, number> = {
    0: 29,
    5: 28,
    10: 27,
    15: 26,
    20: 25,
    25: 24,     // base
    30: 23,
    35: 22,
    40: 21,
    45: 20,
    50: 19
  };

  readonly TRAINING_TYPE_TO_EFFECT_MAP = {
    [TRAINING_TYPE.Speed]: {
      bonus: EffectId.SPEED_BONUS,
      initial: EffectId.INITIAL_SPEED
    },
    [TRAINING_TYPE.Stamina]: {
      bonus: EffectId.STAMINA_BONUS,
      initial: EffectId.INITIAL_STAMINA
    },
    [TRAINING_TYPE.Power]: {
      bonus: EffectId.POWER_BONUS,
      initial: EffectId.INITIAL_POWER
    },
    [TRAINING_TYPE.Guts]: {
      bonus: EffectId.GUTS_BONUS,
      initial: EffectId.INITIAL_GUTS
    },
    [TRAINING_TYPE.Intelligence]: {
      bonus: EffectId.WIT_BONUS,
      initial: EffectId.INITIAL_WIT
    }
  };
  readonly BASIC_SPEC_WEIGHTS = {
    [TRAINING_TYPE.Speed]: 100,
    [TRAINING_TYPE.Stamina]: 100,
    [TRAINING_TYPE.Power]: 100,
    [TRAINING_TYPE.Guts]: 100,
    [TRAINING_TYPE.Intelligence]: 100,
    none: 50
  };

  selectedScenario: SCENARIO = SCENARIO.UNITY_CUP;
  selectedStrategy: STRATEGY = STRATEGY.SPEED_WITS;
  readonly STRATEGY_PRIORITY_MAP: Record<STRATEGY, Record<string, TRAINING_TYPE>> = {
    [STRATEGY.SPEED_WITS]: {
      primary: TRAINING_TYPE.Speed,
      secondary: TRAINING_TYPE.Intelligence,
      tertiary: TRAINING_TYPE.Power
    },
    [STRATEGY.SPEER_POWER]: {
      primary: TRAINING_TYPE.Speed,
      secondary: TRAINING_TYPE.Power,
      tertiary: TRAINING_TYPE.Stamina
    },
    [STRATEGY.GUTS_WITS]: {
      primary: TRAINING_TYPE.Guts,
      secondary: TRAINING_TYPE.Intelligence,
      tertiary: TRAINING_TYPE.Speed
    },
  };

  constructor() {
  }

  aggregateBasicTrainings(supCard: SupportCardEffectData, spec?: TRAINING_TYPE, useSameSpecMock = false): TrainingStats {
    const mockCardSameSpec: SupportCardEffectData = {
      [EffectId.SPECIALTY_PRIORITY]: supCard[EffectId.SPECIALTY_PRIORITY],
      type: supCard.type,
      char_name: 'MOCK_CARD'
    } as unknown as SupportCardEffectData;
    const mockCardEmpty: SupportCardEffectData = {} as unknown as SupportCardEffectData;
    // console.log('supCard', supCard);
    return this.aggregateTrainingStats(useSameSpecMock ? mockCardSameSpec : mockCardEmpty, spec);
  }

  calcSCTraining(supCard: SupportCardEffectData, trainingType: TRAINING_TYPE, trainingLevel: LEVEL, isFriendship: boolean) {
    const basicTrainingResult: TrainingStats = this.BASIC_TRAININGS[this.selectedScenario][trainingLevel][trainingType];
    let result: TrainingStats = {};
    for (const type of Object.values(TRAINING_TYPE)) {
      const moodMulti = ((getEffectValueFn(supCard[EffectId.MOOD_EFFECT] as EffectValue) / 100 + 1) * this.AVERAGE_MOOD) / 100 + 1;
      const trEfMulti = getEffectValueFn(supCard[EffectId.TRAINING_EFFECTIVENESS] as EffectValue) / 100 + 1;

      if (basicTrainingResult[type]) {
        const bonusEffectId = this.TRAINING_TYPE_TO_EFFECT_MAP[type].bonus;
        const cardEffect = supCard[bonusEffectId];
        const bonusValue = getEffectValueFn(cardEffect as EffectValue);

        let friendshipMulti = 1;
        const isSameType = supCard.type as string === trainingType as string;
        if (isSameType && isFriendship) {
          friendshipMulti = getEffectValueFn(supCard[EffectId.FRIENDSHIP_BONUS] as EffectValue) / 100 + 1;
        }

        result[type] = (basicTrainingResult[type] + bonusValue) * moodMulti * trEfMulti * friendshipMulti;
      }
    }
    return result;
  };

  calcFullTraining(supCard: SupportCardEffectData, forSingleTrainingType?: TRAINING_TYPE): TrainingStats[] {
    // console.warn('CARD', supCard)
    let result: TrainingStats[] = [];
    let cardsSpecWeights = {...this.BASIC_SPEC_WEIGHTS};
    if (supCard.type in this.BASIC_SPEC_WEIGHTS) {
      cardsSpecWeights = {
        ...this.BASIC_SPEC_WEIGHTS,
        [supCard.type]: this.BASIC_SPEC_WEIGHTS[supCard.type as unknown as TRAINING_TYPE] + getEffectValueFn(supCard[EffectId.SPECIALTY_PRIORITY] as EffectValue)
      };
    }
    // console.log('cardsSpecWeights', cardsSpecWeights);
    const totalSpecWeight = Object.values(cardsSpecWeights).reduce((a, b) => a + b);
    // console.log('totalSpecWeight', totalSpecWeight);
    const preparedWeeks = this.prepareTrainingWeeksWithFriendship(supCard);
    // console.log(`preparedWeeks for ${supCard.char_name}`, preparedWeeks);
    preparedWeeks.forEach(trainings => {
      // console.warn('------SEGMENT-----');
      const trainingsWoRest = trainings.amount * (1 - trainings.restingPct / 100);
      // console.log('trainingsWoRest', trainingsWoRest);

      const primaryTrainings = {
        amount: trainingsWoRest * cardsSpecWeights[this.STRATEGY_PRIORITY_MAP[this.selectedStrategy]['primary']] / totalSpecWeight,
        type: this.STRATEGY_PRIORITY_MAP[this.selectedStrategy]['primary']
      };
      // console.log('primaryTrainings', primaryTrainings);
      const secondaryTrainings = {
        amount: trainingsWoRest * cardsSpecWeights[this.STRATEGY_PRIORITY_MAP[this.selectedStrategy]['secondary']] / totalSpecWeight,
        type: this.STRATEGY_PRIORITY_MAP[this.selectedStrategy]['secondary']
      };
      // console.log('secondaryTrainings', secondaryTrainings);
      const tertiaryTrainings = {
        amount: trainingsWoRest * cardsSpecWeights[this.STRATEGY_PRIORITY_MAP[this.selectedStrategy]['tertiary']] / totalSpecWeight,
        type: this.STRATEGY_PRIORITY_MAP[this.selectedStrategy]['tertiary']
      };
      // console.log('tertiaryTrainings', tertiaryTrainings);

      let allWeeksResultByTrainingType: TrainingStats = {};

      Object.values(TRAINING_TYPE).forEach(trainingType => {
        if (forSingleTrainingType && forSingleTrainingType !== trainingType) {
          return;
        }

        let lvl, amount;
        switch (trainingType) {
          case primaryTrainings.type:
            lvl = trainings.trainingLvls[0];
            amount = primaryTrainings.amount;
            break;
          case secondaryTrainings.type:
            lvl = trainings.trainingLvls[1];
            amount = secondaryTrainings.amount;
            break;
          case tertiaryTrainings.type:
            lvl = trainings.trainingLvls[2];
            amount = tertiaryTrainings.amount;
            break;
          default:
            lvl = trainings.trainingLvls[2];
            amount = tertiaryTrainings.amount;
        }

        const trainingResult = this.calcSCTraining(supCard, trainingType, lvl, trainings.isFriendship);
        // console.log(`base for ${trainingType} ${lvl}`, this.BASIC_TRAININGS[this.selectedScenario][lvl][trainingType]);
        // console.log(`training result for ${trainingType} ${lvl}`, trainingResult);
        // console.log(`amount`, amount);

        const allWeeksTrainingResult = Object.keys(trainingResult).reduce((trResult: TrainingStats, key) => {
          const attribute = key as TRAINING_TYPE;
          // console.log('trResult', trResult);
          // console.log('attribute', attribute);
          return {
            ...trResult,
            [attribute]: trainingResult[attribute]! * amount
          };
        }, {});
        allWeeksResultByTrainingType = {
          ...allWeeksResultByTrainingType,
          [trainingType]: allWeeksTrainingResult
        };
        // console.log('allWeeksResultByTrainingType', allWeeksResultByTrainingType);
      });
      result = [...result, allWeeksResultByTrainingType];    // summ?

    });
    return result;
  }

  aggregateTrainingStats(supCard: SupportCardEffectData, forSingleTrainingType?: TRAINING_TYPE): TrainingStats {
    const fullTrainingResult: TrainingStats[] = this.calcFullTraining(supCard, forSingleTrainingType);
    const aggregatedStats: TrainingStats = {};

    // Initialize all attributes
    Object.values(TRAINING_TYPE).forEach(attribute => {
      aggregatedStats[attribute] = getEffectValueFn(supCard[this.TRAINING_TYPE_TO_EFFECT_MAP[attribute].initial] as EffectValue);
    });

    // Sum all attributes across all levels and training types
    fullTrainingResult.forEach(levelData => {
      // console.log('levelData', levelData);
      Object.values(levelData).forEach((trainingTypeData: number[]) => {
        Object.entries(trainingTypeData).forEach(([attribute, value]) => {
          if (attribute !== 'energy') { // Skip energy if you don't want to aggregate it
            const currentSum = aggregatedStats[attribute as TRAINING_TYPE] || 0;
            aggregatedStats[attribute as TRAINING_TYPE] = currentSum + value;
          }
        });
      });
    });

    return aggregatedStats;
  }

  calcCardsDiff(supCard: SupportCardEffectData, forSingleTrainingType?: TRAINING_TYPE): TrainingStats {
    const cardStats = this.aggregateTrainingStats(supCard, forSingleTrainingType);
    const basicStats = this.aggregateBasicTrainings(supCard, forSingleTrainingType);
    // console.log('cardStats', cardStats);
    // console.log('basicStats', basicStats);

    return this.subtractTrainingStats(cardStats, basicStats);
  }

  private subtractTrainingStats(baseStats: TrainingStats, compareStats: TrainingStats): TrainingStats {
    const result: TrainingStats = {};

    Object.values(TRAINING_TYPE).forEach(attribute => {
      const baseValue = baseStats[attribute] || 0;
      const compareValue = compareStats[attribute] || 0;
      result[attribute] = Math.round((baseValue - compareValue) * 100) / 100;
    });

    return result;
  }

  private prepareTrainingWeeksWithFriendship(supCard: SupportCardEffectData): Array<{amount: number, restingPct: number, trainingLvls: LEVEL[], isFriendship: boolean}> {
    const trainingWeeks = this.TRAINING_WEEKS[this.selectedScenario];
    const preparedTrainingWeeks: Array<{amount: number, restingPct: number, trainingLvls: LEVEL[], isFriendship: boolean}> = [];
    let cumulativeWeeks = 0;
    const initialFriendshipGauge = getEffectValueFn(supCard[EffectId.INITIAL_FRIENDSHIP_GAUGE] as EffectValue);
    const requiredWeeksForFriendship = this.INITIAL_FRD_GAUGE_MAP[initialFriendshipGauge];
    for (const trainingPeriod of trainingWeeks) {
      const periodStartWeek = cumulativeWeeks;
      const periodEndWeek = cumulativeWeeks + trainingPeriod.amount;
      if (!requiredWeeksForFriendship || periodStartWeek >= requiredWeeksForFriendship) {
        preparedTrainingWeeks.push({...trainingPeriod, isFriendship: true});
      } else if (periodEndWeek <= requiredWeeksForFriendship) {
        preparedTrainingWeeks.push({...trainingPeriod, isFriendship: false});
      } else {
        const weeksWithoutFriendship = requiredWeeksForFriendship - periodStartWeek;
        const weeksWithFriendship = trainingPeriod.amount - weeksWithoutFriendship;
        preparedTrainingWeeks.push({amount: weeksWithoutFriendship, restingPct: trainingPeriod.restingPct, trainingLvls: trainingPeriod.trainingLvls, isFriendship: false});
        preparedTrainingWeeks.push({amount: weeksWithFriendship, restingPct: trainingPeriod.restingPct, trainingLvls: trainingPeriod.trainingLvls, isFriendship: true});
      }
      cumulativeWeeks += trainingPeriod.amount;
    }
    return preparedTrainingWeeks;
  }

  getRatings(supCard: SupportCardEffectData, selectedStrategy: STRATEGY = STRATEGY.SPEED_WITS, selectedScenario = SCENARIO.UNITY_CUP) {
    this.selectedStrategy = selectedStrategy;
    this.selectedScenario = selectedScenario;
    const allStatsDiffSumRating: number = Math.round(Object.values(this.calcCardsDiff(supCard)).reduce((a, b) => a + b) * 100) / 100;
    const specRating: number = Math.round(Object.values(this.aggregateTrainingStats(supCard, supCard.type as unknown as TRAINING_TYPE)).reduce((a, b) => a + b) * 100) / 100;
    return {allStatsDiffSumRating, specRating};
  }
}
