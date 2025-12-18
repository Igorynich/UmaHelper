import { z } from 'zod';
import { Rarity, EffectType, Activation, SkillType } from './skill';

const EffectSchema = z.object({
  type: z.enum(EffectType),
  value: z.number(),
});

const ConditionGroupSchema = z.object({
  base_time: z.number(),
  condition: z.string(),
  cd: z.number().optional(),
  effects: z.array(EffectSchema),
  precondition: z.string().optional(),
});

const GeneVersionSchema = z.object({
  activation: z.enum(Activation),
  condition_groups: z.array(ConditionGroupSchema),
  cost: z.number(),
  desc_en: z.string(),
  desc_ko: z.string(),
  desc_tw: z.string(),
  iconid: z.number(),
  id: z.number(),
  inherited: z.boolean(),
  name_en: z.string(),
  name_ko: z.string(),
  name_tw: z.string(),
  parent_skills: z.array(z.number()),
  rarity: z.enum(Rarity),
});

const LocDetailsSchema = z.object({
  char: z.array(z.number()),
  type: z.array(z.nativeEnum(SkillType)).optional(),
});

const LocSchema = z.object({
  en: LocDetailsSchema,
  ko: LocDetailsSchema,
  zh_tw: LocDetailsSchema,
});

export const SkillSchema = z.object({
  activation: z.enum(Activation),
  char: z.array(z.number()),
  condition_groups: z.array(ConditionGroupSchema),
  desc_en: z.string(),
  desc_ko: z.string(),
  desc_tw: z.string(),
  endesc: z.string(),
  enname: z.string(),
  gene_version: GeneVersionSchema.optional(),
  iconid: z.number(),
  id: z.number(),
  jpdesc: z.string(),
  jpname: z.string(),
  loc: LocSchema.optional(),
  name_en: z.string(),
  name_ko: z.string(),
  name_tw: z.string(),
  rarity: z.enum(Rarity),
  type: z.array(z.enum(SkillType)),
  sup_e: z.any().optional(),
  sup_hint: z.any().optional(),
  evo_cond: z.any().optional(),
  pre_evo: z.any().optional(),
  evo: z.any().optional(),
  versions: z.any().optional(),
});
