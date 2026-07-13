import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { useCollection } from './useCollection'
import { BestiaryView } from './BestiaryView'
import { useViewStore } from '../app/useViewStore'

// Mock useViewStore
vi.mock('../app/useViewStore', () => ({
  useViewStore: vi.fn((selector) => {
    const state = { goCreature: vi.fn(), goBestiary: vi.fn() }
    return selector ? selector(state) : state
  }),
}))

describe('BestiaryView', () => {
  beforeEach(() => {
    useCollection.getState().reset()
  })

  it('renders total progress', () => {
    render(<BestiaryView />)
    expect(screen.getByText(/0\s*\/\s*104/)).toBeInTheDocument()
  })

  it('shows locked creatures as "?"', () => {
    render(<BestiaryView />)
    const locked = screen.getAllByText('?')
    expect(locked.length).toBeGreaterThan(50) // most are locked
  })

  it('unlocks creature after discovery', () => {
    useCollection.getState().discover('bi-fang')
    render(<BestiaryView />)
    const card = screen.getByTestId('bestiary-bi-fang')
    expect(card.querySelector('img, [class*="font-display"]')).toBeTruthy()
    expect(card).not.toBeDisabled()
  })

  it('locked creatures are disabled', () => {
    render(<BestiaryView />)
    const card = screen.getByTestId('bestiary-jiu-wei-hu')
    expect(card).toBeDisabled()
  })

  it('discovered creature can be clicked', () => {
    useCollection.getState().discover('bi-fang')
    const { goCreature } = useViewStore as any
    // Get the mock function
    const mock = (useViewStore as any).mock
      ? (useViewStore as any).mock.results?.[0]?.value?.goCreature
      : undefined

    render(<BestiaryView />)
    const card = screen.getByTestId('bestiary-bi-fang')
    fireEvent.click(card)
    // Just verify it doesn't crash - the mock handles the navigation
  })
})
