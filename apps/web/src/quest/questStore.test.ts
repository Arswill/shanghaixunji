import { describe, it, expect, beforeEach } from 'vitest'
import { useQuestStore } from './questStore'
import { useCollection } from '../collection/useCollection'
import { useGuardianStore } from '../guardian/guardianStore'
import { useBondStore } from '../bond/bondStore'

describe('useQuestStore', () => {
  beforeEach(() => {
    useQuestStore.getState().reset()
    useCollection.getState().reset()
    useGuardianStore.getState().reset()
    useBondStore.getState().reset()
    localStorage.clear()
  })

  const find = (id: string) =>
    useQuestStore.getState().quests.find((q) => q.id === id)!

  it('初始化时包含多个主线任务，且均未开始', () => {
    const quests = useQuestStore.getState().quests
    expect(quests.length).toBeGreaterThan(1)
    expect(quests.every((q) => q.progress === 0)).toBe(true)
    expect(quests.every((q) => !q.completed)).toBe(true)
    expect(quests.every((q) => !q.rewardClaimed)).toBe(true)
    expect(quests.map((q) => q.id)).toEqual(
      expect.arrayContaining([
        'main-start',
        'main-volume',
        'main-provinces',
        'main-outer',
        'main-half',
        'main-guardian',
      ]),
    )
  })

  it('recomputeProgress 基于 discovered/visitedProvinces/guardianId 正确计算进度', () => {
    useCollection.getState().discover('bi-fang')
    useGuardianStore.getState().setGuardian('bi-fang', '湖南')

    useQuestStore.getState().recomputeProgress()

    // main-start：发现 1/1 → 完成
    expect(find('main-start').progress).toBe(1)
    expect(find('main-start').completed).toBe(true)
    // main-guardian：已抽取守护神 → 完成
    expect(find('main-guardian').progress).toBe(1)
    expect(find('main-guardian').completed).toBe(true)
    // main-provinces：访问省份从 discovered 神兽的 province 字段推导
    // 毕方在湖南省（或 province 字段），至少 1 个省份
    expect(find('main-provinces').progress).toBeGreaterThanOrEqual(1)
  })

  it('recomputeProgress 在无任何进展时所有任务保持未完成', () => {
    useQuestStore.getState().recomputeProgress()

    const quests = useQuestStore.getState().quests
    expect(quests.every((q) => q.progress === 0)).toBe(true)
    expect(quests.every((q) => !q.completed)).toBe(true)
  })

  it('claimReward 标记已完成任务为已领取，并发放羁绊奖励', () => {
    useCollection.getState().discover('bi-fang')
    useQuestStore.getState().recomputeProgress()

    const start = find('main-start')
    expect(start.completed).toBe(true)
    expect(start.rewardClaimed).toBe(false)

    const before = useBondStore.getState().getBond('bi-fang').score
    useQuestStore.getState().claimReward('main-start')
    const after = useBondStore.getState().getBond('bi-fang').score

    expect(after - before).toBe(start.reward.amount)
    expect(find('main-start').rewardClaimed).toBe(true)
  })

  it('claimReward 对未完成任务不发放奖励', () => {
    useQuestStore.getState().recomputeProgress()
    const provinces = find('main-provinces')
    expect(provinces.completed).toBe(false)

    useQuestStore.getState().claimReward('main-provinces')
    expect(find('main-provinces').rewardClaimed).toBe(false)
  })

  it('claimReward 不可重复领取同一任务奖励', () => {
    useCollection.getState().discover('bi-fang')
    useQuestStore.getState().recomputeProgress()
    useQuestStore.getState().claimReward('main-start')
    const score1 = useBondStore.getState().getBond('bi-fang').score

    useQuestStore.getState().claimReward('main-start')
    const score2 = useBondStore.getState().getBond('bi-fang').score

    expect(score2).toBe(score1)
    expect(find('main-start').rewardClaimed).toBe(true)
  })
})
