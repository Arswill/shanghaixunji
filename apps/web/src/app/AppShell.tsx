import { useEffect, useState, lazy, Suspense } from 'react'
import { ProvinceCreatureList } from '../list/ProvinceCreatureList'
import { EmbersScene } from '../atmosphere/EmbersScene'

import { useViewStore } from './useViewStore'
import { useDocumentTitle } from './useDocumentTitle'
import { syncHashFromState, syncStateFromHash } from './routes'
import { useReducedMotion } from '../lib/useReducedMotion'
import { getCreatureById, getCreaturesByProvince, type CreatureWithAssets } from '../data/loadCreatures'
import { EncounterOverlay } from '../encounter/EncounterOverlay'
import { useSolarTerm } from '../collection/useSolarTerm'
import { useCollection } from '../collection/useCollection'
import { trackEvent } from '../analytics/analytics'
import { getRarity } from '../collection/rarity'
import { HomePage } from './HomePage'
import { ProvincePreviewSheet } from './ProvincePreviewSheet'
import { LoadingFallback } from './LoadingFallback'
import { RouteErrorBoundary } from './RouteErrorBoundary'
import { GlobalChatBar } from '../chat/GlobalChatBar'
import { CollectionBadge } from '../collection/CollectionBadge'

const CreatureDetail = lazy(() => import('../detail/CreatureDetail').then(m => ({ default: m.CreatureDetail })))
const BestiaryView = lazy(() => import('../collection/BestiaryView').then(m => ({ default: m.BestiaryView })))
const GuardianSpirit = lazy(() => import('../guardian/GuardianSpirit').then(m => ({ default: m.GuardianSpirit })))
const ParticleDissolveTransition = lazy(() => import('../effects/ParticleDissolveTransition').then(m => ({ default: m.ParticleDissolveTransition })))

interface EncounterState {
  creature: CreatureWithAssets
  isNew: boolean
  province: string
}

/* ═══════════════════════════════════════════
   APP SHELL · 主布局
   ═══════════════════════════════════════════ */
export function AppShell() {
  const { view, provinceId, creatureId, goHome, goProvince, goCreature, goGuardian } = useViewStore()
  const reducedMotion = useReducedMotion()

  const pageTitle = (() => {
    switch (view) {
      case 'home':
        return '山海寻迹 · 探索《山海经》中的上古神兽'
      case 'province':
        return `${provinceId ?? ''} · 山海寻迹`
      case 'detail': {
        const c = creatureId ? getCreatureById(creatureId) : undefined
        return c ? `${c.name} · 山海寻迹` : '神兽详情 · 山海寻迹'
      }
      case 'bestiary':
        return '山海图鉴 · 山海寻迹'
      case 'guardian':
        return '家乡守护神 · 山海寻迹'
      default:
        return '山海寻迹'
    }
  })()
  useDocumentTitle(pageTitle)

  const [encounter, setEncounter] = useState<EncounterState | null>(null)
  const [previewProvince, setPreviewProvince] = useState<string | null>(null)
  const { boostedIds } = useSolarTerm()

  // ── 粒子溶解转场状态 ──
  const [transitionActive, setTransitionActive] = useState(false)

  const handleGuardianTransition = () => {
    if (reducedMotion) {
      goGuardian()
      return
    }
    setTransitionActive(true)
  }

  const handleTransitionViewSwitch = () => {
    goGuardian()
  }

  const handleTransitionComplete = () => {
    setTransitionActive(false)
  }

  useEffect(() => {
    syncStateFromHash()
    window.addEventListener('hashchange', syncStateFromHash)
    return () => window.removeEventListener('hashchange', syncStateFromHash)
  }, [])

  useEffect(() => {
    syncHashFromState()
  }, [view, provinceId, creatureId])

  useEffect(() => {
    trackEvent({ name: 'page_view', view })
  }, [view])

  const handleProvinceSelect = (province: string) => {
    trackEvent({ name: 'province_selected', province })
    // All provinces directly show the preview sheet
    const provinceCreatures = getCreaturesByProvince(province)
    if (provinceCreatures.length === 0) {
      goProvince(province)
      return
    }
    setPreviewProvince(province)
  }

  /** Province preview: explore a random creature */
  const handleExploreProvince = (province: string) => {
    setPreviewProvince(null)
    const provinceCreatures = getCreaturesByProvince(province)
    const discovered = useCollection.getState().discovered
    const undiscovered = provinceCreatures.filter((c) => !discovered.includes(c.id))
    const basePool = undiscovered.length > 0 ? undiscovered : provinceCreatures
    const boostedPool = basePool.filter((c) => boostedIds.has(c.id))
    const pool = boostedPool.length > 0 ? boostedPool : basePool
    const random = pool[Math.floor(Math.random() * pool.length)]

    const isNew = useCollection.getState().discover(random.id)
    trackEvent({
      name: 'creature_discovered',
      creatureId: random.id,
      rarity: getRarity(random),
      isNew,
    })
    setEncounter({ creature: random, isNew, province })
  }

  const handleEncounterComplete = () => {
    setEncounter(null)
    const province = encounter?.province || ''
    goProvince(province)
  }

  const handleEncounterSkip = () => {
    const creatureId = encounter?.creature.id || ''
    setEncounter(null)
    goCreature(creatureId)
  }

  return (
    <div
      className="min-h-[100dvh] flex flex-col relative bg-bg-base"
    >
      {/* 暗黑史诗粒子背景层 */}
      <EmbersScene reduced={reducedMotion} />

      {/* SKIP LINK */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-bg-raised focus:border focus:border-cinnabar focus:rounded focus:text-cinnabar"
      >
        跳转到主要内容
      </a>

      {/* ═══ Header · 极简导航 ═══ */}
      <header className="sticky top-0 z-40 backdrop-blur-md bg-bg-deep/85 border-b border-acc-bronze/25 px-4 py-2 flex items-center gap-4">
        <button
          onClick={goHome}
          aria-label="返回首页"
          className="font-brush text-lg text-cinnabar tracking-[0.18em] text-glow-cinnabar"
        >
          山海寻迹
        </button>
        <div className="ml-auto flex items-center gap-3">
          <CollectionBadge />
          {view !== 'guardian' && (
            <button
              onClick={handleGuardianTransition}
              data-testid="header-guardian-btn"
              className="px-3 py-1.5 rounded-full border border-acc-bronze/30 text-acc-gold text-xs font-display hover:border-cinnabar hover:text-cinnabar transition-colors"
            >
              ✦ 守护神
            </button>
          )}
        </div>
      </header>

      {/* ═══ MAIN ═══ */}
      <main id="main-content" className="flex-1 max-w-7xl mx-auto w-full pt-4 p-4 md:p-6 relative z-10">
        {view === 'home' && (
          <HomePage
            onProvinceSelect={handleProvinceSelect}
            onExploreProvince={handleExploreProvince}
            previewProvince={previewProvince}
            onPreviewClose={() => setPreviewProvince(null)}
            goGuardian={handleGuardianTransition}
          />
        )}

        {view === 'province' && provinceId && (
          <div className="animate-fade-in">
            <button
              onClick={goHome}
              className="text-ink-dan mb-4 hover:text-cinnabar transition-colors flex items-center gap-1 font-display"
            >
              ← 返回探索
            </button>
            <ProvinceCreatureList province={provinceId} />
          </div>
        )}

        {view === 'detail' && creatureId && (
          <RouteErrorBoundary>
            <Suspense fallback={<LoadingFallback />}>
              <CreatureDetail creatureId={creatureId} />
            </Suspense>
          </RouteErrorBoundary>
        )}

        {view === 'bestiary' && (
          <div className="animate-fade-in">
            <button
              onClick={goHome}
              className="text-ink-dan mb-4 hover:text-cinnabar transition-colors flex items-center gap-1 font-display"
            >
              ← 返回探索
            </button>
            <RouteErrorBoundary>
              <Suspense fallback={<LoadingFallback />}>
                <BestiaryView />
              </Suspense>
            </RouteErrorBoundary>
          </div>
        )}

        {view === 'guardian' && (
          <div className="animate-fade-in">
            <button
              onClick={goHome}
              className="text-ink-dan mb-4 hover:text-cinnabar transition-colors flex items-center gap-1 font-display"
            >
              ← 返回探索
            </button>
            <RouteErrorBoundary>
              <Suspense fallback={<LoadingFallback />}>
                <GuardianSpirit />
              </Suspense>
            </RouteErrorBoundary>
          </div>
        )}
      </main>

      {encounter && (
        <EncounterOverlay
          creature={encounter.creature}
          isNewDiscovery={encounter.isNew}
          onComplete={handleEncounterComplete}
          onSkip={handleEncounterSkip}
        />
      )}

      {/* ═══ GlobalChatBar · 全站AI入口 ═══ */}
      <GlobalChatBar overlayActive={!!encounter || !!previewProvince} />
      {/* ═══ 省份图鉴预览浮层 · 根级渲染（脱离 main 的 stacking context，彻底隔绝底层地图交互） ═══ */}
      {previewProvince && (
        <ProvincePreviewSheet
          province={previewProvince}
          onExplore={() => handleExploreProvince(previewProvince)}
          onList={() => {
            const p = previewProvince
            setPreviewProvince(null)
            if (p) goProvince(p)
          }}
          onClose={() => {
            const p = previewProvince
            setPreviewProvince(null)
            if (p) goProvince(p)
          }}
        />
      )}

      {/* ═══ 粒子溶解转场 · 全屏覆盖 ═══ */}
      {transitionActive && (
        <Suspense fallback={null}>
          <ParticleDissolveTransition
            onViewSwitch={handleTransitionViewSwitch}
            onComplete={handleTransitionComplete}
          />
        </Suspense>
      )}

      {/* ═══ Footer · 页脚 ═══ */}
      <footer className="relative z-10 bg-bg-deep/60 border-t border-acc-bronze/20 px-4 py-4 text-center">
        <div className="flex items-center justify-center gap-3 text-ink-dan text-xs font-display tracking-wider">
          <span className="h-px w-8 bg-acc-bronze/40" />
          <span>山海寻迹 · 2026 TRAE AI 创意大赛 · 古籍活化赛道</span>
          <span className="h-px w-8 bg-acc-bronze/40" />
        </div>
        <p className="text-ink-faint text-[10px] mt-1.5 font-display">
          道生一，一生二，二生三，三生万物
        </p>
      </footer>
    </div>
  )
}
