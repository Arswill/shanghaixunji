import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ShanhaiScroll } from './ShanhaiScroll'
import { useCollection } from './useCollection'
import { useViewStore } from '../app/useViewStore'
import { VOLUMES } from './volumeConfig'

vi.mock('../app/useViewStore', () => ({
  useViewStore: vi.fn(),
}))

describe('ShanhaiScroll', () => {
  beforeEach(() => {
    useCollection.getState().reset()
    vi.mocked(useViewStore as any).mockImplementation((selector: any) => {
      const state = { goCreature: vi.fn(), goBestiary: vi.fn() }
      return selector ? selector(state) : state
    })
  })

  it('renders all 5 volume sections', () => {
    render(<ShanhaiScroll />)
    for (const volume of VOLUMES) {
      expect(
        screen.getByTestId(`scroll-volume-${volume.id}`),
      ).toBeInTheDocument()
      expect(
        screen.getByTestId(`scroll-volume-progress-${volume.id}`).textContent,
      ).toContain('/')
    }
  })

  it('shows total collection progress', () => {
    render(<ShanhaiScroll />)
    const progress = screen.getByTestId('scroll-total-progress')
    expect(progress.textContent).toMatch(/\d+\s*\/\s*\d+/)
  })

  it('uncollected creatures are disabled and shown as "?"', () => {
    render(<ShanhaiScroll />)
    const card = screen.getByTestId('scroll-creature-jiu-wei-hu')
    expect(card).toBeDisabled()
    expect(card.textContent).toContain('?')
  })

  it('collected creature is clickable and navigates to detail', () => {
    useCollection.getState().discover('bi-fang')
    const goCreature = vi.fn()
    vi.mocked(useViewStore as any).mockImplementation((selector: any) => {
      const state = { goCreature, goBestiary: vi.fn() }
      return selector ? selector(state) : state
    })

    render(<ShanhaiScroll />)
    const card = screen.getByTestId('scroll-creature-bi-fang')
    expect(card).not.toBeDisabled()
    fireEvent.click(card)
    expect(goCreature).toHaveBeenCalledWith('bi-fang')
  })
})
