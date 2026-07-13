import { describe, it, expect } from 'vitest'
import { CreaturesFileSchema } from './creatures.schema'
import verified from '../../../../data/verified/creatures_verified.json' with { type: 'json' }

describe('Verified creature data consistency', () => {
  it('all creatures pass schema validation', () => {
    const result = CreaturesFileSchema.safeParse(verified)
    expect(result.success).toBe(true)
    if (!result.success) {
      console.error('Schema errors:', result.error.issues)
    }
  })

  it('every creature has non-empty province', () => {
    for (const c of verified as any[]) {
      expect(c.province).toBeTruthy()
      expect(c.province.length).toBeGreaterThan(0)
    }
  })

  it('every creature has confidence in enum', () => {
    const validConfidences = ['high', 'medium', 'creative']
    for (const c of verified as any[]) {
      expect(validConfidences).toContain(c.confidence)
    }
  })

  it('every creature has art_description >= 20 chars', () => {
    for (const c of verified as any[]) {
      expect(c.art_description).toBeTruthy()
      expect(c.art_description.length).toBeGreaterThanOrEqual(20)
    }
  })

  it('every creature has non-empty original_text', () => {
    for (const c of verified as any[]) {
      expect(c.original_text).toBeTruthy()
      expect(c.original_text.length).toBeGreaterThan(5)
    }
  })

  it('every creature has non-empty translation', () => {
    for (const c of verified as any[]) {
      expect(c.translation).toBeTruthy()
      expect(c.translation.length).toBeGreaterThan(5)
    }
  })

  it('creature IDs are unique', () => {
    const ids = (verified as any[]).map(c => c.id)
    const uniqueIds = new Set(ids)
    expect(ids.length).toBe(uniqueIds.size)
  })

  it('every creature has a scroll', () => {
    for (const c of verified as any[]) {
      expect(c.scroll).toBeTruthy()
      expect(c.scroll.length).toBeGreaterThan(0)
    }
  })
})
