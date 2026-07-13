import { useMemo } from 'react'

/**
 * 仙侠氛围组件集合 — 桃花 / 星辰 / 御剑
 */

/* ═══ 桃花飘落 (Peach Blossom Falling) ═══ */
interface PetalProps {
  count?: number
}

export function PeachPetals({ count = 12 }: PetalProps) {
  const petals = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 8,
        duration: 6 + Math.random() * 6,
        size: 8 + Math.random() * 8,
        opacity: 0.4 + Math.random() * 0.5,
        rotation: Math.random() * 360,
      })),
    [count]
  )

  return (
    <div
      className="pointer-events-none fixed inset-0 z-[2] overflow-hidden"
      aria-hidden="true"
    >
      {petals.map((p) => (
        <div
          key={p.id}
          className="absolute animate-petal-fall"
          style={{
            left: `${p.left}%`,
            top: '-20px',
            width: p.size,
            height: p.size * 1.3,
            opacity: p.opacity,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            transform: `rotate(${p.rotation}deg)`,
            background:
              'radial-gradient(ellipse at 50% 30%, #f5c4cb 0%, #f0a8b3 50%, #c87882 100%)',
            borderRadius: '50% 0 50% 50%',
            filter: 'drop-shadow(0 0 3px rgba(240, 168, 179, 0.5))',
          }}
        />
      ))}
    </div>
  )
}

/* ═══ 仙天星辰 (Immortal Stars) ═══ */
interface StarsProps {
  count?: number
}

export function ImmortalStars({ count = 40 }: StarsProps) {
  const stars = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        top: Math.random() * 100,
        delay: Math.random() * 4,
        duration: 2 + Math.random() * 4,
        size: 1 + Math.random() * 2,
        color: ['#f3d58a', '#f5c4cb', '#b886d6', '#9d6fc4', '#f5e4b8'][
          Math.floor(Math.random() * 5)
        ],
      })),
    [count]
  )

  return (
    <div
      className="pointer-events-none fixed inset-0 z-[1] overflow-hidden"
      aria-hidden="true"
    >
      {stars.map((s) => (
        <span
          key={s.id}
          className="absolute rounded-full animate-star-twinkle"
          style={{
            left: `${s.left}%`,
            top: `${s.top}%`,
            width: s.size,
            height: s.size,
            background: s.color,
            boxShadow: `0 0 ${s.size * 2}px ${s.color}`,
            animationDelay: `${s.delay}s`,
            animationDuration: `${s.duration}s`,
          }}
        />
      ))}
    </div>
  )
}

/* ═══ 御剑飞行 (Sword Flight) ═══ */
export function FlyingSword() {
  return (
    <div
      className="pointer-events-none fixed top-[20%] left-0 right-0 z-[2] overflow-hidden h-12"
      aria-hidden="true"
    >
      <div className="animate-sword-fly text-2xl">🗡️</div>
    </div>
  )
}

/* ═══ 祥云 (Auspicious Cloud) ═══ */
export function AuspiciousClouds({ count = 4 }: { count?: number }) {
  const clouds = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        left: Math.random() * 80,
        top: Math.random() * 60,
        delay: Math.random() * 6,
        duration: 10 + Math.random() * 8,
        scale: 0.6 + Math.random() * 0.5,
        opacity: 0.3 + Math.random() * 0.3,
      })),
    [count]
  )

  return (
    <div
      className="pointer-events-none fixed inset-0 z-[1] overflow-hidden"
      aria-hidden="true"
    >
      {clouds.map((c) => (
        <div
          key={c.id}
          className="absolute animate-cloud-float"
          style={{
            left: `${c.left}%`,
            top: `${c.top}%`,
            transform: `scale(${c.scale})`,
            opacity: c.opacity,
            animationDelay: `${c.delay}s`,
            animationDuration: `${c.duration}s`,
            width: '120px',
            height: '40px',
            background:
              'radial-gradient(ellipse at center, rgba(255, 255, 255, 0.85) 0%, rgba(232, 244, 236, 0.5) 40%, rgba(245, 228, 184, 0.3) 70%, transparent 100%)',
            borderRadius: '50%',
            filter: 'blur(8px)',
            boxShadow:
              '0 0 30px rgba(245, 228, 184, 0.2), inset 0 0 20px rgba(255, 255, 255, 0.4)',
          }}
        />
      ))}
    </div>
  )
}

/* ═══ 仙家法阵 (Immortal Rune Circle) ═══ */
interface RuneCircleProps {
  size?: number
  animated?: boolean
  color?: string
}

export function RuneCircle({ size = 200, animated = true, color = '#d4a857' }: RuneCircleProps) {
  return (
    <div
      className="pointer-events-none relative"
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      {/* 外圈 */}
      <div
        className={`absolute inset-0 rounded-full ${animated ? 'animate-rune-rotate' : ''}`}
        style={{
          border: `1px solid ${color}`,
          boxShadow: `0 0 16px ${color}40, inset 0 0 16px ${color}20`,
        }}
      />
      {/* 外圈虚线 */}
      <div
        className={`absolute inset-2 rounded-full ${animated ? 'animate-rune-rotate-reverse' : ''}`}
        style={{
          border: `1px dashed ${color}`,
          opacity: 0.6,
        }}
      />
      {/* 中圈 */}
      <div
        className={`absolute inset-6 rounded-full ${animated ? 'animate-rune-rotate' : ''}`}
        style={{
          border: `1px solid ${color}`,
          opacity: 0.5,
        }}
      />
      {/* 内部三角符文 */}
      <div
        className={`absolute inset-0 flex items-center justify-center ${animated ? 'animate-rune-rotate-reverse' : ''}`}
      >
        <svg viewBox="0 0 100 100" width="60%" height="60%">
          <polygon
            points="50,15 85,75 15,75"
            fill="none"
            stroke={color}
            strokeWidth="1"
            opacity="0.6"
          />
          <polygon
            points="50,30 75,68 25,68"
            fill="none"
            stroke={color}
            strokeWidth="0.5"
            opacity="0.5"
            strokeDasharray="2 2"
          />
        </svg>
      </div>
      {/* 中心点 */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full animate-rune-pulse"
        style={{
          background: color,
          boxShadow: `0 0 12px ${color}`,
        }}
      />
    </div>
  )
}

/* ═══ 仙气升腾 (Xianqi Rising Particles) ═══ */
export function XianqiParticles({ count = 20 }: { count?: number }) {
  const particles = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 5,
        duration: 4 + Math.random() * 4,
        size: 2 + Math.random() * 4,
        color: ['#f3d58a', '#d4a857', '#4a8c6b', '#9d6fc4', '#f0a8b3'][
          Math.floor(Math.random() * 5)
        ],
      })),
    [count]
  )

  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden"
      aria-hidden="true"
    >
      {particles.map((p) => (
        <span
          key={p.id}
          className="absolute bottom-0 rounded-full animate-xian-rise"
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.size,
            background: p.color,
            boxShadow: `0 0 8px ${p.color}`,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
          }}
        />
      ))}
    </div>
  )
}
