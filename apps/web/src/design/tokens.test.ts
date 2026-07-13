import { describe, it, expect } from 'vitest'
import { palette, typeScale } from './tokens'

describe('Black Myth design tokens', () => {
  it('uses desaturated dark earth base, not parchment', () => {
    expect(palette.bg.base).toMatch(/^#(1a|1c|1e|20|2d)/i)
  })
  it('keeps cinnabar and jade as accents only', () => {
    expect(palette.accent.cinnabar).toBe('#a8332a')
    expect(palette.accent.jade).toBe('#3a6a4a')
  })
  it('has four type-scale steps minimum', () => {
    expect(Object.keys(typeScale).length).toBeGreaterThanOrEqual(4)
  })
})
