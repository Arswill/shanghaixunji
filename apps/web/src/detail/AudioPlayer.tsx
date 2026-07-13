import { useState, useRef, useCallback, useEffect } from 'react'

interface AudioPlayerProps {
  audioUrl: string | null
  originalText: string
}

export function AudioPlayer({ audioUrl, originalText }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)

  const handlePlay = useCallback(() => {
    if (audioUrl) return // native audio element handles this

    if (!('speechSynthesis' in window)) {
      setError('您的浏览器不支持语音朗读功能')
      return
    }

    // Stop any ongoing speech
    window.speechSynthesis.cancel()

    const utterance = new SpeechSynthesisUtterance(originalText)
    utterance.lang = 'zh-CN'
    utterance.rate = 0.85
    utterance.pitch = 0.9

    utterance.onstart = () => setIsPlaying(true)
    utterance.onend = () => setIsPlaying(false)
    utterance.onerror = () => setIsPlaying(false)

    utteranceRef.current = utterance
    window.speechSynthesis.speak(utterance)
  }, [audioUrl, originalText])

  const handleStop = useCallback(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
    }
    setIsPlaying(false)
  }, [])

  // Cleanup: stop speech when component unmounts
  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel()
      }
    }
  }, [])

  // Native audio file available (edge-tts Mandarin reading)
  if (audioUrl) {
    return (
      <div data-testid="audio-player" className="p-3 bg-bg-raised rounded border border-acc-bronze/30">
        <p className="text-ink-muted text-sm mb-2">
          <span className="text-acc-gold">原文朗读</span> · 普通话
        </p>
        <audio controls preload="none" className="w-full" data-testid="native-audio">
          <source src={audioUrl} type="audio/mpeg" />
        </audio>
      </div>
    )
  }

  // Fallback: Web Speech API (Mandarin, not dialect)
  return (
    <div data-testid="audio-player" className="p-3 bg-bg-raised rounded border border-acc-bronze/30">
      <p className="text-ink-muted text-sm mb-1">
        <span className="text-acc-gold">古文朗读</span> · 普通话预览
      </p>
      <p className="text-ink-faint text-xs mb-2">
        方言音频生成中，当前为普通话朗读预览
      </p>
      {error && (
        <p className="text-acc-cinnabar text-xs mb-2" role="alert">{error}</p>
      )}
      <div className="flex items-center gap-2">
        <button
          onClick={isPlaying ? handleStop : handlePlay}
          aria-label={isPlaying ? '停止朗读' : '播放朗读'}
          className={`px-4 py-1.5 rounded text-sm transition-colors ${
            isPlaying
              ? 'bg-acc-cinnabar/30 text-acc-gold border border-acc-cinnabar/50'
              : 'bg-acc-bronze/20 text-ink-primary border border-acc-bronze/40 hover:bg-acc-bronze/30'
          }`}
        >
          {isPlaying ? '■ 停止' : '▶ 播放朗读'}
        </button>
        {isPlaying && (
          <span className="text-ink-faint text-xs animate-pulse" aria-live="polite">朗读中…</span>
        )}
      </div>
    </div>
  )
}
