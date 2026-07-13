import { useEffect, useRef, useCallback } from 'react'
import { useReducedMotion } from '../lib/useReducedMotion'

interface SsrThemePlayerProps {
  creatureId: string
  /** 是否已解锁；未解锁时不播放。 */
  isUnlocked: boolean
}

/**
 * SSR 神兽主题旋律：五声音阶（宫商角徵羽）C 调。
 * 用 creatureId 做简单哈希，保证同一只神兽每次旋律一致。
 */
const PENTATONIC = [261.63, 293.66, 329.63, 392.0, 440.0] // C4 D4 E4 G4 A4

function hashToMelody(id: string): number[] {
  let hash = 0
  for (let i = 0; i < id.length; i++) {
    hash = (hash << 5) - hash + id.charCodeAt(i)
    hash |= 0
  }
  const rand = (offset: number) => {
    const x = Math.sin(hash + offset) * 10000
    return Math.abs(x - Math.floor(x))
  }
  const length = 5 + Math.floor(rand(1) * 4) // 5-8 个音符
  return Array.from({ length }, (_, i) => {
    const index = Math.floor(rand(i + 2) * PENTATONIC.length)
    const octave = rand(i + 3) > 0.75 ? 2 : 1
    return PENTATONIC[index] * octave
  })
}

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null
  const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
  return Ctx ? new Ctx() : null
}

/**
 * 播放一次 SSR 神兽主题旋律。
 *
 * 仅在用户未开启 reduced motion 且已解锁时自动播放；组件卸载时停止。
 */
export function SsrThemePlayer({ creatureId, isUnlocked }: SsrThemePlayerProps) {
  const reducedMotion = useReducedMotion()
  const playedRef = useRef(false)
  const ctxRef = useRef<AudioContext | null>(null)

  const playTheme = useCallback(() => {
    if (!isUnlocked || reducedMotion || playedRef.current) return

    const ctx = ctxRef.current ?? getAudioContext()
    if (!ctx) return
    ctxRef.current = ctx

    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {
        // ignore autoplay policy blocks
      })
    }

    const melody = hashToMelody(creatureId)
    const master = ctx.createGain()
    master.gain.value = 0.2
    master.connect(ctx.destination)

    const now = ctx.currentTime
    melody.forEach((freq, i) => {
      const osc = ctx.createOscillator()
      osc.type = 'triangle'
      osc.frequency.value = freq

      const gain = ctx.createGain()
      gain.gain.setValueAtTime(0, now + i * 0.35)
      gain.gain.linearRampToValueAtTime(0.18, now + i * 0.35 + 0.05)
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.35 + 0.55)

      osc.connect(gain)
      gain.connect(master)
      osc.start(now + i * 0.35)
      osc.stop(now + i * 0.35 + 0.6)
    })

    playedRef.current = true
  }, [creatureId, isUnlocked, reducedMotion])

  // 首次进入详情页无用户手势，AudioContext 处于 suspended，直接播放不发声。
  // 改为在用户首次交互（点击/按键）后再触发播放，绕过 autoplay 限制。
  useEffect(() => {
    const tryPlay = () => playTheme()
    window.addEventListener('pointerdown', tryPlay, { once: true })
    window.addEventListener('keydown', tryPlay, { once: true })
    return () => {
      window.removeEventListener('pointerdown', tryPlay)
      window.removeEventListener('keydown', tryPlay)
    }
  }, [playTheme])

  // 组件卸载时关闭 AudioContext
  useEffect(() => {
    return () => {
      if (ctxRef.current && ctxRef.current.state !== 'closed') {
        ctxRef.current.close().catch(() => {
          // ignore
        })
      }
    }
  }, [])

  // 这是一个无 UI 的音频播放组件
  return null
}
