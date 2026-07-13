import { useMemo } from 'react'
import { useCollection } from './useCollection'
import { getVolumeForCreature, getCreaturesInVolume } from './volumeConfig'
import { getCreatureById, creatures, type CreatureWithAssets } from '../data/loadCreatures'
import type { SolarTerm, QuestStep } from './solarTerms'

/** 神兽属性类别，对应 step2 描述中的类别关键词。 */
type AttributeCategory = 'fire' | 'water' | 'bird' | 'snake' | 'turtle'

/** step2 描述中的类别关键词 → 属性类别映射。 */
const CATEGORY_KEYWORDS: { match: RegExp; category: AttributeCategory }[] = [
  { match: /火属/, category: 'fire' },
  { match: /水(相关|属)/, category: 'water' },
  { match: /(鸟形|雕鸮类)/, category: 'bird' },
  { match: /蛇虫类/, category: 'snake' },
  { match: /龟蛇类/, category: 'turtle' },
]

/** 原有卷册关键字（用于「收集 N 只北山经神兽」这类按卷册判定的 step）。 */
const SCROLL_KEYWORDS = ['南山经', '西山经', '北山经', '东山经', '海外大荒']

interface StepRequirement {
  /** 具体卷册名（如「北山经」），用于按卷册筛选。 */
  scroll?: string
  /** 泛「山经」——匹配所有 *山经 卷册（如「累计发现 5 只山经神兽」）。 */
  generalShanJing?: boolean
  /** 属性类别（火属/水属/鸟形/蛇虫/龟蛇），用于按属性筛选。 */
  category?: AttributeCategory
  /** step 要求的数量。 */
  count: number
}

/**
 * 解析 step2 的收集要求。
 *
 * 优先识别属性类别（火属/水属/鸟形/蛇虫/龟蛇），
 * 其次识别具体卷册关键字（南山经/西山经/…/海外大荒），
 * 再次识别泛「山经」（匹配所有山经卷册），
 * 均不匹配时返回空，交由调用方走 fallback。
 */
function parseStepRequirement(step: QuestStep): StepRequirement {
  const countMatch = step.description.match(/(\d+)/)
  const count = countMatch ? Number(countMatch[1]) : 3

  // 1. 属性类别优先
  for (const { match, category } of CATEGORY_KEYWORDS) {
    if (match.test(step.description)) {
      return { category, count }
    }
  }

  // 2. 具体卷册关键字
  const scroll = SCROLL_KEYWORDS.find((k) => step.description.includes(k))
  if (scroll) {
    return { scroll, count }
  }

  // 3. 泛「山经」
  if (/山经/.test(step.description)) {
    return { generalShanJing: true, count }
  }

  // 4. fallback：无明确类别/卷册
  return { count }
}

/**
 * 判断一只神兽是否属于指定属性类别。
 *
 * 基于 description / original_text / source 文本匹配属性关键词：
 * - 火属：含「火/炎/灼/焰」
 * - 水属：含「水/渊/泽/冰/雪/雨」
 * - 鸟形：含「鸟/雀/凤/凰/翼/飞/羽」
 * - 蛇虫：含「蛇/虫/蛊/蟒/虺」
 * - 龟蛇：含「龟/蛇/玄武」
 */
export function creatureMatchesCategory(
  creature: CreatureWithAssets,
  category: AttributeCategory,
): boolean {
  const text = `${creature.description}${creature.original_text}${creature.source}`
  switch (category) {
    case 'fire':
      return /火|炎|灼|焰/.test(text)
    case 'water':
      return /水|渊|泽|冰|雪|雨/.test(text)
    case 'bird':
      return /鸟|雀|凤|凰|翼|飞|羽/.test(text)
    case 'snake':
      return /蛇|虫|蛊|蟒|虺/.test(text)
    case 'turtle':
      return /龟|蛇|玄武/.test(text)
    default:
      return false
  }
}

/** 统计已发现神兽中满足某 step 要求的数量。 */
function countDiscoveredForRequirement(
  req: StepRequirement,
  discovered: string[],
  term: SolarTerm,
): number {
  const discoveredSet = new Set(discovered)
  const discoveredCreatures = creatures.filter((c) => discoveredSet.has(c.id))

  // 属性类别筛选
  if (req.category) {
    return discoveredCreatures.filter((c) => creatureMatchesCategory(c, req.category!)).length
  }

  // 具体卷册筛选
  if (req.scroll) {
    const volume = getVolumeForCreature(req.scroll)
    const inVolume = getCreaturesInVolume(volume)
    return inVolume.filter((c) => discovered.includes(c.id)).length
  }

  // 泛「山经」筛选
  if (req.generalShanJing) {
    return discoveredCreatures.filter((c) => c.scroll.includes('山经')).length
  }

  // Fallback：用代表神兽所在卷册判定
  const representative = getCreatureById(term.creatureIds[0])
  if (representative) {
    const volume = getVolumeForCreature(representative.scroll)
    const inVolume = getCreaturesInVolume(volume)
    return inVolume.filter((c) => discovered.includes(c.id)).length
  }
  return 0
}

/**
 * Determine whether each quest step is completed based on actual player state.
 *
 * - Step 0 (explore): any creature discovered.
 * - Step 1 (encounter seasonal creature): current term creature discovered.
 * - Step 2 (collect): count of discovered creatures matching the step's
 *   category (火属/水属/鸟形/蛇虫/龟蛇) or volume (南山经/西山经/…/海外大荒/山经).
 */
export function useSolarQuest(term: SolarTerm): boolean[] {
  const discovered = useCollection((s) => s.discovered)

  return useMemo(() => {
    return term.quest.map((step, index) => {
      if (index === 0) {
        return discovered.length > 0
      }
      if (index === 1) {
        return term.creatureIds.some((id) => discovered.includes(id))
      }
      // Step 2: collection requirement
      const req = parseStepRequirement(step)
      const found = countDiscoveredForRequirement(req, discovered, term)
      return found >= req.count
    })
  }, [discovered, term])
}

/**
 * Raw helper for tests / non-React code.
 */
export function computeSolarQuestCompletion(
  term: SolarTerm,
  discovered: string[],
): boolean[] {
  return term.quest.map((step, index) => {
    if (index === 0) return discovered.length > 0
    if (index === 1) return term.creatureIds.some((id) => discovered.includes(id))
    const req = parseStepRequirement(step)
    const found = countDiscoveredForRequirement(req, discovered, term)
    return found >= req.count
  })
}
