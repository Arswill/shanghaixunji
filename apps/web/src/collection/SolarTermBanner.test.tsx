import { render, screen } from '@testing-library/react'
import { describe, it, expect, beforeEach } from 'vitest'
import { SolarTermBanner } from './SolarTermBanner'
import { useCollection } from './useCollection'
import { useSolarQuestStore } from './solarQuestStore'

function seedDiscovered(ids: string[]) {
  const store = useCollection.getState()
  store.reset()
  for (const id of ids) store.discover(id)
}

describe('SolarTermBanner', () => {
  beforeEach(() => {
    useCollection.getState().reset()
    useSolarQuestStore.getState().reset()
  })

  it('renders banner for the Xiazhi term', () => {
    // 2026-06-27 falls in the Xiazhi solar term.
    render(<SolarTermBanner date={new Date(2026, 5, 27)} />)
    expect(screen.getByTestId('solar-term-banner')).toBeInTheDocument()
    expect(screen.getByTestId('solar-term-title')).toHaveTextContent(/夏至/)
  })

  it('marks quests as completed based on actual player progress', () => {
    // Xiazhi quest step2: 收集 3 只火属神兽（description 含「火」字）。
    // bi-fang(火灾之鸟) + zhu-que(主火司夏) + suan-ni(性好烟火) 均为火属。
    seedDiscovered(['bi-fang', 'zhu-que', 'suan-ni'])
    render(<SolarTermBanner date={new Date(2026, 5, 27)} />)

    expect(screen.getByText('领取节气奖励：羁绊加成 + 限时头像框')).toBeInTheDocument()
    expect(screen.getByTestId('solar-term-seal')).toBeInTheDocument()

    const steps = screen.getAllByTestId(/solar-quest-step-/)
    expect(steps).toHaveLength(3)
    steps.forEach((step) => {
      expect(step).toHaveTextContent('✓')
    })
  })

  it('shows incomplete steps when requirements are not met', () => {
    seedDiscovered([])
    render(<SolarTermBanner date={new Date(2026, 5, 27)} />)

    const steps = screen.getAllByTestId(/solar-quest-step-/)
    expect(steps).toHaveLength(3)
    steps.forEach((step) => {
      expect(step).not.toHaveTextContent('✓')
    })
    expect(screen.queryByTestId('solar-term-seal')).not.toBeInTheDocument()
  })
})
