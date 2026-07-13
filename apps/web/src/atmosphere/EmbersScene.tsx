import { useEffect, useRef } from 'react'

interface Particle {
  x: number
  y: number
  size: number
  speedY: number
  sway: number
  phase: number
  opacity: number
  type: 'ember' | 'star'
}

const EMBER_COUNT = 200
const STAR_COUNT = 80

/** 移动端（<768px）粒子数减半以提升性能 */
function getParticleCounts() {
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768
  return {
    emberCount: isMobile ? Math.floor(EMBER_COUNT / 2) : EMBER_COUNT,
    starCount: isMobile ? Math.floor(STAR_COUNT / 2) : STAR_COUNT,
  }
}

function createEmbers(count: number, width: number, height: number): Particle[] {
  return Array.from({ length: count }, () => ({
    x: Math.random() * width,
    y: Math.random() * height,
    size: Math.random() * 2 + 1,
    speedY: Math.random() * 0.09 + 0.03,
    sway: Math.random() * 0.5 + 0.2,
    phase: Math.random() * Math.PI * 2,
    opacity: Math.random() * 0.3 + 0.1,
    type: 'ember' as const,
  }))
}

function createStars(count: number, width: number, height: number): Particle[] {
  return Array.from({ length: count }, () => ({
    x: Math.random() * width,
    y: Math.random() * height,
    size: Math.random() * 0.5 + 1,
    speedY: 0,
    sway: 0,
    phase: 0,
    opacity: Math.random() * 0.4 + 0.2,
    type: 'star' as const,
  }))
}

function drawScene(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  particles: Particle[],
  time: number
) {
  // Clear with a deep warm-dark background
  const gradient = ctx.createRadialGradient(
    width / 2, height * 0.4, 0,
    width / 2, height / 2, Math.max(width, height)
  )
  gradient.addColorStop(0, '#1a1814')
  gradient.addColorStop(0.6, '#0e0c09')
  gradient.addColorStop(1, '#070503')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, width, height)

  // Top-left golden glow
  const topLeftGlow = ctx.createRadialGradient(
    0, 0, 0,
    0, 0, Math.max(width, height) * 0.3
  )
  topLeftGlow.addColorStop(0, 'rgba(184, 146, 74, 0.06)')
  topLeftGlow.addColorStop(1, 'rgba(184, 146, 74, 0)')
  ctx.fillStyle = topLeftGlow
  ctx.fillRect(0, 0, width, height)

  // Subtle ground/fog at the bottom
  const fog = ctx.createLinearGradient(0, height * 0.6, 0, height)
  fog.addColorStop(0, 'rgba(14, 12, 9, 0)')
  fog.addColorStop(1, 'rgba(26, 24, 20, 0.6)')
  ctx.fillStyle = fog
  ctx.fillRect(0, height * 0.6, width, height * 0.4)

  // Draw background stars (static, white semi-transparent)
  particles.forEach((p) => {
    if (p.type !== 'star') return
    ctx.fillStyle = `rgba(255, 255, 255, ${p.opacity})`
    ctx.beginPath()
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
    ctx.fill()
  })

  // Draw ember particles with additive-like effect
  particles.forEach((p) => {
    if (p.type !== 'ember') return
    const swayOffset = Math.sin(time * p.sway + p.phase) * 1.5
    const x = p.x + swayOffset
    const y = p.y

    const glow = ctx.createRadialGradient(x, y, 0, x, y, p.size * 3)
    glow.addColorStop(0, `rgba(184, 146, 74, ${p.opacity})`)
    glow.addColorStop(0.4, `rgba(184, 146, 74, ${p.opacity * 0.3})`)
    glow.addColorStop(1, 'rgba(184, 146, 74, 0)')

    ctx.fillStyle = glow
    ctx.beginPath()
    ctx.arc(x, y, p.size * 3, 0, Math.PI * 2)
    ctx.fill()

    ctx.fillStyle = `rgba(255, 220, 160, ${p.opacity + 0.2})`
    ctx.beginPath()
    ctx.arc(x, y, p.size * 0.6, 0, Math.PI * 2)
    ctx.fill()
  })
}

function updateParticles(particles: Particle[], width: number, height: number, delta: number) {
  particles.forEach((p) => {
    if (p.type === 'star') return // stars don't move
    p.y -= p.speedY * delta * 60 // normalize to ~60fps
    if (p.y < -10) {
      p.y = height + 10
      p.x = Math.random() * width
    }
  })
}

export function EmbersScene({ reduced = false }: { reduced?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const particlesRef = useRef<Particle[]>([])
  const rafRef = useRef<number>(0)
  const lastTimeRef = useRef<number>(0)

  useEffect(() => {
    if (reduced) return
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = window.innerWidth * dpr
      canvas.height = window.innerHeight * dpr
      canvas.style.width = `${window.innerWidth}px`
      canvas.style.height = `${window.innerHeight}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      const w = window.innerWidth
      const h = window.innerHeight
      const { emberCount, starCount } = getParticleCounts()
      particlesRef.current = [...createEmbers(emberCount, w, h), ...createStars(starCount, w, h)]
    }

    resize()
    window.addEventListener('resize', resize)

    const loop = (now: number) => {
      const delta = lastTimeRef.current ? (now - lastTimeRef.current) / 1000 : 0
      lastTimeRef.current = now

      // ctx 已 setTransform(dpr,...) 进入 CSS 像素空间，
      // 因此更新与绘制都应使用 CSS 像素（window.innerWidth/innerHeight），
      // 而非 canvas.width/height（物理像素），否则 dpr=2 时粒子只覆盖上半屏、背景渐变错位。
      updateParticles(particlesRef.current, window.innerWidth, window.innerHeight, delta)
      drawScene(ctx, window.innerWidth, window.innerHeight, particlesRef.current, now / 1000)
      rafRef.current = requestAnimationFrame(loop)
    }

    rafRef.current = requestAnimationFrame(loop)

    return () => {
      window.removeEventListener('resize', resize)
      cancelAnimationFrame(rafRef.current)
    }
  }, [reduced])

  if (reduced) {
    return (
      <div
        data-testid="embers-reduced"
        className="fixed inset-0 -z-10"
        style={{
          background: 'radial-gradient(ellipse at center, #1a1814 0%, #0e0c09 100%)',
        }}
      />
    )
  }

  return (
    <canvas
      ref={canvasRef}
      data-testid="embers-canvas"
      aria-hidden="true"
      className="fixed inset-0 -z-10 w-full h-full"
    />
  )
}
