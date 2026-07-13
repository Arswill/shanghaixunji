import { useMemo } from 'react'
import {
  getCurrentSolarTerm,
  getDaysUntilNextSolarTerm,
  getNextSolarTerm,
  type SolarTerm,
} from './solarTerms'

export interface UseSolarTermResult {
  /** 当前节气 */
  currentTerm: SolarTerm
  /** 下一个节气 */
  nextTerm: SolarTerm
  /** 距离下一个节气还有几天（向上取整） */
  daysUntilNext: number
  /** 当前处于「限时提升」状态的神兽 id 集合 */
  boostedIds: Set<string>
  /** 判断某只神兽是否在当前节气处于「限时提升」状态 */
  isCreatureBoosted: (creatureId: string) => boolean
}

/**
 * 节气限时事件 hook。
 *
 * 计算当前节气、下一个节气、倒计时天数，并提供判断神兽是否处于
 * 「限时提升」状态的辅助函数。可传入固定 Date 用于测试。
 */
export function useSolarTerm(date: Date = new Date()): UseSolarTermResult {
  const currentTerm = useMemo(() => getCurrentSolarTerm(date), [date])
  const nextTerm = useMemo(() => getNextSolarTerm(date), [date])
  const daysUntilNext = useMemo(() => getDaysUntilNextSolarTerm(date), [date])
  const boostedIds = useMemo(
    () => new Set(currentTerm.boostedCreatures),
    [currentTerm],
  )

  const isCreatureBoosted = (creatureId: string): boolean =>
    boostedIds.has(creatureId)

  return {
    currentTerm,
    nextTerm,
    daysUntilNext,
    boostedIds,
    isCreatureBoosted,
  }
}
