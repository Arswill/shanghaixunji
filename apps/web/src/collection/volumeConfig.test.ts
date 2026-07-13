import { describe, it, expect } from 'vitest'
import { creatures } from '../data/loadCreatures'
import {
  VOLUMES,
  getVolumeForCreature,
  getVolumeById,
  getCreaturesInVolume,
  getVolumeProgress,
  isVolumeComplete,
} from './volumeConfig'

describe('volumeConfig', () => {
  it('defines exactly 5 volumes', () => {
    expect(VOLUMES).toHaveLength(5)
  })

  it('each volume has required fields and a unique color', () => {
    const colors = new Set<string>()
    for (const v of VOLUMES) {
      expect(v.id).toBeTruthy()
      expect(v.name).toBeTruthy()
      expect(v.subtitle).toBeTruthy()
      expect(v.description.length).toBeGreaterThan(0)
      expect(v.scrolls.length).toBeGreaterThan(0)
      expect(v.color).toMatch(/^#[0-9a-fA-F]{6}$/)
      expect(v.narrative.length).toBeGreaterThan(20)
      colors.add(v.color)
    }
    expect(colors.size).toBe(5)
  })

  it('spec-defined scrolls match the requested themes', () => {
    const byName = new Map(VOLUMES.map((v) => [v.name, v]))
    expect(byName.get('南山经')!.scrolls).toEqual(['南山经'])
    expect(byName.get('西山经')!.scrolls).toEqual(['西山经'])
    expect(byName.get('北山经')!.scrolls).toEqual(['北山经'])
    expect(byName.get('东山经')!.scrolls).toEqual(['东山经'])
    const haiwai = byName.get('海外大荒')!
    expect(haiwai.scrolls).toContain('大荒北经')
    expect(haiwai.scrolls).toContain('海外东经')
  })

  it('getVolumeForCreature returns correct volume by scroll', () => {
    expect(getVolumeForCreature('南山经').name).toBe('南山经')
    expect(getVolumeForCreature('西山经').name).toBe('西山经')
    expect(getVolumeForCreature('大荒北经').name).toBe('海外大荒')
  })

  it('every creature in the dataset maps to some volume (no creature is lost)', () => {
    for (const c of creatures) {
      const v = getVolumeForCreature(c.scroll)
      expect(VOLUMES).toContain(v)
      // 确保该 scroll 确实在该卷的 scrolls 列表里（含回退情形）
      expect(v.scrolls.includes(c.scroll) || v.id === 'hai-wai').toBe(true)
    }
  })

  it('getVolumeById round-trips', () => {
    for (const v of VOLUMES) {
      expect(getVolumeById(v.id)).toBe(v)
    }
    expect(getVolumeById('nonexistent')).toBeUndefined()
  })

  it('getCreaturesInVolume + getVolumeProgress compute correctly', () => {
    const nan = VOLUMES.find((v) => v.name === '南山经')!
    const inVol = getCreaturesInVolume(nan)
    const expectedTotal = creatures.filter((c) => c.scroll === '南山经').length
    expect(inVol.length).toBe(expectedTotal)

    const { found, total } = getVolumeProgress(nan, [])
    expect(total).toBe(expectedTotal)
    expect(found).toBe(0)

    const firstId = inVol[0].id
    const p1 = getVolumeProgress(nan, [firstId])
    expect(p1.found).toBe(1)
  })

  it('isVolumeComplete is true only when all found', () => {
    const nan = VOLUMES.find((v) => v.name === '东山经')!
    const inVol = getCreaturesInVolume(nan)
    const allIds = inVol.map((c) => c.id)
    expect(isVolumeComplete(nan, [])).toBe(false)
    expect(isVolumeComplete(nan, allIds)).toBe(true)
    expect(isVolumeComplete(nan, allIds.slice(1))).toBe(false)
  })

  it('all 5 volumes cover every creature in the dataset', () => {
    const covered = new Set<string>()
    for (const v of VOLUMES) {
      for (const c of getCreaturesInVolume(v)) covered.add(c.id)
    }
    expect(covered.size).toBe(creatures.length)
  })
})
