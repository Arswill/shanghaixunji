// src/app/ChatBubble.tsx
import { useState, useEffect, useRef } from 'react'

interface ChatBubbleProps {
  creatureName: string
  creatureImage?: string | null
  message: string
  onClose: () => void
}

export function ChatBubble({ creatureName, creatureImage, message, onClose }: ChatBubbleProps) {
  const [displayed, setDisplayed] = useState('')
  const [isDone, setIsDone] = useState(false)
  const indexRef = useRef(0)

  useEffect(() => {
    indexRef.current = 0
    setDisplayed('')
    setIsDone(false)
    const interval = setInterval(() => {
      if (indexRef.current < message.length) {
        setDisplayed(message.slice(0, indexRef.current + 1))
        indexRef.current++
      } else {
        clearInterval(interval)
        setIsDone(true)
      }
    }, 40)
    return () => clearInterval(interval)
  }, [message])

  return (
    <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md px-4 animate-fade-in">
      <div className="celestial-card rounded-2xl p-5 space-y-3">
        <div className="flex items-center gap-3">
          {creatureImage && (
            <img src={creatureImage} alt={creatureName} className="w-8 h-8 rounded-full object-cover border border-acc-gold/40" />
          )}
          <span className="font-display text-sm text-acc-gold">{creatureName}</span>
          <button onClick={onClose} className="ml-auto text-ink-faint hover:text-cinnabar text-lg">✕</button>
        </div>
        <p className="text-ink-primary text-sm font-display leading-relaxed min-h-[3rem]">
          {displayed}
          {!isDone && <span className="animate-pulse text-acc-gold">▌</span>}
        </p>
      </div>
    </div>
  )
}
