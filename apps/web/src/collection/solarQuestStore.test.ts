import { describe, it, expect, beforeEach } from 'vitest'
import { useSolarQuestStore, SOLAR_REWARD_BOND } from './solarQuestStore'
import { useBondStore } from '../bond/bondStore'

describe('useSolarQuestStore', () => {
  beforeEach(() => {
    useSolarQuestStore.getState().reset()
    useBondStore.getState().reset()
    localStorage.clear()
  })

  it('claimReward 标记节气为已领取，并为节气神兽增加羁绊', () => {
    expect(useSolarQuestStore.getState().isClaimed('夏至')).toBe(false)

    const before = useBondStore.getState().getBond('bi-fang').score
    const ok = useSolarQuestStore.getState().claimReward('夏至', ['bi-fang'])

    expect(ok).toBe(true)
    expect(useSolarQuestStore.getState().isClaimed('夏至')).toBe(true)
    const after = useBondStore.getState().getBond('bi-fang').score
    expect(after - before).toBe(SOLAR_REWARD_BOND)
  })

  it('claimReward 为节气对应的多个神兽均增加羁绊', () => {
    const ok = useSolarQuestStore.getState().claimReward('冬至', ['bi-fang', 'jiu-wei-hu'])
    expect(ok).toBe(true)
    expect(useBondStore.getState().getBond('bi-fang').score).toBe(SOLAR_REWARD_BOND)
    expect(useBondStore.getState().getBond('jiu-wei-hu').score).toBe(SOLAR_REWARD_BOND)
  })

  it('已领取的节气不可重复领取（返回 false 且不再加羁绊）', () => {
    useSolarQuestStore.getState().claimReward('夏至', ['bi-fang'])
    const scoreAfterFirst = useBondStore.getState().getBond('bi-fang').score

    const ok = useSolarQuestStore.getState().claimReward('夏至', ['bi-fang'])
    expect(ok).toBe(false)
    expect(useSolarQuestStore.getState().isClaimed('夏至')).toBe(true)
    expect(useBondStore.getState().getBond('bi-fang').score).toBe(scoreAfterFirst)
  })

  it('不同节气相互独立领取', () => {
    expect(useSolarQuestStore.getState().claimReward('夏至', ['bi-fang'])).toBe(true)
    expect(useSolarQuestStore.getState().isClaimed('夏至')).toBe(true)
    expect(useSolarQuestStore.getState().isClaimed('冬至')).toBe(false)
    expect(useSolarQuestStore.getState().claimReward('冬至', ['bi-fang'])).toBe(true)
    expect(useSolarQuestStore.getState().isClaimed('冬至')).toBe(true)
  })

  it('reset 清空所有领取记录', () => {
    useSolarQuestStore.getState().claimReward('夏至', ['bi-fang'])
    useSolarQuestStore.getState().reset()
    expect(useSolarQuestStore.getState().isClaimed('夏至')).toBe(false)
    expect(useSolarQuestStore.getState().claimedTerms).toEqual({})
  })
})
