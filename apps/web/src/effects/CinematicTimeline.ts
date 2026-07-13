// src/effects/CinematicTimeline.ts
// GSAP 时间线编排：出场时间线 (4.0s) + 切换时间线 (1.5s)
//
// 修复点：TimelineTargets 中 ref-based 目标使用 { current: number } 而非 { value: number }

import gsap from 'gsap'
import type * as THREE from 'three'
import type { CinematicConfig } from './creature-cinematic-config'

// ─── 时间线动画目标 ───
// 注意：magicCircleScale/magicCircleOpacity/bloomIntensity 是 React ref，属性为 current
// fogDensity/farOpacity 等是普通对象，属性为 value
export interface TimelineTargets {
  fogDensity: { value: number }
  farOpacity: { value: number }
  midOpacity: { value: number }
  nearOpacity: { value: number }
  magicCircleScale: { current: number }
  magicCircleOpacity: { current: number }
  bloomIntensity: { current: number }
  envIntensity: { value: number }
}

// ─── 出场时间线 (4.0s) ───
export function createEntranceTimeline(
  targets: TimelineTargets,
  config: CinematicConfig,
  reducedMotion: boolean
): gsap.core.Timeline {
  const tl = gsap.timeline()
  const t = config.timing

  if (reducedMotion) {
    // reduced-motion: 直接显示，1.0s 过渡
    tl.to(targets.farOpacity, { value: 1, duration: 0.5 }, 0)
    tl.to(targets.midOpacity, { value: 1, duration: 0.5 }, 0)
    tl.to(targets.nearOpacity, { value: 1, duration: 0.5 }, 0)
    tl.to(targets.magicCircleOpacity, { current: 0.5, duration: 0.5 }, 0)
    tl.to(targets.bloomIntensity, { current: 0.5, duration: 0.5 }, 0)
    return tl
  }

  // 阶段1：背景铺设 (0~1.0s)
  tl.to(targets.fogDensity, { value: config.scene.fogDensity, duration: t.inkSpread, ease: 'power2.out' }, 0)
  tl.to(targets.farOpacity, { value: 1, duration: t.inkSpread, ease: 'power2.out' }, 0.2)
  tl.to(targets.midOpacity, { value: 1, duration: t.inkSpread * 0.6, ease: 'power2.out' }, 0.4)
  tl.to(targets.nearOpacity, { value: 1, duration: t.inkSpread * 0.4, ease: 'power2.out' }, 0.6)

  // 阶段2：蓄势+法阵 (0.5~2.0s)
  tl.to(targets.envIntensity, { value: 0.7, duration: 0.5, ease: 'power2.in' }, 0.5)
  tl.to(targets.magicCircleScale, { current: 1, duration: t.magicCircle, ease: 'power2.out' }, 0.5)
  tl.to(targets.magicCircleOpacity, { current: 1, duration: t.magicCircle * 0.5, ease: 'power2.out' }, 0.5)

  // 阶段3：入场高潮 (1.0~3.0s) — 入场动作由 EntranceAnimator 独立处理
  tl.to(targets.envIntensity, { value: 1.0, duration: 0.3, ease: 'power2.out' }, 1.0)
  tl.to(targets.envIntensity, { value: 0.3, duration: t.bloomFadeIn, ease: 'power2.inOut' }, 2.5)

  // 阶段4：Bloom 渐入 (2.5~4.0s)
  tl.to(targets.bloomIntensity, { current: 0.9, duration: t.bloomFadeIn, ease: 'power2.inOut' }, 2.5)
  tl.to(targets.magicCircleOpacity, { current: 0.6, duration: 1.0, ease: 'power2.inOut' }, 3.0)

  return tl
}

// ─── 切换时间线 (1.5s) ───
export function createSwitchTimeline(
  targets: TimelineTargets,
  oldModelRef: React.RefObject<THREE.Group | null>,
  _config: CinematicConfig
): gsap.core.Timeline {
  const tl = gsap.timeline()

  // 旧模型溶解
  if (oldModelRef.current) {
    tl.to(oldModelRef.current.position, { y: -0.5, duration: 0.3, ease: 'power2.in' }, 0)
    tl.to(oldModelRef.current.scale, { x: 0.3, y: 0.3, z: 0.3, duration: 0.5, ease: 'power2.in' }, 0)
  }

  // 背景交叉淡入淡出
  tl.to(targets.farOpacity, { value: 0.3, duration: 0.3, ease: 'power2.inOut' }, 0)
  tl.to(targets.magicCircleOpacity, { current: 0, duration: 0.3, ease: 'power2.in' }, 0)
  tl.to(targets.farOpacity, { value: 1, duration: 0.4, ease: 'power2.out' }, 0.5)
  tl.to(targets.magicCircleScale, { current: 1, duration: 0.3, ease: 'power2.out' }, 0.5)
  tl.to(targets.magicCircleOpacity, { current: 0.6, duration: 0.3, ease: 'power2.out' }, 0.5)
  tl.to(targets.bloomIntensity, { current: 0.9, duration: 0.5, ease: 'power2.out' }, 0.8)

  return tl
}
