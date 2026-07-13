import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { useCollection } from './useCollection'
import { BestiaryView } from './BestiaryView'
import { ExplorationJournal, buildJournalEntry } from './ExplorationJournal'
import { creatures } from '../data/loadCreatures'
import { getCurrentSolarTerm } from './solarTerms'

// Mock useViewStore (same shape as the existing BestiaryView test)
vi.mock('../app/useViewStore', () => ({
  useViewStore: vi.fn((selector) => {
    const state = { goCreature: vi.fn(), goBestiary: vi.fn() }
    return selector ? selector(state) : state
  }),
}))

describe('BestiaryView — new features', () => {
  beforeEach(() => {
    useCollection.getState().reset()
  })

  it('renders the solar-term banner with today term name', () => {
    render(<BestiaryView />)
    const term = getCurrentSolarTerm()
    const banner = screen.getByTestId('solar-term-banner')
    expect(banner.textContent).toContain(term.name)
    expect(banner.textContent).toContain(term.creatureName)
    expect(banner.textContent).toContain('出没')
  })

  it('renders 5 volume tabs', () => {
    render(<BestiaryView />)
    expect(screen.getByTestId('volume-tab-nan-shan')).toBeTruthy()
    expect(screen.getByTestId('volume-tab-xi-shan')).toBeTruthy()
    expect(screen.getByTestId('volume-tab-bei-shan')).toBeTruthy()
    expect(screen.getByTestId('volume-tab-dong-shan')).toBeTruthy()
    expect(screen.getByTestId('volume-tab-hai-wai')).toBeTruthy()
  })

  it('default view shows all creatures (no tab active)', () => {
    render(<BestiaryView />)
    // bi-fang (西山经) and jiu-wei-hu (南山经) both rendered simultaneously
    expect(screen.getByTestId('bestiary-bi-fang')).toBeTruthy()
    expect(screen.getByTestId('bestiary-jiu-wei-hu')).toBeTruthy()
  })

  it('clicking a volume tab filters the grid to that volume', () => {
    render(<BestiaryView />)
    // initially both visible
    expect(screen.getByTestId('bestiary-bi-fang')).toBeTruthy()
    expect(screen.getByTestId('bestiary-jiu-wei-hu')).toBeTruthy()

    // switch to 东山经 volume
    fireEvent.click(screen.getByTestId('volume-tab-dong-shan'))
    // 东山经 creatures still present
    expect(screen.getByTestId('bestiary-dang-kang')).toBeTruthy()
    // 西山经 / 南山经 creatures filtered out
    expect(screen.queryByTestId('bestiary-bi-fang')).toBeNull()
    expect(screen.queryByTestId('bestiary-jiu-wei-hu')).toBeNull()

    // click the active tab again -> back to all
    fireEvent.click(screen.getByTestId('volume-tab-dong-shan'))
    expect(screen.getByTestId('bestiary-bi-fang')).toBeTruthy()
  })

  it('shows evolution stage icon only on discovered cards', () => {
    useCollection.getState().discover('bi-fang')
    render(<BestiaryView />)
    expect(screen.getByTestId('evo-stage-bi-fang').textContent).toBeTruthy()
    // locked creature has no evo stage testid
    expect(screen.queryByTestId('evo-stage-jiu-wei-hu')).toBeNull()
  })

  it('toggle journal button shows and hides the ExplorationJournal', () => {
    render(<BestiaryView />)
    expect(screen.queryByTestId('exploration-journal')).toBeNull()
    fireEvent.click(screen.getByTestId('toggle-journal'))
    expect(screen.getByTestId('exploration-journal')).toBeTruthy()
    fireEvent.click(screen.getByTestId('toggle-journal'))
    expect(screen.queryByTestId('exploration-journal')).toBeNull()
  })

  it('complete volume shows ✦ and unlocks narrative', () => {
    // 东山经 has few creatures; discover them all to complete the volume
    const dongCreatures = creatures.filter((c) => c.scroll === '东山经')
    for (const c of dongCreatures) useCollection.getState().discover(c.id)

    render(<BestiaryView />)
    // tab shows the complete mark ✦
    const tab = screen.getByTestId('volume-tab-dong-shan')
    expect(tab.textContent).toContain('✦')

    // activate the volume to reveal the narrative button
    fireEvent.click(screen.getByTestId('volume-tab-dong-shan'))
    const btn = screen.getByTestId('volume-narrative-btn')
    fireEvent.click(btn)
    const narrative = screen.getByTestId('volume-narrative')
    expect(narrative.textContent!.length).toBeGreaterThan(20)
  })
})

describe('ExplorationJournal', () => {
  beforeEach(() => {
    useCollection.getState().reset()
  })

  it('shows empty hint when nothing discovered', () => {
    render(<ExplorationJournal />)
    expect(screen.getByTestId('exploration-journal').textContent).toContain('尚未有所见闻')
  })

  it('lists discovered creatures in discovery order with ordinal', () => {
    useCollection.getState().discover('bi-fang')
    useCollection.getState().discover('jiu-wei-hu')
    const { container } = render(<ExplorationJournal />)
    const e1 = screen.getByTestId('journal-entry-bi-fang')
    const e2 = screen.getByTestId('journal-entry-jiu-wei-hu')
    expect(e1.textContent).toContain('第 1 只')
    expect(e2.textContent).toContain('第 2 只')
    // entries appear in discovery order
    expect(container.querySelectorAll('[data-testid^="journal-entry-"]').length).toBe(2)
  })

  it('unlocks epilogue at >=50% collection', () => {
    const half = Math.ceil(creatures.length / 2) + 1
    for (const c of creatures.slice(0, half)) useCollection.getState().discover(c.id)
    render(<ExplorationJournal />)
    expect(screen.getByTestId('exploration-journal').textContent).toContain('结语')
  })

  it('buildJournalEntry uses province, volume name, and original_text', () => {
    const c = creatures.find((x) => x.id === 'bi-fang')!
    const entry = buildJournalEntry(c)
    expect(entry).toContain('陕西')
    expect(entry).toContain('毕方')
    expect(entry).toContain('西山经')
    expect(entry).toContain(c.original_text.slice(0, 10))
  })
})
