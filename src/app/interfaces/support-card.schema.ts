import { z } from 'zod';
import { Rarity } from './display-support-card';
import { SupportCardType } from './support-card-type.enum';

const SupportCardHintOtherSchema = z.object({
  hint_type: z.number(),
  hint_value: z.number(),
});

const SupportCardHintsSchema = z.object({
  hint_others: z.array(SupportCardHintOtherSchema),
  hint_skills: z.array(z.number()),
});

const UniqueEffectSchema = z.object({
  type: z.number(),
  value: z.number(),
  value_1: z.number().optional(),
  value_2: z.number().optional(),
  value_3: z.number().optional(),
  value_4: z.number().optional(),
});

const UniquePropertySchema = z.object({
  effects: z.array(UniqueEffectSchema),
  level: z.number(),
  unique_desc: z.string().optional(),
});

export const SupportCardSchema = z.object({
  char_id: z.number(),
  char_name: z.string(),
  effects: z.array(z.array(z.number())),
  event_skills: z.array(z.number()),
  event_skills_en: z.array(z.number()).optional(),
  hints: SupportCardHintsSchema,
  name_jp: z.string(),
  name_ko: z.string(),
  name_tw: z.string(),
  obtained: z.string(),
  rarity: z.enum(Rarity),
  release: z.string(),
  release_en: z.string().optional(),
  release_ko: z.string().optional(),
  release_zh_tw: z.string().optional(),
  support_id: z.number(),
  type: z.enum(SupportCardType),
  unique: UniquePropertySchema.optional(),
  url_name: z.string(),
});
