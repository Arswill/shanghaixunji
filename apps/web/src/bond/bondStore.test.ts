import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { useBondStore, LEVEL_THRESHOLDS, type GiftType } from './bondStore'

const CREATURE_ID = 'bi-fang'
const OLD_GIFT: GiftType = 'cinnabar'
const LIKED_GIFT: GiftType = 'ancient-jade'

describe('useBondStore', () => {
  beforeEach(() => {
    useBondStore.getState().reset()
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-06-27T10:00:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('starts with an empty bond for unknown creature', () => {
    const bond = useBondStore.getState().getBond(CREATURE_ID)
    expect(bond.level).toBe('stranger')
    expect(bond.score).toBe(0)
    expect(bond.chatCount).toBe(0)
    expect(bond.giftCount).toBe(0)
    expect(bond.encounterCount).toBe(0)
    expect(bond.lastInteraction).toBe(0)
    expect(bond.mood).toBe('calm')
  })

  it('recordChat increments chatCount and score', () => {
    useBondStore.getState().recordChat(CREATURE_ID)
    const bond = useBondStore.getState().getBond(CREATURE_ID)
    expect(bond.chatCount).toBe(1)
    expect(bond.score).toBe(5)
    expect(bond.lastInteraction).toBeGreaterThan(0)
  })

  it('recordEncounter increments encounterCount and score', () => {
    useBondStore.getState().recordEncounter(CREATURE_ID)
    const bond = useBondStore.getState().getBond(CREATURE_ID)
    expect(bond.encounterCount).toBe(1)
    expect(bond.score).toBe(10)
  })

  it('advances bond level when score thresholds are reached', () => {
    const store = useBondStore.getState()
    // Stranger -> Acquainted
    for (let i = 0; i < 10; i++) store.recordEncounter(CREATURE_ID)
    expect(store.getBond(CREATURE_ID).level).toBe('acquainted')

    // Acquainted -> Bonded
    for (let i = 0; i < 15; i++) store.recordEncounter(CREATURE_ID)
    expect(store.getBond(CREATURE_ID).level).toBe('bonded')

    // Bonded -> Kindred
    for (let i = 0; i < 16; i++) store.recordEncounter(CREATURE_ID)
    expect(store.getBond(CREATURE_ID).level).toBe('kindred')
  })

  it('gives more score for liked gifts and less for disliked gifts', () => {
    const store = useBondStore.getState()
    store.giveGift(CREATURE_ID, OLD_GIFT)
    const disliked = store.getBond(CREATURE_ID)
    expect(disliked.giftCount).toBe(1)
    expect(disliked.score).toBe(5)

    store.giveGift(CREATURE_ID, LIKED_GIFT)
    const liked = store.getBond(CREATURE_ID)
    expect(liked.giftCount).toBe(2)
    expect(liked.score).toBe(25)
  })

  it('tracks the last gift type and whether it was liked', () => {
    const store = useBondStore.getState()
    store.giveGift(CREATURE_ID, OLD_GIFT)
    expect(store.getLastGift(CREATURE_ID)).toEqual({ type: OLD_GIFT, liked: false })

    store.giveGift(CREATURE_ID, LIKED_GIFT)
    expect(store.getLastGift(CREATURE_ID)).toEqual({ type: LIKED_GIFT, liked: true })
  })

  it('mood becomes joyful after three consecutive chats', () => {
    const store = useBondStore.getState()
    expect(store.getMood(CREATURE_ID)).toBe('calm')
    store.recordChat(CREATURE_ID)
    store.recordChat(CREATURE_ID)
    expect(store.getMood(CREATURE_ID)).toBe('calm')
    store.recordChat(CREATURE_ID)
    expect(store.getMood(CREATURE_ID)).toBe('joyful')
  })

  it('mood becomes wary after a disliked gift', () => {
    const store = useBondStore.getState()
    store.recordChat(CREATURE_ID)
    store.giveGift(CREATURE_ID, OLD_GIFT)
    expect(store.getMood(CREATURE_ID)).toBe('wary')
  })

  it('mood becomes listless after seven days of inactivity', () => {
    const store = useBondStore.getState()
    store.recordChat(CREATURE_ID)
    expect(store.getMood(CREATURE_ID)).toBe('calm')

    vi.advanceTimersByTime(8 * 24 * 60 * 60 * 1000)
    expect(store.getMood(CREATURE_ID)).toBe('listless')
  })

  it('persists state across store instances (localStorage)', () => {
    const store = useBondStore.getState()
    store.recordChat(CREATURE_ID)
    store.giveGift(CREATURE_ID, LIKED_GIFT)

    const saved = localStorage.getItem('shanhai-bonds')
    expect(saved).toBeTruthy()

    const parsed = JSON.parse(saved!)
    expect(parsed.state.bonds[CREATURE_ID].chatCount).toBe(1)
    expect(parsed.state.bonds[CREATURE_ID].giftCount).toBe(1)
    expect(parsed.state.interactions[CREATURE_ID].length).toBe(2)
  })

  it('reset clears all bonds and interactions', () => {
    const store = useBondStore.getState()
    store.recordChat(CREATURE_ID)
    store.giveGift(CREATURE_ID, LIKED_GIFT)
    store.reset()

    expect(store.getBond(CREATURE_ID).chatCount).toBe(0)
    expect(store.getBond(CREATURE_ID).giftCount).toBe(0)
    expect(store.getLastGift(CREATURE_ID)).toBeUndefined()
  })

  it('uses threshold constants correctly', () => {
    expect(LEVEL_THRESHOLDS.stranger).toBe(0)
    expect(LEVEL_THRESHOLDS.acquainted).toBe(50)
    expect(LEVEL_THRESHOLDS.bonded).toBe(150)
    expect(LEVEL_THRESHOLDS.kindred).toBe(300)
  })
})
