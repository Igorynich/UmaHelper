import {EffectId, UniqEffectId} from '../interfaces/effect-id.enum';
import {UniqueEffect} from '../interfaces/support-card';
import {SkillType, SkillTypeMap} from '../interfaces/skill';

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

export type UniqEffectToStringFn = (ue: UniqueEffect) => string;      // think about using whole card instead of ue, and use it to map things like STAT_BONUS to exact stat(speed, stam etc)
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
  [UniqEffectId.FRIENDSHIP_BONUS_BASED_ON_MISSING_ENERGY]: {
    short: (ue) => `${effectMap[ue.value as EffectId]?.short}(UP TO +${ue.value_3}) PER MISSING ENERGY`,
    long: (ue) => `${effectMap[ue.value as EffectId]?.long}(${ue.value_4} - ${ue.value_3}) Based on Missing Energy(max at <=${ue.value_2}))`,
    effect: (ue) => EffectId.FRIENDSHIP_BONUS
  },
  [UniqEffectId.TR_EF_ON_MAX_ENERGY]: {
    short: (ue) => `TR EF (UP TO +${ue.value_4}) ON MAX ENERGY`,
    long: (ue) => `Training Effectiveness (${ue.value_3} - ${ue.value_4}) Based on Max Energy (max at >=120)`,
    effect: (ue) => EffectId.TRAINING_EFFECTIVENESS
  },
  [UniqEffectId.TR_EF_ON_ALL_SUPPORTS_BOND]: {
    short: (ue) => `TR EF (UP TO +20) ON ALL SUPPORTS BOND`,
    long: (ue) => `Training Effectiveness (up to +20): +1 per ${ue.value_1} Bond of All Supports`,
    effect: (ue) => EffectId.TRAINING_EFFECTIVENESS
  },
  [UniqEffectId.TR_EF_ON_SUPPORTS_ON_SAME_TRAINING]: {
    short: (ue) => `TR EF (+${ue.value_1}) PER SUPPORT ON SAME TRAINING`,
    long: (ue) => `Training Effectiveness (+${ue.value_1}) for Every Other Support Card on the Same Training(up to +${ue.value_1! * 5})`,
    effect: (ue) => EffectId.TRAINING_EFFECTIVENESS
  },
  [UniqEffectId.TR_EF_ON_TRAINING_FACILITY_LVL]: {
    short: (ue) => `TR EF (+${ue.value_1}) PER TRAINING LVL`,
    long: (ue) => `Training Effectiveness (+${ue.value_1}) for Every Level of the Current Training Facility(up to +${ue.value_1! * 5})`,
    effect: (ue) => EffectId.TRAINING_EFFECTIVENESS
  },
  [UniqEffectId.CHANCE_TO_REMOVE_FAILURE_CHANCE]: {
    short: (ue) => `${ue.value}% CHANCE TO SET FAILURE TO 0%`,
    long: (ue) => `${ue.value}% Chance to Set Failure Rate to 0%`
  },
  [UniqEffectId.ENERGY_COST_REDUCTION_WHEN_ON_FRIENDSHIP_TRAINING]: {
    short: (ue) => `${effectMap[ue.value as EffectId]?.short}(+${ue.value_1}) WHEN ON FRIENDSHIP TRAINING`,
    long: (ue) => `${effectMap[ue.value as EffectId]?.long}(+${ue.value_1}) When Participating in Friendship Training`,
    effect: (ue) => EffectId.ENERGY_COST_REDUCTION
  },
  [UniqEffectId.TR_EF_ON_CURRENT_ENERGY]: {
    short: (ue) => `TR EF (UP TO +${ue.value_2}) ON CURRENT ENERGY`,
    long: (ue) => `Training Effectiveness (up to +${ue.value_2}): 1 per ${ue.value_1} Current Energy(up to 100)`,
    effect: (ue) => EffectId.TRAINING_EFFECTIVENESS
  },
  [UniqEffectId.INITIAL_FRIENDSHIP_GAUGE_FOR_ALL_SUPPORTS]: {
    short: (ue) => `${effectMap[ue.value as EffectId]?.short}(+${ue.value_1}) FOR ALL SUPPORTS`,
    long: (ue) => `${effectMap[ue.value as EffectId]?.long}(+${ue.value_1}) for All Support Cards in the Deck`
  },
  [UniqEffectId.EFFECT_BONUS_FOR_EVERY_SKILL_OF_CERTAIN_TYPE]: {
    short: (ue) => `${effectMap[ue.value_1 as EffectId]?.short}(+${ue.value_2}) PER ${SkillTypeMap[ue.value as SkillType]?.short} SKILL`,
    long: (ue) => `${effectMap[ue.value_1 as EffectId]?.long}(+${ue.value_2}) for Every ${SkillTypeMap[ue.value as SkillType]?.long} Skill(max ${ue.value_3})`,
    effect: (ue) => ue.value_1 as EffectId
  },
  [UniqEffectId.TR_EF_ON_LEVEL_OF_ALL_TRAINING_FACILITIES]: {
    short: (ue) => `TR EF (UP TO +${ue.value_2}) ON LVL OF ALL TRAININGS`,
    long: (ue) => `Training Effectiveness (up to +${ue.value_2}): Scales Based on Level of All Training Facilities(up to Combined Level of ${ue.value_1})`,
    effect: (ue) => EffectId.TRAINING_EFFECTIVENESS
  },
  [UniqEffectId.EXTRA_TRAINING_LOCATION_ON_BOND]: {
    short: (ue) => `EXTRA TRAINING(${ue.value}) ON BOND>=${ue.value_1}`,
    long: (ue) => `Extra Training Location Appearances(${ue.value}), when Bond is ${ue.value_1} or Higher`
  },
  [UniqEffectId.SPEC_PRIORITY_FOR_ALL_SUPPORTS_ON_BOND]: {
    short: (ue) => `${effectMap[EffectId.SPECIALTY_PRIORITY]?.short}(+${ue.value}) FOR ALL SUPPORTS ON BOND>=${ue.value_2}`,
    long: (ue) => `${effectMap[EffectId.SPECIALTY_PRIORITY]?.long}(+${ue.value}) for All Support Cards in the Deck, when Bond is ${ue.value_2} or Higher`
  },
  [UniqEffectId.STAT_BONUS_ON_AMOUNT_DIFFERENT_SUP_CARDS_IN_DECK]: {
    short: (ue) => `STAT BONUS(+${ue.value_2}) ON DIFF CARD TYPES(UP TO +${ue.value_3})`,
    long: (ue) => `Specialty Stat Bonus(+${ue.value_2}) per Different Support Card Type in Your Deck(up to ${ue.value_3}), when Bond is ${ue.value_1} or Higher`
  },
  [UniqEffectId.BONUS_BOND_GAIN_FOR_ALL_SUPPORTS]: {
    short: (ue) => `BONUS BOND GAIN(+${ue.value} or +${ue.value_1}) FOR ALL SUPPORTS`,
    long: (ue) => `Bonus Bond Gain(+${ue.value}) for All Support Cards in the Deck, +${ue.value_1} - if They're On the Same Training`
  },
  [UniqEffectId.EFFECT_BONUS_TO_SUPPORTS_ON_SAME_TRAINING_FOR_NEXT_TURN]: {
    short: (ue) => `${effectMap[ue.value as EffectId]?.short}(+${ue.value_1}) FOR SOME SUPPORTS`,
    long: (ue) => `${effectMap[ue.value as EffectId]?.long}(+${ue.value_1}) to Other Supports on the Same Training Facility for the Next Turn`
  },
};
