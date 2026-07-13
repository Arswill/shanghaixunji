import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { EffectComposer, Bloom, ChromaticAberration } from '@react-three/postprocessing'
import { BlendFunction } from 'postprocessing'
import { CreatureParallax } from './CreatureParallax'

interface CreatureViewerProps {
  creatureId: string
  textureUrl: string
  depthMapUrl: string
}

export function CreatureViewer({ creatureId, textureUrl, depthMapUrl }: CreatureViewerProps) {
  return (
    <Canvas
      camera={{ position: [0, 0, 5], fov: 50 }}
      gl={{ antialias: true, alpha: true }}
      style={{ width: '100%', height: '100%' }}
    >
      <ambientLight intensity={0.6} />
      <pointLight position={[10, 10, 10]} intensity={1.0} />
      <Suspense fallback={null}>
        <CreatureParallax
          creatureId={creatureId}
          textureUrl={textureUrl}
          depthMapUrl={depthMapUrl}
        />
      </Suspense>
      <EffectComposer>
        <Bloom
          luminanceThreshold={0.2}
          luminanceSmoothing={0.9}
          intensity={1.2}
          mipmapBlur
        />
        <ChromaticAberration
          blendFunction={BlendFunction.NORMAL}
          offset={[0.0005, 0.0005]}
        />
      </EffectComposer>
    </Canvas>
  )
}

export default CreatureViewer
