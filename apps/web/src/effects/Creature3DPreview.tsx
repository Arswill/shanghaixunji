/**
 * Creature3DPreview — 神兽 3D 模型预览组件（增强版）
 *
 * 使用 @react-three/drei 的 useGLTF 加载 GLB 模型，
 * 支持 OrbitControls 旋转/缩放、自动旋转、Environment HDRI、Bloom 后处理。
 *
 * 增强效果：
 * - 神兽悬浮呼吸动画（上下浮动 + 微缩放）
 * - 材质自发光/边缘光增强，低多边形模型也能呈现灵气
 * - 灵气粒子环绕（金色+青色粒子流）
 * - 脚下法阵（缓慢旋转的符文圆环）
 * - 更丰富的三点布光（主光+轮廓光+补光）
 * - 更慢的自动旋转，突出观察而非炫技
 *
 * @lazy-loaded — 通过 React.lazy 按需加载
 */

import { Suspense, useRef, useState, useEffect, useCallback, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import {
  useGLTF,
  OrbitControls,
  Html,
  useProgress,
  Bounds,
  ContactShadows,
} from '@react-three/drei'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import * as THREE from 'three'

// ──────────────────────────────────────────────
// Draco 解码器全局配置
// ──────────────────────────────────────────────
useGLTF.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.7/')

// ──────────────────────────────────────────────
// 类型
// ──────────────────────────────────────────────

interface Creature3DPreviewProps {
  /** GLB 模型 URL */
  modelUrl: string
  /** 神兽名称（Fallback 显示用） */
  creatureName: string
  /** 是否全屏模式 */
  fullscreen?: boolean
  /** 模型加载失败回调 */
  onLoadError?: () => void
}

// ──────────────────────────────────────────────
// 加载进度指示器
// ──────────────────────────────────────────────

function Loader({ name }: { name: string }) {
  const { progress } = useProgress()
  return (
    <Html center>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '12px',
          color: '#c9a96e',
          fontFamily: '"Noto Serif SC", serif',
        }}
      >
        <div
          style={{
            width: '48px',
            height: '48px',
            border: '3px solid rgba(201,169,110,0.2)',
            borderTopColor: '#c9a96e',
            borderRadius: '50%',
            animation: 'creature3d-spin 1s linear infinite',
          }}
        />
        <span style={{ fontSize: '14px', letterSpacing: '0.1em' }}>{name}</span>
        <span style={{ fontSize: '12px', color: '#8b8680' }}>
          {progress > 0 ? `${Math.round(progress)}%` : '加载中...'}
        </span>
      </div>
    </Html>
  )
}

// ──────────────────────────────────────────────
// 灵气粒子环绕
// ──────────────────────────────────────────────

function SpiritParticles({ color = '#d4a857', count = 120 }: { color?: string; count?: number }) {
  const pointsRef = useRef<THREE.Points>(null)

  const { positionAttr, sizeAttr, speeds } = useMemo(() => {
    const pos = new Float32Array(count * 3)
    const sz = new Float32Array(count)
    const sp = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2
      const radius = 1.2 + Math.random() * 1.8
      const y = (Math.random() - 0.5) * 2.5
      pos[i * 3] = Math.cos(angle) * radius
      pos[i * 3 + 1] = y
      pos[i * 3 + 2] = Math.sin(angle) * radius
      sz[i] = 0.03 + Math.random() * 0.05
      sp[i] = 0.3 + Math.random() * 0.7
    }
    return {
      positionAttr: new THREE.BufferAttribute(pos, 3),
      sizeAttr: new THREE.BufferAttribute(sz, 1),
      speeds: sp,
    }
  }, [count])

  useFrame(({ clock }) => {
    if (!pointsRef.current) return
    const t = clock.getElapsedTime()
    pointsRef.current.rotation.y = t * 0.08
    const posAttr = pointsRef.current.geometry.attributes.position as THREE.BufferAttribute
    const baseArray = positionAttr.array as Float32Array
    for (let i = 0; i < count; i++) {
      const ix = i * 3
      const angle = Math.atan2(baseArray[ix + 2], baseArray[ix]) + speeds[i] * 0.008
      const radius = Math.sqrt(baseArray[ix] ** 2 + baseArray[ix + 2] ** 2)
      posAttr.array[ix] = Math.cos(angle) * radius
      posAttr.array[ix + 2] = Math.sin(angle) * radius
      // 轻微上下漂移
      posAttr.array[ix + 1] = baseArray[ix + 1] + Math.sin(t * speeds[i] + i) * 0.003
    }
    posAttr.needsUpdate = true
  })

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <primitive object={positionAttr} attach="attributes-position" />
        <primitive object={sizeAttr} attach="attributes-size" />
      </bufferGeometry>
      <pointsMaterial
        size={0.05}
        color={color}
        transparent
        opacity={0.75}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  )
}

// ──────────────────────────────────────────────
// 脚下法阵
// ──────────────────────────────────────────────

function MagicCircle({ color = '#c9a96e' }: { color?: string }) {
  const ring1 = useRef<THREE.Mesh>(null)
  const ring2 = useRef<THREE.Mesh>(null)
  const ring3 = useRef<THREE.Mesh>(null)

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()
    if (ring1.current) ring1.current.rotation.z = t * 0.15
    if (ring2.current) ring2.current.rotation.z = -t * 0.22
    if (ring3.current) ring3.current.rotation.y = Math.sin(t * 0.3) * 0.1
  })

  return (
    <group position={[0, -1.25, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      {/* 外环 */}
      <mesh ref={ring1}>
        <ringGeometry args={[2.0, 2.08, 64]} />
        <meshBasicMaterial color={color} transparent opacity={0.35} side={THREE.DoubleSide} />
      </mesh>
      {/* 中环 */}
      <mesh ref={ring2}>
        <ringGeometry args={[1.5, 1.55, 48]} />
        <meshBasicMaterial color={color} transparent opacity={0.25} side={THREE.DoubleSide} />
      </mesh>
      {/* 内环符文点 */}
      <mesh ref={ring3}>
        <ringGeometry args={[1.1, 1.12, 12]} />
        <meshBasicMaterial color="#f5e4b8" transparent opacity={0.5} side={THREE.DoubleSide} />
      </mesh>
    </group>
  )
}

// ──────────────────────────────────────────────
// GLB 模型渲染（带呼吸动画 + 材质增强）
// ──────────────────────────────────────────────

function CreatureModel({ modelUrl }: { modelUrl: string }) {
  const gltf = useGLTF(modelUrl, true)
  const scene = gltf.scene
  const groupRef = useRef<THREE.Group>(null)

  // 克隆场景避免修改原始缓存
  const cloned = useRef<THREE.Group | null>(null)
  if (!cloned.current) {
    cloned.current = scene.clone(true)
  }

  // 材质增强 + 收集可发光网格
  useEffect(() => {
    cloned.current?.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true
        child.receiveShadow = true
        if (child.material instanceof THREE.MeshStandardMaterial) {
          child.material.envMapIntensity = 1.6
          // 给低多边形模型增加一点自发光，呈现"灵气"轮廓
          child.material.emissive = new THREE.Color('#1a1510')
          child.material.emissiveIntensity = 0.25
          child.material.roughness = Math.max(0.45, child.material.roughness * 0.9)
          child.material.metalness = Math.min(0.85, child.material.metalness + 0.15)
          child.material.needsUpdate = true
        }
      }
    })
  }, [])

  // 呼吸动画：上下浮动 + 轻微缩放脉冲
  useFrame(({ clock }) => {
    if (!groupRef.current) return
    const t = clock.getElapsedTime()
    groupRef.current.position.y = Math.sin(t * 0.8) * 0.06
    const s = 1 + Math.sin(t * 1.2) * 0.015
    groupRef.current.scale.set(s, s, s)
  })

  return (
    <group ref={groupRef}>
      <Bounds fit clip observe margin={1.2}>
        <primitive object={cloned.current} dispose={null} />
      </Bounds>
    </group>
  )
}

// ──────────────────────────────────────────────
// 错误边界包装
// ──────────────────────────────────────────────

function ModelWrapper({
  modelUrl,
  onError,
}: {
  modelUrl: string
  onError?: () => void
}) {
  useEffect(() => {
    let cancelled = false
    fetch(modelUrl, { method: 'HEAD' })
      .then((res) => {
        if (!res.ok && !cancelled) onError?.()
      })
      .catch(() => {
        if (!cancelled) onError?.()
      })
    return () => {
      cancelled = true
    }
  }, [modelUrl, onError])

  return <CreatureModel modelUrl={modelUrl} />
}

// ──────────────────────────────────────────────
// 主组件
// ──────────────────────────────────────────────

export function Creature3DPreview({
  modelUrl,
  creatureName,
  fullscreen = false,
  onLoadError,
}: Creature3DPreviewProps) {
  const [hasError, setHasError] = useState(false)

  const handleError = useCallback(() => {
    setHasError(true)
    onLoadError?.()
  }, [onLoadError])

  if (hasError) {
    return null
  }

  const containerStyle: React.CSSProperties = fullscreen
    ? {
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'radial-gradient(ellipse at center, #1e222d 0%, #0c0e14 100%)',
      }
    : {
        width: '100%',
        height: '100%',
        minHeight: '320px',
        background: 'radial-gradient(ellipse at center, #1e222d 0%, #0c0e14 100%)',
        borderRadius: '12px',
        overflow: 'hidden',
      }

  return (
    <div style={containerStyle}>
      {/* 全屏关闭按钮 */}
      {fullscreen && (
        <button
          onClick={() => window.history.back()}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            zIndex: 10000,
            background: 'rgba(26,29,39,0.8)',
            border: '1px solid rgba(201,169,110,0.3)',
            borderRadius: '8px',
            color: '#c9a96e',
            padding: '8px 16px',
            cursor: 'pointer',
            fontFamily: '"Noto Serif SC", serif',
            fontSize: '14px',
            backdropFilter: 'blur(8px)',
          }}
        >
          ✕ 关闭
        </button>
      )}

      {/* 神兽名称水印 */}
      <div
        style={{
          position: 'absolute',
          bottom: '16px',
          left: '16px',
          zIndex: 10,
          pointerEvents: 'none',
          color: 'rgba(201,169,110,0.5)',
          fontFamily: '"Noto Serif SC", serif',
          fontSize: fullscreen ? '24px' : '16px',
          letterSpacing: '0.15em',
        }}
      >
        {creatureName}
      </div>

      <Canvas
        camera={{ position: [0, 0.2, 3.3], fov: 42 }}
        gl={{ antialias: true, alpha: true, preserveDrawingBuffer: true }}
        shadows
        dpr={[1, 1.5]}
        style={{ width: '100%', height: '100%' }}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping
          gl.toneMappingExposure = 1.15
        }}
      >
        {/* 三点布光 */}
        <ambientLight intensity={0.35} />
        <directionalLight
          position={[4, 6, 4]}
          intensity={1.4}
          castShadow
          shadow-mapSize={[1024, 1024]}
          shadow-camera-far={20}
          shadow-camera-left={-5}
          shadow-camera-right={5}
          shadow-camera-top={5}
          shadow-camera-bottom={-5}
          color="#fff5e0"
        />
        {/* 轮廓光（暖金） */}
        <spotLight
          position={[-4, 2, -3]}
          angle={Math.PI / 5}
          penumbra={0.8}
          intensity={2.0}
          color="#d4a857"
          distance={15}
        />
        {/* 补光（冷青） */}
        <pointLight position={[3, -1, -2]} intensity={0.8} color="#6ca6a0" />

        <Suspense fallback={<Loader name={creatureName} />}>
          <ModelWrapper modelUrl={modelUrl} onError={handleError} />
          <SpiritParticles color="#d4a857" count={160} />
          <SpiritParticles color="#6ca6a0" count={80} />
          <MagicCircle color="#c9a96e" />
          <ContactShadows
            position={[0, -1.25, 0]}
            opacity={0.45}
            scale={10}
            blur={2.5}
            far={4}
          />
        </Suspense>

        {/* 交互控件：更慢的自动旋转 */}
        <OrbitControls
          enableZoom
          enablePan={false}
          autoRotate
          autoRotateSpeed={0.6}
          minDistance={1.8}
          maxDistance={6}
          minPolarAngle={Math.PI / 6}
          maxPolarAngle={Math.PI / 1.8}
        />

        {/* 后处理：更强的泛光 */}
        <EffectComposer>
          <Bloom
            luminanceThreshold={0.25}
            luminanceSmoothing={0.85}
            intensity={0.9}
            mipmapBlur
          />
        </EffectComposer>
      </Canvas>
    </div>
  )
}

export default Creature3DPreview
