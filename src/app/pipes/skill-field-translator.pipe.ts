import { Pipe, PipeTransform } from '@angular/core';
import { Activation, Effect, Rarity, SkillEffect } from '../interfaces/skill';

@Pipe({
  name: 'skillFieldTranslator',
  standalone: true,
})
export class SkillFieldTranslatorPipe implements PipeTransform {
  private effectTypeMap: Record<SkillEffect, string> = {
    [SkillEffect.SpeedStat]: 'Speed Stat',
    [SkillEffect.StaminaStat]: 'Stamina Stat',
    [SkillEffect.PowerStat]: 'Power Stat',
    [SkillEffect.GutsStat]: 'Guts Stat',
    [SkillEffect.WitsStat]: 'Wits Stat',
    [SkillEffect.ChangeStrategy]: 'Change Strategy',
    [SkillEffect.FieldOfView]: 'Field of View',
    [SkillEffect.Stamina]: 'Stamina',
    [SkillEffect.StartReactionTime]: 'Start Reaction Time',
    [SkillEffect.RushTime]: 'Rush Time',
    [SkillEffect.StartDelay]: 'Start Delay',
    [SkillEffect.CurrentSpeedDecrease]: 'Current Speed',
    [SkillEffect.CurrentSpeedIncrease]: 'Current Speed',
    [SkillEffect.TargetSpeed]: 'Target Speed',
    [SkillEffect.LaneMovementSpeed]: 'Lane Movement Speed',
    [SkillEffect.RushChance]: 'Rush Chance',
    [SkillEffect.Acceleration]: 'Acceleration',
    [SkillEffect.ChangeLane]: 'Change Lane',
    [SkillEffect.CarnivalPointGain]: 'Carnival Point Gain',
    [SkillEffect.AllStatsIncreasedDuringCarnival]: 'All Stats Increased During Carnival',
    [SkillEffect.MoodMaxedDuringCarnival]: 'Mood Maxed During Carnival',
  };

  private conditionKeyMap: { [key: string]: string } = {
    'running_style': 'Running Strategy',
    'phase_random': 'Race Phase',
    'order': 'Position',
    'order_rate': 'Position',
    'rotation': 'Race Direction',
    'ground_condition': 'Track Condition',
    'season': 'Season',
    'track_id': 'Track',
    'popularity': 'Popularity',
    'running_style_count_same': 'Characters with the same running strat(incl. you)',
    'running_style_count_same_rate': 'Percent of characters with the same running strat(incl. you)',
    'same_skill_horse_count': 'Characters with this skill(incl. you)',
    'post_number': 'Gate Block(not Number)',
    'grade': 'Grade of the Race',
    'weather': 'Weather',
    'running_style_equal_popularity_one': 'Running strategy is the same as the most popular character',
    'random_lot': 'Random Chance',
    'all_corner_random': 'Corner',
    'straight_random': 'Straight',
    'phase': 'Current Phase',
    'change_order_onetime': 'Change of Position',
    'is_lastspurt': 'On Last Spurt',
    'phase_firsthalf_random': 'Random Point of the Phase',
    'phase_laterhalf_random': 'Second Half of the Phase',
    'is_finalcorner': 'On Final Corner or Beyond',
    'is_finalcorner_random': 'Random Point of the Final Corner',
    'last_straight_random': 'Random Point on Last Straight',
    'corner_random': 'Random Point of the',
    'corner': 'Corner',
    'is_behind_in': 'Uma Behind You is Closer to the Fence Than You',
    'distance_type': 'Distance Type',
    'overtake_target_time': 'Target of an Overtake',
    'is_last_straight': 'On Last Straight',
    'is_last_straight_onetime': 'Entered Last Straight',
    'always': 'Always',
    'is_overtake': 'You have an Overtake Target',
    'overtake_target_no_order_up_time': 'Overtake Target In Sight',
    'is_exist_chara_id': 'Character with this ID is in the race',
    'distance_rate': 'Distance',
    'lastspurt': 'Last Spurt Status',
    'distance_diff_rate': 'Distance from Leader',
    'ground_type': 'Ground Type',
    'is_basis_distance': 'Distance Type',
    'blocked_front_continuetime': 'Blocked from the Front',
    'blocked_side_continuetime': 'Blocked from the Side',
    'blocked_front': 'Blocked from the Front',
    'behind_near_lane_time': 'An Opponent Right Behind You',
    'accumulatetime': 'Time from Race Start',
    'temptation_opponent_count_behind': 'Number of Players Behind That Rushing',
    'temptation_opponent_count_infront': 'Number of Players In Front That Rushing',
    'running_style_count_oikomi_otherself': 'Number of End-Closers in the Race(w/o you)',
    'running_style_count_sashi_otherself': 'Number of Late-Surgers in the Race(w/o you)',
    'running_style_count_senko_otherself': 'Number of Pace-Chasers in the Race(w/o you)',
    'running_style_count_nige_otherself': 'Number of Front-Runners in the Race(w/o you)',
    'is_temptation': 'Rushing',
    'running_style_temptation_opponent_count_oikomi': 'Number of End-Closer Opponents That Rushing',
    'running_style_temptation_opponent_count_sashi': 'Number of Late-Surger Opponents That Rushing',
    'running_style_temptation_opponent_count_senko': 'Number of Pace-Chaser Opponents That Rushing',
    'running_style_temptation_opponent_count_nige': 'Number of Front-Runner Opponents That Rushing',
    'distance_rate_after_random': 'Random Point of the Race',
    'is_move_lane': 'Moved',
    'temptation_count': 'Times Rushed',
    'is_finalcorner_laterhalf': 'On the Second Half of the Final Corner',
    'down_slope_random': 'Random Point on the Downhill',
    'up_slope_random': 'Random Point of the Uphill',
    'activate_count_start': 'Number of Skills Activated in the Early-Race',
    'infront_near_lane_time': 'Runner in Front of You',
    'lane_type': 'Lane',
    'hp_per': 'Remaining HP(stamina)',
    'bashin_diff_behind': 'Distance Between You and Closest Opponent Behind',
    'bashin_diff_infront': 'Distance between You and Closest Opponent Ahead',
    'is_surrounded': 'Surrounded',
    'activate_count_middle': 'Skills Activated Mid-Race',
    'activate_count_end_after': 'Skills Activated Late-Race or Later',
    'activate_count_all': 'Skills Activated',
    'activate_count_heal': 'Recovery Skills Activated',
    'is_activate_any_skill': 'Activated Any Skill',
    'near_count': 'Opponents Near',
    'remain_distance_viewer_id': 'Remaining Distance for Any Player Character',
    'remain_distance': 'Remaining Distance',
    'slope': 'Running Uphill or Downhill',
    'distance_diff_top': 'Distance from Leader',
    'change_order_up_finalcorner_after': 'Overtakes on the Final Corner',
    'change_order_up_end_after': 'Overtakes after Entering the Late-Race',
    'straight_front_type': 'Straight Type',
    'compete_fight_count': 'Complete Duels',
    'is_badstart': 'Started Late'
  };

  private conditionValueMap: { [key: string]: { [value: string]: string } } = {
    'running_style': {
      '1': 'Front Runner',
      '2': 'Pace Chaser',
      '3': 'Late Surger',
      '4': 'End Closer'
    },
    'phase': {
      '0': 'Early-Race',
      '1': 'Mid-Race',
      '2': 'Late-Race',
      '3': 'Last Spurt'
    },
    'phase_random': {
      '0': 'Early-Race',
      '1': 'Mid-Race',
      '2': 'Late-Race',
      '3': 'Last Spurt'
    },
    'rotation': {
      '1': 'Clockwise/Right',
      '2': 'Counterclockwise/Left'
    },
    'ground_condition': {
      '1': 'Good',
      '2': 'Slightly Heavy',
      '3': 'Heavy',
      '4': 'Bad'
    },
    'season': {
      '1': 'Spring',
      '2': 'Summer',
      '3': 'Fall',
      '4': 'Winter',
      '5': 'Cherry Blossom'
    },
    'track_id': {
      '10001': 'Sapporo (札幌)',
      '10002': 'Hakodate (函館)',
      '10003': 'Niigata (新潟)',
      '10004': 'Fukushima (福島)',
      '10005': 'Nakayama (中山)',
      '10006': 'Tokyo (東京)',
      '10007': 'Chukyo (中京)',
      '10008': 'Kyoto (京都)',
      '10009': 'Hanshin (阪神)',
      '10010': 'Kokura (小倉)',
      '10101': 'Ooi (大井)',
      '10103': 'Kawasaki (川崎)',
      '10104': 'Funabashi (船橋)',
      '10105': 'Morioka (盛岡)'
    },
    'grade': {
      '100': 'G1',
      '200': 'G2',
      '300': 'G3',
      '400': 'OP',
      '700': 'Pre-OP',
      '800': 'Maiden',
      '900': 'Debut',
      '999': 'Daily'
    },
    'weather': {
      '1': 'Sunny',
      '2': 'Cloudy',
      '3': 'Rainy',
      '4': 'Snowy'
    },
    'corner': {
      '0': 'Not a corner',
      '1': 'First corner',
      '2': 'Second corner',
      '3': 'Third corner',
      '4': 'Fourth corner'
    },
    'distance_type': {
      '1': 'Sprint',
      '2': 'Mile',
      '3': 'Medium',
      '4': 'Long'
    },
    'is_exist_chara_id': {
      '1002': 'Silence Suzuka'
    },
    'lastspurt': {
      '0': 'Not Enough Stamina to Even Finish at Base Speed',
      '1': 'Enough Stamina to Run Above Base Speed, but not Enough to Finish at Max Speed',
      '2': 'Enough Stamina to Finish at Max Speed'
    },
    'ground_type': {
      '1': 'Turf',
      '2': 'Dirt'
    },
    'is_basis_distance': {
      '0': 'Non-Standard(non-multi of 400)',
      '1': 'Standard(multi of 400)'
    },
    'is_move_lane': {
      '1': 'Closer to the Fence',
      '2': 'Further from the Fence'
    },
    /*'lane_type': {
      '0.2': 'Inner',
      '0.4': 'Middle',
      '0.6': 'Outer',
      '999': 'Outside'
    }*/
    'corner_random': {
      '1': 'First Corner',
      '2': 'Second Corner',
      '3': 'Third Corner',
      '4': 'Fourth Corner'
    },
    'slope': {
      '0': 'No Slope',
      '1': 'Uphill',
      '2': 'Downhill'
    },
    'straight_front_type': {
      '1': 'Straight in Front of the Audience',
      '2': 'Straight on the Opposite Side from the Audience'
    }
  };

  private conditionOperatorMap: { [key: string]: string } = {
    '==': '=',
    '>=': '>=',
    '<=': '<=',
    '>': '>',
    '<': '<',
  };

  toTranslate = new Set();

  transform(value: any, field: string): string {
    switch (field) {
      case 'activation':
        switch (value) {
          case Activation.Guaranteed:
            return 'Guaranteed';
          case Activation.WitCheck:
            return 'Wit check';
          default:
            return String(value);
        }
      case 'rarity':
        switch (value) {
          case Rarity.Normal:
            return 'Normal';
          case Rarity.Rare:
            return 'Rare';
          case Rarity.Unique:
            return 'Unique';
          default:
            return String(value);
        }
      case 'base_time':
        switch (value) {
          case -1:
            return 'Infinite';
          case 0:
            return 'Instant Effect';
          default:
            return `${value / 10000} s`;
        }
      case 'cd':
        return `${value / 10000} s`;
      case 'cost':
        return value ? String(value) : '-';
      case 'effects':
        if (Array.isArray(value)) {
          return (value as Effect[]).map(effect => {
            if (!this.effectTypeMap[effect.type]) {
              this.toTranslate.add(effect);
              console.error(this.toTranslate);
            }
            if (effect.type === 31) {
              // console.warn('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
            }
            const effectName = this.effectTypeMap[effect.type] || `Unknown Effect (${effect.type})`;
            const effectValue = effect.value / 10000; // Assuming division by 10000
            const displayedEffValue = effectValue > 0 ? `+${effectValue}` : `${effectValue}`;
            const effectScale: string = effect.value_scale ? ', scales' : '';
            return `${effectName} (${displayedEffValue}${effectScale})`;
          }).join('<br>');
        }
        return String(value);
      case 'condition':
      case 'precondition':
        if (typeof value === 'string') {
          return value.split('&').map(andPart =>
            andPart.split('@').map(orPart => {
              const match = orPart.match(/^([a-zA-Z_]+)([<>=!]+)(.*)$/);
              if (!match) {
                return orPart;
              }
              const [, key, operator, val] = match;
              return this.getConditionDesc(key, operator, val);
            }).join(' <br><b>OR</b><br> ')
          ).join(',<br>');
        }
        return String(value);
      default:
        return String(value);
    }
  }

  private getConditionDesc(key: string, operator: string, value: string): string {
    /*if (!this.conditionKeyMap[key]) {
      this.toTranslate.add(`${key}${operator}${value}`);
      console.error(this.toTranslate);
    }*/
    const translatedKey = this.conditionKeyMap[key] || key;
    const translatedOperator = this.conditionOperatorMap[operator] || operator;
    const translatedValue = this.conditionValueMap[key]?.[value] || value;
    switch (key) {
      case 'order_rate':
        return `${translatedKey} ${translatedOperator} ${translatedValue}% of the Pack`;
      case 'distance_rate':
        return `${translatedKey} ${translatedOperator} ${translatedValue}% of the Track`;
      case 'distance_diff_rate':
        return `${translatedKey} ${translatedOperator} ${translatedValue}% of the Peloton Length`;
      case 'order':
        return `${translatedKey} ${translatedOperator} ${translatedValue}`; // as the default, but lets keep separate
      // just a key group
      case 'running_style_equal_popularity_one':
      case 'always':
      case 'is_finalcorner_random':
      case 'is_overtake':
      case 'is_behind_in':
      case 'down_slope_random':
      case 'up_slope_random':
      case 'last_straight_random':
      case 'is_activate_any_skill':
        if (value !== '1' || operator !== '==') {
          console.error('Potential error', key, operator, value);
        }
        return `${translatedKey}`;

        // true-false
      case 'is_finalcorner':
      case 'is_lastspurt':
      case 'is_last_straight':
      case 'is_last_straight_onetime':
      case 'is_finalcorner_laterhalf':
      case 'is_surrounded':
      case 'is_temptation':
      case 'blocked_front':
      case 'is_badstart':
        const trueCond = `${translatedOperator}${translatedValue}` === '=1' || `${translatedOperator}${translatedValue}` === '!=0';
        return trueCond ? `${translatedKey}` : `Not ${translatedKey}`;
      // true-false with value
      case 'slope':
        if (`${translatedOperator}` === '=') {
          return `Running On ${translatedValue}`;
        }
        return `Not Running On ${translatedValue}`;

      // percents
      case 'random_lot':
      case 'hp_per':
        return `${translatedKey} ${translatedOperator} ${translatedValue}%`;
      // seconds
      case 'accumulatetime':
        return `${translatedKey} ${translatedOperator} ${translatedValue}s`;

      case 'bashin_diff_behind':
      case 'bashin_diff_infront':
        return `${translatedKey} ${translatedOperator} ${translatedValue} horse lengths`;

      case 'all_corner_random':
      case 'straight_random':
        return `Any ${translatedKey}`;
      case 'change_order_onetime':
        return `${translatedOperator}${translatedValue}` === '<0' ? 'Overtook an Opponent' : 'Has Been Overtaken';
      case 'phase_firsthalf_random':
        return `Random Point of the First Half of ${this.conditionValueMap['phase']?.[value] || value}`;
      case 'phase_laterhalf_random':
        return `Random Point of the Second Half of ${this.conditionValueMap['phase']?.[value] || value}`;
      case 'corner_random':
        return `${translatedKey} ${translatedValue}`;
      case 'distance_rate_after_random':
        return `Random Point after ${translatedValue}% of The Race Distance`;

      case 'corner':
        if (`${translatedOperator}${value}` === '!=0') {
          return 'Any Corner'
        }
        return translatedOperator === '!=' ? `Not ${translatedValue}` : `${translatedValue}`;

      case 'temptation_count':
        return `${translatedOperator}${translatedValue}` === '=0' ? 'Have Not Been Rushing' : 'Been Rushing';
      case 'overtake_target_time':
      case 'overtake_target_no_order_up_time':
      case 'blocked_front_continuetime':
      case 'blocked_side_continuetime':
      case 'infront_near_lane_time':
      case 'behind_near_lane_time':
        return `${translatedKey} for ${translatedOperator}${translatedValue} seconds`;

      case 'is_exist_chara_id':
        return `${translatedValue} is in the Race`;

      case 'lastspurt':
        return `${translatedKey}: ${translatedValue}`;

      case 'is_move_lane':
        return `${translatedKey} ${translatedValue}`;

      case 'lane_type':
        if (+translatedValue <= 0.2) {
          return `Running In Inner Lane`;
        } else if (+translatedValue <= 0.4) {
          return `Running In Middle Lane`;
        } else if (+translatedValue <= 0.6) {
          return `Running In Outer Lane`;
        } else {
          return `Running On the Outside`;
        }
      case 'straight_front_type':
        return `On ${translatedValue}`;


      default:
        return `${translatedKey} ${translatedOperator} ${translatedValue}`;
    }
  }
}
