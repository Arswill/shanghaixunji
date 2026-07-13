import { useMemo } from 'react'

/**
 * 仙鹤祥云组件 - 仙侠风
 *
 * 模拟仙鹤飞过天际，伴以金色光点，比原"水墨飞鸟"更仙侠。
 */

interface CraneState {
  id: number
  left: number
  top: number
  delay: number
  duration: number
  scale: number
  opacity: number
  color: string
}

// 仙鹤剪影：展翅高飞形态
const CRANE_PATH = 'M2 6 Q4 4 6 5 L8 4 Q10 4 12 5 Q16 4 22 6 L26 5 L24 7 L20 6 L18 8 L16 7 L12 7 L8 8 L6 7 L4 8 Q2 8 2 6 Z'

const CRANE_COLORS = [
  '#d4a857', // 仙金
  '#c8423a', // 朱砂
  '#4a8c6b', // 翠玉
  '#7b4ea0', // 紫电
  '#2d4a5e', // 玄青
]

function generateCranes(count: number): CraneState[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    left: Math.random() * 120 - 10,
    top: 5 + Math.random() * 50,
    delay: Math.random() * 15,
    duration: 18 + Math.random() * 22,
    scale: 0.5 + Math.random() * 0.8,
    opacity: 0.2 + Math.random() * 0.3,
    color: CRANE_COLORS[Math.floor(Math.random() * CRANE_COLORS.length)],
  }))
}

export function InkBirds({ count = 6, reduced = false }: { count?: number; reduced?: boolean }) {
  const cranes = useMemo(() => generateCranes(count), [count])

  if (reduced) return null

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden z-[0]" aria-hidden="true">
      {cranes.map((crane) => (
        <svg
          key={crane.id}
          viewBox="0 0 30 12"
          className="absolute"
          style={{
            left: `${crane.left}%`,
            top: `${crane.top}%`,
            transform: `scale(${crane.scale})`,
            opacity: crane.opacity,
            animation: `ink-bird-fly ${crane.duration}s linear ${crane.delay}s infinite`,
            width: '32px',
            height: '13px',
            filter: `drop-shadow(0 0 4px ${crane.color}40)`,
          }}
        >
          <path d={CRANE_PATH} fill={crane.color} />
          {/* 仙鹤金光尾 */}
          <circle cx="28" cy="6" r="1.5" fill="#f3d58a" opacity="0.6" />
        </svg>
      ))}
    </div>
  )
}
