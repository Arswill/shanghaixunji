import { describe, it, expect } from 'vitest'
import { creatures, getCreaturesByProvince, getCreatureById } from './loadCreatures'

describe('loadCreatures', () => {
  it('loads all 104 creatures', () => {
    expect(creatures.length).toBe(104)
  })
  it('each creature has audio and image fields', () => {
    for (const c of creatures) {
      expect(c).toHaveProperty('audio')
      expect(c).toHaveProperty('image')
    }
  })
  it('getCreaturesByProvince filters by province', () => {
    const shaanxiCreatures = getCreaturesByProvince('陕西')
    expect(shaanxiCreatures.length).toBeGreaterThan(0)
    expect(shaanxiCreatures.every(c => c.province === '陕西')).toBe(true)
  })
  it('getCreatureById finds by id', () => {
    const bi_fang = getCreatureById('bi-fang')
    expect(bi_fang).toBeDefined()
    expect(bi_fang?.name).toBe('毕方')
  })
})
