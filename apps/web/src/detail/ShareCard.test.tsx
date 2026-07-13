import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ShareCard } from './ShareCard'
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
    clip: vi.fn(),
    strokeRect: vi.fn(),
  }) as unknown as CanvasRenderingContext2D)

  HTMLCanvasElement.prototype.toBlob = vi.fn((cb: (b: Blob | null) => void) => {
    cb(new Blob(['png'], { type: 'image/png' }))
  })

  URL.createObjectURL = vi.fn(() => 'blob://mock')
  URL.revokeObjectURL = vi.fn()
})

describe('ShareCard', () => {
  it('renders template selector with three options', () => {
    render(<ShareCard creature={mockCreature} />)
    expect(screen.getByTestId('share-template-encounter')).toBeInTheDocument()
    expect(screen.getByTestId('share-template-bond')).toBeInTheDocument()
    expect(screen.getByTestId('share-template-scroll')).toBeInTheDocument()
  })

  it('switches to bond template', () => {
    render(<ShareCard creature={mockCreature} />)
    fireEvent.click(screen.getByTestId('share-template-bond'))
    expect(screen.getByTestId('bond-star-chart')).toBeInTheDocument()
  })

  it('switches to scroll template', () => {
    render(<ShareCard creature={mockCreature} />)
    fireEvent.click(screen.getByTestId('share-template-scroll'))
    expect(screen.getByTestId('scroll-share-card')).toBeInTheDocument()
  })

  it('defaults to encounter template', () => {
    render(<ShareCard creature={mockCreature} />)
    expect(screen.getByTestId('encounter-share-card')).toBeInTheDocument()
  })
})
