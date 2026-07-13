import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { useBondStore } from '../bond/bondStore'

/** 节气奖励领取时为节气神兽增加的羁绊值。 */
export const SOLAR_REWARD_BOND = 20

interface SolarQuestState {
  /** 已领取奖励的节气名 → true。节气变更后新节气默认未领取。 */
  claimedTerms: Record<string, boolean>
  /**
   * 领取某节气的限时奖励。
   *
   * 领取时：
   * 1. 调用 bondStore 为该节气对应神兽增加羁绊值（+20）；
   * 2. 在本 store 中标记该节气为已领取；
   * 3. 节气变更后允许新节气重新领取（每个节气名独立记录）。
   *
   * @param termName 节气名（如「夏至」）
   * @param creatureIds 该节气对应的神兽 ID 列表
   * @returns 是否领取成功（已领取过则返回 false）
   */
  claimReward: (termName: string, creatureIds: string[]) => boolean
  /** 查询某节气奖励是否已领取。 */
  isClaimed: (termName: string) => boolean
  /** 重置全部领取记录（调试用）。 */
  reset: () => void
}

/**
 * 节气任务奖励领取 store。
 *
 * 记录每个节气是否已领取限时奖励，领取时联动 bondStore 增加羁绊值，
 * 并持久化到 localStorage，避免刷新后重复领取。
 */
export const useSolarQuestStore = create<SolarQuestState>()(
  persist(
    (set, get) => ({
      claimedTerms: {},

      isClaimed: (termName: string) => !!get().claimedTerms[termName],

      claimReward: (termName: string, creatureIds: string[]) => {
        if (get().claimedTerms[termName]) return false

        // ① 调用 bondStore 给当前节气神兽加羁绊值
        const bondStore = useBondStore.getState()
        for (const id of creatureIds) {
          bondStore.addScore(id, SOLAR_REWARD_BOND)
        }

        // ② 标记该节气已领取
        set((state) => ({
          claimedTerms: { ...state.claimedTerms, [termName]: true },
        }))
        return true
      },

      reset: () => set({ claimedTerms: {} }),
    }),
    { name: 'shanhai-solar-quest' },
  ),
)
