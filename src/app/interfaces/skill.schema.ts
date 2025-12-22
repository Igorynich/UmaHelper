import { z } from 'zod';
import { Activation, Rarity, SkillEffect } from './skill';

const EffectSchema = z.object({
  type: z.number(), // Likely an enum (SkillEffect), but allows any number for flexibility.
  value: z.number(),
  value_scale: z.number().optional(),
});

const ConditionGroupSchema = z.object({
  base_time: z.number(),
  condition: z.string(),
  cd: z.number().optional(),
  effects: z.array(EffectSchema),
  precondition: z.string().optional(),
});

export const SkillSchema = z.object({
  activation: z.enum(Activation),
  char: z.array(z.number()).optional(),
  condition_groups: z.array(ConditionGroupSchema),
  cost: z.number().optional(),
  desc_en: z.string().optional(),
  desc_ko: z.string().optional(),
  desc_tw: z.string().optional(),
  endesc: z.string(),
  enname: z.string(),
  iconid: z.number(),
  id: z.number(),
  jpdesc: z.string(),
  jpname: z.string(),
  name_en: z.string().optional(),
  name_ko: z.string().optional(),
  name_tw: z.string().optional(),
  rarity: z.enum(Rarity),
  type: z.array(z.string()),
});
