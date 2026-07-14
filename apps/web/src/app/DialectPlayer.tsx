// src/app/DialectPlayer.tsx
import { useState, useCallback, useRef, useEffect } from 'react'
import { speakDialect, playAudioUrl, speakWithWebAPI } from '../tts/cosyvoice'

interface DialectPlayerProps {
  creatureId: string
  province: string
  text: string
}

export function DialectPlayer({ creatureId, province, text }: DialectPlayerProps) {
  const [state, setState] = useState<'idle' | 'loading' | 'playing'>('idle')
  const [dialectLabel, setDialectLabel] = useState('')
  const [isFallback, setIsFallback] = useState(false)
  const stopRef = useRef<(() => void) | null>(null)

  const handlePlay = useCallback(async () => {
    if (state === 'playing') {
      stopRef.current?.()
      setState('idle')
      return
    }

    setState('loading')
    setIsFallback(false)
    try {
      const result = await speakDialect({ text, province, creatureId })
      setDialectLabel(result.dialectLabel)

      if (result.audioUrl) {
        // 播放 URL 音频，失败时自动回退到 Web Speech
        const audio = playAudioUrl(result.audioUrl, () => {
          // 音频播放失败 — 回退到 Web Speech
          console.info('[DialectPlayer] 音频播放失败，回退到 Web Speech API')
          setIsFallback(true)
          const stop = speakWithWebAPI(text)
          stopRef.current = stop
          setState('playing')
          setTimeout(() => setState('idle'), text.length * 80 + 1000)
        })
        audio.onended = () => setState('idle')
        stopRef.current = () => { audio.pause(); audio.src = '' }
        setState('playing')
      } else {
        // Web Speech API 回退
        setIsFallback(true)
        const stop = speakWithWebAPI(text)
        stopRef.current = stop
        setState('playing')
        // 简单估计时长后自动回到 idle
        setTimeout(() => setState('idle'), text.length * 80 + 1000)
      }
    } catch {
      setState('idle')
    }
  }, [creatureId, province, text, state])

  useEffect(() => {
    return () => stopRef.current?.()
  }, [creatureId])

  return (
    <button
      onClick={handlePlay}
      disabled={state === 'loading'}
      className="flex items-center gap-2 px-5 py-2.5 rounded-full ancient-btn disabled:opacity-60"
      title={isFallback ? '预生成方言音频不可用，当前为浏览器语音朗读' : `听${dialectLabel}朗读`}
    >
      <span className={state === 'playing' ? 'animate-pulse' : ''}>
        {state === 'playing' ? '🔊' : '🔇'}
      </span>
      <span className="font-display text-sm">
        {state === 'loading'
          ? '加载中…'
          : state === 'playing'
            ? `${isFallback ? '朗读中' : `播放中'} (${dialectLabel})`
            : `听${dialectLabel || '方言'}`}
      </span>
    </button>
  )
}
