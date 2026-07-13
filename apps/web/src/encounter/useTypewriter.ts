import { useState, useEffect, useRef, useCallback } from 'react'

export function useTypewriter(text: string, speed: number = 80, startDelay: number = 300, trigger: boolean = true) {
  const [displayed, setDisplayed] = useState('')
  const [isDone, setIsDone] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const startedRef = useRef(false)

  const start = useCallback(() => {
    if (startedRef.current) return
    startedRef.current = true
    setDisplayed('')
    setIsDone(false)
    let i = 0
    const type = () => {
      if (i < text.length) {
        setDisplayed(text.slice(0, i + 1))
        i++
        timerRef.current = setTimeout(type, speed)
      } else {
        setIsDone(true)
      }
    }
    timerRef.current = setTimeout(type, startDelay)
  }, [text, speed, startDelay])

  useEffect(() => {
    if (trigger) start()
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [trigger, start])

  const skip = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    setDisplayed(text)
    setIsDone(true)
  }, [text])

  return { displayed, isDone, skip }
}
