import { describe, it, expect } from 'vitest'
import { getRarity, RARITY_CONFIG } from './rarity'

describe('rarity', () => {
  it('SSR for famous creatures', () => {
    expect(getRarity({ id: 'jiu-wei-hu', confidence: 'medium' })).toBe('SSR')
    expect(getRarity({ id: 'tao-tie', confidence: 'medium' })).toBe('SSR')
  })
  it('SR for high/medium confidence non-famous', () => {
    expect(getRarity({ id: 'bi-fang', confidence: 'high' })).toBe('SR')
    expect(getRarity({ id: 'some-creature', confidence: 'medium' })).toBe('SR')
  })
  it('R for creative confidence', () => {
    expect(getRarity({ id: 'some-creative', confidence: 'creative' })).toBe('R')
  })
  it('SSR overrides confidence', () => {
    expect(getRarity({ id: 'chu-shuo', confidence: 'creative' })).toBe('SSR')
  })
  it('RARITY_CONFIG has all three tiers', () => {
    expect(RARITY_CONFIG.SSR.stars).toBe('★★★')
    expect(RARITY_CONFIG.SR.stars).toBe('★★')
    expect(RARITY_CONFIG.R.stars).toBe('★')
  })
})
