import { useState, useRef, useCallback, useEffect } from 'react'
import type { Personality } from '../chat/chatPrompts'

interface CreatureAmbienceProps {
  personality: Personality
}

interface ActiveNodes {
  sources: AudioScheduledSourceNode[]
  gains: GainNode[]
  filters: BiquadFilterNode[]
  timeouts: number[]
}

const PERSONALITY_LABEL: Record<Personality, string> = {
  ferocious: '凶猛',
  auspicious: '祥瑞',
  disastrous: '灾厄',
  mysterious: '神秘',
}

/**
 * 创建白噪声 buffer，用于风声、雷鸣、嘶鸣等合成。
 */
function createNoiseBuffer(ctx: AudioContext): AudioBuffer {
  const bufferSize = ctx.sampleRate * 2
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1
  }
  return buffer
}

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null
  const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
  return Ctx ? new Ctx() : null
}

/**
 * 凶猛：低沉咆哮 + 心跳低频。
 */
function buildFerocious(ctx: AudioContext, master: GainNode, nodes: ActiveNodes): void {
  // 咆哮：低频锯齿波 + LFO 调制
  const growlOsc = ctx.createOscillator()
  growlOsc.type = 'sawtooth'
  growlOsc.frequency.value = 72

  const growlGain = ctx.createGain()
  growlGain.gain.value = 0

  const lfo = ctx.createOscillator()
  lfo.type = 'sine'
  lfo.frequency.value = 4
  const lfoGain = ctx.createGain()
  lfoGain.gain.value = 24

  const filter = ctx.createBiquadFilter()
  filter.type = 'lowpass'
  filter.frequency.value = 180
  filter.Q.value = 2

  growlOsc.connect(filter)
  filter.connect(growlGain)
  growlGain.connect(master)

  lfo.connect(lfoGain)
  lfoGain.connect(growlOsc.frequency)

  const now = ctx.currentTime
  growlGain.gain.setValueAtTime(0, now)
  growlGain.gain.linearRampToValueAtTime(0.35, now + 1.2)

  growlOsc.start(now)
  lfo.start(now)
  nodes.sources.push(growlOsc, lfo)
  nodes.gains.push(growlGain, lfoGain)
  nodes.filters.push(filter)

  // 心跳：周期性低频脉冲
  const heartbeat = () => {
    if (master.gain.value < 0.01) return
    const beatOsc = ctx.createOscillator()
    beatOsc.type = 'sine'
    beatOsc.frequency.setValueAtTime(60, ctx.currentTime)
    beatOsc.frequency.exponentialRampToValueAtTime(30, ctx.currentTime + 0.18)

    const beatGain = ctx.createGain()
    beatGain.gain.setValueAtTime(0, ctx.currentTime)
    beatGain.gain.linearRampToValueAtTime(0.45, ctx.currentTime + 0.02)
    beatGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35)

    beatOsc.connect(beatGain)
    beatGain.connect(master)
    beatOsc.start(ctx.currentTime)
    beatOsc.stop(ctx.currentTime + 0.4)
    nodes.sources.push(beatOsc)
    nodes.gains.push(beatGain)

    const next = window.setTimeout(heartbeat, 920 + Math.random() * 400)
    nodes.timeouts.push(next)
  }
  heartbeat()
}

/**
 * 祥瑞：清亮铃声 + 悠远风声。
 */
function buildAuspicious(ctx: AudioContext, master: GainNode, nodes: ActiveNodes, noiseBuffer: AudioBuffer): void {
  // 风声：持续低响度 filtered noise
  const wind = ctx.createBufferSource()
  wind.buffer = noiseBuffer
  wind.loop = true

  const windFilter = ctx.createBiquadFilter()
  windFilter.type = 'bandpass'
  windFilter.frequency.value = 380
  windFilter.Q.value = 0.6

  const windGain = ctx.createGain()
  windGain.gain.value = 0.12

  wind.connect(windFilter)
  windFilter.connect(windGain)
  windGain.connect(master)
  wind.start()

  nodes.sources.push(wind)
  nodes.gains.push(windGain)
  nodes.filters.push(windFilter)

  // 铃声：随机间隔的泛音衰减
  const bellNotes = [880, 1100, 1320, 1568]
  const ringBell = () => {
    if (master.gain.value < 0.01) return
    const freq = bellNotes[Math.floor(Math.random() * bellNotes.length)]
    const bell = ctx.createOscillator()
    bell.type = 'sine'
    bell.frequency.value = freq

    const bellGain = ctx.createGain()
    bellGain.gain.setValueAtTime(0, ctx.currentTime)
    bellGain.gain.linearRampToValueAtTime(0.18, ctx.currentTime + 0.02)
    bellGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 2.5)

    // 轻微颤音
    const vibrato = ctx.createOscillator()
    vibrato.frequency.value = 6
    const vibratoGain = ctx.createGain()
    vibratoGain.gain.value = 4
    vibrato.connect(vibratoGain)
    vibratoGain.connect(bell.frequency)
    vibrato.start()

    bell.connect(bellGain)
    bellGain.connect(master)
    bell.start(ctx.currentTime)
    bell.stop(ctx.currentTime + 3)

    nodes.sources.push(bell, vibrato)
    nodes.gains.push(bellGain, vibratoGain)

    const next = window.setTimeout(ringBell, 2200 + Math.random() * 2800)
    nodes.timeouts.push(next)
  }
  ringBell()
}

/**
 * 灾厄：沙哑嘶鸣 + 断续雷鸣。
 */
function buildDisastrous(ctx: AudioContext, master: GainNode, nodes: ActiveNodes, noiseBuffer: AudioBuffer): void {
  // 嘶鸣：bandpass noise 模拟沙哑质感
  const hiss = ctx.createBufferSource()
  hiss.buffer = noiseBuffer
  hiss.loop = true

  const hissFilter = ctx.createBiquadFilter()
  hissFilter.type = 'bandpass'
  hissFilter.frequency.value = 600
  hissFilter.Q.value = 4

  const hissGain = ctx.createGain()
  hissGain.gain.value = 0.08

  // LFO 调制 filter 频率，产生嘶嘶波动
  const lfo = ctx.createOscillator()
  lfo.type = 'sine'
  lfo.frequency.value = 2.5
  const lfoGain = ctx.createGain()
  lfoGain.gain.value = 300

  hiss.connect(hissFilter)
  hissFilter.connect(hissGain)
  hissGain.connect(master)
  hiss.start()

  lfo.connect(lfoGain)
  lfoGain.connect(hissFilter.frequency)
  lfo.start()

  nodes.sources.push(hiss, lfo)
  nodes.gains.push(hissGain, lfoGain)
  nodes.filters.push(hissFilter)

  // 雷鸣：低频噪声突发
  const thunder = () => {
    if (master.gain.value < 0.01) return
    const rumble = ctx.createBufferSource()
    rumble.buffer = noiseBuffer

    const rumbleFilter = ctx.createBiquadFilter()
    rumbleFilter.type = 'lowpass'
    rumbleFilter.frequency.value = 120

    const rumbleGain = ctx.createGain()
    rumbleGain.gain.setValueAtTime(0, ctx.currentTime)
    rumbleGain.gain.linearRampToValueAtTime(0.55, ctx.currentTime + 0.08)
    rumbleGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.8)

    rumble.connect(rumbleFilter)
    rumbleFilter.connect(rumbleGain)
    rumbleGain.connect(master)
    rumble.start(ctx.currentTime)
    rumble.stop(ctx.currentTime + 2)

    nodes.sources.push(rumble)
    nodes.gains.push(rumbleGain)
    nodes.filters.push(rumbleFilter)

    const next = window.setTimeout(thunder, 4200 + Math.random() * 5000)
    nodes.timeouts.push(next)
  }
  thunder()
}

/**
 * 神秘：空灵回响 + 水滴/洞穴声。
 */
function buildMysterious(ctx: AudioContext, master: GainNode, nodes: ActiveNodes): void {
  // 空灵：多个失谐正弦波
  const baseFreqs = [220, 277, 330, 392]
  baseFreqs.forEach((freq, i) => {
    const osc = ctx.createOscillator()
    osc.type = 'sine'
    osc.frequency.value = freq

    const gain = ctx.createGain()
    gain.gain.value = 0.04 + i * 0.01

    // 缓慢音量起伏
    const lfo = ctx.createOscillator()
    lfo.frequency.value = 0.15 + i * 0.05
    const lfoGain = ctx.createGain()
    lfoGain.gain.value = 0.02
    lfo.connect(lfoGain)
    lfoGain.connect(gain.gain)
    lfo.start()

    osc.connect(gain)
    gain.connect(master)
    osc.start()

    nodes.sources.push(osc, lfo)
    nodes.gains.push(gain, lfoGain)
  })

  // 水滴：随机短促高频
  const droplets = [1320, 1568, 1760, 2093]
  const drop = () => {
    if (master.gain.value < 0.01) return
    const freq = droplets[Math.floor(Math.random() * droplets.length)]
    const osc = ctx.createOscillator()
    osc.type = 'sine'
    osc.frequency.value = freq

    const gain = ctx.createGain()
    gain.gain.setValueAtTime(0, ctx.currentTime)
    gain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.01)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.7)

    osc.connect(gain)
    gain.connect(master)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.8)

    nodes.sources.push(osc)
    nodes.gains.push(gain)

    const next = window.setTimeout(drop, 1500 + Math.random() * 3500)
    nodes.timeouts.push(next)
  }
  drop()
}

function buildAmbience(personality: Personality, ctx: AudioContext, master: GainNode): ActiveNodes {
  const nodes: ActiveNodes = { sources: [], gains: [], filters: [], timeouts: [] }
  const noiseBuffer = createNoiseBuffer(ctx)

  switch (personality) {
    case 'ferocious':
      buildFerocious(ctx, master, nodes)
      break
    case 'auspicious':
      buildAuspicious(ctx, master, nodes, noiseBuffer)
      break
    case 'disastrous':
      buildDisastrous(ctx, master, nodes, noiseBuffer)
      break
    case 'mysterious':
    default:
      buildMysterious(ctx, master, nodes)
      break
  }

  return nodes
}

function stopNodes(nodes: ActiveNodes): void {
  nodes.timeouts.forEach((id) => window.clearTimeout(id))
  nodes.timeouts = []

  nodes.gains.forEach((gain) => {
    try {
      const now = gain.context.currentTime
      gain.gain.cancelScheduledValues(now)
      gain.gain.setValueAtTime(gain.gain.value, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3)
    } catch {
      // ignore
    }
  })

  window.setTimeout(() => {
    nodes.sources.forEach((src) => {
      try {
        src.stop()
        src.disconnect()
      } catch {
        // ignore already stopped nodes
      }
    })
    nodes.gains.forEach((g) => g.disconnect())
    nodes.filters.forEach((f) => f.disconnect())
    nodes.sources = []
    nodes.gains = []
    nodes.filters = []
  }, 350)
}

export function CreatureAmbience({ personality }: CreatureAmbienceProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [unsupported, setUnsupported] = useState(false)
  const [waitingForInteraction, setWaitingForInteraction] = useState(false)
  const ctxRef = useRef<AudioContext | null>(null)
  const masterRef = useRef<GainNode | null>(null)
  const nodesRef = useRef<ActiveNodes | null>(null)

  const stop = useCallback(() => {
    if (nodesRef.current) {
      stopNodes(nodesRef.current)
      nodesRef.current = null
    }
    if (masterRef.current) {
      try {
        masterRef.current.gain.setValueAtTime(0, masterRef.current.context.currentTime)
      } catch {
        // ignore
      }
    }
    setIsPlaying(false)
  }, [])

  const play = useCallback(() => {
    const ctx = ctxRef.current ?? getAudioContext()
    if (!ctx) {
      setUnsupported(true)
      return
    }
    ctxRef.current = ctx

    if (!masterRef.current) {
      const master = ctx.createGain()
      master.gain.value = 0.35
      master.connect(ctx.destination)
      masterRef.current = master
    }

    // resume 是异步的：必须等 ctx 真正进入 running 状态后再创建音频节点，
    // 否则在 suspended 状态下创建的节点不会发声。
    const start = () => {
      stop()
      nodesRef.current = buildAmbience(personality, ctx, masterRef.current!)
      setIsPlaying(true)
      setWaitingForInteraction(false)
    }

    if (ctx.state === 'suspended') {
      ctx
        .resume()
        .then(start)
        .catch(() => {
          // autoplay policy 导致 resume 失败，并非"不支持 Web Audio"，
          // 提示用户点击后再播放。
          setWaitingForInteraction(true)
        })
    } else {
      start()
    }
  }, [personality, stop])

  const toggle = useCallback(() => {
    if (isPlaying) stop()
    else play()
  }, [isPlaying, stop, play])

  useEffect(() => {
    return () => {
      stop()
      if (ctxRef.current && ctxRef.current.state !== 'closed') {
        ctxRef.current.close().catch(() => {
          // ignore
        })
      }
    }
  }, [stop])

  return (
    <div
      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-bg-deep/70 backdrop-blur-sm border border-acc-bronze/30"
      data-testid="creature-ambience"
    >
      <button
        type="button"
        onClick={toggle}
        data-testid="ambience-toggle"
        aria-label={isPlaying ? '暂停氛围音' : '播放氛围音'}
        className={`text-sm px-3 py-1 rounded transition-colors ${
          isPlaying
            ? 'bg-acc-cinnabar/30 text-acc-gold border border-acc-cinnabar/50'
            : 'bg-acc-bronze/20 text-ink-primary border border-acc-bronze/40 hover:bg-acc-bronze/30'
        }`}
      >
        {isPlaying ? '■ 暂停氛围' : '▶ 氛围音'}
      </button>
      <span className="text-xs text-ink-muted">{PERSONALITY_LABEL[personality]}</span>
      {unsupported && (
        <span className="text-xs text-acc-cinnabar" role="alert">
          当前环境不支持 Web Audio
        </span>
      )}
      {waitingForInteraction && (
        <span className="text-xs text-acc-gold" role="status">
          点击后播放氛围音
        </span>
      )}
    </div>
  )
}
