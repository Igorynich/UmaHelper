import { z } from 'zod';

const TraineeSkillEvoSchema = z.object({
  old: z.number(),
  new: z.number(),
});

export const TraineeItemDataSchema = z.object({
  aptitude: z.array(z.string()), // Example: ["A", "E", "G", "E", "A", "A", "C", "A", "A", "G"]
  base_stats: z.array(z.number()), // Example: [87, 102, 74, 88, 99]
  card_id: z.number(), // Example: 101502
  char_id: z.number(), // Example: 1004
  costume: z.number(), // Example: 101510
  event_statuses: z.array(z.number()), // Example: [7]
  five_star_stats: z.array(z.number()), // Example: [106, 124, 91, 107, 122]
  four_star_stats: z.array(z.number()), // Example: [96, 113, 83, 98, 110]
  name_en: z.string(), // Example: "TM Opera O"
  name_jp: z.string(), // Example: "テイエムオペラオー"
  name_ko: z.string(), // Example: "티엠 오페라 오"
  name_tw: z.string(), // Example: "好歌劇"
  obtained: z.string(), // Example: "gacha"
  preview_id: z.number(), // Example: 30004
  rarity: z.number(), // Example: 3
  release: z.string(), // Example: "2021-12-31"
  release_en: z.string().optional(), // Example: "2026-01-29"
  release_ko: z.string().optional(), // Example: "2023-04-21"
  release_zh_tw: z.string().optional(), // Example: "2023-05-05"
  skills_awakening: z.array(z.number()), // Example: [200252, 200351, 200202, 202011]
  skills_event: z.array(z.number()), // Example: [200142, 200582, 201152]
  skills_evo: z.array(TraineeSkillEvoSchema), // Example: [{old: 200351, new: 101502111}, ...]
  skills_innate: z.array(z.number()), // Example: [201312, 202012, 200352]
  skills_unique: z.array(z.number()), // Example: [110151]
  stat_bonus: z.array(z.number()), // Example: [14, 8, 0, 0, 8]
  talent_group: z.number(), // Example: 101502
  tid: z.string(), // Example: "Z"
  title: z.string(), // Example: "Blue Dazzle"
  title_en_gl: z.string(), // Example: "[New Year, Same Radiance!]"
  title_jp: z.string(), // Example: "[初晴・青き絢爛]"
  title_ko: z.string(), // Example: "[새해 창천・푸르른 현란]"
  title_tw: z.string(), // Example: "[初晴．湛藍絢爛]"
  url_name: z.string(), // Example: "101502-tm-opera-o"
  version: z.string().optional(), // Example: "new_year"
});

export const TraineeRaceSchema = z.object({
  distance: z.number(), // Example: 2000
  fans_gained: z.number(), // Example: 700
  fans_needed: z.number(), // Example: 0
  grade: z.number(), // Example: 900
  group: z.number(), // Example: 7
  icon_id: z.number(), // Example: 9002
  id: z.number(), // Example: 9391
  name_en: z.string(), // Example: "Junior Make Debut"
  name_ja: z.string(), // Example: "ジュニア級メイクデビュー"
  name_ko: z.string(), // Example: "주니어급 데뷔전"
  name_zh_tw: z.string(), // Example: "新手級閃耀出道戰"
  terrain: z.number(), // Example: 1
  track: z.number(), // Example: 10008
  url_name: z.string().optional(), // Example: "satsuki-sho"
});

export const TraineeObjectiveSchema = z.object({
  cond_id: z.number(), // Example: 1067
  cond_type: z.number(), // Example: 1
  cond_value: z.number(), // Example: 0
  cond_value_2: z.number(), // Example: 0
  order: z.number(), // Example: 1
  race_choice: z.number(), // Example: 0
  race_choice_details: z.number(), // Example: 0
  race_type: z.number(), // Example: 0
  races: z.array(TraineeRaceSchema).optional(), // Example: [{id: 9391, ...}]
  target_type: z.number(), // Example: 1
  turn: z.number(), // Example: 12
  turns_break: z.number().optional(), // Example: 15
});

export const TraineeCharDataSchema = z.object({
  active: z.boolean(), // Example: "tm-opera-o" (Interface enforces boolean)
  active_en: z.boolean(), // Example: "e"
  active_ko: z.boolean(), // Example: 1015
  active_zh_tw: z.boolean(), // Example: "テイエムオペラオー"
  birth_day: z.number(),
  birth_month: z.number(),
  birth_year: z.number(),
  char_id: z.number(), // Example: true
  color_main: z.string(), // Example: "F271C4"
  color_sub: z.string(), // Example: "FBE415"
  height: z.number(), // Example: 156
  name_en: z.string(), // Example: "TM Opera O"
  name_ja: z.string(), // Example: "テイエムオペラオー"
  name_ko: z.string(), // Example: "티엠 오페라 오"
  name_zh_tw: z.string(), // Example: "好歌劇"
  playable: z.boolean(), // Example: true
  playable_en: z.boolean(), // Example: true
  playable_ko: z.boolean(), // Example: true
  playable_zh_tw: z.boolean(), // Example: true
  race: z.string(), // Example: "uma"
  rl: z.object({
    active: z.string(), // Example: "1998-2002"
    country: z.string(), // Example: "jp"
    death: z.string().nullable().optional(), // Example: "2018-05-17"
    earnings: z.number(), // Example: 1835189000
    races: z.number(), // Example: 26
    record: z.string(), // Example: "14-6-3-3"
    win_stats: z.array(z.number()), // Example: [7, 1, 12, 8]
    wins: z.number(), // Example: 14
  }),
  sex: z.number(), // Example: 1
  three_sizes: z.object({ // Example: {b: 76, w: 55, h: 80}
    b: z.number(),
    w: z.number(),
    h: z.number(),
  }),
  tid: z.string(), // Example: "e"
  url_name: z.string(), // Example: "tm-opera-o"
  va_en: z.string(), // Voice Actor: Example: "Sora Tokui"
  va_ja: z.string(), // Example: "徳井青空"
  va_ko: z.string(), // Example: "토쿠이 소라"
  va_link: z.string(), // Example: "https://myanimelist.net/people/11361/Sora_Tokui"
  va_zh_tw: z.string(), // Example: "徳井青空"
});

export const TraineeSchema = z.object({
  isCharCard: z.boolean(),
  itemData: TraineeItemDataSchema,
  objectiveData: z.array(TraineeObjectiveSchema),
  charData: TraineeCharDataSchema,
  eventData: z.object({
    en: z.string()
  })
});

export type TraineeSchemaType = z.infer<typeof TraineeSchema>;
