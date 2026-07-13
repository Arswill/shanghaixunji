import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import App from './App'

// Mock MapView to avoid Leaflet in jsdom
vi.mock('./map/MapView', () => ({
  MapView: ({ onSelect }: { onSelect: (p: string) => void }) => (
    <div data-testid="map-view" />
  ),
}))

// Mock atmosphere components
vi.mock('./atmosphere/InkMistLayer', () => ({ InkMistLayer: () => null }))
vi.mock('./atmosphere/InkBirds', () => ({ InkBirds: () => null }))
vi.mock('./atmosphere/InkSeal', () => ({
  InkSeal: ({ text }: { text: string }) => <span>{text}</span>,
  SealBadge: ({ text }: { text: string }) => <span>{text}</span>,
  ImmortalSeal: ({ text }: { text: string }) => <span>{text}</span>,
}))
vi.mock('./atmosphere/XianxiaAtmosphere', () => ({
  PeachPetals: () => null,
  ImmortalStars: () => null,
  AuspiciousClouds: () => null,
  RuneCircle: () => null,
  XianqiParticles: () => null,
  FlyingSword: () => null,
}))

// Mock sub-components
vi.mock('./collection/SolarTermBanner', () => ({ SolarTermBanner: () => <div /> }))
vi.mock('./quest/QuestLog', () => ({ QuestLog: () => <div /> }))
vi.mock('./encounter/EncounterOverlay', () => ({ EncounterOverlay: () => null }))
vi.mock('./guardian/GuardianSpirit', () => ({ GuardianSpirit: () => <div /> }))
vi.mock('./collection/CollectionBadge', () => ({ CollectionBadge: () => <div /> }))
vi.mock('./analytics/analytics', () => ({ trackEvent: vi.fn() }))
vi.mock('./map/provinceRegion', () => ({ REGIONS: {} }))
vi.mock('./app/routes', () => ({ syncHashFromState: vi.fn(), syncStateFromHash: vi.fn() }))

// Mock HeroCreatureSection (uses R3F Canvas/WebGL which requires WebGL, not available in jsdom)
vi.mock('./app/HeroCreatureSection', () => ({
  HeroCreatureSection: () => <div data-testid="hero-creature-section" />,
}))

describe('App', () => {
  it('renders the app title', () => {
    render(<App />)
    const headings = screen.getAllByRole('heading', { name: /山海寻迹/i })
    expect(headings.length).toBeGreaterThanOrEqual(1)
  })
})
