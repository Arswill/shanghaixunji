import { describe, it, expect, beforeEach } from 'vitest'
import { useCollection } from './useCollection'

describe('useCollection', () => {
  beforeEach(() => {
    useCollection.getState().reset()
  })

  it('starts empty', () => {
    expect(useCollection.getState().discovered).toEqual([])
    expect(useCollection.getState().discoveredCount()).toBe(0)
  })

  it('discover returns true for new creature', () => {
    expect(useCollection.getState().discover('bi-fang')).toBe(true)
    expect(useCollection.getState().discoveredCount()).toBe(1)
  })

  it('discover returns false for already discovered', () => {
    useCollection.getState().discover('bi-fang')
    expect(useCollection.getState().discover('bi-fang')).toBe(false)
    expect(useCollection.getState().discoveredCount()).toBe(1)
  })

  it('isDiscovered checks correctly', () => {
    useCollection.getState().discover('bi-fang')
    expect(useCollection.getState().isDiscovered('bi-fang')).toBe(true)
    expect(useCollection.getState().isDiscovered('jiu-wei-hu')).toBe(false)
  })

  it('reset clears all', () => {
    useCollection.getState().discover('bi-fang')
    useCollection.getState().discover('jiu-wei-hu')
    useCollection.getState().reset()
    expect(useCollection.getState().discoveredCount()).toBe(0)
  })
})
