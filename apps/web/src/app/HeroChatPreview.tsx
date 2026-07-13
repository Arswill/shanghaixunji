import { useState, useCallback, useEffect } from 'react'
import { getCreatureById, getCreaturesByProvince } from '../data/loadCreatures'
import { useViewStore } from './useViewStore'
import { useCollection } from '../collection/useCollection'
import { useGuardianStore } from '../guardian/guardianStore'
import { getCurrentSeasonCreatureIds } from '../collection/solarTerms'

/** 3 个快捷问题 */
const QUICK_QUESTIONS = [
  '我家乡有什么神兽？',
  '九尾狐的故事是什么？',
  '最近有什么节气神兽？',
] as const

/** 未发现任何神兽时的默认目标 */
const DEFAULT_CREATURE_ID = 'jiu-wei-hu'

interface QuickQuestionTarget {
  targetId: string | null
  notice?: string
}

/**
 * 按问题语义解析目标神兽 id：
 * - 含「九尾狐」→ id 为 jiu-wei-hu 的神兽
 * - 含「节气」→ 当前节气对应神兽（取第一个）
 * - 含「家乡」→ 守护神省份对应神兽；未定位家乡则返回提示
 * - 其余/找不到 → discovered[0] 或默认神兽
 */
function resolveQuickQuestion(
  question: string,
  discovered: string[],
  province: string | null
): QuickQuestionTarget {
  const fallback = discovered.length > 0 ? discovered[0] : DEFAULT_CREATURE_ID

  if (question.includes('九尾狐')) {
    return { targetId: getCreatureById('jiu-wei-hu') ? 'jiu-wei-hu' : fallback }
  }

  if (question.includes('节气')) {
    const ids = getCurrentSeasonCreatureIds()
    if (ids.length > 0 && getCreatureById(ids[0])) return { targetId: ids[0] }
    return { targetId: fallback }
  }

  if (question.includes('家乡')) {
    if (province) {
      const provinceCreatures = getCreaturesByProvince(province)
      if (provinceCreatures.length > 0) {
        const discoveredInProvince = provinceCreatures.filter((c) =>
          discovered.includes(c.id)
        )
        const pick = discoveredInProvince[0] ?? provinceCreatures[0]
        return { targetId: pick.id }
      }
      return { targetId: fallback }
    }
    return { targetId: null, notice: '请先在守护神页面定位家乡' }
  }

  return { targetId: fallback }
}

export function HeroChatPreview() {
  const goCreature = useViewStore((s) => s.goCreature)
  const setInitialMessage = useViewStore((s) => s.setInitialMessage)
  const discovered = useCollection((s) => s.discovered)
  const province = useGuardianStore((s) => s.province)
  const [input, setInput] = useState('')
  const [notice, setNotice] = useState<string | null>(null)

  useEffect(() => {
    if (!notice) return
    const t = setTimeout(() => setNotice(null), 3000)
    return () => clearTimeout(t)
  }, [notice])

  const sendMessage = useCallback(
    (text: string, targetId?: string) => {
      const trimmed = text.trim()
      if (!trimmed) return
      const id = targetId ?? (discovered.length > 0 ? discovered[0] : DEFAULT_CREATURE_ID)
      if (!id) return
      setInitialMessage(trimmed)
      goCreature(id)
    },
    [discovered, goCreature, setInitialMessage]
  )

  const handleQuickQuestion = useCallback(
    (q: string) => {
      const resolved = resolveQuickQuestion(q, discovered, province)
      if (resolved.notice) {
        setNotice(resolved.notice)
        return
      }
      sendMessage(q, resolved.targetId ?? undefined)
    },
    [discovered, province, sendMessage]
  )

  const handleSend = useCallback(() => {
    sendMessage(input)
    setInput('')
  }, [input, sendMessage])

  return (
    <div
      data-testid="hero-chat-preview"
      className="celestial-card rounded-2xl p-5 space-y-4"
    >
      {/* 快捷提问 chip */}
      <div className="flex flex-wrap gap-2">
        {QUICK_QUESTIONS.map((q) => (
          <button
            key={q}
            onClick={() => handleQuickQuestion(q)}
            className="px-3 py-2.5 text-xs rounded-full bg-bg-deep text-ink-muted border border-acc-bronze/30 hover:border-acc-gold hover:text-ink-primary transition-colors"
          >
            {q}
          </button>
        ))}
      </div>

      {/* 未定位家乡等提示 */}
      {notice && (
        <p
          role="status"
          data-testid="hero-chat-notice"
          className="text-xs text-acc-cinnabar animate-pulse"
        >
          {notice}
        </p>
      )}

      {/* 输入框 + 发送按钮 */}
      <div className="flex gap-2">
        <input
          type="text"
          inputMode="text"
          enterKeyHint="send"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="输入神兽名称或问题…"
          className="flex-1 bg-bg-deep text-ink-primary text-base px-3 py-2 rounded-lg border border-acc-bronze/30 focus:border-acc-gold focus:outline-none placeholder:text-ink-faint"
          data-testid="hero-chat-input"
        />
        <button
          onClick={handleSend}
          disabled={!input.trim()}
          className="px-4 py-2 rounded-lg bg-acc-cinnabar/20 text-acc-gold-bright border border-acc-cinnabar/40 hover:bg-acc-cinnabar/30 transition-colors text-sm disabled:opacity-50"
          data-testid="hero-chat-send"
        >
          发送
        </button>
      </div>
    </div>
  )
}
