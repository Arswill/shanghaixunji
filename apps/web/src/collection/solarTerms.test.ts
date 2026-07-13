import { describe, it, expect } from 'vitest'
import { SOLAR_TERMS, getCurrentSolarTerm, isCreatureInSeason, getCurrentSeasonCreatureIds } from './solarTerms'
import { creatures } from '../data/loadCreatures'

describe('solarTerms', () => {
  it('defines 24 solar terms', () => {
    expect(SOLAR_TERMS).toHaveLength(24)
  })

  it('every solar term creature id exists in the dataset', () => {
    const ids = new Set(creatures.map((c) => c.id))
    for (const t of SOLAR_TERMS) {
      expect(t.creatureIds.length).toBeGreaterThan(0)
      for (const id of t.creatureIds) {
        expect(ids.has(id)).toBe(true)
      }
      expect(t.name).toBeTruthy()
      expect(t.creatureName).toBeTruthy()
      expect(t.description.length).toBeGreaterThan(0)
      expect(t.date).toMatch(/^\d{2}-\d{2}$/)
    }
  })

  it('24 solar terms are unique by name and creature', () => {
    const names = new Set(SOLAR_TERMS.map((t) => t.name))
    expect(names.size).toBe(24)
    const creatureIds = new Set(SOLAR_TERMS.flatMap((t) => t.creatureIds))
    expect(creatureIds.size).toBe(24)
  })

  it('spec-required mappings are present', () => {
    const byName = new Map(SOLAR_TERMS.map((t) => [t.name, t]))
    expect(byName.get('立春')!.creatureIds).toContain('qi-lin')
    expect(byName.get('雨水')!.creatureIds).toContain('ying-long')
    expect(byName.get('惊蛰')!.creatureIds).toContain('ba-she')
    expect(byName.get('春分')!.creatureIds).toContain('jiu-wei-hu')
    expect(byName.get('夏至')!.creatureIds).toContain('bi-fang')
    expect(byName.get('冬至')!.creatureIds).toContain('chu-shuo')
    expect(byName.get('大寒')!.creatureIds).toContain('xing-tian')
  })

  it('getCurrentSolarTerm returns 冬至 for late December', () => {
    expect(getCurrentSolarTerm(new Date('2026-12-25')).name).toBe('冬至')
    expect(getCurrentSolarTerm(new Date('2026-12-22')).name).toBe('冬至')
  })

  it('getCurrentSolarTerm returns 小寒 for early January (cross-year wrap)', () => {
    expect(getCurrentSolarTerm(new Date('2026-01-03')).name).toBe('冬至')
    expect(getCurrentSolarTerm(new Date('2026-01-06')).name).toBe('小寒')
    expect(getCurrentSolarTerm(new Date('2026-01-19')).name).toBe('小寒')
  })

  it('getCurrentSolarTerm returns 夏至 for late June', () => {
    expect(getCurrentSolarTerm(new Date('2026-06-21')).name).toBe('夏至')
    expect(getCurrentSolarTerm(new Date('2026-06-27')).name).toBe('夏至')
  })

  it('isCreatureInSeason matches the current term only', () => {
    const now = new Date('2026-06-27') // 夏至 → bi-fang
    expect(isCreatureInSeason('bi-fang', now)).toBe(true)
    expect(isCreatureInSeason('jiu-wei-hu', now)).toBe(false)
    expect(getCurrentSeasonCreatureIds(now)).toEqual(['bi-fang'])
  })
})
