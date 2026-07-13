import { describe, it, expect } from 'vitest'
import {
  creatureMatchesCategory,
  computeSolarQuestCompletion,
} from './useSolarQuest'
import type { SolarTerm } from './solarTerms'
import type { CreatureWithAssets } from '../data/loadCreatures'

/**
 * useSolarQuest 测试。
 *
 * parseStepRequirement 是模块内部函数（未导出），通过导出的
 * computeSolarQuestCompletion（专为测试/非 React 场景提供的原始助手）间接验证
 * 其对属性类别（火属/水属/鸟形/蛇虫/龟蛇）的识别（B2-16 修复）。
 * creatureMatchesCategory 已导出，直接基于文本匹配断言。
 */

/** 构造一个仅含文本字段的神兽（creatureMatchesCategory 只读取 description/original_text/source）。 */
function makeCreature(description: string): CreatureWithAssets {
  return { description, original_text: '', source: '' } as unknown as CreatureWithAssets
}

/** 构造一个只关心 step2 描述的节气（step0/step1 用占位）。 */
function makeTerm(step2Description: string): SolarTerm {
  return {
    name: '测试节气',
    date: '06-21',
    creatureIds: [],
    creatureName: '测试神兽',
    description: '',
    eventTitle: '',
    eventDescription: '',
    boostedCreatures: [],
    quest: [
      { title: '探索', description: '完成一次探索' },
      { title: '遭遇', description: '与神兽完成一次遭遇' },
      { title: '收集', description: step2Description },
    ],
  }
}

describe('creatureMatchesCategory（基于文本匹配属性）', () => {
  it('火属：含 火/炎/灼/焰 视为火属', () => {
    expect(creatureMatchesCategory(makeCreature('口吐烈火，灼热炎炎'), 'fire')).toBe(true)
    expect(creatureMatchesCategory(makeCreature('清泉渊泽，冰封千里'), 'fire')).toBe(false)
  })

  it('水属：含 水/渊/泽/冰/雪/雨 视为水属', () => {
    expect(creatureMatchesCategory(makeCreature('深渊冰泽，雨雪交加'), 'water')).toBe(true)
    expect(creatureMatchesCategory(makeCreature('烈火炎炎，焦土千里'), 'water')).toBe(false)
  })

  it('鸟形：含 鸟/雀/凤/凰/翼/飞/羽 视为鸟形', () => {
    expect(creatureMatchesCategory(makeCreature('状如鸟，有翼能飞，羽色五彩'), 'bird')).toBe(true)
    expect(creatureMatchesCategory(makeCreature('状如犬，赤首白身'), 'bird')).toBe(false)
  })

  it('蛇虫：含 蛇/虫/蛊/蟒/虺 视为蛇虫', () => {
    expect(creatureMatchesCategory(makeCreature('身似蟒蛇，蛊虫之属'), 'snake')).toBe(true)
    expect(creatureMatchesCategory(makeCreature('状如马，白首赤尾'), 'snake')).toBe(false)
  })

  it('龟蛇：含 龟/蛇/玄武 视为龟蛇', () => {
    expect(creatureMatchesCategory(makeCreature('龟蛇合体，玄武之象'), 'turtle')).toBe(true)
    expect(creatureMatchesCategory(makeCreature('状如虎，金气肃杀'), 'turtle')).toBe(false)
  })
})

describe('parseStepRequirement（经 computeSolarQuestCompletion 间接验证，B2-16）', () => {
  it('识别「火属」类别：火属神兽计入，非火属不计入', () => {
    const term = makeTerm('收集 1 只火属神兽')
    expect(computeSolarQuestCompletion(term, ['bi-fang'])[2]).toBe(true) // 毕方属火
    expect(computeSolarQuestCompletion(term, ['ying-long'])[2]).toBe(false) // 应龙不属火
  })

  it('识别「水属」类别', () => {
    const term = makeTerm('收集 1 只水属神兽')
    expect(computeSolarQuestCompletion(term, ['ying-long'])[2]).toBe(true) // 应龙带「雨」属水
    expect(computeSolarQuestCompletion(term, ['bi-fang'])[2]).toBe(false) // 毕方不属水
  })

  it('识别「鸟形」类别并按数量判定', () => {
    const term2 = makeTerm('收集 2 只鸟形神兽')
    expect(computeSolarQuestCompletion(term2, ['bi-fang', 'zhu-que'])[2]).toBe(true) // 两只皆鸟形
    expect(computeSolarQuestCompletion(term2, ['bi-fang'])[2]).toBe(false) // 仅 1 只，未达 2
  })

  it('识别「蛇虫类」类别', () => {
    const term = makeTerm('收集 1 只蛇虫类神兽')
    expect(computeSolarQuestCompletion(term, ['ba-she'])[2]).toBe(true) // 巴蛇属蛇虫
    expect(computeSolarQuestCompletion(term, ['bi-fang'])[2]).toBe(false) // 毕方不属蛇虫
  })

  it('识别「龟蛇类」类别', () => {
    const term = makeTerm('收集 1 只龟蛇类神兽')
    expect(computeSolarQuestCompletion(term, ['xuan-wu'])[2]).toBe(true) // 玄武属龟蛇
    expect(computeSolarQuestCompletion(term, ['bi-fang'])[2]).toBe(false) // 毕方不属龟蛇
  })

  it('数量阈值来自描述中的数字（收集 3 只需 3 只方可完成）', () => {
    const term = makeTerm('收集 3 只火属神兽')
    expect(computeSolarQuestCompletion(term, ['bi-fang', 'zhu-que'])[2]).toBe(false) // 仅 2 只 < 3
  })
})
