import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  getEncounterTemplateData,
  getDefaultBondData,
  getScrollTemplateData,
  drawRadarChart,
  canvasToBlob,
  loadImage,
  SHARE_TEMPLATE_LABELS,
  BOND_DIMENSION_LABELS,
} from './shareTemplates'
import type { CreatureWithAssets } from '../data/loadCreatures'

const mockCreature: CreatureWithAssets = {
  id: 'bi-fang',
  name: '毕方',
  pinyin: 'Bì Fāng',
  province: '青海',
  original_text: '其状如鹤，一足，赤文青质而白喙，名曰毕方，其鸣自叫也，见则其邑有讹火。',
  source: '西山经',
  translation: '形状像鹤，一只脚，红色纹饰青色身体白色嘴，名叫毕方，它的叫声就是自己的名字，它出现的地方会有怪火。',
  modern_location: '青海湖周边',
  confidence: 'high',
  confidence_notes: '',
  description: '毕方是火兆之鸟。',
  scroll: '西山经',
  art_description: '',
  audio: null,
  image: null,
}

const mockAllCreatures: CreatureWithAssets[] = [
  mockCreature,
  {
    ...mockCreature,
    id: 'qing-niao',
    name: '青鸟',
    pinyin: 'Qīng Niǎo',
    province: '青海',
    original_text: '青鸟身黄赤足。',
    scroll: '西山经',
  },
  {
    ...mockCreature,
    id: 'tao-tie',
    name: '饕餮',
    pinyin: 'Tāo Tiè',
    province: '陕西',
    original_text: '其状如羊身人面，其目在腋下，虎齿人爪，其音如婴儿，名曰饕餮，是食人。',
    scroll: '北山经',
  },
]

describe('shareTemplates', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('SHARE_TEMPLATE_LABELS', () => {
    it('has labels for all three templates', () => {
      expect(SHARE_TEMPLATE_LABELS.encounter).toBe('遭遇瞬间')
      expect(SHARE_TEMPLATE_LABELS.bond).toBe('羁绊星图')
      expect(SHARE_TEMPLATE_LABELS.scroll).toBe('山海长卷')
    })
  })

  describe('BOND_DIMENSION_LABELS', () => {
    it('has labels for five dimensions', () => {
      expect(BOND_DIMENSION_LABELS.chat).toBe('聊天')
      expect(BOND_DIMENSION_LABELS.gift).toBe('赠礼')
      expect(BOND_DIMENSION_LABELS.explore).toBe('探索')
      expect(BOND_DIMENSION_LABELS.fate).toBe('缘分')
      expect(BOND_DIMENSION_LABELS.lore).toBe('传说')
    })
  })

  describe('getEncounterTemplateData', () => {
    it('returns collected count and collect number', () => {
      const data = getEncounterTemplateData(mockCreature, 12, 5)
      expect(data.collectedCount).toBe(12)
      expect(data.collectNumber).toBe(5)
    })

    it('falls back to collectedCount + 1 when collectNumber is omitted', () => {
      const data = getEncounterTemplateData(mockCreature, 7)
      expect(data.collectedCount).toBe(7)
      expect(data.collectNumber).toBe(8)
    })

    it('ensures collectNumber is at least 1', () => {
      const data = getEncounterTemplateData(mockCreature, 0)
      expect(data.collectNumber).toBe(1)
    })
  })

  describe('getDefaultBondData', () => {
    it('returns five dimensions with values between 0 and 100', () => {
      const data = getDefaultBondData(mockCreature, mockAllCreatures)
      expect(data.dimensions).toHaveLength(5)
      data.dimensions.forEach((d) => {
        expect(d.value).toBeGreaterThanOrEqual(0)
        expect(d.value).toBeLessThanOrEqual(100)
      })
    })

    it('includes all expected dimension keys and labels', () => {
      const data = getDefaultBondData(mockCreature, mockAllCreatures)
      const keys = data.dimensions.map((d) => d.key)
      expect(keys).toEqual(['chat', 'gift', 'explore', 'fate', 'lore'])
      data.dimensions.forEach((d) => {
        expect(d.label).toBe(BOND_DIMENSION_LABELS[d.key])
      })
    })

    it('computes totalBond as sum of dimension values', () => {
      const data = getDefaultBondData(mockCreature, mockAllCreatures)
      const sum = data.dimensions.reduce((acc, d) => acc + d.value, 0)
      expect(data.totalBond).toBe(sum)
    })

    it('caps fate at 100 even with many related creatures', () => {
      const manyCreatures = Array.from({ length: 50 }, (_, i) => ({
        ...mockCreature,
        id: `creature-${i}`,
      }))
      const data = getDefaultBondData(mockCreature, manyCreatures)
      const fate = data.dimensions.find((d) => d.key === 'fate')
      expect(fate?.value).toBe(100)
    })
  })

  describe('getScrollTemplateData', () => {
    it('returns collected slices first and fills with uncollected', () => {
      const collected = [mockAllCreatures[0], mockAllCreatures[1]]
      const data = getScrollTemplateData(collected, mockAllCreatures, mockCreature.id, 5)
      expect(data.collectedCount).toBe(2)
      expect(data.totalCount).toBe(3)
      expect(data.slices[0].creature.id).toBe(mockCreature.id)
      expect(data.slices[0].collected).toBe(true)
      expect(data.slices).toHaveLength(3)
    })

    it('limits slices to maxSlices', () => {
      const collected = [mockAllCreatures[0]]
      const data = getScrollTemplateData(collected, mockAllCreatures, undefined, 2)
      expect(data.slices).toHaveLength(2)
    })

    it('marks uncollected creatures correctly', () => {
      const collected = [mockAllCreatures[0]]
      const data = getScrollTemplateData(collected, mockAllCreatures, undefined, 3)
      const uncollected = data.slices.filter((s) => !s.collected)
      expect(uncollected.length).toBeGreaterThan(0)
      uncollected.forEach((s) => {
        expect(s.collected).toBe(false)
      })
    })
  })

  describe('drawRadarChart', () => {
    it('draws grid, axes, data area and labels', () => {
      const ctx = {
        save: vi.fn(),
        restore: vi.fn(),
        beginPath: vi.fn(),
        closePath: vi.fn(),
        moveTo: vi.fn(),
        lineTo: vi.fn(),
        stroke: vi.fn(),
        fill: vi.fn(),
        arc: vi.fn(),
        fillText: vi.fn(),
      } as unknown as CanvasRenderingContext2D

      const dimensions = [
        { key: 'chat' as const, label: '聊天', value: 80 },
        { key: 'gift' as const, label: '赠礼', value: 60 },
        { key: 'explore' as const, label: '探索', value: 70 },
        { key: 'fate' as const, label: '缘分', value: 50 },
        { key: 'lore' as const, label: '传说', value: 90 },
      ]

      drawRadarChart(ctx, dimensions, { centerX: 300, centerY: 300, radius: 200 })

      expect(ctx.save).toHaveBeenCalled()
      expect(ctx.restore).toHaveBeenCalled()
      expect(ctx.beginPath).toHaveBeenCalled()
      expect(ctx.stroke).toHaveBeenCalled()
      expect(ctx.fill).toHaveBeenCalled()
      expect(ctx.fillText).toHaveBeenCalledTimes(dimensions.length)
    })

    it('returns early for empty dimensions', () => {
      const ctx = {
        save: vi.fn(),
        restore: vi.fn(),
      } as unknown as CanvasRenderingContext2D

      drawRadarChart(ctx, [], { centerX: 300, centerY: 300, radius: 200 })
      expect(ctx.save).not.toHaveBeenCalled()
      expect(ctx.restore).not.toHaveBeenCalled()
    })
  })

  describe('canvasToBlob', () => {
    it('resolves with blob from canvas', async () => {
      const blob = new Blob(['png'], { type: 'image/png' })
      const canvas = {
        toBlob: vi.fn((cb: (b: Blob | null) => void) => cb(blob)),
      } as unknown as HTMLCanvasElement

      const result = await canvasToBlob(canvas)
      expect(result).toBe(blob)
    })
  })

  describe('loadImage', () => {
    it('resolves when image loads', async () => {
      const imgMock = {
        set src(_: string) {
          setTimeout(() => this.onload?.(), 0)
        },
        onload: null as (() => void) | null,
        onerror: null as (() => void) | null,
        crossOrigin: '',
        width: 100,
        height: 100,
      }
      vi.stubGlobal(
        'Image',
        function () {
          return imgMock
        } as unknown as typeof Image,
      )

      const img = await loadImage('http://example.com/creature.png')
      expect(img).toBe(imgMock)
      expect(imgMock.crossOrigin).toBe('anonymous')
      vi.unstubAllGlobals()
    })

    it('rejects when image fails to load', async () => {
      const imgMock = {
        set src(_: string) {
          setTimeout(() => this.onerror?.(), 0)
        },
        onload: null as (() => void) | null,
        onerror: null as (() => void) | null,
        crossOrigin: '',
      }
      vi.stubGlobal(
        'Image',
        function () {
          return imgMock
        } as unknown as typeof Image,
      )

      await expect(loadImage('bad.png')).rejects.toThrow('Failed to load image: bad.png')
      vi.unstubAllGlobals()
    })
  })
})
