// src/app/Creature3DViewer.tsx
// 3D 神兽查看器 — 支持加载状态、入场动画、错误回退

import { Suspense, useRef, useState, useEffect, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { useGLTF, ContactShadows, OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import { has3DModel } from '../effects/creature-3d-manifest'

// 配置 Draco 解码器（从 CDN 加载，用于解码 Draco 压缩的 GLB 文件）
useGLTF.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.7/')

function CreatureModel({ creatureId, onLoad }: { creatureId: string; onLoad: () => void }) {
  const groupRef = useRef<THREE.Group>(null)
  const glbUrl = `/assets/models/${creatureId}.glb`
  console.log('[CreatureModel] Loading GLB:', glbUrl, 'for creatureId:', creatureId)
  const { scene } = useGLTF(glbUrl)

  // 克隆 scene 避免多个实例共享同一对象
  const clonedScene = useMemo(() => scene.clone(true), [scene])

  useEffect(() => {
    onLoad()
  }, [onLoad])

  // 慢速自转
  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.12
    }
  })

  // 卸载时释放克隆的 scene 资源
  useEffect(() => {
    return () => {
      clonedScene.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.geometry?.dispose()
          if (Array.isArray(child.material)) {
            child.material.forEach((m) => m.dispose())
          } else {
            child.material?.dispose()
          }
        }
      })
    }
  }, [clonedScene])

  return (
    <group ref={groupRef}>
      <primitive object={clonedScene} scale={1.2} position={[0, -0.5, 0]} />
    </group>
  )
}

// 调试用：在控制台暴露 useGLTF 缓存清除方法
if (typeof window !== 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(window as any).__clearGLTFCache = () => useGLTF.clear('/assets/models/', true)
}

function SceneFallback() {
  return (
    <mesh>
      <boxGeometry args={[0, 0, 0]} />
    </mesh>
  )
}

interface Creature3DViewerProps {
  creatureId: string
  creatureName: string
}

export function Creature3DViewer({ creatureId, creatureName }: Creature3DViewerProps) {
  const [loaded, setLoaded] = useState(false)
  const [visible, setVisible] = useState(false)

  // 检查该神兽是否有 3D 模型
  const hasModel = has3DModel(creatureId)
  console.log('[Creature3DViewer] creatureId:', creatureId, 'name:', creatureName, 'hasModel:', hasModel)

  // 出场动画
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 100)
    return () => clearTimeout(t)
  }, [creatureId])

  const handleLoad = () => {
    setLoaded(true)
  }

  // creatureId 变化时重置状态
  useEffect(() => {
    setLoaded(false)
    setVisible(false)
    const t = setTimeout(() => setVisible(true), 100)
    return () => clearTimeout(t)
  }, [creatureId])

  // 没有 3D 模型时，直接显示回退内容
  if (!hasModel) {
    return (
      <div
        className="w-full h-full relative flex items-center justify-center"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? 'scale(1)' : 'scale(0.85)',
          transition: 'opacity 1.2s ease-out, transform 1.2s ease-out',
          background: 'linear-gradient(135deg, #1a1814 0%, #0e0c08 100%)',
        }}
      >
        <div className="text-center space-y-4">
          <div
            className="text-7xl"
            style={{ filter: 'drop-shadow(0 0 20px rgba(212,175,55,0.3))' }}
          >
            🐉
          </div>
          <div className="space-y-1">
            <p className="text-acc-gold text-lg font-display">{creatureName}</p>
            <p className="text-ink-muted text-sm font-display">尚未显形</p>
            <p className="text-ink-faint text-xs">探索地图发现更多线索</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      className="w-full h-full relative"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'scale(1)' : 'scale(0.85)',
        transition: 'opacity 1.2s ease-out, transform 1.2s ease-out',
      }}
    >
      {/* 加载状态提示 */}
      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <div className="text-center space-y-3">
            <div className="w-10 h-10 border-2 border-acc-gold/50 border-t-acc-gold rounded-full animate-spin mx-auto" />
            <p className="text-ink-muted text-sm font-display">召唤 {creatureName} 中…</p>
          </div>
        </div>
      )}

      <Canvas
        key={creatureId}
        camera={{ position: [0, 0, 5], fov: 45 }}
        gl={{ antialias: true, alpha: false }}
        style={{ background: '#0e0c08' }}
        onCreated={({ gl }) => {
          gl.setClearColor('#0e0c08', 1)
        }}
      >
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 5, 5]} intensity={1.0} castShadow />
        <directionalLight position={[-5, 3, -5]} intensity={0.4} color="#d4af55" />
        <pointLight position={[-5, -5, -5]} intensity={0.3} />
        <Suspense fallback={<SceneFallback />}>
          <CreatureModel
            key={creatureId}
            creatureId={creatureId}
            onLoad={handleLoad}
          />
          <ContactShadows position={[0, -1.5, 0]} opacity={0.4} scale={4} blur={2} />
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

// 预加载已移除 — 改为按需加载，避免大文件阻塞页面
