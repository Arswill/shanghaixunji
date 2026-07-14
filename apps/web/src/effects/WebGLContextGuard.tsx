/**
 * WebGLContextGuard — R3F Canvas 内部组件
 *
 * 监听 WebGL context lost / restored 事件，防止长时间运行时
 * 因 GPU 资源回收导致页面崩溃（P1#07 修复）。
 *
 * 用法：放在 <Canvas> 内部即可自动生效。
 *
 *   <Canvas>
 *     <WebGLContextGuard />
 *     ...
 *   </Canvas>
 */

import { useEffect, useCallback } from 'react'
import { useThree } from '@react-three/fiber'

export function WebGLContextGuard() {
  const gl = useThree((state) => state.gl)
  const invalidate = useThree((state) => state.invalidate)

  const handleContextLost = useCallback(
    (event: Event) => {
      // 阻止默认行为，允许 R3F 自动恢复
      event.preventDefault()
      console.warn('[WebGL] Context lost — R3F will attempt auto-recovery')
    },
    [],
  )

  const handleContextRestored = useCallback(() => {
    console.info('[WebGL] Context restored — re-rendering scene')
    // 强制重新渲染一帧
    invalidate()
  }, [invalidate])

  useEffect(() => {
    const canvas = gl.domElement
    canvas.addEventListener('webglcontextlost', handleContextLost, false)
    canvas.addEventListener('webglcontextrestored', handleContextRestored, false)

    return () => {
      canvas.removeEventListener('webglcontextlost', handleContextLost)
      canvas.removeEventListener('webglcontextrestored', handleContextRestored)
    }
  }, [gl, handleContextLost, handleContextRestored])

  return null
}

export default WebGLContextGuard
