import { useRef, useMemo, useEffect, useLayoutEffect } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import gsap from 'gsap'
import { transitionVertexShader, transitionFragmentShader } from './transition-shader'

interface ParticleDissolveTransitionProps {
  /** Called when the screen is fully covered — switch the underlying view here. */
  onViewSwitch: () => void
  /** Called when the entire transition animation finishes. */
  onComplete: () => void
  /** Total transition duration in seconds. */
  duration?: number
}

// ── Particle grid constants ──
const COLS = 120
const ROWS = 80
const COUNT = COLS * ROWS // 9 600 particles

/**
 * Inner R3F scene: particle grid + dark backing plane.
 * GSAP timeline drives uProgress (0→1) and backing-plane opacity.
 */
function DissolveScene({ onViewSwitch, onComplete, duration = 2.0 }: ParticleDissolveTransitionProps) {
  const { viewport } = useThree()
  const matRef = useRef<THREE.ShaderMaterial>(null)
  const bgMatRef = useRef<THREE.MeshBasicMaterial>(null)
  const opacityState = useRef({ value: 0 })

  // Keep latest callbacks in a ref so the GSAP timeline doesn't need to re-create
  const callbacksRef = useRef({ onViewSwitch, onComplete })
  callbacksRef.current = { onViewSwitch, onComplete }

  // ── Geometry: particle grid covering the full viewport ──
  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry()
    const positions = new Float32Array(COUNT * 3)
    const dispersions = new Float32Array(COUNT * 3)
    const sizes = new Float32Array(COUNT)
    const delays = new Float32Array(COUNT)
    const colors = new Float32Array(COUNT * 3)

    const w = viewport.width
    const h = viewport.height

    // Theme colors
    const cinnabar = new THREE.Color('#c8423a')
    const gold = new THREE.Color('#d4a857')
    const dark = new THREE.Color('#1a1a2e')
    const blue = new THREE.Color('#2a4a6e')

    for (let i = 0; i < COUNT; i++) {
      const col = i % COLS
      const row = Math.floor(i / COLS)

      // Grid position in viewport space
      const x = (col / (COLS - 1) - 0.5) * w
      const y = (row / (ROWS - 1) - 0.5) * h
      positions[i * 3] = x
      positions[i * 3 + 1] = y
      positions[i * 3 + 2] = 0

      // Dispersion: outward from center + randomness
      const distFromCenter = Math.sqrt(x * x + y * y)
      const angle = Math.atan2(y, x) + (Math.random() - 0.5) * 0.8
      const mag = 0.8 + Math.random() * 2.0
      dispersions[i * 3] = Math.cos(angle) * mag + (Math.random() - 0.5) * 0.3
      dispersions[i * 3 + 1] = Math.sin(angle) * mag + (Math.random() - 0.5) * 0.3
      dispersions[i * 3 + 2] = (Math.random() - 0.5) * 0.2

      sizes[i] = 2 + Math.random() * 5

      // Delay: center particles move first (0 delay), edges follow (up to 0.15)
      const maxDist = Math.sqrt(w * w + h * h) / 2
      const normalizedDist = distFromCenter / maxDist
      delays[i] = normalizedDist * 0.15

      // Color: warm (cinnabar/gold) near center, cool (dark/blue) at edges
      const colorMix = 1 - normalizedDist
      const warm = cinnabar.clone().lerp(gold, Math.random())
      const cool = dark.clone().lerp(blue, Math.random())
      const finalColor = cool.lerp(warm, colorMix * 0.6 + Math.random() * 0.2)
      colors[i * 3] = finalColor.r
      colors[i * 3 + 1] = finalColor.g
      colors[i * 3 + 2] = finalColor.b
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geo.setAttribute('aDispersion', new THREE.BufferAttribute(dispersions, 3))
    geo.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1))
    geo.setAttribute('aDelay', new THREE.BufferAttribute(delays, 1))
    geo.setAttribute('aColor', new THREE.BufferAttribute(colors, 3))

    return geo
  }, [viewport.width, viewport.height])

  // Dispose old geometry when it changes
  useEffect(() => {
    return () => geometry.dispose()
  }, [geometry])

  // ── Uniforms ──
  const uniforms = useMemo(() => ({
    uProgress: { value: 0 },
    uTime: { value: 0 },
    uPixelRatio: { value: Math.min(window.devicePixelRatio || 1, 2) },
  }), [])

  // ── Per-frame updates ──
  useFrame((state) => {
    uniforms.uTime.value = state.clock.elapsedTime
    if (bgMatRef.current) {
      bgMatRef.current.opacity = opacityState.current.value
    }
  })

  // ── GSAP timeline ──
  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        onComplete: () => callbacksRef.current.onComplete(),
      })

      // Animate dissolve progress (0 → 1 over full duration)
      tl.to(uniforms.uProgress, {
        value: 1,
        duration,
        ease: 'power2.inOut',
      })

      // Backing plane fade in (0 → 0.5s): darkness closes in
      tl.to(opacityState.current, {
        value: 1,
        duration: 0.5,
        ease: 'power2.in',
      }, 0)

      // View switch at 30% of duration — screen is fully covered
      tl.call(() => callbacksRef.current.onViewSwitch(), [], duration * 0.3)

      // Backing plane fade out (60% → 100%): reveal new view underneath
      tl.to(opacityState.current, {
        value: 0,
        duration: duration * 0.4,
        ease: 'power2.out',
      }, duration * 0.6)
    })

    return () => ctx.revert()
  }, [duration])

  return (
    <>
      {/* Dark backing plane — hides the view switch */}
      <mesh position={[0, 0, -0.1]} renderOrder={0}>
        <planeGeometry args={[20, 20]} />
        <meshBasicMaterial
          ref={bgMatRef}
          color="#0a0a14"
          transparent
          opacity={0}
          depthWrite={false}
        />
      </mesh>

      {/* Particle system */}
      <points geometry={geometry} renderOrder={1}>
        <shaderMaterial
          ref={matRef}
          vertexShader={transitionVertexShader}
          fragmentShader={transitionFragmentShader}
          uniforms={uniforms}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </>
  )
}

/**
 * Full-screen particle dissolve transition overlay.
 *
 * Renders a fixed, pointer-events-none R3F Canvas above all other content.
 * The transition has three phases:
 *  1. Converge (0→30%): particles rush in from dispersed positions
 *  2. Hold   (30%→40%): screen fully covered — view switches here
 *  3. Dissolve (40%→100%): particles disperse outward, revealing new view
 *
 * @param onViewSwitch Called when the screen is fully covered.
 * @param onComplete   Called when the entire animation finishes.
 * @param duration     Total duration in seconds (default 2.0).
 */
export function ParticleDissolveTransition(props: ParticleDissolveTransitionProps) {
  return (
    <div className="fixed inset-0 z-[100]">
      <Canvas
        camera={{ position: [0, 0, 5], fov: 50 }}
        gl={{ antialias: true, alpha: true }}
        style={{ width: '100%', height: '100%' }}
      >
        <DissolveScene {...props} />
      </Canvas>
    </div>
  )
}

export default ParticleDissolveTransition
