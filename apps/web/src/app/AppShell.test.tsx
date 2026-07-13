import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { useViewStore } from './useViewStore'
import { useCollection } from '../collection/useCollection'
import { AppShell } from './AppShell'

// Mock MapView
vi.mock('../map/MapView', () => ({
  MapView: ({ onSelect }: { onSelect: (p: string) => void }) => (
    <div data-testid="map-view">
      <button data-testid="province-btn" onClick={() => onSelect('陕西')}>陕西</button>
    </div>
  ),
}))

// Mock atmosphere components
vi.mock('../atmosphere/InkMistLayer', () => ({ InkMistLayer: () => null }))
vi.mock('../atmosphere/InkBirds', () => ({ InkBirds: () => null }))
vi.mock('../atmosphere/InkSeal', () => ({
  InkSeal: ({ text, onClick }: any) => <span data-testid="ink-seal" onClick={onClick}>{text}</span>,
  SealBadge: ({ text }: any) => <span>{text}</span>,
  ImmortalSeal: ({ text, onClick }: any) => <span data-testid="immortal-seal" onClick={onClick}>{text}</span>,
}))
vi.mock('../atmosphere/XianxiaAtmosphere', () => ({
  PeachPetals: () => null,
  ImmortalStars: () => null,
  AuspiciousClouds: () => null,
  RuneCircle: () => null,
  XianqiParticles: () => null,
  FlyingSword: () => null,
}))

// Mock EncounterOverlay
vi.mock('../encounter/EncounterOverlay', () => ({
  EncounterOverlay: ({ creature, isNewDiscovery, onComplete, onSkip }: any) => (
    <div data-testid="encounter-overlay">
      <span data-testid="encounter-name">{creature.name}</span>
      {isNewDiscovery && <span data-testid="new-discovery">新发现</span>}
      <button data-testid="encounter-continue" onClick={onComplete}>继续探索</button>
      <button data-testid="encounter-detail" onClick={onSkip}>查看详情</button>
    </div>
  ),
}))

vi.mock('../collection/SolarTermBanner', () => ({ SolarTermBanner: () => <div /> }))
vi.mock('../quest/QuestLog', () => ({ QuestLog: () => <div /> }))
vi.mock('../guardian/GuardianSpirit', () => ({ GuardianSpirit: () => <div /> }))
vi.mock('../analytics/analytics', () => ({ trackEvent: vi.fn() }))

// Mock HeroCreatureSection (uses R3F Canvas/WebGL, not available in jsdom)
vi.mock('./HeroCreatureSection', () => ({
  HeroCreatureSection: () => <div data-testid="hero-creature-section" />,
}))

// Mock provinceRegion - AppShell needs REGIONS with proper structure
vi.mock('../map/provinceRegion', () => ({
  REGIONS: {
    south: { id: 'south', scrollName: '南山经', color: '#5f7d4b', colorVar: '--region-south', washVar: '--region-south-wash', name: '赤炎' },
    west: { id: 'west', scrollName: '西山经', color: '#a58237', colorVar: '--region-west', washVar: '--region-west-wash', name: '赭石' },
    north: { id: 'north', scrollName: '北山经', color: '#3c697d', colorVar: '--region-north', washVar: '--region-north-wash', name: '玄冰' },
    east: { id: 'east', scrollName: '东山经', color: '#824b5f', colorVar: '--region-east', washVar: '--region-east-wash', name: '青木' },
    central: { id: 'central', scrollName: '中山经', color: '#7d7837', colorVar: '--region-central', washVar: '--region-central-wash', name: '黄土' },
    outer: { id: 'outer', scrollName: '海外大荒', color: '#5a5a5a', colorVar: '--region-outer', washVar: '--region-outer-wash', name: '大荒' },
  },
  getProvinceRegionInfo: () => ({ id: 'south', scrollName: '南山经', color: '#5f7d4b', colorVar: '--region-south', washVar: '--region-south-wash', name: '赤炎' }),
}))

// Mock ProvinceCreatureList for navigation test
vi.mock('../list/ProvinceCreatureList', () => ({
  ProvinceCreatureList: ({ province }: { province: string }) => (
    <div data-testid="province-creature-list">{province}</div>
  ),
}))

// Mock CreatureDetail
vi.mock('../detail/CreatureDetail', () => ({
  CreatureDetail: ({ creatureId }: { creatureId: string }) => (
    <div data-testid="creature-detail">{creatureId}</div>
  ),
}))

// Mock BestiaryView
vi.mock('../collection/BestiaryView', () => ({
  BestiaryView: () => <div data-testid="bestiary-view">Bestiary</div>,
}))

describe('AppShell', () => {
  beforeEach(() => {
    useViewStore.getState().goHome()
    useCollection.getState().reset()
  })

  it('renders app titles in header and homepage', () => {
    render(<AppShell />)
    const headings = screen.getAllByRole('heading', { name: /山海寻迹/i })
    expect(headings.length).toBeGreaterThanOrEqual(1)
  })

  it('shows map view on home', () => {
    render(<AppShell />)
    expect(screen.getByTestId('map-view')).toBeInTheDocument()
  })

  it('shows preview sheet when province clicked (new behavior)', () => {
    render(<AppShell />)
    fireEvent.click(screen.getByTestId('province-btn'))
    expect(screen.getByTestId('province-preview-sheet')).toBeInTheDocument()
  })

  it('shows encounter overlay from preview sheet', () => {
    render(<AppShell />)
    fireEvent.click(screen.getByTestId('province-btn'))
    // Click "探寻此地" in preview sheet
    fireEvent.click(screen.getByText('探寻此地'))
    expect(screen.getByTestId('encounter-overlay')).toBeInTheDocument()
  })

  it('navigates to province list after encounter complete', () => {
    render(<AppShell />)
    fireEvent.click(screen.getByTestId('province-btn'))
    fireEvent.click(screen.getByText('探寻此地'))
    fireEvent.click(screen.getByTestId('encounter-continue'))
    expect(screen.getByTestId('province-creature-list')).toBeInTheDocument()
  })

  it('shows collection badge in header', () => {
    render(<AppShell />)
    expect(screen.getByTestId('collection-badge')).toBeInTheDocument()
  })
})
