export interface TraineeSkillEvo {
  old: number; // Example: 200351
  new: number; // Example: 101502111
}

export interface TraineeItemData {
  url_name: string; // Example: "101502-tm-opera-o"
  tid: string; // Example: "Z"
  card_id: number; // Example: 101502
  char_id: number; // Example: 1015
  name_en: string; // Example: "TM Opera O"
  name_jp: string; // Example: "テイエムオペラオー"
  name_ko: string; // Example: "티엠 오페라 오"
  name_tw: string; // Example: "好歌劇"
  version?: string; // Example: "new_year"
  title: string; // Example: "Blue Dazzle"
  title_jp: string; // Example: "[初晴・青き絢爛]"
  title_ko: string; // Example: "[새해 창천・푸르른 현란]"
  title_tw: string; // Example: "[初晴．湛藍絢爛]"
  title_en_gl: string; // Example: "[New Year, Same Radiance!]"
  rarity: number; // Example: 3
  costume: number; // Example: 101510
  release: string; // Example: "2021-12-31"
  release_ko?: string; // Example: "2023-04-21"
  release_zh_tw?: string; // Example: "2023-05-05"
  release_en?: string; // Example: "2026-01-29"
  obtained: string; // Example: "gacha"
  skills_unique: number[]; // Example: [110151]
  skills_innate: number[]; // Example: [201312, 202012, 200352]
  skills_evo: TraineeSkillEvo[]; // Example: [{old: 200351, new: 101502111}, ...]
  skills_awakening: number[]; // Example: [200252, 200351, 200202, 202011]
  skills_event: number[]; // Example: [200142, 200582, 201152]
  stat_bonus: number[]; // Example: [14, 8, 0, 0, 8]
  talent_group: number; // Example: 101502
  base_stats: number[]; // Example: [87, 102, 74, 88, 99]
  aptitude: string[]; // Example: ["A", "E", "G", "E", "A", "A", "C", "A", "A", "G"]
  four_star_stats: number[]; // Example: [96, 113, 83, 98, 110]
  five_star_stats: number[]; // Example: [106, 124, 91, 107, 122]
}

export interface TraineeRace {
  id: number; // Example: 9391
  name_en: string; // Example: "Junior Make Debut"
  name_jp: string; // Example: "ジュニア級メイクデビュー"
  name_ko: string; // Example: "주니어급 데뷔전"
  name_tw: string; // Example: "新手級閃耀出道戰"
  url_name?: string; // Example: "satsuki-sho"
  group: number; // Example: 7
  grade: number; // Example: 900
  track: number; // Example: 10008
  distance: number; // Example: 2000
  terrain: number; // Example: 1
  fans_needed: number; // Example: 0
  fans_gained: number; // Example: 700
  icon_id: number; // Example: 9002
}

export interface TraineeObjective {
  order: number; // Example: 1
  turn: number; // Example: 12
  cond_type: number; // Example: 1
  cond_id: number; // Example: 1067
  cond_value: number; // Example: 0
  cond_value_2: number; // Example: 0
  race_type: number; // Example: 0
  target_type: number; // Example: 1
  race_choice: number; // Example: 0
  race_choice_details: number; // Example: 0
  races?: TraineeRace[]; // Example: [{id: 9391, ...}]
  turns_break?: number; // Example: 15
}

export interface TraineeCharData {
  url_name: string; // Example: "tm-opera-o"
  tid: string; // Example: "e"
  char_id: number; // Example: 1015
  jp_name: string; // Example: "テイエムオペラオー"
  en_name: string; // Example: "TM Opera O"
  name_ko: string; // Example: "티엠 오페라 오"
  name_tw: string; // Example: "好歌劇"
  playable: boolean; // Example: true
  playable_ko: boolean; // Example: true
  playable_zh_tw: boolean; // Example: true
  playable_en: boolean; // Example: true
  active: boolean; // Example: true
  active_ko: boolean; // Example: true
  active_zh_tw: boolean; // Example: true
  active_en: boolean; // Example: true
  va_en: string; // Example: "Sora Tokui"
  va_ja: string; // Example: "徳井青空"
  va_ko: string; // Example: "토쿠이 소라"
  va_zh_tw: string; // Example: "徳井青空"
  va_link: string; // Example: "https://myanimelist.net/people/11361/Sora_Tokui"
  three_sizes: { // Example: {b: 76, w: 55, h: 80}
    b: number;
    w: number;
    h: number;
  };
  birth_day: number; // Example: 13
  birth_month: number; // Example: 3
  birth_year: number; // Example: 1996
  height: number; // Example: 156
  sex: number; // Example: 1
  race: string; // Example: "uma"
  rl: { // Example: {country: "jp", death: "2018-05-17", ...}
    country: string;
    death?: string | null;
    races: number;
    wins: number;
    record: string;
    earnings: number;
    active: string;
  };
}

export interface TraineeProfileLocaleData {
  self_intro: string; // Example: "Muahahaha! Feast your eyes upon your beautiful and powerful Overlord, T.M. Opera O! My legend... begins now!"
  tagline: string; // Example: "The pompous star of the stage. Her laugh fills the room!"
  weight: string; // Example: "Perpetually perfect (according to herself)"
  shoes: string; // Example: "Left and right: 23.0cm"
  dorm: string; // Example: "Ritto Dormitory"
  class: string; // Example: "Junior Division"
  ears: string; // Example: "Hear everything as a compliment"
  tail: string; // Example: "Seems to glisten when light hits it"
  strong: string; // Example: "Impromptu opera performances"
  weak: string; // Example: "Boring tasks"
  family: string; // Example: "She's thankful to her parents for making a beautiful daughter like her"
  secrets: string[]; // Example: ["Did you know? She's made just one huge change to her ear decoration in the past."]
}

export interface TraineeProfileData {
  char_id: number; // Example: 1015
  ja: TraineeProfileLocaleData; // Japanese locale data
  ko: TraineeProfileLocaleData; // Korean locale data
  zh_tw: TraineeProfileLocaleData; // Traditional Chinese locale data
  en: TraineeProfileLocaleData; // English locale data
}

export interface TraineeEvoSkillLoc {
  ja: string[][]; // Example: [["育成イベント「激走・福ウマ娘レース！」で福ウマ娘になる", "基礎能力[スタミナ]が600以上になる"]]
  ko: string[][]; // Example: [["육성 이벤트 「폭주·복 우마무스메 레이스!」에서 복 우마무스메가 된다", "기초 능력 [스태미나]를 600 이상으로 만든다"]]
  zh_tw: string[][]; // Example: [["在培育事件「狂奔．福賽馬娘競賽！」中成為福賽馬娘", "基礎能力[持久力]達到600以上"]]
}

export interface Trainee {
  isCharCard: boolean; // Example: true     keep?
  itemData: TraineeItemData;    // keep
  // exclude - can be decoded with event service - confirmed, but check for sus Unknown events
  /*eventData: { // Event data in different languages
    ja: string; // Japanese event data stringified JSON
    ko: string; // Korean event data stringified JSON
    zh_tw: string; // Traditional Chinese event data stringified JSON
    en: string; // English event data stringified JSON
  };*/
  objectiveData: TraineeObjective[];    // keep
  charData: TraineeCharData;      // keep, but a lot of irl stuff - check later
  // profileData: TraineeProfileData;      // mb exclude - secrets, family and shit
  /*profileArtMeta: { // Metadata for profile art   exclude - uniforms
    url_name: string; // Example: "tm-opera-o"
    images: { // Image availability flags
      uniform: boolean; // Example: true
      racing: boolean; // Example: true
      concept: boolean; // Example: true
      'starting-future': boolean; // Example: true
    };
  };*/
  /*evoLocData: { // Evolution localization data        exculde
    card_id: number; // Example: 101502
    skills: { // Skills object with skillId as key
      [skillId: string]: TraineeEvoSkillLoc; // Example: {"101502111": {ja: [[...]], ko: [[...]], zh_tw: [[...]]}}
    };
  };*/
}

export interface TraineeData {
  pageProps: Trainee; // The main trainee data
  __N_SSG: boolean; // Example: true        exclude
}
