import { describe, it, expect } from 'vitest'
import { CreatureSchema, CreaturesFileSchema } from './creatures.schema'
import verified from '../../../../data/verified/creatures_verified.json' with { type: 'json' }

describe('CreatureSchema', () => {
  it('accepts a valid creature', () => {
    const valid = {
      id: 'bi-fang', name: '毕方', pinyin: 'Bì Fāng', province: '陕西',
      original_text: '有鸟焉，其状如鹤', source: '《山海经·西山经》',
      translation: 'A bird like a crane', modern_location: 'Shaanxi Baoji',
      confidence: 'high',
      description: 'fire bird',
      confidence_notes: '据谭其骧《中国历史地图集》及袁珂《山海经校注》考证',
      scroll: '西山经', art_description: 'one-legged crane, blue body, red beak',
    }
    expect(CreatureSchema.safeParse(valid).success).toBe(true)
  })
  it('rejects missing province', () => {
    const bad = { id: 'x', name: 'X', pinyin: '', original_text: '', source: '',
                  translation: '', modern_location: '', confidence: 'low', description: '', scroll: '' }
    expect(CreatureSchema.safeParse(bad).success).toBe(false)
  })
  it('confidence must be high|medium|creative', () => {
    const base = { id: 'x', name: 'X', pinyin: 'X', province: '陕西', original_text: 'text',
      source: 'src', translation: 'tr', modern_location: '', description: '', scroll: '' }
    expect(CreatureSchema.safeParse({ ...base, confidence: 'high' }).success).toBe(true)
    expect(CreatureSchema.safeParse({ ...base, confidence: 'maybe' }).success).toBe(false)
  })

  it('all verified creatures parse', () => {
    expect(CreaturesFileSchema.safeParse(verified).success).toBe(true)
  })
})
