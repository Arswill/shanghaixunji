import { useRef, useMemo } from 'react'
import { useFrame, useLoader, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { parallaxVertexShader, parallaxFragmentShader } from './parallax-shader'
import { getCreatureConfig } from './creature-parallax-config'
import { CreatureAura } from './CreatureAura'

interface CreatureParallaxProps {
  creatureId: string
  textureUrl: string
  depthMapUrl: string
}

export function CreatureParallax({ creatureId, textureUrl, depthMapUrl }: CreatureParallaxProps) {
  const config = getCreatureConfig(creatureId)
  const [texture, depthMap] = useLoader(THREE.TextureLoader, [textureUrl, depthMapUrl])
  const { pointer } = useThree()
  const mouse = useRef(new THREE.Vector2())
  const matRef = useRef<THREE.ShaderMaterial>(null)

  const uniforms = useMemo(() => ({
    uTexture: { value: texture },
    uDepthMap: { value: depthMap },
    uMouse: { value: new THREE.Vector2() },
    uTime: { value: 0 },
    uIntensity: { value: config.parallaxIntensity },
    uGlowColor: { value: new THREE.Color(config.glowColor) },
  }), []) // eslint-disable-line react-hooks/exhaustive-deps

  useFrame((state, delta) => {
    mouse.current.lerp(pointer, 1 - Math.pow(0.001, delta))
    uniforms.uMouse.value.copy(mouse.current)
    uniforms.uTime.value = state.clock.elapsedTime
  })

  return (
    <group>
      <mesh>
        <planeGeometry args={[3, 4]} />
        <shaderMaterial
          ref={matRef}
          vertexShader={parallaxVertexShader}
          fragmentShader={parallaxFragmentShader}
          uniforms={uniforms}
          transparent
        />
      </mesh>
      <CreatureAura particleType={config.particleType} />
    </group>
  )
}