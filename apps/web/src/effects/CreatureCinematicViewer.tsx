// src/effects/CreatureCinematicViewer.tsx
// 电影感神兽查看器 — 整合配置层 + 场景层 + 动画层
// 替代 Creature3DViewer，提供专属入场动画 + 背景 + 环境衬托

import { Suspense, useRef, useState, useEffect, useMemo } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useGLTF, ContactShadows, OrbitControls, Environment, Lightformer } from '@react-three/drei'
import * as THREE from 'three'
import gsap from 'gsap'

import { has3DModel } from './creature-3d-manifest'
import { getCinematicConfig } from './creature-cinematic-config'
import type { CinematicConfig } from './creature-cinematic-config'
import { BackgroundScene } from './BackgroundScene'
import { EnvEffect } from './EnvEffect'
import { EntranceAnimator } from './EntranceAnimator'
import { CreatureIdle } from './CreatureIdle'
import { createEntranceTimeline, type TimelineTargets } from './CinematicTimeline'
import { useReducedMotion } from '../lib/useReducedMotion'

// Draco 解码器
useGLTF.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.7/')

// ─── 魔法法阵（多层复杂设计）───
function MagicCircle({ scaleRef, opacityRef, color }: {
  scaleRef: React.RefObject<number>
  opacityRef: React.RefObject<number>
  color: string
}) {
  const groupRef = useRef<THREE.Group>(null)
  const ringOuter = useRef<THREE.Mesh>(null)
  const ringMid = useRef<THREE.Mesh>(null)
  const ringInner = useRef<THREE.Mesh>(null)
  const ringCore = useRef<THREE.Mesh>(null)
  const runeRing = useRef<THREE.Group>(null)
  const starRing = useRef<THREE.Group>(null)
  const dotRing = useRef<THREE.Group>(null)

  const ringColor = useMemo(() => new THREE.Color(color), [color])
  const dimColor = useMemo(() => new THREE.Color(color).multiplyScalar(0.5), [color])

  // 生成符文点（12个均匀分布的小方块）
  const runeData = useMemo(() => {
    const items = []
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2
      items.push({ x: Math.cos(angle) * 1.6, y: Math.sin(angle) * 1.6, rot: angle })
    }
    return items
  }, [])

  // 生成星形射线（8个三角形组成八角星）
  const starData = useMemo(() => {
    const items = []
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2
      items.push({ x: Math.cos(angle) * 1.1, y: Math.sin(angle) * 1.1, rot: angle })
    }
    return items
  }, [])

  // 生成点阵环（24个小球）
  const dotData = useMemo(() => {
    const items = []
    for (let i = 0; i < 24; i++) {
      const angle = (i / 24) * Math.PI * 2
      items.push({ x: Math.cos(angle) * 0.8, y: Math.sin(angle) * 0.8 })
    }
    return items
  }, [])

  useFrame((_, delta) => {
    const scale = scaleRef.current
    const opacity = opacityRef.current
    if (groupRef.current) {
      groupRef.current.scale.setScalar(scale)
    }
    // 各层不同速度旋转
    if (ringOuter.current) ringOuter.current.rotation.z += delta * 0.3
    if (ringMid.current) ringMid.current.rotation.z -= delta * 0.5
    if (ringInner.current) ringInner.current.rotation.z += delta * 0.7
    if (ringCore.current) ringCore.current.rotation.z -= delta * 0.4
    if (runeRing.current) runeRing.current.rotation.z += delta * 0.15
    if (starRing.current) starRing.current.rotation.z -= delta * 0.25
    if (dotRing.current) dotRing.current.rotation.z += delta * 0.6

    // 更新所有材质透明度
    const meshes = [ringOuter, ringMid, ringInner, ringCore]
    meshes.forEach(r => {
      if (r.current?.material) {
        const mat = r.current.material as THREE.MeshBasicMaterial
        mat.opacity = opacity
        mat.transparent = true
      }
    })
    ;[runeRing, starRing, dotRing].forEach(g => {
      if (g.current) {
        g.current.traverse(child => {
          if (child instanceof THREE.Mesh && child.material) {
            const mat = child.material as THREE.MeshBasicMaterial
            mat.opacity = opacity
            mat.transparent = true
          }
        })
      }
    })
  })

  return (
    <group ref={groupRef} position={[0, -1.2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      {/* 外圈：宽环 */}
      <mesh ref={ringOuter}>
        <ringGeometry args={[1.65, 1.8, 64]} />
        <meshBasicMaterial color={ringColor} transparent opacity={0} side={THREE.DoubleSide} />
      </mesh>
      {/* 外圈装饰：细环 */}
      <mesh>
        <ringGeometry args={[1.48, 1.52, 64]} />
        <meshBasicMaterial color={dimColor} transparent opacity={0} side={THREE.DoubleSide} />
      </mesh>
      {/* 中圈 */}
      <mesh ref={ringMid}>
        <ringGeometry args={[1.2, 1.3, 48]} />
        <meshBasicMaterial color={ringColor} transparent opacity={0} side={THREE.DoubleSide} />
      </mesh>
      {/* 内圈 */}
      <mesh ref={ringInner}>
        <ringGeometry args={[0.9, 0.95, 48]} />
        <meshBasicMaterial color={ringColor} transparent opacity={0} side={THREE.DoubleSide} />
      </mesh>
      {/* 核心圈 */}
      <mesh ref={ringCore}>
        <ringGeometry args={[0.3, 0.35, 32]} />
        <meshBasicMaterial color={ringColor} transparent opacity={0} side={THREE.DoubleSide} />
      </mesh>

      {/* 符文环：12个方块标记 */}
      <group ref={runeRing}>
        {runeData.map((rune, i) => (
          <mesh key={i} position={[rune.x, rune.y, 0]} rotation={[0, 0, rune.rot]}>
            <planeGeometry args={[0.12, 0.04]} />
            <meshBasicMaterial color={ringColor} transparent opacity={0} side={THREE.DoubleSide} />
          </mesh>
        ))}
      </group>

      {/* 八角星射线 */}
      <group ref={starRing}>
        {starData.map((star, i) => (
          <mesh key={i} position={[star.x, star.y, 0]} rotation={[0, 0, star.rot + Math.PI / 2]}>
            <coneGeometry args={[0.05, 0.25, 4]} />
            <meshBasicMaterial color={dimColor} transparent opacity={0} side={THREE.DoubleSide} />
          </mesh>
        ))}
      </group>

      {/* 点阵环：24个小球 */}
      <group ref={dotRing}>
        {dotData.map((dot, i) => (
          <mesh key={i} position={[dot.x, dot.y, 0]}>
            <circleGeometry args={[0.03, 8]} />
            <meshBasicMaterial color={ringColor} transparent opacity={0} side={THREE.DoubleSide} />
          </mesh>
        ))}
      </group>
    </group>
  )
}

// ─── 灵力粒子 ───
function SpiritParticles({ count, color, radius, speed }: {
  count: number
  color: string
  radius: number
  speed: number
}) {
  const pointsRef = useRef<THREE.Points>(null)

  const { positions, geometry, material } = useMemo(() => {
    const pos = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2
      const r = radius * (0.7 + Math.random() * 0.3)
      pos[i * 3] = Math.cos(angle) * r
      pos[i * 3 + 1] = (Math.random() - 0.5) * 3
      pos[i * 3 + 2] = Math.sin(angle) * r
    }
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    const mat = new THREE.PointsMaterial({
      size: 0.05,
      color: new THREE.Color(color),
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
    return { positions: pos, geometry: geo, material: mat }
  }, [count, color, radius])

  useFrame(({ clock }) => {
    if (!pointsRef.current) return
    const t = clock.getElapsedTime()
    pointsRef.current.rotation.y = t * speed * 0.3
    const posAttr = pointsRef.current.geometry.attributes.position as THREE.BufferAttribute
    const arr = posAttr.array as Float32Array
    for (let i = 0; i < count; i++) {
      arr[i * 3 + 1] += Math.sin(t * 2 + i * 0.5) * 0.003
    }
    posAttr.needsUpdate = true
  })

  return <points ref={pointsRef} geometry={geometry} material={material} />
}

// ─── 神兽模型（入场动画 + 透明度控制）───
function CreatureModel({ creatureId, config, groupRef, modelOpacityRef, onLoaded }: {
  creatureId: string
  config: CinematicConfig
  groupRef: React.RefObject<THREE.Group | null>
  modelOpacityRef: React.RefObject<number>
  onLoaded: () => void
}) {
  const glbUrl = `/assets/models/${creatureId}.glb`
  const { scene } = useGLTF(glbUrl)
  const clonedScene = useMemo(() => scene.clone(true), [scene])

  const emissiveColor = useMemo(() => new THREE.Color(config.palette.primary), [config.palette.primary])

  // 设置材质透明 + 保留原始 PBR 纹理（不加全模型自发光）
  useEffect(() => {
    clonedScene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const setupMat = (m: THREE.Material) => {
          m.transparent = true
          m.opacity = 0
          if (m instanceof THREE.MeshStandardMaterial) {
            // 保留原始纹理，仅微调 PBR 参数
            m.envMapIntensity = 1.8
            m.roughness = Math.max(0.35, m.roughness)
            m.metalness = Math.min(0.7, m.metalness)
          }
        }
        if (Array.isArray(child.material)) {
          child.material.forEach(setupMat)
        } else if (child.material) {
          setupMat(child.material)
        }
      }
    })
    onLoaded()
  }, [clonedScene, onLoaded])

  // 每帧更新透明度
  useFrame(() => {
    const opacity = modelOpacityRef.current
    clonedScene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        if (Array.isArray(child.material)) {
          child.material.forEach(m => { m.opacity = opacity })
        } else if (child.material) {
          child.material.opacity = opacity
        }
      }
    })
  })

  // 资源释放
  useEffect(() => {
    return () => {
      clonedScene.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.geometry?.dispose()
          if (Array.isArray(child.material)) {
            child.material.forEach(m => m.dispose())
          } else {
            child.material?.dispose()
          }
        }
      })
    }
  }, [clonedScene])

  return (
    <group ref={groupRef}>
      <primitive object={clonedScene} scale={1.6} position={[0, -0.4, 0]} />
    </group>
  )
}

// ─── 场景内容 ───
function CinematicScene({ creatureId, config, reducedMotion, onLoaded }: {
  creatureId: string
  config: CinematicConfig
  reducedMotion: boolean
  onLoaded: () => void
}) {
  const modelGroupRef = useRef<THREE.Group>(null)
  const modelOpacityRef = useRef(0)
  const magicCircleScaleRef = useRef(0)
  const magicCircleOpacityRef = useRef(0)
  const [entranceComplete, setEntranceComplete] = useState(false)

  const { scene: threeScene } = useThree()

  // 设置雾效和灯光
  useEffect(() => {
    threeScene.fog = new THREE.FogExp2(config.scene.fogColor, config.scene.fogDensity)
    threeScene.background = new THREE.Color(config.palette.background)
  }, [threeScene, config])

  // 启动时间线
  useEffect(() => {
    const targets: TimelineTargets = {
      fogDensity: { value: 0 },
      farOpacity: { value: 0 },
      midOpacity: { value: 0 },
      nearOpacity: { value: 0 },
      magicCircleScale: magicCircleScaleRef,
      magicCircleOpacity: magicCircleOpacityRef,
      bloomIntensity: { current: 0 },
      envIntensity: { value: 0 },
    }

    const tl = createEntranceTimeline(targets, config, reducedMotion)

    return () => {
      tl.kill()
    }
  }, [config, reducedMotion])

  // 入场完成回调
  const handleEntranceComplete = useMemo(() => () => setEntranceComplete(true), [])

  return (
    <>
      {/* 收敛灯光：主光 + 轮廓光 */}
      <directionalLight
        color={config.scene.lighting.main.color}
        intensity={config.scene.lighting.main.intensity + 1.0}
        position={config.scene.lighting.main.position}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0001}
      />
      <directionalLight
        color={config.scene.lighting.rim.color}
        intensity={config.scene.lighting.rim.intensity + 1.0}
        position={config.scene.lighting.rim.position}
      />

      {/* 暗黑奇幻环境贴图 — PBR 反射 */}
      <Environment resolution={256} background={false}>
        <color attach="background" args={['#000']} />
        <Lightformer form="rect" intensity={2.5} color="#9fb4d6"
          position={[0, 4, 1]} scale={[6, 1, 1]} rotation={[-Math.PI / 2, 0, 0]} />
        <Lightformer form="rect" intensity={4} color={config.palette.primary}
          position={[-4, 1, -2]} scale={[1, 4, 1]} rotation={[0, Math.PI / 2, 0]} />
        <Lightformer form="rect" intensity={3} color={config.palette.secondary}
          position={[4, 1, -3]} scale={[1, 4, 1]} rotation={[0, -Math.PI / 2, 0]} />
        <Lightformer form="circle" intensity={1.2} color="#fff"
          position={[0, 1, 5]} scale={2} />
      </Environment>

      {/* 三层视差背景 */}
      <BackgroundScene scene={config.scene} />

      {/* 环境衬托 */}
      <EnvEffect config={config.envEffect} />

      {/* 灵力粒子 */}
      <SpiritParticles
        count={reducedMotion ? config.particles.count / 2 : config.particles.count}
        color={config.palette.secondary}
        radius={config.particles.radius}
        speed={config.particles.speed}
      />

      {/* 神兽模型 + 入场动画 */}
      <Suspense fallback={null}>
        <CreatureModel
          creatureId={creatureId}
          config={config}
          groupRef={modelGroupRef}
          modelOpacityRef={modelOpacityRef}
          onLoaded={onLoaded}
        />
        <EntranceAnimator
          config={config.entrance}
          groupRef={modelGroupRef}
          modelOpacityRef={modelOpacityRef}
          onComplete={handleEntranceComplete}
        />
      </Suspense>

      {/* 待机动画 */}
      <CreatureIdle
        groupRef={modelGroupRef}
        baseY={0}
        baseScale={1}
        enabled={entranceComplete}
        reducedMotion={reducedMotion}
      />

      {/* 接触阴影 */}
      <ContactShadows position={[0, -1.5, 0]} opacity={0.4} scale={5} blur={2} />
    </>
  )
}

// ─── 主组件 ───
interface CreatureCinematicViewerProps {
  creatureId: string
  creatureName: string
}

export function CreatureCinematicViewer({ creatureId, creatureName }: CreatureCinematicViewerProps) {
  const [loaded, setLoaded] = useState(false)
  const reducedMotion = useReducedMotion()
  const hasModel = has3DModel(creatureId)

  const config = useMemo(() => getCinematicConfig(creatureId), [creatureId])

  // creatureId 变化时重置加载状态
  useEffect(() => {
    setLoaded(false)
  }, [creatureId])

  // 没有模型时的回退 UI
  if (!hasModel) {
    return (
      <div
        className="w-full h-full relative flex items-center justify-center"
        style={{
          background: `linear-gradient(135deg, ${config.palette.background} 0%, #000 100%)`,
        }}
      >
        <div className="text-center space-y-4">
          <div className="text-7xl" style={{ filter: `drop-shadow(0 0 20px ${config.palette.primary}50)` }}>
            🐉
          </div>
          <div className="space-y-1">
            <p className="text-lg font-display" style={{ color: config.palette.primary }}>{creatureName}</p>
            <p className="text-sm font-display opacity-60">尚未显形</p>
            <p className="text-xs opacity-40">探索地图发现更多线索</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full h-full relative">
      {/* 加载状态 */}
      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center z-10" style={{ background: config.palette.background }}>
          <div className="text-center space-y-3">
            <div
              className="w-10 h-10 border-2 rounded-full animate-spin mx-auto"
              style={{
                borderColor: `${config.palette.primary}50`,
                borderTopColor: config.palette.primary,
              }}
            />
            <p className="text-sm font-display opacity-60">召唤 {creatureName} 中…</p>
          </div>
        </div>
      )}

      <Canvas
        key={creatureId}
        shadows
        dpr={[1, 2]}
        camera={{ position: [0, 0.3, 3.5], fov: 38 }}
        gl={{ antialias: true, alpha: false, powerPreference: 'high-performance', preserveDrawingBuffer: true }}
        style={{ background: config.palette.background }}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping
          gl.toneMappingExposure = 1.2
          gl.setClearColor(config.palette.background, 1)
        }}
      >
        <Suspense fallback={null}>
          <CinematicScene
            creatureId={creatureId}
            config={config}
            reducedMotion={reducedMotion}
            onLoaded={() => setLoaded(true)}
          />
        </Suspense>
        <OrbitControls
          enablePan={false}
          enableZoom={true}
          minDistance={2}
          maxDistance={10}
          autoRotate={false}
          rotateSpeed={0.5}
        />
      </Canvas>
    </div>
  )
}
