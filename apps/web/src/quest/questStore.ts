import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { useCollection } from '../collection/useCollection'
import { useGuardianStore } from '../guardian/guardianStore'
import { useBondStore } from '../bond/bondStore'
import { creatures } from '../data/loadCreatures'

// ═══════════════════════════════════════
// 任务 schema 定义
// ═══════════════════════════════════════

export type QuestTriggerType =
  | 'discover' // 发现神兽
  | 'volume' // 单卷集齐
  | 'guardian' // 守护神抽取
  | 'collect' // 收集特定类别
  | 'province' // 探索省份

export interface QuestReward {
  type: 'bond' | 'collection'
  amount: number
  description: string
}

export interface Quest {
  id: string
  title: string
  description: string
  /** 触发条件的人类可读描述 */
  trigger: string
  triggerType: QuestTriggerType
  /** 当前进度 */
  progress: number
  /** 目标进度 */
  target: number
  reward: QuestReward
  /** 是否已完成（progress >= target） */
  completed: boolean
  /** 奖励是否已领取 */
  rewardClaimed: boolean
}

// ═══════════════════════════════════════
// 主线任务定义（保留原有 5 个阶段 + 守护神/推测触发源）
// ═══════════════════════════════════════

const MAIN_QUESTS: Omit<Quest, 'progress' | 'completed' | 'rewardClaimed'>[] = [
  {
    id: 'main-start',
    title: '初入山海',
    description: '发现第一只神兽，开启山海寻迹之旅。',
    trigger: '发现 1 只神兽',
    triggerType: 'discover',
    target: 1,
    reward: { type: 'bond', amount: 20, description: '羁绊 +20' },
  },
  {
    id: 'main-volume',
    title: '一卷初成',
    description: '在同一卷山海经中收集 5 只神兽。',
    trigger: '单卷集齐 5 只',
    triggerType: 'volume',
    target: 5,
    reward: { type: 'bond', amount: 30, description: '羁绊 +30' },
  },
  {
    id: 'main-provinces',
    title: '九州行',
    description: '探索 10 处华夏省份，踏遍九州大地。',
    trigger: '造访 10 省份',
    triggerType: 'province',
    target: 10,
    reward: { type: 'bond', amount: 40, description: '羁绊 +40' },
  },
  {
    id: 'main-outer',
    title: '海外大荒',
    description: '发现一只海外大荒经的神兽，探寻域外之境。',
    trigger: '发现 1 只海外/大荒神兽',
    triggerType: 'collect',
    target: 1,
    reward: { type: 'bond', amount: 30, description: '羁绊 +30' },
  },
  {
    id: 'main-half',
    title: '山海过半',
    description: '累计发现 52 只神兽，山海图录过半。',
    trigger: '发现 52 只神兽',
    triggerType: 'discover',
    target: 52,
    reward: { type: 'bond', amount: 50, description: '羁绊 +50' },
  },
  {
    id: 'main-guardian',
    title: '守护神契',
    description: '抽取一位守护神兽，缔结守护之契。',
    trigger: '抽取守护神 1 次',
    triggerType: 'guardian',
    target: 1,
    reward: { type: 'bond', amount: 20, description: '羁绊 +20' },
  },
]

function buildInitialQuests(): Quest[] {
  return MAIN_QUESTS.map((q) => ({
    ...q,
    progress: 0,
    completed: false,
    rewardClaimed: false,
  }))
}

// ═══════════════════════════════════════
// Store 定义
// ═══════════════════════════════════════

interface QuestState {
  quests: Quest[]

  /** 根据当前游戏状态重新计算所有任务进度。 */
  recomputeProgress: () => void
  /** 触发源：守护神抽取 */
  onGuardianDrawn: () => void
  /** 触发源：省份探索 */
  onProvinceExplored: () => void
  /** 领取已完成任务的奖励。 */
  claimReward: (questId: string) => void
  /** 重置全部任务（调试用）。 */
  reset: () => void
}

/**
 * 任务系统 store。
 */
export const useQuestStore = create<QuestState>()(
  persist(
    (set, get) => ({
      quests: buildInitialQuests(),

      recomputeProgress: () => {
        const discovered = useCollection.getState().discovered
        const guardianId = useGuardianStore.getState().guardianId
        const discoveredSet = new Set(discovered)

        // 计算单卷最大收集数
        const volumeCounts: Record<string, number> = {}
        const visitedProvinces = new Set<string>()
        for (const c of creatures) {
          if (discoveredSet.has(c.id)) {
            volumeCounts[c.scroll] = (volumeCounts[c.scroll] || 0) + 1
            const prov = c.province === '两广' ? ['广东', '广西'] : [c.province]
            for (const p of prov) visitedProvinces.add(p)
          }
        }
        const maxInVolume = Math.max(0, ...Object.values(volumeCounts))

        // 海外/大荒神兽数量
        const outerCount = creatures.filter(
          (c) =>
            discoveredSet.has(c.id) &&
            (c.scroll.startsWith('海外') || c.scroll.startsWith('大荒')),
        ).length

        set((state) => ({
          quests: state.quests.map((q) => {
            let progress = q.progress
            switch (q.id) {
              case 'main-start':
                progress = Math.min(discovered.length, q.target)
                break
              case 'main-volume':
                progress = Math.min(maxInVolume, q.target)
                break
              case 'main-provinces':
                progress = Math.min(visitedProvinces.size, q.target)
                break
              case 'main-outer':
                progress = Math.min(outerCount, q.target)
                break
              case 'main-half':
                progress = Math.min(discovered.length, q.target)
                break
              case 'main-guardian':
                progress = guardianId ? 1 : 0
                break
            }
            return { ...q, progress, completed: progress >= q.target }
          }),
        }))
      },

      onGuardianDrawn: () => {
        get().recomputeProgress()
      },

      onProvinceExplored: () => {
        get().recomputeProgress()
      },

      claimReward: (questId: string) => {
        const state = get()
        const quest = state.quests.find((q) => q.id === questId)
        if (!quest || !quest.completed || quest.rewardClaimed) return

        // 发放羁绊奖励：优先给守护神兽，否则给第一只已发现神兽
        if (quest.reward.type === 'bond') {
          const guardianId = useGuardianStore.getState().guardianId
          const discovered = useCollection.getState().discovered
          const targetId = guardianId || discovered[0]
          if (targetId) {
            useBondStore.getState().addScore(targetId, quest.reward.amount)
          }
        }

        set((s) => ({
          quests: s.quests.map((q) =>
            q.id === questId ? { ...q, rewardClaimed: true } : q,
          ),
        }))
      },

      reset: () => {
        set({ quests: buildInitialQuests() })
      },
    }),
    {
      name: 'shanhai-quest',
      partialize: (state) => ({
        quests: state.quests,
      }),
    },
  ),
)
