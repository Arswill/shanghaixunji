import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { auraVertexShader, auraFragmentShader } from './aura-shader'
import { type ElementType, PARTICLE_COLORS } from './creature-parallax-config'

interface CreatureAuraProps {
  particleType: ElementType
}

interface ElementConfig {
  count: number
  radius: number
  speed: number
  minSize: number
  maxSize: number
}

const ELEMENT_CONFIGS: Record<ElementType, ElementConfig> = {
  fire:    { count: 200, radius: 2.0, speed: 1.5, minSize: 2,   maxSize: 8  },
  water:   { count: 250, radius: 2.2, speed: 0.8, minSize: 1.5, maxSize: 6  },
  wind:    { count: 180, radius: 2.5, speed: 1.2, minSize: 1,   maxSize: 5  },
  thunder: { count: 150, radius: 1.8, speed: 2.0, minSize: 3,   maxSize: 10 },
  light:   { count: 220, radius: 2.3, speed: 1.0, minSize: 2,   maxSize: 7  },
}

/** Fibonacci sphere: evenly distribute points on unit sphere */
function fibonacciSphere(count: number): Float32Array {
  const positions = new Float32Array(count * 3)
  const golden = Math.PI * (3 - Math.sqrt(5))
  for (let i = 0; i < count; i++) {
    const y = 1 - (i / Math.max(count - 1, 1)) * 2
    const r = Math.sqrt(Math.max(1 - y * y, 0))
    const theta = golden * i
    positions[i * 3]     = Math.cos(theta) * r
    positions[i * 3 + 1] = y
    positions[i * 3 + 2] = Math.sin(theta) * r
  }
  return positions
}

export function CreatureAura({ particleType }: CreatureAuraProps) {
  const config = ELEMENT_CONFIGS[particleType]
  const color = PARTICLE_COLORS[particleType]
  const matRef = useRef<THREE.ShaderMaterial>(null)

  const { positions, sizes, offsets } = useMemo(() => {
    const pos = fibonacciSphere(config.count)
    const sz = new Float32Array(config.count)
    const off = new Float32Array(config.count)
    for (let i = 0; i < config.count; i++) {
      sz[i] = config.minSize + Math.random() * (config.maxSize - config.minSize)
      off[i] = Math.random() * Math.PI * 2
    }
    return { positions: pos, sizes: sz, offsets: off }
  }, [config.count, config.minSize, config.maxSize])

  const uniforms = useMemo(() => ({
    uTime:   { value: 0 },
    uRadius: { value: config.radius },
    uSpeed:  { value: config.speed },
    uColor:  { value: new THREE.Color(color) },
  }), [config.radius, config.speed, color])

  useFrame((state) => {
    uniforms.uTime.value = state.clock.elapsedTime
  })

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-aSize" args={[sizes, 1]} />
        <bufferAttribute attach="attributes-aOffset" args={[offsets, 1]} />
      </bufferGeometry>
      <shaderMaterial
        ref={matRef}
        vertexShader={auraVertexShader}
        fragmentShader={auraFragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}
