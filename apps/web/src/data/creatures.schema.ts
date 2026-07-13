import { z } from 'zod'

export const CreatureSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  name: z.string().min(1),
  pinyin: z.string(),
  province: z.string().min(1),
  original_text: z.string().min(1),
  source: z.string().min(1),
  translation: z.string().min(1),
  modern_location: z.string(),
  confidence: z.enum(['high', 'medium', 'creative']),
  confidence_notes: z.string().optional().default(''),
  description: z.string(),
  scroll: z.string(),
  art_description: z.string().optional().refine(val => val !== '', 'art_description 不能为空'),
})
export type Creature = z.infer<typeof CreatureSchema>
export const CreaturesFileSchema = z.array(CreatureSchema)
