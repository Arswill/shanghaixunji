import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { EncounterOverlay } from './EncounterOverlay'
import type { CreatureWithAssets } from '../data/loadCreatures'

// Mock typewriter to skip delay
vi.mock('./useTypewriter', () => ({
  useTypewriter: (text: string) => ({
    displayed: text,
    isDone: true,
    skip: vi.fn(),
  }),
}))

const mockCreature: CreatureWithAssets = {
  id: 'bi-fang',
  name: '毕方',
  pinyin: 'Bì Fāng',
  province: '陕西',
  original_text: '有鸟焉，其状如鹤，一足，青质白文，赤喙而白喙，名曰毕方。',
  source: '《山海经·西山经》',
  translation: 'A bird like a crane',
  modern_location: 'Shaanxi',
  confidence: 'high',
  confidence_notes: '',
  description: 'Fire bird',
  scroll: '西山经',
  art_description: 'one-legged crane',
  audio: null,
  image: '/assets/images/bi-fang.jpg',
}

// The encounter animation advances through chained setTimeout phases
// (darkening → text → reveal → notification), where each useEffect schedules
// the next timer. React 19 defers state updates from timer callbacks until the
// next act() flush, so a single `await act(sleep)` only advances one phase.
// Using findBy* queries (backed by waitFor) polls and flushes each step,
// letting the full chain resolve.
const FIND_OPTS = { timeout: 5000 }

describe('EncounterOverlay', () => {
  it('renders overlay', () => {
    render(<EncounterOverlay creature={mockCreature} isNewDiscovery={true} onComplete={vi.fn()} onSkip={vi.fn()} />)
    expect(screen.getByTestId('encounter-overlay')).toBeInTheDocument()
  })

  it('shows creature name in notification phase', async () => {
    render(<EncounterOverlay creature={mockCreature} isNewDiscovery={true} onComplete={vi.fn()} onSkip={vi.fn()} />)
    const name = await screen.findByTestId('encounter-name', {}, FIND_OPTS)
    expect(name).toHaveTextContent('毕方')
  })

  it('shows new discovery badge when isNewDiscovery', async () => {
    render(<EncounterOverlay creature={mockCreature} isNewDiscovery={true} onComplete={vi.fn()} onSkip={vi.fn()} />)
    expect(await screen.findByTestId('new-discovery-badge', {}, FIND_OPTS)).toBeInTheDocument()
  })

  it('shows already discovered when not new', async () => {
    render(<EncounterOverlay creature={mockCreature} isNewDiscovery={false} onComplete={vi.fn()} onSkip={vi.fn()} />)
    expect(await screen.findByTestId('already-discovered', {}, FIND_OPTS)).toBeInTheDocument()
  })

  it('calls onComplete when continue clicked', async () => {
    const onComplete = vi.fn()
    render(<EncounterOverlay creature={mockCreature} isNewDiscovery={true} onComplete={onComplete} onSkip={vi.fn()} />)
    const button = await screen.findByTestId('encounter-continue', {}, FIND_OPTS)
    fireEvent.click(button)
    expect(onComplete).toHaveBeenCalled()
  })

  it('calls onSkip when detail clicked', async () => {
    const onSkip = vi.fn()
    render(<EncounterOverlay creature={mockCreature} isNewDiscovery={true} onComplete={vi.fn()} onSkip={onSkip} />)
    const button = await screen.findByTestId('encounter-detail', {}, FIND_OPTS)
    fireEvent.click(button)
    expect(onSkip).toHaveBeenCalled()
  })

  it('shows rarity stars', async () => {
    render(<EncounterOverlay creature={mockCreature} isNewDiscovery={true} onComplete={vi.fn()} onSkip={vi.fn()} />)
    const stars = await screen.findByTestId('rarity-stars', {}, FIND_OPTS)
    expect(stars.textContent).toMatch(/[★✦]/)
  })
})
