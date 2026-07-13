import { useMemo } from 'react'

interface MistParams {
  top: number
  left: number
  width: number
  height: number
  duration: number
  delay: number
  opacity: number
}

/**
 * 生成雾团参数。独立成函数，便于用 useMemo 缓存，
 * 避免父组件重渲染时雾团位置/大小随机跳变。
 */
function generateMists(count: number): MistParams[] {
  return Array.from({ length: count }, (_, i) => ({
    top: 10 + (i * 70) / count + Math.random() * 10,
    left: (i * 100) / count + Math.random() * 10,
    width: 200 + Math.random() * 200,
    height: 100 + Math.random() * 80,
    duration: 20 + Math.random() * 15,
    delay: -Math.random() * 10,
    opacity: 0.15 + Math.random() * 0.1,
  }))
}

/**
 * 暗黑史诗氛围层 —— 深灰雾团替代浅色祥云。
 * 6 个半透明雾团，blur(40px)，mist-drift 动画。
 */
export function DarkMist({ count = 6 }: { count?: number }) {
  // 用 useMemo 缓存雾团参数，避免每次重渲染重新随机导致视觉跳变
  const mists = useMemo(() => generateMists(count), [count])

  return (
    <div
      data-testid="dark-mist"
      className="absolute inset-0 overflow-hidden pointer-events-none"
      aria-hidden="true"
    >
      {mists.map((m, i) => (
        <div
          key={i}
          aria-hidden="true"
          className="absolute rounded-full"
          style={{
            top: `${m.top}%`,
            left: `${m.left}%`,
            width: `${m.width}px`,
            height: `${m.height}px`,
            background:
              'radial-gradient(ellipse, rgba(60, 54, 40, 0.6) 0%, rgba(40, 36, 28, 0.3) 50%, transparent 80%)',
            filter: 'blur(40px)',
            opacity: m.opacity,
            animation: `mist-drift ${m.duration}s linear infinite`,
            animationDelay: `${m.delay}s`,
            willChange: 'transform, opacity',
            pointerEvents: 'none',
          }}
        />
      ))}
    </div>
  )
}
