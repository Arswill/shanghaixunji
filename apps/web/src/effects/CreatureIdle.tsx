// src/effects/CreatureIdle.tsx
// 待机循环动画：呼吸悬浮 + 缩放脉冲 + 慢速自转

import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface CreatureIdleProps {
  groupRef: React.RefObject<THREE.Group | null>
  baseY?: number
  baseScale?: number
  enabled: boolean
  reducedMotion: boolean
}

export function CreatureIdle({ groupRef, baseY = 0, baseScale = 1, enabled, reducedMotion }: CreatureIdleProps) {
  useFrame(({ clock }) => {
    if (!enabled || !groupRef.current) return
    const t = clock.getElapsedTime()

    // 呼吸悬浮
    groupRef.current.position.y = baseY + Math.sin(t * 0.8) * 0.06

    // 缩放脉冲
    const pulse = 1 + Math.sin(t * 1.2) * 0.015
    groupRef.current.scale.setScalar(baseScale * pulse)

    // 慢速自转（reducedMotion 时跳过）
    if (!reducedMotion) {
      groupRef.current.rotation.y += 0.002
    }
  })

  return null
}
