import { useRef, useEffect, useState, type ReactNode } from 'react'
import gsap from 'gsap'
import { useReducedMotion } from '../lib/useReducedMotion'

// ═══════════════════════════════════════════
// ScrollReveal — 水墨画卷轴缓缓展开动画
// ─────────────────────────────────────────────
// 技术方案（节奏2 · 舒缓 3.5s）：
//   1. clip-path: inset() 从中央 50% 向 0% 逐帧揭示地图内容
//   2. 左右金色卷轴横杆从中央向两端同步位移
//   3. 地图内容 opacity + blur 做墨色浸润（模糊→清晰）
//   4. 起手停顿 0.3s 模拟"手按卷轴"呼吸感
//   5. 仅首屏播放一次；prefers-reduced-motion 直接跳过
//   6. 等待子组件（lazy MapView）挂载后再启动动画
//   7. 超时 fallback：4s 后无论如何都显示地图
// ═══════════════════════════════════════════

interface ScrollRevealProps {
  children: ReactNode
  className?: string
}

export function ScrollReveal({ children, className = '' }: ScrollRevealProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<HTMLDivElement>(null)
  const rodLRef = useRef<HTMLDivElement>(null)
  const rodRRef = useRef<HTMLDivElement>(null)
  const veilRef = useRef<HTMLDivElement>(null)
  const tlRef = useRef<gsap.core.Timeline | null>(null)
  const [done, setDone] = useState(false)
  const reducedMotion = useReducedMotion()

  // 主effect：挂载后启动动画
  useEffect(() => {
    if (reducedMotion) {
      setDone(true)
      return
    }

    // 超时 fallback：如果动画 4s 内没完成，强制显示
    const fallbackTimer = setTimeout(() => {
      if (tlRef.current) tlRef.current.kill()
      setDone(true)
    }, 4500)

    // 用 rAF + 短延迟确保子组件已渲染
    let cancelled = false
    const raf = requestAnimationFrame(() => {
      setTimeout(() => {
        if (cancelled) return

        const container = containerRef.current
        const mapEl = mapRef.current
        const rodL = rodLRef.current
        const rodR = rodRRef.current
        const veil = veilRef.current

        if (!container || !mapEl || !rodL || !rodR || !veil) {
          setDone(true)
          return
        }

        const tl = gsap.timeline({
          onComplete: () => {
            // 清理 inline styles，确保地图完全可交互
            gsap.set(mapEl, { clearProps: 'all' })
            setDone(true)
          },
        })
        tlRef.current = tl

        // 初始状态
        tl.set(veil, { clipPath: 'inset(0 50% 0 50%)' })
        tl.set(mapEl, { opacity: 0, filter: 'blur(8px)' })
        tl.set(rodL, { x: 0 })
        tl.set(rodR, { x: 0 })

        // Phase 1: 起手停顿 0.3s
        tl.to({}, { duration: 0.3 })

        // Phase 2: 卷轴缓缓展开 + 揭示 + 墨色渐浓
        tl.to(veil, {
          clipPath: 'inset(0 0% 0 0%)',
          duration: 2.2,
          ease: 'power2.inOut',
        }, 0.3)
        tl.to(rodL, {
          x: () => -container.offsetWidth / 2 + 7,
          duration: 2.2,
          ease: 'power2.inOut',
        }, 0.3)
        tl.to(rodR, {
          x: () => container.offsetWidth / 2 - 7,
          duration: 2.2,
          ease: 'power2.inOut',
        }, 0.3)
        tl.to(mapEl, {
          opacity: 0.85,
          filter: 'blur(1.5px)',
          duration: 2.2,
          ease: 'power1.out',
        }, 0.3)

        // Phase 3: 定格收尾
        tl.to(mapEl, {
          opacity: 1,
          filter: 'blur(0px)',
          duration: 1.0,
          ease: 'power2.out',
        }, 2.5)

        tl.set(veil, { display: 'none' })
      }, 100)
    })

    return () => {
      cancelled = true
      cancelAnimationFrame(raf)
      clearTimeout(fallbackTimer)
      if (tlRef.current) {
        tlRef.current.kill()
        // 确保清理 inline styles
        const mapEl = mapRef.current
        if (mapEl) gsap.set(mapEl, { clearProps: 'all' })
      }
    }
  }, [reducedMotion])

  // 动画未完成时，地图初始隐藏（CSS 控制，不依赖 GSAP set）
  const mapStyle = done
    ? undefined
    : { opacity: 0, filter: 'blur(8px)', willChange: 'opacity, filter' as const }

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* 地图内容层 */}
      <div ref={mapRef} style={mapStyle}>
        {children}
      </div>

      {/* 揭示遮罩层 */}
      {!done && (
        <div
          ref={veilRef}
          className="absolute inset-0 z-20 pointer-events-none overflow-hidden"
          style={{
            clipPath: 'inset(0 50% 0 50%)',
            background: 'linear-gradient(135deg, #1c1913, #242018)',
            boxShadow: 'inset 0 0 40px rgba(0,0,0,0.4)',
          }}
        >
          <div
            className="absolute top-0 bottom-0 left-0 w-6"
            style={{
              background: 'linear-gradient(to right, rgba(245,232,195,0.5), transparent)',
              filter: 'blur(2px)',
            }}
          />
          <div
            className="absolute top-0 bottom-0 right-0 w-6"
            style={{
              background: 'linear-gradient(to left, rgba(245,232,195,0.5), transparent)',
              filter: 'blur(2px)',
            }}
          />
        </div>
      )}

      {/* 金色卷轴横杆 — 左 */}
      {!done && (
        <div
          ref={rodLRef}
          className="absolute top-0 bottom-0 z-30 pointer-events-none"
          style={{
            left: '50%',
            width: '14px',
            marginLeft: '-7px',
            background:
              'linear-gradient(to bottom, #8c6b30 0%, #d4a857 45%, #f3d58a 50%, #d4a857 55%, #8c6b30 100%)',
            boxShadow:
              '0 0 10px rgba(212,168,87,0.6), inset 0 0 4px rgba(255,255,255,0.2)',
            borderRadius: '4px',
            willChange: 'transform',
          }}
        />
      )}

      {/* 金色卷轴横杆 — 右 */}
      {!done && (
        <div
          ref={rodRRef}
          className="absolute top-0 bottom-0 z-30 pointer-events-none"
          style={{
            left: '50%',
            width: '14px',
            marginLeft: '-7px',
            background:
              'linear-gradient(to bottom, #8c6b30 0%, #d4a857 45%, #f3d58a 50%, #d4a857 55%, #8c6b30 100%)',
            boxShadow:
              '0 0 10px rgba(212,168,87,0.6), inset 0 0 4px rgba(255,255,255,0.2)',
            borderRadius: '4px',
            willChange: 'transform',
          }}
        />
      )}
    </div>
  )
}
