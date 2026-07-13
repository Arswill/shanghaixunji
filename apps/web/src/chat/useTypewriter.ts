import { useState, useEffect, useRef, useCallback } from 'react'

export interface UseTypewriterResult {
  /** 当前已显示的文本（逐字增长）。 */
  displayed: string
  /** 是否已打字完成。 */
  isDone: boolean
  /** 跳过动画，立即显示完整文本。 */
  skip: () => void
}

/**
 * 打字机 Hook —— 逐字显示文本，用于 AI 回复的渐进式呈现。
 *
 * 与 `encounter/useTypewriter` 不同，本 Hook 面向聊天场景：
 *  - 无起始延迟，首个字符在 `speed` ms 后出现
 *  - 默认每字 50ms
 *  - 文本变化时自动重置并重新开始
 *
 * 组件可据 `isDone` 控制光标显示与输入框禁用状态。
 */
export function useTypewriter(text: string, speed: number = 50): UseTypewriterResult {
  const [displayed, setDisplayed] = useState('')
  const [isDone, setIsDone] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    // 文本变化时重置
    setDisplayed('')
    setIsDone(false)
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }

    // 空文本直接完成
    if (!text) {
      setIsDone(true)
      return
    }

    let i = 0
    const type = () => {
      if (i < text.length) {
        setDisplayed(text.slice(0, i + 1))
        i += 1
        timerRef.current = setTimeout(type, speed)
      } else {
        timerRef.current = null
        setIsDone(true)
      }
    }
    timerRef.current = setTimeout(type, speed)

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
    }
  }, [text, speed])

  const skip = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
    setDisplayed(text)
    setIsDone(true)
  }, [text])

  return { displayed, isDone, skip }
}
