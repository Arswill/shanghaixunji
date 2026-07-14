import { useRef, useMemo, useState, useCallback, useEffect, lazy, Suspense } from 'react'
import { getCreatureById } from '../data/loadCreatures'
const CreatureViewer = lazy(() => import('../effects/CreatureViewer').then(m => ({ default: m.CreatureViewer })))
const Creature3DPreview = lazy(() => import('../effects/Creature3DPreview').then(m => ({ default: m.Creature3DPreview })))
import { has3DModel, getModelUrl } from '../effects/creature-3d-manifest'
import { useViewStore } from '../app/useViewStore'
import { useCollection } from '../collection/useCollection'
import { AudioPlayer } from './AudioPlayer'
import { CreatureTextCard } from './CreatureTextCard'
import { ShareCard } from './ShareCard'
import { CreatureChat } from '../chat/CreatureChat'
import { BondPanel } from '../bond/BondPanel'
import { CreatureAmbience } from './CreatureAmbience'
import { SsrThemePlayer } from './SsrThemePlayer'
import { detectPersonality } from '../chat/chatPrompts'
import { getRarity, RARITY_CONFIG } from '../collection/rarity'
import {
  getEvolutionStage,
  creaturesUntilNextEvolution,
  type EvolutionStage,
} from '../collection/evolution'
import { useBondStore } from '../bond/bondStore'
import { ImmortalSeal } from '../atmosphere/InkSeal'
import { XianqiParticles, RuneCircle } from '../atmosphere/XianxiaAtmosphere'
import { PERSONALITY_ATMOSPHERE, XianAction } from './PersonalityAtmosphere'
import { RelatedCreatures } from './RelatedCreatures'
import { ScrollSection } from './ScrollSection'
import { EvolutionLockCard, EvolutionProgress } from './EvolutionSection'

const RARITY_XIAN = {
  SSR: { label: '仙品', icon: '✦✦✦', color: '#c8423a', glow: 'shadow-ssr-glow' },
  SR: { label: '灵品', icon: '✦✦', color: '#d4a857', glow: 'shadow-gold-glow' },
  R: { label: '凡品', icon: '✦', color: '#4a8c6b', glow: 'shadow-jade-glow' },
} as const

export function CreatureDetail({ creatureId }: { creatureId: string }) {
  const creature = getCreatureById(creatureId)
  const goProvince = useViewStore((s) => s.goProvince)
  const goCreature = useViewStore((s) => s.goCreature)
  const goBestiary = useViewStore((s) => s.goBestiary)
  const initialMessage = useViewStore((s) => s.initialMessage)
  const setInitialMessage = useViewStore((s) => s.setInitialMessage)

  const [showChat, setShowChat] = useState(false)
  const recordChat = useBondStore((s) => s.recordChat)

  // 3D 预览状态
  const show3D = has3DModel(creatureId)
  const modelUrl = getModelUrl(creatureId)
  const [view3D, setView3D] = useState(false)
  const [show3DFullscreen, setShow3DFullscreen] = useState(false)

  // 从首页/全局浮层带入的初始消息：自动展开对话区
  useEffect(() => {
    if (initialMessage) {
      setShowChat(true)
      return () => setInitialMessage(undefined)
    }
  }, [initialMessage, setInitialMessage])

  const upperRef = useRef<HTMLElement>(null)
  const middleRef = useRef<HTMLElement>(null)
  const lowerRef = useRef<HTMLElement>(null)
  const audioRef = useRef<HTMLElement>(null)
  const shareRef = useRef<HTMLElement>(null)

  const personality = useMemo(
    () => (creature ? detectPersonality(creature) : 'mysterious'),
    [creature]
  )
  const atmosphere = PERSONALITY_ATMOSPHERE[personality]
  const rarity = useMemo(() => (creature ? getRarity(creature) : 'R'), [creature])
  const rarityXian = RARITY_XIAN[rarity as keyof typeof RARITY_XIAN]
  const rarityConfig = RARITY_CONFIG[rarity]

  const isDiscovered = useCollection((s) => (creature ? s.isDiscovered(creature.id) : false))
  const discovered = useCollection((s) => s.discovered)
  const evolutionStage: EvolutionStage = creature
    ? getEvolutionStage(creature.id, discovered)
    : 1
  const untilNextEvolution = creature
    ? creaturesUntilNextEvolution(creature.id, discovered)
    : 0
  const isSsr = rarity === 'SSR'

  const [imageFailed, setImageFailed] = useState(false)

  const depthMapUrl = `/assets/depth/${creatureId}_depth.png`
  const [hasDepthMap, setHasDepthMap] = useState<boolean | null>(null)
  useEffect(() => {
    const img = new Image()
    img.onload = () => setHasDepthMap(true)
    img.onerror = () => setHasDepthMap(false)
    img.src = depthMapUrl
  }, [depthMapUrl])

  const [isRevealed, setIsRevealed] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setIsRevealed(true), 50)
    return () => clearTimeout(t)
  }, [])

  const scrollTo = useCallback((ref: React.RefObject<HTMLElement | null>) => {
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [])

  if (!creature) {
    return (
      <div data-testid="creature-detail" className="p-4 text-ink-dan font-display">
        未找到该神兽。
      </div>
    )
  }

  return (
    <div
      data-testid="creature-detail"
      className={`relative min-h-[100dvh] bg-celestial-mist text-ink-heaven transition-opacity duration-700 ${
        isRevealed ? 'opacity-100' : 'opacity-0'
      }`}
    >
      {isSsr && <SsrThemePlayer creatureId={creature.id} isUnlocked={isDiscovered} />}

      {/* ── 顶部导航：仙侠题签 ── */}
      <header className="sticky top-0 z-30 px-4 sm:px-6 py-2.5 flex items-center justify-between backdrop-blur-xl bg-celestial-jade/80 border-b border-immortal-gold/25">
        <button
          type="button"
          onClick={() => goProvince(creature.province)}
          className="text-ink-dan hover:text-cinnabar transition-colors text-sm flex items-center gap-1.5 font-display px-3 py-1 rounded-lg hover:bg-celestial-fog/50"
        >
          <span className="text-base">⟵</span> 返回{creature.province}
        </button>
        <span className="text-xs text-ink-faint hidden sm:inline font-display tracking-[0.15em]">
          山海寻迹 · {creature.source}
        </span>
      </header>

      {/* ── 首屏：神兽仙家剧场 ── */}
      <section
        className={`relative min-h-[68vh] flex flex-col items-center justify-end pb-12 pt-10 px-4 bg-gradient-to-b ${atmosphere.gradient} overflow-hidden`}
        style={{ backgroundImage: `${atmosphere.texture}` }}
      >
        {/* 仙气升腾 */}
        <XianqiParticles count={20} />

        {/* 法阵背景 */}
        <div className="absolute top-[42%] left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-60">
          <RuneCircle size={280} animated color={atmosphere.rune} />
        </div>

        {/* 仙家印记 (右上) */}
        <div
          className={`absolute top-20 right-4 sm:right-8 px-3 py-1.5 rounded-full border text-xs font-display tracking-widest backdrop-blur-md celestial-card ${atmosphere.seal}`}
        >
          ✦ {atmosphere.label} ✦
        </div>

        {/* 稀有度 (左上) */}
        <div
          className={`absolute top-20 left-4 sm:left-8 flex flex-col items-center gap-1 px-3 py-1.5 rounded-lg celestial-card ${rarityXian.glow}`}
          style={{ color: rarityXian.color }}
        >
          <span className="text-base">{rarityXian.icon}</span>
          <span className="text-[10px] tracking-widest font-display">{rarityXian.label}</span>
        </div>

        {/* 神兽画像：占首屏主体 */}
        <div className="relative z-10 w-full max-w-sm aspect-[3/4] flex items-center justify-center">
          {/* 柔和光晕——降低亮度避免过曝光 */}
          <div
            className="absolute inset-0 rounded-2xl opacity-15 blur-3xl"
            style={{ background: rarityConfig.glow }}
            aria-hidden="true"
          />
          {/* 画框内层暗色背板 */}
          <div
            className="absolute inset-0 rounded-2xl border border-immortal-gold/30"
            style={{
              background: 'linear-gradient(135deg, rgba(30,26,18,0.85) 0%, rgba(20,17,12,0.92) 100%)',
              boxShadow: 'inset 0 0 40px rgba(0,0,0,0.5)',
            }}
            aria-hidden="true"
          />

          {/* 3D 模型查看模式 */}
          {view3D && modelUrl ? (
            <Suspense fallback={
              <div className="relative z-10 w-full h-full flex flex-col items-center justify-center">
                <div
                  className="w-12 h-12 border-3 border-immortal-gold/20 border-t-immortal-gold rounded-full"
                  style={{ animation: 'creature3d-spin 1s linear infinite' }}
                />
                <p className="mt-3 text-sm text-ink-dan font-display">{creature.name} 3D 加载中…</p>
              </div>
            }>
              <Creature3DPreview
                modelUrl={modelUrl}
                creatureName={creature.name}
                onLoadError={() => {
                  setView3D(false)
                }}
              />
            </Suspense>
          ) : (
            creature.image && !imageFailed ? (
              hasDepthMap ? (
                <Suspense fallback={
                  <img
                    src={creature.image}
                    alt={creature.name}
                    loading="lazy"
                    decoding="async"
                    className="relative z-10 w-full h-full object-contain drop-shadow-2xl animate-mist-clear"
                  />
                }>
                  <CreatureViewer
                    creatureId={creatureId}
                    textureUrl={creature.image}
                    depthMapUrl={depthMapUrl}
                  />
                </Suspense>
              ) : (
                <img
                  src={creature.image}
                  alt={creature.name}
                  loading="lazy"
                  decoding="async"
                  onError={() => setImageFailed(true)}
                  className="relative z-10 w-full h-full object-contain drop-shadow-2xl animate-mist-clear"
                />
              )
            ) : (
              <div className="relative z-10 w-full h-full flex flex-col items-center justify-center text-center border border-immortal-gold/30 rounded-2xl bg-celestial-paper/60 backdrop-blur-sm animate-mist-clear">
                <p className="font-brush text-cinnabar text-6xl mb-2">{creature.name}</p>
                <p className="text-ink-dan text-sm font-display">
                  {imageFailed ? '画像暂不可见，以名代之' : 'AI 神兽画像生成中…'}
                </p>
              </div>
            )
          )}

          {/* 3D 预览切换按钮（有模型时显示） */}
          {show3D && modelUrl && (
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 z-20 flex gap-2">
              <button
                type="button"
                onClick={() => setView3D((v) => !v)}
                className={`px-3 py-1.5 rounded-full text-xs font-display tracking-wider backdrop-blur-md transition-all border ${
                  view3D
                    ? 'bg-immortal-gold/30 text-immortal-gold border-immortal-gold/50'
                    : 'bg-celestial-paper/70 text-ink-dan border-immortal-gold/20 hover:border-immortal-gold/50'
                }`}
              >
                {view3D ? '🖼 返回画像' : '🎲 3D 预览'}
              </button>
              {view3D && (
                <button
                  type="button"
                  onClick={() => setShow3DFullscreen(true)}
                  className="px-3 py-1.5 rounded-full text-xs font-display tracking-wider backdrop-blur-md bg-celestial-paper/70 text-ink-dan border border-immortal-gold/20 hover:border-immortal-gold/50 transition-all"
                >
                  ⛶ 全屏
                </button>
              )}
            </div>
          )}

          {/* 画框四角 */}
          <div className="ink-corner-tl !top-0 !left-0" aria-hidden="true" />
          <div className="ink-corner-tr !top-0 !right-0" aria-hidden="true" />
          <div className="ink-corner-bl !bottom-0 !left-0" aria-hidden="true" />
          <div className="ink-corner-br !bottom-0 !right-0" aria-hidden="true" />
        </div>

        {/* 神兽名与拼音 (题签) */}
        <div className="relative z-10 text-center mt-5">
          {/* 印章盖在标题旁边 */}
          <div className="flex items-center justify-center gap-3 mb-2">
            <ImmortalSeal text="仙" size={44} />
            <h2 className="font-brush text-4xl sm:text-5xl text-cinnabar tracking-[0.15em] text-glow-cinnabar">
              {creature.name}
            </h2>
            <ImmortalSeal text="瑞" size={44} rotation={6} />
          </div>
          <p className="text-ink-dan text-sm tracking-[0.3em] font-display">{creature.pinyin}</p>
          <div className="text-ink-faint text-[11px] mt-1.5 font-display tracking-[0.2em]">
            {creature.source} · {creature.scroll}
          </div>
        </div>
      </section>

      {/* ── 悬浮快捷操作栏：仙家法器 ── */}
      <div className="sticky top-[44px] z-20 -mt-6 mb-3 px-4">
        <div className="max-w-xl mx-auto flex items-center justify-center gap-1.5 p-2 rounded-2xl celestial-card !shadow-immortal overflow-x-auto border-immortal-gold/30">
          <XianAction icon="🔊" label="听声" testId="quick-audio" onClick={() => scrollTo(audioRef)} />
          <div className="flex items-center px-1">
            <CreatureAmbience personality={personality} />
          </div>
          <XianAction
            icon="💬"
            label="对话"
            testId="quick-chat"
            accent
            onClick={() =>
              setShowChat((s) => {
                if (!s) recordChat(creature.id)
                return !s
              })
            }
          />
          <XianAction icon="🖼" label="分享" testId="quick-share" onClick={() => scrollTo(shareRef)} />
          <XianAction icon="📜" label="考据" testId="quick-research" onClick={() => scrollTo(middleRef)} />
          <XianAction icon="✦" label="进化" testId="quick-evolution" onClick={() => goBestiary()} />
        </div>
      </div>

      {/* ── 上卷：原文 + 译文 ── */}
      <ScrollSection
        id="scroll-upper"
        title="上卷 · 原文译文"
        subtitle="ORIGINAL & TRANSLATION"
        refProp={upperRef}
      >
        <CreatureTextCard creature={creature} stage={evolutionStage} untilNext={untilNextEvolution} />
      </ScrollSection>

      {/* ── 中卷：考证 + 现代地 ── */}
      <ScrollSection
        id="scroll-middle"
        title="中卷 · 考据地望"
        subtitle="RESEARCH & LOCATION"
        refProp={middleRef}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <EvolutionLockCard stage={evolutionStage} requiredStage={3} untilNext={untilNextEvolution} title="地望与考证">
            <p className="text-ink-heaven font-display leading-relaxed">
              {creature.modern_location}
            </p>
            {creature.confidence_notes && (
              <p className="text-ink-dan text-xs mt-3 italic">{creature.confidence_notes}</p>
            )}
            <span
              className={`inline-block mt-3 text-xs px-2 py-1 rounded font-display ${
                creature.confidence === 'high'
                  ? 'bg-jade-cui/20 text-jade-cui border border-jade-cui/40'
                  : creature.confidence === 'medium'
                    ? 'bg-immortal-gold/20 text-immortal-gold border border-immortal-gold/40'
                    : 'bg-ink-muted/20 text-ink-muted border border-ink-muted/40'
              }`}
            >
              {creature.confidence === 'high' ? '✦ 高置信度' : creature.confidence === 'medium' ? '✦ 中置信度' : '✦ 创意附会'}
            </span>
          </EvolutionLockCard>
          <EvolutionLockCard stage={evolutionStage} requiredStage={2} untilNext={untilNextEvolution} title="轶事补遗">
            <p className="text-ink-zhong leading-relaxed text-sm">{creature.description}</p>
          </EvolutionLockCard>
        </div>
      </ScrollSection>

      {/* ── 进化进度 ── */}
      <section className="px-4 sm:px-6 py-4 max-w-5xl mx-auto">
        <EvolutionProgress stage={evolutionStage} untilNext={untilNextEvolution} />
      </section>

      {/* ── 下卷：羁绊记录 ── */}
      <ScrollSection id="scroll-lower" title="下卷 · 羁绊手记" subtitle="BOND JOURNAL" refProp={lowerRef}>
        <BondPanel creature={creature} />
      </ScrollSection>

      {/* ── 听声区域 ── */}
      <section ref={audioRef} className="px-4 sm:px-6 py-6 max-w-5xl mx-auto">
        <AudioPlayer
          audioUrl={creature.audio}
          originalText={creature.original_text}
          province={creature.province}
        />
      </section>

      {/* ── 对话区域 ── */}
      {showChat && (
        <section className="px-4 sm:px-6 pb-8 animate-fade-in max-w-5xl mx-auto">
          <CreatureChat creature={creature} initialMessage={initialMessage} />
        </section>
      )}

      {/* ── 分享卡区域 ── */}
      <section ref={shareRef} className="px-4 sm:px-6 pb-8 max-w-5xl mx-auto">
        <ShareCard creature={creature} />
      </section>

      {/* ── 底部关系网络：同门仙友 ── */}
      <RelatedCreatures
        creature={creature}
        evolutionStage={evolutionStage}
        goCreature={goCreature}
      />

      {/* ── 全屏 3D 查看器 ── */}
      {show3DFullscreen && modelUrl && (
        <div
          className="fixed inset-0 z-[9999]"
          onClick={() => setShow3DFullscreen(false)}
        >
          <Suspense fallback={null}>
            <Creature3DPreview
              modelUrl={modelUrl}
              creatureName={creature.name}
              fullscreen
              onLoadError={() => setShow3DFullscreen(false)}
            />
          </Suspense>
        </div>
      )}
    </div>
  )
}
