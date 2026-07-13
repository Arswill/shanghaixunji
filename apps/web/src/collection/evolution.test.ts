import { describe, it, expect } from 'vitest'
import { creatures } from '../data/loadCreatures'
import { getVolumeForCreature, getCreaturesInVolume } from './volumeConfig'
import {
  getEvolutionStage,
  EVOLUTION_CONFIG,
  EVOLUTION_THRESHOLDS,
  getVolumeDiscoveryRate,
  creaturesUntilNextEvolution,
} from './evolution'

describe('evolution', () => {
  it('exposes three stages with icons', () => {
    expect(EVOLUTION_CONFIG[1].icon).toBe('📜')
    expect(EVOLUTION_CONFIG[2].icon).toBe('📖')
    expect(EVOLUTION_CONFIG[3].icon).toBe('🔮')
    expect(EVOLUTION_THRESHOLDS.stage2).toBe(0.3)
    expect(EVOLUTION_THRESHOLDS.stage3).toBe(0.6)
  })

  it('returns stage 1 when not discovered', () => {
    expect(getEvolutionStage('bi-fang', [])).toBe(1)
    expect(getEvolutionStage('bi-fang', ['jiu-wei-hu'])).toBe(1)
  })

  it('returns stage 1 just after discovery (rate < 30%)', () => {
    expect(getEvolutionStage('bi-fang', ['bi-fang'])).toBe(1)
  })

  it('reaches stage 2 at >=30% volume discovery', () => {
    // 取一个卷册，发现 >=30% 的神兽后，该卷任一已发现神兽应为二阶
    const nan = getVolumeForCreature('南山经')
    const inVol = getCreaturesInVolume(nan)
    const need = Math.ceil(0.3 * inVol.length)
    const discovered = inVol.slice(0, need).map((c) => c.id)
    expect(getEvolutionStage(discovered[0], discovered)).toBe(2)

    // 不足 30% 时仍为一阶
    const below = inVol.slice(0, need - 1).map((c) => c.id)
    if (below.length > 0) {
      expect(getEvolutionStage(below[0], below)).toBe(1)
    }
  })

  it('reaches stage 3 at >=60% volume discovery', () => {
    const nan = getVolumeForCreature('东山经')
    const inVol = getCreaturesInVolume(nan)
    const need = Math.ceil(0.6 * inVol.length)
    const discovered = inVol.slice(0, need).map((c) => c.id)
    expect(getEvolutionStage(discovered[0], discovered)).toBe(3)
  })

  it('getVolumeDiscoveryRate is between 0 and 1', () => {
    const c = creatures[0]
    expect(getVolumeDiscoveryRate(c.id, [])).toBe(0)
    const vol = getVolumeForCreature(c.scroll)
    const all = getCreaturesInVolume(vol).map((x) => x.id)
    expect(getVolumeDiscoveryRate(c.id, all)).toBeCloseTo(1, 5)
  })

  it('creaturesUntilNextEvolution is 0 at stage 3', () => {
    const nan = getVolumeForCreature('东山经')
    const inVol = getCreaturesInVolume(nan)
    const discovered = inVol.map((c) => c.id)
    expect(creaturesUntilNextEvolution(discovered[0], discovered)).toBe(0)
  })

  it('creaturesUntilNextEvolution decreases as more are discovered', () => {
    const nan = getVolumeForCreature('东山经')
    const inVol = getCreaturesInVolume(nan)
    const first = inVol[0].id
    const a = creaturesUntilNextEvolution(first, [first])
    const need2 = Math.ceil(0.3 * inVol.length)
    const b = creaturesUntilNextEvolution(first, inVol.slice(0, need2).map((c) => c.id))
    expect(b).toBeLessThanOrEqual(a)
  })
})
