// src/effects/EnvEffect.tsx
// 环境衬托动画：粒子效果 / 流体效果 / 云雾效果

import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { EnvEffectConfig } from './creature-cinematic-config'

// ─── 粒子效果 ───
function ParticleEffect({ type, count, color, motion }: {
  type: string
  count: number
  color: [string, string]
  motion: string
}) {
  const pointsRef = useRef<THREE.Points>(null)
  const c1 = useMemo(() => new THREE.Color(color[0]), [color])

  const { positions, velocities, sizes } = useMemo(() => {
    const pos = new Float32Array(count * 3)
    const vel = new Float32Array(count * 3)
    const sz = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2
      const r = 1.5 + Math.random() * 2.5
      pos[i * 3] = Math.cos(angle) * r
      pos[i * 3 + 1] = (Math.random() - 0.5) * 4
      pos[i * 3 + 2] = Math.sin(angle) * r
      vel[i * 3] = (Math.random() - 0.5) * 0.02
      vel[i * 3 + 1] = Math.random() * 0.03
      vel[i * 3 + 2] = (Math.random() - 0.5) * 0.02
      sz[i] = 0.03 + Math.random() * 0.06
    }
    return { positions: pos, velocities: vel, sizes: sz }
  }, [count])

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1))
    return geo
  }, [positions, sizes])

  const material = useMemo(() => {
    return new THREE.PointsMaterial({
      size: 0.06,
      color: c1,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
    })
  }, [c1])

  useFrame(({ clock }) => {
    if (!pointsRef.current) return
    const t = clock.getElapsedTime()
    const posAttr = pointsRef.current.geometry.attributes.position as THREE.BufferAttribute
    const arr = posAttr.array as Float32Array

    for (let i = 0; i < count; i++) {
      const ix = i * 3
      if (motion === 'swirl') {
        const angle = Math.atan2(arr[ix + 2], arr[ix]) + 0.01
        const r = Math.sqrt(arr[ix] ** 2 + arr[ix + 2] ** 2)
        arr[ix] = Math.cos(angle) * r
        arr[ix + 2] = Math.sin(angle) * r
        arr[ix + 1] += Math.sin(t + i) * 0.005
      } else if (motion === 'burst') {
        arr[ix] += velocities[ix]
        arr[ix + 1] += velocities[ix + 1]
        arr[ix + 2] += velocities[ix + 2]
      } else if (motion === 'fall') {
        arr[ix + 1] -= 0.02
        if (arr[ix + 1] < -2) arr[ix + 1] = 2
      } else if (motion === 'spread') {
        arr[ix] += velocities[ix] * 2
        arr[ix + 2] += velocities[ix + 2] * 2
      } else if (motion === 'trail') {
        arr[ix + 2] += 0.02
        if (arr[ix + 2] > 5) arr[ix + 2] = -5
      }
    }
    posAttr.needsUpdate = true
    pointsRef.current.rotation.y = t * 0.05
  })

  return <points ref={pointsRef} geometry={geometry} material={material} />
}

// ─── 流体效果 ───
function FluidEffect({ type, color, intensity }: {
  type: string
  color: string
  intensity: number
}) {
  const meshRef = useRef<THREE.Mesh>(null)
  const c = useMemo(() => new THREE.Color(color), [color])

  const material = useMemo(() => {
    const intensityStr = intensity.toFixed(2)
    return new THREE.ShaderMaterial({
      vertexShader: `
        uniform float uTime;
        varying vec2 vUv;
        varying float vWave;
        void main() {
          vUv = uv;
          vec3 pos = position;
          float wave = sin(pos.x * 3.0 + uTime * 1.5) * 0.08 * ${intensityStr};
          pos.y += wave;
          vWave = wave;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 uColor;
        uniform float uTime;
        varying vec2 vUv;
        varying float vWave;
        void main() {
          float ripple = sin(distance(vUv, vec2(0.5)) * 20.0 - uTime * 2.0) * 0.5 + 0.5;
          vec3 col = uColor + vec3(vWave * 2.0) + vec3(ripple * 0.1);
          float alpha = 0.6 * ripple + 0.3;
          gl_FragColor = vec4(col, alpha);
        }
      `,
      uniforms: { uColor: { value: c }, uTime: { value: 0 } },
      transparent: true,
      depthWrite: false,
    })
  }, [c, intensity])

  useFrame(({ clock }) => {
    if (material.uniforms.uTime) material.uniforms.uTime.value = clock.getElapsedTime()
  })

  if (type === 'distortion') {
    return (
      <mesh ref={meshRef} position={[0, 0, -2]} material={material}>
        <planeGeometry args={[15, 8, 32, 32]} />
      </mesh>
    )
  }

  return (
    <mesh ref={meshRef} position={[0, -1.5, 0]} rotation={[-Math.PI / 2, 0, 0]} material={material}>
      <planeGeometry args={[10, 10, 64, 64]} />
    </mesh>
  )
}

// ─── 云雾效果 ───
function CloudEffect({ color, density, motion }: {
  type: string
  color: [string, string]
  density: number
  motion: string
}) {
  const meshRef = useRef<THREE.Mesh>(null)
  const c1 = useMemo(() => new THREE.Color(color[0]), [color])
  const c2 = useMemo(() => new THREE.Color(color[1]), [color])

  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 uColor1;
        uniform vec3 uColor2;
        uniform float uTime;
        uniform float uDensity;
        varying vec2 vUv;
        float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
        float noise(vec2 p) {
          vec2 i = floor(p); vec2 f = fract(p); f = f * f * (3.0 - 2.0 * f);
          return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
                     mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
        }
        float fbm(vec2 p) {
          float v = 0.0; float a = 0.5;
          for (int i = 0; i < 4; i++) { v += a * noise(p); p *= 2.0; a *= 0.5; }
          return v;
        }
        void main() {
          vec2 uv = vUv + vec2(uTime * 0.03, uTime * 0.01);
          float n = fbm(uv * 3.0);
          float mask = smoothstep(0.3, 0.6, n) * uDensity;
          vec3 col = mix(uColor1, uColor2, n);
          gl_FragColor = vec4(col, mask);
        }
      `,
      uniforms: {
        uColor1: { value: c1 },
        uColor2: { value: c2 },
        uTime: { value: 0 },
        uDensity: { value: density },
      },
      transparent: true,
      depthWrite: false,
    })
  }, [c1, c2, density])

  useFrame(({ clock }) => {
    if (material.uniforms.uTime) material.uniforms.uTime.value = clock.getElapsedTime()
    if (meshRef.current && motion === 'surround') {
      meshRef.current.rotation.z = clock.getElapsedTime() * 0.02
    }
  })

  return (
    <mesh ref={meshRef} position={[0, 0, -8]} material={material}>
      <planeGeometry args={[20, 12]} />
    </mesh>
  )
}

// ─── 主组件 ───
export function EnvEffect({ config }: { config: EnvEffectConfig }) {
  if (config.category === 'particles' && config.particles) {
    return <ParticleEffect {...config.particles} />
  }
  if (config.category === 'fluid' && config.fluid) {
    return <FluidEffect {...config.fluid} />
  }
  if (config.category === 'clouds' && config.clouds) {
    return <CloudEffect {...config.clouds} />
  }
  return null
}
