// src/app/HomePage.tsx — 两区结构：神兽殿堂 + 山海图
import { lazy, Suspense } from 'react'
import { useCollection } from '../collection/useCollection'
import { SolarTermBanner } from '../collection/SolarTermBanner'
import { HeroChatPreview } from './HeroChatPreview'
import { HeroCreatureSection } from './HeroCreatureSection'
import { LoadingFallback } from './LoadingFallback'
import { RouteErrorBoundary } from './RouteErrorBoundary'
import { useViewStore } from './useViewStore'

const MapView = lazy(() => import('../map/MapView').then(m => ({ default: m.MapView })))

const REGION_LEGEND = [
  { key: 'south', label: '南山经', color: 'bg-region-south', glow: '#4a8a5a' },
  { key: 'west', label: '西山经', color: 'bg-region-west', glow: '#8a6a3a' },
  { key: 'north', label: '北山经', color: 'bg-region-north', glow: '#4a6a8a' },
  { key: 'east', label: '东山经', color: 'bg-region-east', glow: '#6a4a8a' },
  { key: 'central', label: '中山经', color: 'bg-region-central', glow: '#8b3a2a' },
  { key: 'outer', label: '海外大荒', color: 'bg-region-outer', glow: '#5a5a5a' },
] as const

interface HomePageProps {
  onProvinceSelect: (p: string) => void
  onExploreProvince: (p: string) => void
  previewProvince: string | null
  onPreviewClose: () => void
  goGuardian: () => void
}

export function HomePage({ onProvinceSelect, onExploreProvince, previewProvince, onPreviewClose, goGuardian }: HomePageProps) {
  const goCreature = useViewStore(s => s.goCreature)
  const setInitialMessage = useViewStore(s => s.setInitialMessage)
  const discoveredCount = useCollection((state) => state.discovered.length)

  return (
    <div className="space-y-0 pb-0">
      {/* ═══ 第一区 · 神兽殿堂 ═══ */}
      <HeroCreatureSection
        onExplore={() => document.getElementById('map-section')?.scrollIntoView({ behavior: 'smooth' })}
        goCreature={goCreature}
        setInitialMessage={setInitialMessage}
      />

      {/* ═══ 第二区 · 山海图 ═══ */}
      <section id="map-section" className="relative max-w-5xl mx-auto px-4 py-8">
        <div className="relative scroll-container rounded-sm">
          <div className="ink-corner-tl" aria-hidden="true" />
          <div className="ink-corner-tr" aria-hidden="true" />
          <div className="ink-corner-bl" aria-hidden="true" />
          <div className="ink-corner-br" aria-hidden="true" />

          <div className="text-center mb-4">
            <div className="inline-flex items-center gap-3 mb-1">
              <span className="ink-divider w-12" />
              <h2 className="scroll-title font-display text-xl text-ink-heaven">山海图</h2>
              <span className="ink-divider w-12" />
            </div>
            <p className="text-ink-dan text-xs font-display tracking-widest">✦ 点击九州 · 寻踪神兽 ✦</p>
          </div>

          <div className="relative">
            <RouteErrorBoundary>
              <Suspense fallback={<LoadingFallback />}>
                <MapView onSelect={onProvinceSelect} />
              </Suspense>
            </RouteErrorBoundary>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 mt-4 text-xs">
            {REGION_LEGEND.map((r) => (
              <div key={r.key} className="flex items-center gap-1.5 celestial-card px-2.5 py-1.5">
                <div className={`w-3 h-3 rounded-sm ${r.color}`} style={{ boxShadow: `0 0 6px ${r.glow}80` }} />
                <span className="text-ink-zhong font-display tracking-wider">{r.label}</span>
              </div>
            ))}
          </div>

          <p className="text-center text-ink-dan text-xs mt-4 font-display tracking-wider">
            <span className="text-cinnabar">✦</span>
            高亮九州——神兽栖息
            <span className="mx-3 text-acc-gold">·</span>
            远山雾绕——待你行游探幽
            <span className="text-cinnabar">✦</span>
          </p>
        </div>
      </section>

      {/* ═══ 底部 · 节气+AI ═══ */}
      <div className="max-w-3xl mx-auto px-4 pb-8 space-y-4">
        <SolarTermBanner />
        <HeroChatPreview />
      </div>
    </div>
  )
}
