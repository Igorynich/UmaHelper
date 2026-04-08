import {EffectId, UniqEffectId} from '../interfaces/effect-id.enum';
import {UniqueEffect} from '../interfaces/support-card';

export const effectMap: Record<EffectId, { short: string; long: string; unit?: string; }> = {
  [EffectId.FRIENDSHIP_BONUS]: { short: 'FRD', long: 'Friendship Bonus', unit: '%' },
  [EffectId.MOOD_EFFECT]: { short: 'MOOD', long: 'Mood Effect', unit: '%' },
  [EffectId.SPEED_BONUS]: { short: '+SPD', long: 'Speed Bonus' },
  [EffectId.STAMINA_BONUS]: { short: '+STA', long: 'Stamina Bonus' },
  [EffectId.POWER_BONUS]: { short: '+PWR', long: 'Power Bonus' },
  [EffectId.GUTS_BONUS]: { short: '+GUT', long: 'Guts Bonus' },
  [EffectId.WIT_BONUS]: { short: '+WIT', long: 'Wit Bonus' },
  [EffectId.TRAINING_EFFECTIVENESS]: { short: 'TR EF', long: 'Training Effectiveness', unit: '%' },
  [EffectId.INITIAL_SPEED]: { short: 'INIT SPD', long: 'Initial Speed' },
  [EffectId.INITIAL_STAMINA]: { short: 'INIT STA', long: 'Initial Stamina' },
  [EffectId.INITIAL_POWER]: { short: 'INIT PWR', long: 'Initial Power' },
  [EffectId.INITIAL_GUTS]: { short: 'INIT GUT', long: 'Initial Guts' },
  [EffectId.INITIAL_WIT]: { short: 'INIT WIT', long: 'Initial Wit' },
  [EffectId.INITIAL_FRIENDSHIP_GAUGE]: { short: 'INIT FRD', long: 'Initial Friendship Gauge' },
  [EffectId.RACE_BONUS]: { short: 'RACE', long: 'Race Bonus', unit: '%' },
  [EffectId.FAN_BONUS]: { short: 'FAN', long: 'Fan Bonus', unit: '%' },
  [EffectId.HINT_LEVELS]: { short: 'HNT LV', long: 'Hint Levels', unit: 'Lv' },
  [EffectId.HINT_FREQUENCY]: { short: 'HNT FR', long: 'Hint Frequency', unit: '%' },
  [EffectId.SPECIALTY_PRIORITY]: { short: 'SPEC', long: 'Specialty Priority' },
  [EffectId.EVENT_RECOVERY]: { short: 'EVT REC', long: 'Event Recovery', unit: '%' },
  [EffectId.EVENT_EFFECTIVENESS]: { short: 'EVT EFF', long: 'Event Effectiveness', unit: '%' },
  [EffectId.FAILURE_PROTECTION]: { short: 'FAIL PROT', long: 'Failure Protection', unit: '%' },
  [EffectId.ENERGY_COST_REDUCTION]: { short: 'NRG CST', long: 'Energy Cost Reduction', unit: '%' },
  [EffectId.SKILL_POINT_BONUS]: { short: '+SP', long: 'Skill Point Bonus' },
  [EffectId.WIT_FRIENDSHIP_RECOVERY]: { short: 'WIT REC', long: 'Wit Friendship Recovery' },
  [EffectId.INITIAL_SKILL_POINTS]: { short: 'INIT SP', long: 'Initial Skill Points' },
};

export type UniqEffectToStringFn = (ue: UniqueEffect) => string;
export type UniqEffectToEffectIdFn = (ue: UniqueEffect) => EffectId;

export const uniqEffectMap: Record<UniqEffectId, { short: UniqEffectToStringFn; long: UniqEffectToStringFn; unit?: string; effect?: UniqEffectToEffectIdFn}> = {
  [UniqEffectId.EFFECT_BONUS_DEPENDENT_ON_GAUGE]: {
    short: (ue) => `${effectMap[ue.value_1 as EffectId]?.short}(${ue.value_2}) At FRD>=${ue.value}`,
    long: (ue) => `${effectMap[ue.value_1 as EffectId]?.long}(${ue.value_2}) At Friendship Gauge>=${ue.value}`,
    effect: (ue) => ue.value_1 as EffectId
  },
  [UniqEffectId.NON_SPEC_TR_EF_DEPENDENT_ON_GAUGE]: {
    short: (ue) => `NON-SPEC TR EF(${ue.value_1}) AT FRD>=${ue.value}`, // 'COND NON-SPEC TREF',
    long: (ue) => `Non-Spec Training Effectiveness(${ue.value_1}) AT Friendship Gauge>=${ue.value}`,  //'Non-spec Tr.Effect When Bond Gauge Higher Than 80'
    effect: (ue) => EffectId.TRAINING_EFFECTIVENESS
  },
  [UniqEffectId.INCREASED_TR_EF_ON_AMOUNT_DIFFERENT_SUP_CARDS_IN_DECK]: {
    short: (ue) => `TR EF(+${ue.value_1}) ON DIFF CARD TYPES>=${ue.value}`,
    long: (ue) => `Training Effectiveness(+${ue.value_1}), When At Least ${ue.value} Different Types of Support Cards in Your Deck`,  //'Non-spec Tr.Effect When Bond Gauge Higher Than 80'
    effect: (ue) => EffectId.TRAINING_EFFECTIVENESS
  },
  [UniqEffectId.INCREASED_TR_EF_ON_FANS]: {
    short: (ue) => `TR EF +1(TO +20) PER ${ue.value} FANS`,
    long: (ue) => `Training Effectiveness +1(up to +20) Per ${ue.value} fans`,  //'Non-spec Tr.Effect When Bond Gauge Higher Than 80'
    effect: (ue) => EffectId.TRAINING_EFFECTIVENESS
  },
  [UniqEffectId.INIT_STAT_FOR_EVERY_CARD_IN_SUPPORT_DECK]: {
    short: (ue) => `INIT SPEC STAT(+${ue.value}) FOR EVERY CARD`,
    long: (ue) => `Gain Initial Stat (+${ue.value}), where Stat is the Type of the Card, for Every Card in your Support Deck (Friend and Group Types give (+${ue.value}) to every stat)`,  //'Non-spec Tr.Effect When Bond Gauge Higher Than 80'
  },
  [UniqEffectId.FRIENDSHIP_BONUS_ON_FRIENDSHIP_TRAININGS]: {
    short: (ue) => `${effectMap[ue.value_1 as EffectId]?.short}(+${ue.value_2}) PER FRIEND TRAINING(${ue.value})`,
    long: (ue) => `${effectMap[ue.value_1 as EffectId]?.long}(+${ue.value_2}) per Friendship Training(up to ${ue.value} times)`,
    effect: (ue) => EffectId.FRIENDSHIP_BONUS
  },
};
