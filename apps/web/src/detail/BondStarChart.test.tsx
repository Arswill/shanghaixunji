import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { BondStarChart } from './BondStarChart'
import type { CreatureWithAssets } from '../data/loadCreatures'

const mockCreature: CreatureWithAssets = {
  id: 'bi-fang',
  name: '毕方',
  pinyin: 'Bì Fāng',
  province: '青海',
  original_text: '其状如鹤，一足，赤文青质而白喙，名曰毕方。',
  source: '西山经',
  translation: '形状像鹤。',
  modern_location: '青海湖周边',
  confidence: 'high',
  confidence_notes: '',
  description: '火兆之鸟。',
  scroll: '西山经',
  art_description: '',
  audio: null,
  image: null,
}

beforeEach(() => {
  HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
    fillRect: vi.fn(),
    fillText: vi.fn(),
    drawImage: vi.fn(),
    measureText: vi.fn(() => ({ width: 100 })),
    createLinearGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
    createRadialGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
    beginPath: vi.fn(),
    closePath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    stroke: vi.fn(),
    fill: vi.fn(),
    arc: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
  }) as unknown as CanvasRenderingContext2D)

  HTMLCanvasElement.prototype.toBlob = vi.fn((cb: (b: Blob | null) => void) => {
    cb(new Blob(['png'], { type: 'image/png' }))
  })

  URL.createObjectURL = vi.fn(() => 'blob://mock')
  URL.revokeObjectURL = vi.fn()
})

describe('BondStarChart', () => {
  it('renders generate button', () => {
    render(<BondStarChart creature={mockCreature} />)
    expect(screen.getByText('生成羁绊星图')).toBeInTheDocument()
  })

  it('shows preview and download button after generation', async () => {
    render(<BondStarChart creature={mockCreature} />)
    fireEvent.click(screen.getByText('生成羁绊星图'))

    expect(await screen.findByText('下载 PNG')).toBeInTheDocument()
    expect(screen.getByAltText('毕方 羁绊星图')).toBeInTheDocument()
  })

  it('accepts custom dimensions', async () => {
    const dimensions = [
      { key: 'chat' as const, label: '聊天', value: 90 },
      { key: 'gift' as const, label: '赠礼', value: 80 },
      { key: 'explore' as const, label: '探索', value: 70 },
      { key: 'fate' as const, label: '缘分', value: 60 },
      { key: 'lore' as const, label: '传说', value: 50 },
    ]
    render(<BondStarChart creature={mockCreature} dimensions={dimensions} />)
    fireEvent.click(screen.getByText('生成羁绊星图'))

    expect(await screen.findByText('下载 PNG')).toBeInTheDocument()
  })
})
