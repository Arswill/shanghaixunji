import { creatures } from '../data/loadCreatures'
import { getVolumeForCreature, getCreaturesInVolume } from './volumeConfig'

/**
 * 神兽三阶进化体系。
 *
 * 进化以「卷册探索度」为驱动：发现越多同卷神兽，单只神兽的形态就越完整。
 *  - 一阶（原文形态）：刚发现，仅显古文原文。
 *  - 二阶（白话形态）：发现该神兽所在卷册的 >=30% 神兽，解锁白话译义。
 *  - 三阶（考证形态）：发现该神兽所在卷册的 >=60% 神兽，解锁今地考证 + 方言音频。
 *
 * 阈值作用于「该卷册已被发现的神兽数 / 该卷册神兽总数」。
 */

export type EvolutionStage = 1 | 2 | 3

export interface EvolutionConfig {
  name: string
  description: string
  icon: string
}

export const EVOLUTION_CONFIG: Record<EvolutionStage, EvolutionConfig> = {
  1: { name: '原文形态', description: '仅显古文原文', icon: '📜' },
  2: { name: '白话形态', description: '解锁白话译义', icon: '📖' },
  3: { name: '考证形态', description: '解锁今地考证+方言音频', icon: '🔮' },
}

/** 二阶 / 三阶的卷册探索度阈值（百分比）。 */
export const EVOLUTION_THRESHOLDS = {
  stage2: 0.3, // 30%
  stage3: 0.6, // 60%
}

/**
 * 计算给定神兽的卷册探索度（0~1）。
 * 未发现该神兽时探索度为 0。
 */
export function getVolumeDiscoveryRate(creatureId: string, discovered: string[]): number {
  const creature = creatures.find((c) => c.id === creatureId)
  if (!creature) return 0
  const volume = getVolumeForCreature(creature.scroll)
  const inVolume = getCreaturesInVolume(volume)
  const total = inVolume.length
  if (total === 0) return 0
  const found = inVolume.filter((c) => discovered.includes(c.id)).length
  return found / total
}

/**
 * 返回神兽的当前进化阶段。
 *  - 未发现（不在 discovered 中）→ 1
 *  - 卷册探索度 >= 60% → 3
 *  - 卷册探索度 >= 30% → 2
 *  - 否则 → 1
 */
export function getEvolutionStage(creatureId: string, discovered: string[]): EvolutionStage {
  if (!discovered.includes(creatureId)) return 1
  const rate = getVolumeDiscoveryRate(creatureId, discovered)
  if (rate >= EVOLUTION_THRESHOLDS.stage3) return 3
  if (rate >= EVOLUTION_THRESHOLDS.stage2) return 2
  return 1
}

/**
 * 返回「距离下一次进化还需发现几只同卷神兽」。
 * 已达三阶返回 0。
 */
export function creaturesUntilNextEvolution(creatureId: string, discovered: string[]): number {
  const creature = creatures.find((c) => c.id === creatureId)
  if (!creature) return 0
  const volume = getVolumeForCreature(creature.scroll)
  const inVolume = getCreaturesInVolume(volume)
  const total = inVolume.length
  if (total === 0) return 0
  const found = inVolume.filter((c) => discovered.includes(c.id)).length

  const stage = getEvolutionStage(creatureId, discovered)
  if (stage >= 3) return 0

  const nextThreshold = stage === 1 ? EVOLUTION_THRESHOLDS.stage2 : EVOLUTION_THRESHOLDS.stage3
  const needed = Math.ceil(nextThreshold * total)
  return Math.max(0, needed - found)
}
