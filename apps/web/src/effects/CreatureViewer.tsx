import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { CreatureParallax } from './CreatureParallax'

interface CreatureViewerProps {
  creatureId: string
  textureUrl: string
  depthMapUrl: string
}

export function CreatureViewer({ creatureId, textureUrl, depthMapUrl }: CreatureViewerProps) {
  return (
    <div style={{
      width: '100%',
      height: '100%',
      background: 'radial-gradient(ellipse at 50% 40%, #2a231c 0%, #14110d 60%, #080705 100%)',
      borderRadius: '8px',
      overflow: 'hidden',
      position: 'relative',
    }}>
    <Canvas
      camera={{ position: [0, 0, 5], fov: 50 }}
      gl={{ antialias: true, alpha: false }}
      style={{ width: '100%', height: '100%' }}
    >
      <ambientLight intensity={0.8} />
      <pointLight position={[10, 10, 10]} intensity={1.6} />
      <Suspense fallback={null}>
        <CreatureParallax
          creatureId={creatureId}
          textureUrl={textureUrl}
          depthMapUrl={depthMapUrl}
        />
      </Suspense>
    </Canvas>
    {/* CSS 暗角效果——替代 postprocessing Vignette */}
    <div style={{
      position: 'absolute',
      inset: 0,
      pointerEvents: 'none',
      background: 'radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.5) 100%)',
    }} />
    </div>
  )
}

export default CreatureViewer
