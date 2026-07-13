// src/effects/EntranceAnimator.tsx
// 8 种入场动作运动轨迹（GSAP 驱动）
// leap / dive / rise / walk / reveal / emerge / spin / rush

import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import gsap from 'gsap'
import type { CinematicConfig } from './creature-cinematic-config'

interface EntranceAnimatorProps {
  config: CinematicConfig['entrance']
  groupRef: React.RefObject<THREE.Group | null>
  modelOpacityRef: React.RefObject<number>
  onComplete: () => void
}

export function EntranceAnimator({ config, groupRef, modelOpacityRef, onComplete }: EntranceAnimatorProps) {
  const animationRef = useRef<gsap.core.Timeline | null>(null)
  const completedRef = useRef(false)

  useEffect(() => {
    if (!groupRef.current || completedRef.current) return

    const group = groupRef.current
    const { startPose, endPose, duration, easing, type } = config

    // 初始位置
    group.position.set(startPose.x, startPose.y, startPose.z)
    group.rotation.y = startPose.rotationY
    modelOpacityRef.current = 0

    const tl = gsap.timeline({
      onComplete: () => {
        completedRef.current = true
        onComplete()
      },
    })

    // GSAP 接受 string ease 名称，直接传入
    const ease = easing as string

    if (type === 'leap') {
      // 抛物线：x 从 start 到 end，y 先升后降
      tl.to(group.position, { x: endPose.x, duration, ease }, 0)
      tl.to(group.position, { y: endPose.y + 1.5, duration: duration * 0.5, ease: 'power2.out' }, 0)
      tl.to(group.position, { y: endPose.y, duration: duration * 0.5, ease: 'power2.in' }, duration * 0.5)
      tl.to(group.rotation, { y: endPose.rotationY, duration, ease }, 0)
      tl.to(modelOpacityRef, { current: 1, duration: duration * 0.6, ease: 'power1.inOut' }, duration * 0.2)
    } else if (type === 'dive') {
      // 俯冲：x/y/z 同时变化
      tl.to(group.position, { x: endPose.x, y: endPose.y, z: endPose.z, duration, ease }, 0)
      tl.to(group.rotation, { y: endPose.rotationY, duration, ease: 'power2.inOut' }, 0)
      tl.to(modelOpacityRef, { current: 1, duration: duration * 0.4, ease: 'power1.in' }, 0.1)
    } else if (type === 'rise') {
      // 垂直上升
      tl.to(group.position, { y: endPose.y, duration, ease }, 0)
      tl.to(modelOpacityRef, { current: 1, duration: duration * 0.5, ease: 'power1.inOut' }, 0.2)
    } else if (type === 'walk') {
      // 水平移动（匀速）
      tl.to(group.position, { x: endPose.x, duration, ease: 'none' }, 0)
      tl.to(group.rotation, { y: endPose.rotationY, duration, ease: 'power2.inOut' }, 0)
      tl.to(modelOpacityRef, { current: 1, duration: duration * 0.3, ease: 'power1.in' }, 0)
    } else if (type === 'reveal') {
      // 原地渐显
      group.scale.set(0.5, 0.5, 0.5)
      tl.to(modelOpacityRef, { current: 1, duration, ease }, 0)
      tl.to(group.scale, { x: 1, y: 1, z: 1, duration, ease: 'power2.out' }, 0)
    } else if (type === 'emerge') {
      // 从远到近 + 缩放
      group.scale.set(0.3, 0.3, 0.3)
      tl.to(group.position, { z: endPose.z, duration, ease }, 0)
      tl.to(group.scale, { x: 1, y: 1, z: 1, duration, ease: 'power2.out' }, 0)
      tl.to(modelOpacityRef, { current: 1, duration: duration * 0.5, ease: 'power1.inOut' }, 0.1)
    } else if (type === 'spin') {
      // 旋转入场
      tl.to(group.position, { x: endPose.x, y: endPose.y, z: endPose.z, duration, ease }, 0)
      tl.to(group.rotation, { y: endPose.rotationY, duration, ease: 'power2.inOut' }, 0)
      tl.to(modelOpacityRef, { current: 1, duration: duration * 0.4, ease: 'power1.inOut' }, 0.2)
    } else if (type === 'rush') {
      // 猛冲向前
      tl.to(group.position, { z: endPose.z, duration, ease }, 0)
      tl.to(modelOpacityRef, { current: 1, duration: duration * 0.3, ease: 'power1.in' }, 0)
    }

    animationRef.current = tl

    return () => {
      tl.kill()
    }
  }, [config, groupRef, modelOpacityRef, onComplete])

  return null
}
