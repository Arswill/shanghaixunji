import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { EncounterShareCard } from './EncounterShareCard'
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
    strokeRect: vi.fn(),
  }) as unknown as CanvasRenderingContext2D)

  HTMLCanvasElement.prototype.toBlob = vi.fn((cb: (b: Blob | null) => void) => {
    cb(new Blob(['png'], { type: 'image/png' }))
  })

  URL.createObjectURL = vi.fn(() => 'blob://mock')
  URL.revokeObjectURL = vi.fn()
})

describe('EncounterShareCard', () => {
  it('renders generate button', () => {
    render(<EncounterShareCard creature={mockCreature} />)
    expect(screen.getByText('生成遭遇海报')).toBeInTheDocument()
  })

  it('shows preview and download button after generation', async () => {
    render(<EncounterShareCard creature={mockCreature} collectedCount={12} collectNumber={5} />)
    fireEvent.click(screen.getByText('生成遭遇海报'))

    expect(await screen.findByText('下载 PNG')).toBeInTheDocument()
    expect(screen.getByAltText('毕方 遭遇海报')).toBeInTheDocument()
  })

  it('calls onExport when generation completes', async () => {
    const onExport = vi.fn()
    render(<EncounterShareCard creature={mockCreature} onExport={onExport} />)
    fireEvent.click(screen.getByText('生成遭遇海报'))

    expect(await screen.findByText('下载 PNG')).toBeInTheDocument()
    expect(onExport).toHaveBeenCalledWith('blob://mock')
  })
})
