import { useState, useEffect, useMemo, useRef, useLayoutEffect } from 'react'
import gsap from 'gsap'
import { useTypewriter } from './useTypewriter'
import type { CreatureWithAssets } from '../data/loadCreatures'
import { getRarity, type Rarity } from '../collection/rarity'
import { RuneCircle, XianqiParticles } from '../atmosphere/XianxiaAtmosphere'

interface EncounterOverlayProps {
  creature: CreatureWithAssets
  isNewDiscovery: boolean
  onComplete: () => void
  onSkip: () => void
}

/* ═══ 7 阶段类型 ═══ */
type EncounterPhase =
  | 'darkening'
  | 'ink-spread'
  | 'ancient-text'
  | 'rune-spin'
  | 'creature-reveal'
  | 'golden-burst'
  | 'show-name'

/* ═══ 阶段时长配置 (秒) ═══ */
/* SSR 总计 3.9s | SR 总计 2.5s | R 总计 1.5s */
const PHASE_DURATIONS: Record<Rarity, {
  darkening: number; inkSpread: number; ancientText: number;
  runeSpin: number; creatureReveal: number; goldenBurst: number; showName: number;
}> = {
  SSR: { darkening: 0.3, inkSpread: 0.6, ancientText: 0.8, runeSpin: 0.5, creatureReveal: 1.0, goldenBurst: 0.4, showName: 0.3 },
  SR:  { darkening: 0.3, inkSpread: 0.6, ancientText: 0.6, runeSpin: 0,   creatureReveal: 0.7, goldenBurst: 0.2, showName: 0.1 },
  R:   { darkening: 0.3, inkSpread: 0.6, ancientText: 0,   runeSpin: 0,   creatureReveal: 0.4, goldenBurst: 0,   showName: 0.2 },
}

const XIAN_RARITY: Record<Rarity, { label: string; icon: string; color: string; phase: string }> = {
  R: { label: '凡品', icon: '✦', color: '#4a8c6b', phase: '水墨淡现' },
  SR: { label: '灵品', icon: '✦✦', color: '#d4a857', phase: '金光乍现' },
  SSR: { label: '仙品', icon: '✦✦✦', color: '#c8423a', phase: '紫电雷劫' },
}

const PHASE_LABELS: Record<EncounterPhase, string> = {
  'darkening': '暗幕降临',
  'ink-spread': '水墨扩散',
  'ancient-text': '古文浮现',
  'rune-spin': '法阵旋转',
  'creature-reveal': '神兽显现',
  'golden-burst': '金光炸裂',
  'show-name': '仙名题刻',
}

const TEXT_PHASES: EncounterPhase[] = ['ancient-text', 'rune-spin', 'creature-reveal', 'golden-burst']
const IMAGE_PHASES: EncounterPhase[] = ['creature-reveal', 'golden-burst', 'show-name']

/* ── Audio ── */
function safeCreateAudioContext(): AudioContext | null {
  try {
    const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    return new Ctor()
  } catch { return null }
}

function playRumble(ctx: AudioContext) {
  const now = ctx.currentTime
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = 'sawtooth'
  osc.frequency.setValueAtTime(45, now)
  osc.frequency.exponentialRampToValueAtTime(80, now + 0.8)
  gain.gain.setValueAtTime(0, now)
  gain.gain.linearRampToValueAtTime(0.15, now + 0.1)
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8)
  osc.connect(gain).connect(ctx.destination)
  osc.start(now)
  osc.stop(now + 0.8)
}

function playReveal(ctx: AudioContext, rarity: Rarity) {
  const now = ctx.currentTime
  const freqs = rarity === 'SSR' ? [220, 330, 440] : rarity === 'SR' ? [220, 330] : [220]
  freqs.forEach((f, i) => {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(f, now + i * 0.05)
    gain.gain.setValueAtTime(0, now + i * 0.05)
    gain.gain.linearRampToValueAtTime(0.12, now + i * 0.05 + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.05 + 0.6)
    osc.connect(gain).connect(ctx.destination)
    osc.start(now + i * 0.05)
    osc.stop(now + i * 0.05 + 0.6)
  })
}

function playAcquisitionChime(ctx: AudioContext) {
  const now = ctx.currentTime
  const notes = [523.25, 659.25, 783.99]
  notes.forEach((f, i) => {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'triangle'
    osc.frequency.setValueAtTime(f, now + i * 0.08)
    gain.gain.setValueAtTime(0, now + i * 0.08)
    gain.gain.linearRampToValueAtTime(0.1, now + i * 0.08 + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.4)
    osc.connect(gain).connect(ctx.destination)
    osc.start(now + i * 0.08)
    osc.stop(now + i * 0.08 + 0.4)
  })
}

/* ── Accessibility ── */
function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReduced(mq.matches)
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])
  return reduced
}

/* ── ThunderBolts (SSR 紫电) ── */
function ThunderBolts({ color }: { color: string }) {
  const bolts = useMemo(() =>
    Array.from({ length: 3 }).map((_, i) => ({
      left: 15 + i * 30 + Math.random() * 10,
      delay: i * 0.3,
      duration: 2 + Math.random(),
    })), []
  )
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
      {bolts.map((b, i) => (
        <div key={i} className="absolute top-0 w-0.5 h-full animate-thunder-flash"
          style={{ left: `${b.left}%`, background: `linear-gradient(to bottom, transparent, ${color}, transparent)`, animationDelay: `${b.delay}s`, animationDuration: `${b.duration}s` }}
        />
      ))}
    </div>
  )
}

/* ── GoldenBurst 粒子 (金光炸裂) ── */
function GoldenBurst({ color }: { color: string }) {
  const particles = useMemo(() =>
    Array.from({ length: 24 }).map(() => {
      const angle = Math.random() * Math.PI * 2
      const distance = 80 + Math.random() * 200
      return {
        dx: Math.cos(angle) * distance,
        dy: Math.sin(angle) * distance,
        size: 2 + Math.random() * 6,
        delay: Math.random() * 0.1,
      }
    }), []
  )
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30 overflow-hidden" aria-hidden="true">
      {particles.map((p, i) => (
        <div key={i} className="absolute rounded-full"
          style={{
            width: `${p.size}px`, height: `${p.size}px`,
            background: color, boxShadow: `0 0 ${p.size * 3}px ${color}`,
            '--dx': `${p.dx}px`, '--dy': `${p.dy}px`,
            animation: `goldenBurst 0.4s ${p.delay}s ease-out forwards`,
          } as React.CSSProperties}
        />
      ))}
    </div>
  )
}

export function EncounterOverlay({ creature, isNewDiscovery, onComplete, onSkip }: EncounterOverlayProps) {
  const [phase, setPhase] = useState<EncounterPhase>('darkening')
  const [typingActive, setTypingActive] = useState(false)
  const [burstActive, setBurstActive] = useState(false)

  const rarity = getRarity(creature)
  const xianRarity = XIAN_RARITY[rarity]
  const durations = PHASE_DURATIONS[rarity]
  const reducedMotion = usePrefersReducedMotion()

  const overlayRef = useRef<HTMLDivElement>(null)
  const inkSpreadRef = useRef<HTMLDivElement>(null)
  const runeRef = useRef<HTMLDivElement>(null)
  const tlRef = useRef<gsap.core.Timeline | null>(null)

  const audioRef = useRef<AudioContext | null>(null)
  const audioReadyRef = useRef(false)

  const { displayed, isDone, skip: skipTyping } = useTypewriter(
    creature.original_text, 60, 0, typingActive
  )

  const particles = useMemo(() =>
    Array.from({ length: 16 }).map(() => ({
      left: Math.random() * 100,
      color: xianRarity.color,
      duration: 4 + Math.random() * 4,
      delay: Math.random() * 3,
    })), [xianRarity.color]
  )

  /* ═══ GSAP Timeline ═══ */
  useLayoutEffect(() => {
    if (reducedMotion) {
      setPhase('show-name')
      setTypingActive(true)
      return
    }

    const ctx = gsap.context(() => {
      const tl = gsap.timeline()
      tlRef.current = tl
      let t = 0

      // Phase 1: 暗幕降临
      tl.call(() => setPhase('darkening'), [], t)
      tl.fromTo(overlayRef.current,
        { opacity: 0.3 }, { opacity: 1, duration: durations.darkening }, t
      )
      t += durations.darkening

      // Phase 2: 水墨扩散
      tl.call(() => setPhase('ink-spread'), [], t)
      if (inkSpreadRef.current) {
        tl.fromTo(inkSpreadRef.current,
          { clipPath: 'circle(0% at 50% 50%)' },
          { clipPath: 'circle(150% at 50% 50%)', duration: durations.inkSpread, ease: 'power2.out' },
          t
        )
      }
      t += durations.inkSpread

      // Phase 3: 古文浮现 (SSR/SR)
      if (durations.ancientText > 0) {
        tl.call(() => { setPhase('ancient-text'); setTypingActive(true) }, [], t)
        tl.to({}, { duration: durations.ancientText }, t)
        t += durations.ancientText
      }

      // Phase 4: 法阵旋转 (SSR)
      if (durations.runeSpin > 0 && runeRef.current) {
        tl.call(() => setPhase('rune-spin'), [], t)
        tl.to(runeRef.current,
          { rotation: '+=720', duration: durations.runeSpin, ease: 'power2.in' }, t
        )
        t += durations.runeSpin
      }

      // Phase 5: 神兽显现
      tl.call(() => setPhase('creature-reveal'), [], t)
      t += durations.creatureReveal

      // Phase 6: 金光炸裂 (SSR/SR)
      if (durations.goldenBurst > 0) {
        tl.call(() => { setPhase('golden-burst'); setBurstActive(true) }, [], t)
        tl.to({}, { duration: durations.goldenBurst }, t)
        t += durations.goldenBurst
      }

      // Phase 7: 显示名称
      tl.call(() => setPhase('show-name'), [], t)
    }, overlayRef)

    return () => ctx.revert()
  }, [rarity, reducedMotion, durations])

  /* ═══ Audio ═══ */
  useEffect(() => {
    audioRef.current = safeCreateAudioContext()
    return () => { audioRef.current?.close().catch(() => {}) }
  }, [])

  useEffect(() => {
    if (reducedMotion) return
    const ctx = audioRef.current
    if (!ctx) return

    const play = () => {
      if (phase === 'ancient-text') playRumble(ctx)
      else if (phase === 'creature-reveal') playReveal(ctx, rarity)
      else if (phase === 'show-name') playAcquisitionChime(ctx)
    }
    const start = () => {
      if (ctx.state === 'suspended') ctx.resume().then(play).catch(() => {})
      else play()
    }

    if (audioReadyRef.current) { start(); return }
    const onInteract = () => { audioReadyRef.current = true; start() }
    window.addEventListener('pointerdown', onInteract, { once: true })
    window.addEventListener('keydown', onInteract, { once: true })
    return () => {
      window.removeEventListener('pointerdown', onInteract)
      window.removeEventListener('keydown', onInteract)
    }
  }, [phase, rarity, reducedMotion])

  /* ═══ Focus & Keyboard ═══ */
  useEffect(() => { overlayRef.current?.focus() }, [])

  const skipToIntro = () => {
    setTypingActive(true)
    tlRef.current?.kill()
    if (inkSpreadRef.current) {
      gsap.set(inkSpreadRef.current, { clipPath: 'circle(150% at 50% 50%)' })
    }
    setPhase('show-name')
    skipTyping()
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (phase !== 'show-name') skipToIntro()
        else onComplete()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [phase, onComplete])

  const handleClick = () => {
    if (phase !== 'show-name') skipToIntro()
    else onComplete()
  }

  /* ═══ Render ═══ */
  const phaseLabel = phase === 'show-name'
    ? (isNewDiscovery ? `新发现 ${creature.name}` : `已收录 ${creature.name}`)
    : PHASE_LABELS[phase]

  const showText = TEXT_PHASES.includes(phase)
  const showImage = IMAGE_PHASES.includes(phase)
  const showName = phase === 'show-name'

  const revealClass = {
    R: 'animate-mist-clear',
    SR: 'animate-bronze-gate',
    SSR: 'animate-gold-flash',
  }[rarity]

  return (
    <div
      ref={overlayRef}
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
      aria-label={`渡劫 · 遭遇神兽 ${creature.name}`}
      data-testid="encounter-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center bg-bg-deep outline-none overflow-hidden"
      onClick={handleClick}
      onMouseMove={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <span className="sr-only" aria-live="polite" data-testid="phase-announcement">
        {phaseLabel}
      </span>

      {/* 水墨扩散层 */}
      <div
        ref={inkSpreadRef}
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(circle at 50% 50%, ${xianRarity.color}15 0%, transparent 70%)`,
          clipPath: 'circle(0% at 50% 50%)',
        }}
        aria-hidden="true"
      />

      {/* 仙气粒子背景 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        {particles.map((p, i) => (
          <div key={i} className="absolute w-1 h-1 rounded-full"
            style={{
              left: `${p.left}%`, bottom: '0',
              background: p.color, boxShadow: `0 0 8px ${p.color}`,
              animation: `xian-rise ${p.duration}s ${p.delay}s ease-out infinite`,
            }}
          />
        ))}
      </div>

      {/* 法阵背景 */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
        <div ref={runeRef}>
          <RuneCircle size={500} animated color={xianRarity.color} />
        </div>
      </div>

      {/* SSR 紫电 */}
      {rarity === 'SSR' && <ThunderBolts color={xianRarity.color} />}

      {/* 金光炸裂 */}
      {burstActive && <GoldenBurst color={xianRarity.color} />}

      {/* Content */}
      <div className="relative z-10 max-w-2xl w-full mx-auto p-8 text-center">
        {/* 古文浮现 */}
        {showText && (
          <div className="mb-8 min-h-[80px] flex items-center justify-center">
            <div className="relative px-8 py-6 max-w-xl">
              <div className="absolute inset-0 celestial-card opacity-30" />
              <p className="relative font-display text-ink-heaven text-lg md:text-xl leading-relaxed font-brush tracking-wider">
                {displayed}
                {!isDone && <span className="animate-pulse text-immortal-gold">▊</span>}
              </p>
            </div>
          </div>
        )}

        {/* 神兽显现 */}
        {showImage && (
          <div className={`relative mx-auto mb-6 ${showName ? revealClass : ''}`} style={{ width: 'min(300px, 70vw)', height: 'min(300px, 70vw)' }}>
            <div className="absolute inset-0 pointer-events-none">
              <RuneCircle size={300} animated color={xianRarity.color} />
            </div>
            <div
              className="absolute inset-4 overflow-hidden rounded-full"
              style={{ boxShadow: `0 0 32px ${xianRarity.color}`, border: `2px solid ${xianRarity.color}` }}
            >
              <div
                className="absolute inset-0 bg-gradient-to-b from-celestial-mist/30 via-celestial-paper/50 to-celestial-paper/80 z-10 transition-opacity duration-1000"
                style={{ opacity: showName ? 0 : 0.7 }}
              />
              {creature.image ? (
                <img
                  src={creature.image}
                  alt={`${creature.name}画像`}
                  className="w-full h-full object-cover"
                  data-testid="encounter-image"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-celestial-paper">
                  <span className="font-brush text-cinnabar text-6xl">{creature.name}</span>
                </div>
              )}
            </div>
            <XianqiParticles count={12} />
          </div>
        )}

        {/* 显示名称 */}
        {showName && (
          <div className="animate-talisman-unfurl space-y-3" role="status" aria-live="polite">
            <div className="flex items-center justify-center gap-3">
              <span
                className="text-2xl font-display"
                style={{ color: xianRarity.color, textShadow: `0 0 8px ${xianRarity.color}` }}
                aria-label={`稀有度 ${xianRarity.label}`}
                data-testid="rarity-stars"
              >
                {xianRarity.icon}
              </span>
              <h2
                className="font-brush text-5xl tracking-[0.15em] text-glow-cinnabar"
                style={{ color: xianRarity.color }}
                data-testid="encounter-name"
              >
                {creature.name}
              </h2>
            </div>
            <p className="text-ink-deep/80 text-sm font-display tracking-wider">
              {creature.pinyin} · {creature.source}
            </p>
            {isNewDiscovery ? (
              <p
                className="text-sm font-display py-1.5 px-5 inline-block rounded-full celestial-card"
                style={{ color: xianRarity.color, border: `1px solid ${xianRarity.color}`, background: `${xianRarity.color}20` }}
                data-testid="new-discovery-badge"
              >
                ✦ 渡劫成功 · 新收 {xianRarity.label}级神兽 ✦
              </p>
            ) : (
              <p className="text-ink-dan text-sm font-display" data-testid="already-discovered">
                此神兽已收录于图录
              </p>
            )}
            <div className="flex items-center justify-center gap-4 pt-4">
              <button
                onClick={(e) => { e.stopPropagation(); onComplete() }}
                className="px-5 py-2 rounded-full celestial-btn !py-2"
                data-testid="encounter-continue"
                aria-label="继续探索地图"
              >
                继续寻仙
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onSkip() }}
                className="px-5 py-2 rounded-full celestial-btn !py-2 !border-cinnabar"
                data-testid="encounter-detail"
                aria-label={`查看${creature.name}详情`}
              >
                查看神兽
              </button>
            </div>
          </div>
        )}

        {/* Skip hint */}
        {!showName && (
          <p className="absolute bottom-4 left-0 right-0 text-ink-dan/60 text-xs text-center font-display tracking-wider">
            ✦ 点击屏幕或按 Esc 键跳过 ✦
          </p>
        )}
      </div>
    </div>
  )
}
