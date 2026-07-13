import { useCallback, useState, useEffect } from 'react'
import { useViewStore } from '../app/useViewStore'
import { useCollection } from '../collection/useCollection'
import { useGuardianStore } from '../guardian/guardianStore'
import { getCreatureById, getCreaturesByProvince } from '../data/loadCreatures'
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

interface GlobalChatBarProps {
  /** 迷雾视图或遭遇覆盖层激活时隐藏底部入口，避免被高 z-index 覆盖层遮挡。 */
  overlayActive?: boolean
}

/**
 * 全站底部 AI 入口浮层。
 * 仅在非首页显示，提供 0 次点击直达 AI 对话的快捷入口。
 */
export function GlobalChatBar({ overlayActive = false }: GlobalChatBarProps = {}) {
  const view = useViewStore((s) => s.view)
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

  const isFirstVisit = discovered.length === 0
  const placeholder = isFirstVisit ? '向鲲鹏问一问山海经…' : '问一问神兽…'

  const handleSend = useCallback(() => {
    const trimmed = input.trim()
    if (!trimmed) return
    // 首次访问默认发给鲲鹏，否则发给第一个已发现神兽
    const targetId = isFirstVisit ? 'kun-peng' : discovered[0]
    if (!getCreatureById(targetId)) return
    setInitialMessage(trimmed)
    goCreature(targetId)
    setInput('')
  }, [input, isFirstVisit, discovered, goCreature, setInitialMessage])

  const handleQuickQuestion = useCallback(
    (q: string) => {
      const resolved = resolveQuickQuestion(q, discovered, province)
      if (resolved.notice) {
        setNotice(resolved.notice)
        return
      }
      if (!resolved.targetId) return
      setInitialMessage(q)
      goCreature(resolved.targetId)
    },
    [discovered, province, goCreature, setInitialMessage]
  )

  // 仅在非首页显示；详情页已有内嵌对话，迷雾/遭遇覆盖层激活时隐藏避免被遮挡
  if (view === 'home' || view === 'detail' || overlayActive) return null

  return (
    <div
      data-testid="global-chat-bar"
      className="fixed bottom-0 left-0 right-0 z-30 bg-bg-deep/90 backdrop-blur-md border-t border-acc-bronze/25 px-4 py-2.5 pb-[max(0.625rem,env(safe-area-inset-bottom))]"
    >
      <div className="max-w-5xl mx-auto flex items-center gap-3">
        {/* 标签 */}
        <span className="shrink-0 text-acc-gold text-sm font-display tracking-wider hidden sm:inline">
          ⟡ 问神兽
        </span>
        <span className="shrink-0 text-acc-gold text-sm sm:hidden">⟡</span>

        {/* 文字输入框 */}
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder={placeholder}
          inputMode="text"
          enterKeyHint="send"
          className="min-w-0 flex-1 bg-bg-raised text-ink-primary text-base px-3 py-2.5 rounded-full border border-acc-bronze/30 focus:border-acc-gold focus:outline-none placeholder:text-ink-faint"
          data-testid="global-chat-input"
          aria-label="向神兽提问"
        />

        {/* 快捷问题 chips（桌面端显示） */}
        <div className="hidden md:flex items-center gap-2 shrink-0">
          {QUICK_QUESTIONS.map((q) => (
            <button
              key={q}
              onClick={() => handleQuickQuestion(q)}
              className="shrink-0 px-3 py-2 text-xs rounded-full bg-bg-raised text-ink-primary border border-acc-bronze/30 hover:border-acc-gold hover:text-acc-gold-bright transition-colors whitespace-nowrap"
            >
              {q}
            </button>
          ))}
        </div>
        {notice && (
          <span
            role="status"
            data-testid="global-chat-notice"
            className="shrink-0 text-xs text-acc-cinnabar animate-pulse whitespace-nowrap"
          >
            {notice}
          </span>
        )}
      </div>
    </div>
  )
}
