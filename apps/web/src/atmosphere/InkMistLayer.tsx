import { useEffect, useRef } from 'react'

/**
 * 仙侠仙雾层 - Canvas 实现的仙气飘渺
 *
 * 相比水墨版：暖色调（仙金/翠玉/桃粉），多层径向渐变模拟
 * 仙气升腾、祥云流动，比黑色水墨更"仙"。
 */

interface MistParticle {
  x: number
  y: number
  radius: number
  opacity: number
  speedX: number
  speedY: number
  phase: number
  hue: 'gold' | 'jade' | 'peach' | 'azure'
}

const HUE_COLORS = {
  gold: [
    [245, 228, 184],   // 仙金光
    [212, 168, 87],    // 仙金
    [243, 213, 138],   // 亮仙金
  ],
  jade: [
    [184, 220, 200],   // 翠玉光
    [111, 173, 139],   // 翠玉
    [74, 140, 107],    // 深翠玉
  ],
  peach: [
    [245, 196, 203],   // 桃花
    [240, 168, 179],   // 桃粉
    [200, 120, 130],   // 深桃
  ],
  azure: [
    [184, 220, 235],   // 玄青光
    [74, 110, 133],    // 玄青
    [45, 74, 94],      // 深玄青
  ],
} as const

function createMistParticles(w: number, h: number, count: number): MistParticle[] {
  const hues: MistParticle['hue'][] = ['gold', 'jade', 'peach', 'azure']
  return Array.from({ length: count }, () => ({
    x: Math.random() * w,
    y: Math.random() * h,
    radius: 80 + Math.random() * 200,
    opacity: 0.02 + Math.random() * 0.05,
    speedX: (Math.random() - 0.5) * 0.25,
    speedY: -Math.random() * 0.3 - 0.05,  // 仙气向上飘
    phase: Math.random() * Math.PI * 2,
    hue: hues[Math.floor(Math.random() * hues.length)],
  }))
}

export function InkMistLayer({ reduced = false, count = 15 }: { reduced?: boolean; count?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef = useRef<number>(0)
  const particlesRef = useRef<MistParticle[]>([])
  const timeRef = useRef(0)

  useEffect(() => {
    if (reduced) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const resize = () => {
      canvas.width = window.innerWidth * dpr
      canvas.height = window.innerHeight * dpr
      canvas.style.width = `${window.innerWidth}px`
      canvas.style.height = `${window.innerHeight}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      // ctx 已 setTransform 进入 CSS 像素空间，粒子坐标需用 CSS 像素，
      // 否则 dpr>1 时粒子只覆盖部分屏幕且位置错位。
      // 移动端（<768px）粒子数减半以提升性能
      const isMobile = window.innerWidth < 768
      const effectiveCount = isMobile ? Math.max(1, Math.floor(count / 2)) : count
      particlesRef.current = createMistParticles(window.innerWidth, window.innerHeight, effectiveCount)
    }
    resize()
    window.addEventListener('resize', resize)

    const loop = (now: number) => {
      timeRef.current = now

      const w = canvas.width / dpr
      const h = canvas.height / dpr
      ctx.clearRect(0, 0, w, h)

      particlesRef.current.forEach((p) => {
        // 仙气向上飘 + 横向摇摆
        p.x += p.speedX + Math.sin(now * 0.0003 + p.phase) * 0.2
        p.y += p.speedY + Math.cos(now * 0.0002 + p.phase) * 0.15

        // 飘出顶部则从底部回来
        if (p.y < -p.radius) p.y = h + p.radius
        if (p.x < -p.radius) p.x = w + p.radius
        if (p.x > w + p.radius) p.x = -p.radius

        const colors = HUE_COLORS[p.hue]
        const [r, g, b] = colors[0]

        const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius)
        gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${p.opacity * 1.4})`)
        gradient.addColorStop(0.4, `rgba(${r}, ${g}, ${b}, ${p.opacity * 0.7})`)
        gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`)

        ctx.fillStyle = gradient
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2)
        ctx.fill()
      })

      rafRef.current = requestAnimationFrame(loop)
    }

    rafRef.current = requestAnimationFrame(loop)
    return () => {
      cancelAnimationFrame(rafRef.current)
      window.removeEventListener('resize', resize)
    }
  }, [reduced, count])

  if (reduced) return null

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="fixed inset-0 z-[1] pointer-events-none"
      style={{ mixBlendMode: 'screen' }}
    />
  )
}
