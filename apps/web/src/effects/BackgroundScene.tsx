// src/effects/BackgroundScene.tsx
// 三层视差背景：远景(z=-40) / 中景(z=-15) / 近景(z=-5)

import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import {
  mountainVertexShader, mountainFragmentShader,
  waterVertexShader, waterFragmentShader,
  cloudVertexShader, cloudFragmentShader,
  forestVertexShader, forestFragmentShader,
} from './scene-shaders'
import type { SceneConfig, BackgroundLayerConfig } from './creature-cinematic-config'

function BackgroundLayer({ config, z, parallaxSpeed }: {
  config: BackgroundLayerConfig
  z: number
  parallaxSpeed: number
}) {
  const meshRef = useRef<THREE.Mesh>(null)

  const material = useMemo(() => {
    const color = new THREE.Color(config.color)
    switch (config.geometry) {
      case 'mountain':
        return new THREE.ShaderMaterial({
          vertexShader: mountainVertexShader,
          fragmentShader: mountainFragmentShader,
          uniforms: {
            uColor: { value: color },
            uTime: { value: 0 },
            uFogDensity: { value: 0.3 },
          },
          transparent: true,
        })
      case 'water':
        return new THREE.ShaderMaterial({
          vertexShader: waterVertexShader,
          fragmentShader: waterFragmentShader,
          uniforms: {
            uColor: { value: color },
            uTime: { value: 0 },
          },
          transparent: true,
        })
      case 'clouds':
        return new THREE.ShaderMaterial({
          vertexShader: cloudVertexShader,
          fragmentShader: cloudFragmentShader,
          uniforms: {
            uColor1: { value: color },
            uColor2: { value: color.clone().multiplyScalar(1.5) },
            uTime: { value: 0 },
            uDensity: { value: 0.5 },
          },
          transparent: true,
          depthWrite: false,
        })
      case 'forest':
        return new THREE.ShaderMaterial({
          vertexShader: forestVertexShader,
          fragmentShader: forestFragmentShader,
          uniforms: {
            uColor: { value: color },
            uTime: { value: 0 },
          },
          transparent: true,
        })
      case 'rockwall':
      case 'palace':
      case 'battlefield':
        return new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.6 })
      case 'void':
      default:
        return new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.0 })
    }
  }, [config])

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()
    if (material instanceof THREE.ShaderMaterial && material.uniforms.uTime) {
      material.uniforms.uTime.value = t
    }
    if (meshRef.current && parallaxSpeed > 0) {
      meshRef.current.position.x = Math.sin(t * 0.05 * parallaxSpeed) * 0.5
    }
  })

  // void 层不渲染
  if (config.geometry === 'void') return null

  return (
    <mesh ref={meshRef} position={[0, 0, z]} material={material}>
      <planeGeometry args={[40, 20]} />
    </mesh>
  )
}

export function BackgroundScene({ scene }: { scene: SceneConfig }) {
  return (
    <group>
      <BackgroundLayer config={scene.farLayer} z={-40} parallaxSpeed={0.1} />
      <BackgroundLayer config={scene.midLayer} z={-15} parallaxSpeed={0.3} />
      <BackgroundLayer config={scene.nearLayer} z={-5} parallaxSpeed={0.8} />
    </group>
  )
}
