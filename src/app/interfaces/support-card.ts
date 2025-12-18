import { Rarity } from './display-support-card';
import {SupportCardType} from './support-card-type.enum';

export interface SupportCardHintOther {
  /**
   * Type of the hint.
   * Example: 1
   */
  hint_type: number;
  /**
   * Value of the hint.
   * Example: 1
   */
  hint_value: number;
}

export interface SupportCardHints {
  /**
   * Array of other hints.
   * Example: [{ hint_type: 1, hint_value: 1 }]
   */
  hint_others: SupportCardHintOther[];
  /**
   * Array of skill hint IDs.
   * Example: [200162, 200232]
   */
  hint_skills: number[];
}

export interface UniqueEffect {
  type: number;
  value: number;
  value_1?: number;
  value_2?: number;
  value_3?: number;
  value_4?: number;
}

export interface UniqueProperty {
  effects: UniqueEffect[];
  level: number;
  unique_desc?: string;
}

export interface SupportCard {
  /**
   * Character ID associated with the support card.
   * Example: 1001
   */
  char_id: number;
  /**
   * Name of the character.
   * Example: "Special Week"
   */
  char_name: string;
  /**
   * An array of arrays representing various effects.
   * Example: [[1, 5, -1, -1, 10, 10, -1, -1, 15, -1, -1, -1]]
   */
  effects: number[][];
  /**
   * Array of event skill IDs.
   * Example: [200762]
   */
  event_skills: number[];
  /**
   * Array of event skill IDs (English version), optional.
   * Example: [200582] (from another entry)
   */
  event_skills_en?: number[];
  /**
   * Hints object containing skill and other hints.
   */
  hints: SupportCardHints;
  /**
   * Japanese name of the support card.
   * Example: "スペシャルウィーク"
   */
  name_jp: string;
  /**
   * Korean name of the support card.
   * Example: "스페셜 위크"
   */
  name_ko: string;
  /**
   * Traditional Chinese name of the support card.
   * Example: "特別週"
   */
  name_tw: string;
  /**
   * How the support card is obtained.
   * Example: "gacha"
   */
  obtained: string;
  /**
   * Rarity of the support card.
   * Example: 1
   */
  rarity: Rarity;
  /**
   * Release date of the support card.
   * Example: "2021-02-24"
   */
  release: string;
  /**
   * English release date of the support card.
   * Example: "2025-06-26"
   */
  release_en?: string;
  /**
   * Korean release date of the support card.
   * Example: "2022-06-20"
   */
  release_ko?: string;
  /**
   * Traditional Chinese release date of the support card.
   * Example: "2022-06-27"
   */
  release_zh_tw?: string;
  /**
   * Unique identifier for the support card.
   * Example: 10001
   */
  support_id: number;
  /**
   * Type of the support card.
   * Example: "guts"
   */
  type: SupportCardType;
  /**
   * Optional unique property for some support cards.
   */
  unique?: UniqueProperty;
  /**
   * URL friendly name of the support card.
   * Example: "10001-special-week"
   */
  url_name: string;
}
