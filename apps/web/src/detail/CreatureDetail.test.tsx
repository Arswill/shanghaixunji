import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { CreatureDetail } from './CreatureDetail'

// Mock useViewStore with stable references to avoid infinite re-renders.
const mockViewState = {
  view: 'detail' as const,
  provinceId: '陕西',
  creatureId: 'bi-fang',
  goHome: vi.fn(),
  goProvince: vi.fn(),
  goCreature: vi.fn(),
  goBestiary: vi.fn(),
  goGuardian: vi.fn(),
}

vi.mock('../app/useViewStore', () => ({
  useViewStore: vi.fn((selector) => (selector ? selector(mockViewState) : mockViewState)),
}))

// Mock useBondStore to avoid persist middleware issues in jsdom
const mockBond = {
  level: 'stranger' as const,
  score: 0,
  chatCount: 0,
  giftCount: 0,
  encounterCount: 0,
  lastInteraction: 0,
  mood: 'calm' as const,
  giftGivenDate: '',
  giftCountToday: 0,
}

vi.mock('../bond/bondStore', () => ({
  useBondStore: vi.fn((selector) => {
    const state = {
      bonds: {},
      interactions: {},
      recordChat: vi.fn(),
      recordEncounter: vi.fn(),
      giveGift: vi.fn(),
      getBond: vi.fn(() => mockBond),
      getMood: vi.fn(() => 'calm'),
      getLastGift: vi.fn(() => undefined),
      reset: vi.fn(),
    }
    return selector ? selector(state) : state
  }),
  LEVEL_THRESHOLDS: { stranger: 0, acquainted: 50, bonded: 150, kindred: 300 } as Record<string, number>,
  LEVEL_LABEL: { stranger: '初识', acquainted: '相知', bonded: '化形', kindred: '共生' } as Record<string, string>,
  MOOD_LABEL: { joyful: '欣喜', calm: '平静', wary: '警惕', listless: '慵懒' } as Record<string, string>,
  GIFT_LABEL: { 'spirit-fruit': '灵果', 'ancient-jade': '古玉', cinnabar: '朱砂' } as Record<string, string>,
  GIFT_PREFERENCE: { ferocious: 'ancient-jade', auspicious: 'spirit-fruit', disastrous: 'cinnabar', mysterious: 'ancient-jade' } as Record<string, string>,
  MAX_GIFTS_PER_DAY: 3,
}))

// Mock useCollection to ensure proper test isolation
vi.mock('../collection/useCollection', () => ({
  useCollection: vi.fn((selector) => {
    const state = {
      discovered: [] as string[],
      discover: vi.fn(() => true),
      isDiscovered: vi.fn(() => false),
      reset: vi.fn(),
      discoveredCount: vi.fn(() => 0),
    }
    return selector ? selector(state) : state
  }),
  navigateToBestiary: vi.fn(),
}))

// Mock HTMLCanvasElement.getContext
beforeEach(() => {
  HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
    fillRect: vi.fn(),
    fillText: vi.fn(),
    drawImage: vi.fn(),
    measureText: vi.fn(() => ({ width: 100 })),
    createLinearGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
    fillStyle: '',
    font: '',
    textAlign: '',
    textBaseline: '',
  }) as any)
})

describe('CreatureDetail', () => {
  it('renders creature basic info', () => {
    render(<CreatureDetail creatureId="bi-fang" />)
    // The name 毕方 also appears in body text (original_text/description) and
    // the image placeholder, so query the heading by role for a unique match.
    expect(screen.getByRole('heading', { name: '毕方' })).toBeInTheDocument()
    expect(screen.getByText(/Bì Fāng/i)).toBeInTheDocument()
  })

  it('renders original text section', () => {
    render(<CreatureDetail creatureId="bi-fang" />)
    expect(screen.getByText(/古籍原文/)).toBeInTheDocument()
  })

  it('renders text card with tabs (evolution-gated)', () => {
    render(<CreatureDetail creatureId="bi-fang" />)
    // Original text tab is always visible (stage 1)
    expect(screen.getByText(/古籍原文/)).toBeInTheDocument()
    // Translation/location labels appear multiple times (tabs + evolution hints)
    expect(screen.getAllByText(/白话译义/).length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText(/今地考证/).length).toBeGreaterThanOrEqual(1)
  })

  it('renders modern location section', () => {
    render(<CreatureDetail creatureId="bi-fang" />)
    expect(screen.getByText(/今地考证/)).toBeInTheDocument()
  })

  it('renders lore section', () => {
    render(<CreatureDetail creatureId="bi-fang" />)
    expect(screen.getByText(/神兽志略/)).toBeInTheDocument()
  })

  it('shows native audio player when audio file exists', () => {
    render(<CreatureDetail creatureId="bi-fang" />)
    // bi-fang has a generated Mandarin audio file in the manifest
    expect(screen.getByTestId('native-audio')).toBeInTheDocument()
    expect(screen.getByText(/原文朗读/)).toBeInTheDocument()
  })

  it('shows audio player with Web Speech fallback when no audio', () => {
    render(<CreatureDetail creatureId="qi-lin" />)
    // qi-lin has no audio file, Web Speech fallback shows "古文朗读"
    expect(screen.getByText(/古文朗读/)).toBeInTheDocument()
  })

  it('shows creature image when available', () => {
    // All creatures now have generated images
    render(<CreatureDetail creatureId="tao-wu" />)
    const img = screen.getByRole('img')
    expect(img).toHaveAttribute('alt', '梼杌')
  })

  it('renders share card section', () => {
    render(<CreatureDetail creatureId="bi-fang" />)
    expect(screen.getByTestId('share-card')).toBeInTheDocument()
    expect(screen.getByText(/生成遭遇海报/)).toBeInTheDocument()
  })

  it('shows not found message for invalid creature', () => {
    render(<CreatureDetail creatureId="nonexistent" />)
    expect(screen.getByText(/未找到/)).toBeInTheDocument()
  })

  it('shows back button', () => {
    render(<CreatureDetail creatureId="bi-fang" />)
    expect(screen.getByText(/返回/)).toBeInTheDocument()
  })
})
