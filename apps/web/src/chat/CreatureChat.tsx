import { useState, useRef, useEffect, useCallback } from 'react'
import type { Creature } from '../data/creatures.schema'
import { sendChatMessage, type ChatMessage, type FallbackContext } from './chatApi'
import { buildSystemPrompt, detectPersonality, SUGGESTED_QUESTIONS } from './chatPrompts'
import { buildMemoryContext } from './memorySummary'
import { useBondStore, LEVEL_LABEL, MOOD_LABEL, GIFT_LABEL } from '../bond/bondStore'
import { useTypewriter } from './useTypewriter'
import { trackEvent } from '../analytics/analytics'
import { speakDialect, playAudioUrl, getDialectLabel, speakWithWebAPI } from '../tts/cosyvoice'

interface CreatureChatProps {
  /** 神兽数据；`image` 为可选字段，由 `CreatureWithAssets` 提供。 */
  creature: Creature & { image?: string | null }
  /** 初始消息：设置后自动发送一次（800ms 延迟）。 */
  initialMessage?: string
}

/** System notice shown before the first offline reply. */
const OFFLINE_NOTICE =
  '⚠ 当前为离线模式，回复基于规则匹配。配置API Key后可体验真实AI对话。'

/** 打字机每字间隔（ms）。 */
const TYPE_SPEED = 50

/**
 * 关键词 → 追问问题映射表。
 * 根据最近一条 AI 回复的内容关键词，推荐 2-3 个上下文相关的追问。
 */
const FOLLOW_UP_MAP: { keywords: string[]; question: string }[] = [
  { keywords: ['火', '焚', '炎', '烧', '焰'], question: '你能掌控火焰吗？' },
  { keywords: ['水', '洪', '涝', '雨', '涛', '波'], question: '你与水有何渊源？' },
  { keywords: ['食人', '吃', '噬', '吞', '猎'], question: '你为何食人？' },
  { keywords: ['旱', '干', '枯', '焦'], question: '大旱之年你做了什么？' },
  { keywords: ['黄帝', '蚩尤', '帝', '战', '伐', '征'], question: '你参与过上古之战吗？' },
  { keywords: ['形', '状', '貌', '如'], question: '你的形貌有何寓意？' },
  { keywords: ['山', '居', '栖', '住', '穴'], question: '你的栖息地还有谁？' },
  { keywords: ['鸣', '音', '声', '叫'], question: '你的叫声预示什么？' },
  { keywords: ['兆', '见则', '现', '征', '瑞'], question: '你现世意味着什么？' },
  { keywords: ['千', '年', '久', '古', '远', '岁'], question: '你活了多少岁月？' },
  { keywords: ['翼', '飞', '鸟', '羽'], question: '你会飞翔吗？' },
  { keywords: ['角', '爪', '牙', '鳞', '尾'], question: '你的形体有何神异？' },
]

/** 兜底追问（当关键词命中不足时补充）。 */
const FALLBACK_FOLLOW_UPS = [
  '你还有什么想说的？',
  '你能告诉我一个秘密吗？',
  '你最怕什么？',
]

/** 生成文言文开场白：神兽用第一句话打招呼 */
function getOpeningLine(creature: Creature & { image?: string | null }): string {
  const scrollName = creature.scroll || '山海经'
  return `吾乃${scrollName}所载之${creature.name}，等候千年，今与汝遇。`
}

/** 根据回复内容推荐 2-3 个追问。 */
function getFollowUps(reply: string): string[] {
  const hits: string[] = []
  for (const item of FOLLOW_UP_MAP) {
    if (item.keywords.some((k) => reply.includes(k))) {
      if (!hits.includes(item.question)) hits.push(item.question)
      if (hits.length >= 3) break
    }
  }
  if (hits.length < 2) {
    for (const q of FALLBACK_FOLLOW_UPS) {
      if (!hits.includes(q)) hits.push(q)
      if (hits.length >= 3) break
    }
  }
  return hits.slice(0, 3)
}

interface AssistantMessageProps {
  messageIndex: number
  content: string
  creature: Creature & { image?: string | null }
  isSpeaking: boolean
  onToggleSpeak: (index: number, text: string) => void
  onTypingDone: (index: number) => void
  isDialectSpeaking: boolean
  onToggleDialectSpeak: (index: number, text: string) => void
  dialectLabel: string
}

/** 单条 AI 回复：神兽头像 + 打字机正文 + 语音朗读按钮。 */
function AssistantMessage({
  messageIndex,
  content,
  creature,
  isSpeaking,
  onToggleSpeak,
  onTypingDone,
  isDialectSpeaking,
  onToggleDialectSpeak,
  dialectLabel,
}: AssistantMessageProps) {
  const { displayed, isDone } = useTypewriter(content, TYPE_SPEED)

  // 用 ref 持有最新的 onTypingDone，避免其成为 effect 依赖造成重复触发。
  const onDoneRef = useRef(onTypingDone)
  onDoneRef.current = onTypingDone

  useEffect(() => {
    if (isDone) onDoneRef.current?.(messageIndex)
  }, [isDone, messageIndex])

  return (
    <div className="flex gap-2 justify-start" data-testid={`chat-msg-${messageIndex}`}>
      {/* 神兽头像 */}
      <div
        className="shrink-0 w-8 h-8 rounded-full overflow-hidden border border-acc-bronze/40 bg-bg-deep flex items-center justify-center"
        data-testid={`chat-avatar-${messageIndex}`}
      >
        {creature.image ? (
          <img
            src={creature.image}
            alt={creature.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="font-display text-sm text-acc-gold">
            {creature.name.charAt(0)}
          </span>
        )}
      </div>

      <div className="flex flex-col gap-1 max-w-[80%]">
        {/* 打字机正文 */}
        <div className="px-3 py-2 rounded-lg text-sm bg-bg-deep text-ink-muted font-display">
          {displayed}
          {!isDone && (
            <span
              data-testid="chat-typing-cursor"
              className="inline-block ml-0.5 animate-pulse text-acc-gold"
              aria-hidden="true"
            >
              ▌
            </span>
          )}
        </div>

        {/* 语音朗读按钮：打字完成后出现 */}
        {isDone && (
          <div className="flex gap-2">
            <button
              type="button"
              data-testid={`chat-voice-${messageIndex}`}
              aria-label={isSpeaking ? '停止朗读' : '朗读回复'}
              onClick={() => onToggleSpeak(messageIndex, content)}
              className={`self-start text-xs px-3 py-2 rounded border transition-colors ${
                isSpeaking
                  ? 'bg-acc-cinnabar/30 text-acc-gold-bright border-acc-cinnabar/50'
                  : 'bg-bg-deep text-ink-dan border-acc-bronze/30 hover:text-acc-gold-bright hover:border-acc-gold'
              }`}
            >
              {isSpeaking ? '⏹ 停止' : '🔊 朗读'}
            </button>
            {/* 方言朗读按钮 */}
            <button
              type="button"
              data-testid={`chat-dialect-${messageIndex}`}
              aria-label={isDialectSpeaking ? '停止方言朗读' : `${dialectLabel}朗读`}
              onClick={() => onToggleDialectSpeak(messageIndex, content)}
              className={`self-start text-xs px-3 py-2 rounded border transition-colors ${
                isDialectSpeaking
                  ? 'bg-acc-cinnabar/30 text-acc-gold-bright border-acc-cinnabar/50'
                  : 'bg-bg-deep text-ink-dan border-acc-bronze/30 hover:text-acc-gold-bright hover:border-acc-gold'
              }`}
            >
              {isDialectSpeaking ? '⏹ 停止' : `🎵 ${dialectLabel}话`}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export function CreatureChat({ creature, initialMessage }: CreatureChatProps) {
  // 开场白作为第一条 assistant 消息（仅初始化一次）
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    { role: 'assistant', content: getOpeningLine(creature) },
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isOffline, setIsOffline] = useState(false)
  const [offlineNoticeShown, setOfflineNoticeShown] = useState(false)
  /** 当前正在打字的 assistant 消息索引；为 null 表示无打字进行中。 */
  const [typingMessageIndex, setTypingMessageIndex] = useState<number | null>(null)
  /** 当前正在朗读的 assistant 消息索引；为 null 表示未朗读。 */
  const [speakingIndex, setSpeakingIndex] = useState<number | null>(null)
  /** 方言 TTS 音频元素 */
  const dialectAudioRef = useRef<HTMLAudioElement | null>(null)
  /** 当前方言朗读的消息索引 */
  const [dialectSpeakingIndex, setDialectSpeakingIndex] = useState<number | null>(null)

  const scrollRef = useRef<HTMLDivElement>(null)
  // 用 ref 同步 speakingIndex，避免 SpeechSynthesis 回调闭包读到旧值。
  const speakingIndexRef = useRef<number | null>(null)

  useEffect(() => {
    // Auto-scroll to bottom
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, typingMessageIndex])

  // 组件卸载时停止朗读
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel()
      }
      if (dialectAudioRef.current) {
        dialectAudioRef.current.pause()
        dialectAudioRef.current = null
      }
    }
  }, [])

  const handleTypingDone = useCallback((index: number) => {
    setTypingMessageIndex((prev) => (prev === index ? null : prev))
  }, [])

  /** 切换某条回复的语音朗读：再次点击同一按钮则停止。 */
  const toggleSpeak = useCallback((index: number, text: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return

    // 停止当前朗读
    window.speechSynthesis.cancel()

    // 点击正在朗读的同一按钮 → 仅停止
    if (speakingIndexRef.current === index) {
      speakingIndexRef.current = null
      setSpeakingIndex(null)
      return
    }

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'zh-CN'
    utterance.rate = 0.85
    utterance.pitch = 0.9
    utterance.onend = () => {
      if (speakingIndexRef.current === index) {
        speakingIndexRef.current = null
        setSpeakingIndex(null)
      }
    }
    utterance.onerror = () => {
      if (speakingIndexRef.current === index) {
        speakingIndexRef.current = null
        setSpeakingIndex(null)
      }
    }

    speakingIndexRef.current = index
    setSpeakingIndex(index)
    window.speechSynthesis.speak(utterance)
  }, [])

  /** 切换方言 TTS 朗读：用神兽栖息地方言朗读回复 */
  const toggleDialectSpeak = useCallback(
    async (index: number, text: string) => {
      // 停止现有朗读
      if (speakingIndexRef.current !== null) {
        window.speechSynthesis?.cancel()
        setSpeakingIndex(null)
        speakingIndexRef.current = null
      }
      if (dialectAudioRef.current) {
        dialectAudioRef.current.pause()
        dialectAudioRef.current = null
      }

      // 点击正在方言朗读的同一按钮 → 仅停止
      if (dialectSpeakingIndex === index) {
        setDialectSpeakingIndex(null)
        return
      }

      setDialectSpeakingIndex(index)
      trackEvent({ name: 'dialect_tts_play', creatureId: creature.id, province: creature.province })

      try {
        const result = await speakDialect({
          text,
          province: creature.province,
          creatureId: creature.id,
        })

        if (result.audioUrl) {
          // 有音频 URL（预生成 demo 或 DashScope 实时生成）
          dialectAudioRef.current = playAudioUrl(result.audioUrl)
          dialectAudioRef.current.onended = () => {
            setDialectSpeakingIndex(null)
            dialectAudioRef.current = null
          }
          dialectAudioRef.current.onerror = () => {
            setDialectSpeakingIndex(null)
            dialectAudioRef.current = null
          }
        } else {
          // 回退到 Web Speech API
          const stop = speakWithWebAPI(text)
          // Web Speech 没有精确的 onend 回调，用定时器模拟
          const estimatedDuration = Math.max(text.length * 120, 3000)
          setTimeout(() => {
            setDialectSpeakingIndex((prev) => (prev === index ? null : prev))
          }, estimatedDuration)
          // 保存 stop 函数到 ref 以便手动停止
          dialectAudioRef.current = { pause: stop } as unknown as HTMLAudioElement
        }
      } catch (e) {
        console.warn('[DialectTTS] 播放失败:', e)
        setDialectSpeakingIndex(null)
      }
    },
    [creature.id, creature.province, dialectSpeakingIndex]
  )

  const isTyping = typingMessageIndex !== null
  const inputDisabled = isLoading || isTyping

  const recordChat = useBondStore((s) => s.recordChat)

  const handleSend = async (text?: string) => {
    const content = text || input.trim()
    if (!content || inputDisabled) return

    const userMsg: ChatMessage = { role: 'user', content }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput('')
    setIsLoading(true)
    // 发送新消息时停止任何正在进行的朗读
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel()
    }
    speakingIndexRef.current = null
    setSpeakingIndex(null)

    // 更新羁绊：玩家主动发起对话
    recordChat(creature.id)

    // 构建羁绊与记忆上下文，注入 system prompt
    const bond = useBondStore.getState().getBond(creature.id)
    const mood = useBondStore.getState().getMood(creature.id)
    const lastGift = useBondStore.getState().getLastGift(creature.id)
    const memorySummary = buildMemoryContext(creature.id, newMessages)
    const bondContext = {
      level: bond.level,
      levelLabel: LEVEL_LABEL[bond.level],
      score: bond.score,
      chatCount: bond.chatCount,
      giftCount: bond.giftCount,
      encounterCount: bond.encounterCount,
      lastGiftLabel: lastGift ? GIFT_LABEL[lastGift.type] : undefined,
      mood,
      moodLabel: MOOD_LABEL[mood],
      memorySummary,
    }
    const systemPrompt = buildSystemPrompt(creature, bondContext)

    const fallbackContext: FallbackContext = {
      personality: detectPersonality(creature),
      level: bond.level,
      levelLabel: LEVEL_LABEL[bond.level],
      score: bond.score,
      mood,
      moodLabel: MOOD_LABEL[mood],
      lastGiftLabel: lastGift ? GIFT_LABEL[lastGift.type] : undefined,
      memorySummary,
    }

    try {
      const { content: reply, isOffline: offline } = await sendChatMessage(
        creature,
        newMessages,
        systemPrompt,
        fallbackContext
      )
      setIsOffline(offline)
      trackEvent({ name: 'chat_message_sent', creatureId: creature.id, isOffline: offline })

      const upcoming: ChatMessage[] = []
      // On the first offline reply, prepend a system notice so the user
      // understands why the answers are rule-based.
      if (offline && !offlineNoticeShown) {
        upcoming.push({ role: 'system', content: OFFLINE_NOTICE })
        setOfflineNoticeShown(true)
      }
      upcoming.push({ role: 'assistant', content: reply })
      const nextMessages = [...newMessages, ...upcoming]
      setMessages(nextMessages)
      // 最后一条即为 assistant 回复，开启打字机
      setTypingMessageIndex(nextMessages.length - 1)
    } catch {
      const fallback: ChatMessage = { role: 'assistant', content: '……（神兽沉默不语）' }
      const nextMessages = [...newMessages, fallback]
      setMessages(nextMessages)
      setTypingMessageIndex(nextMessages.length - 1)
    } finally {
      setIsLoading(false)
    }
  }

  // 自动发送初始消息（仅一次）
  // 用 ref 持有最新的 handleSend，避免将其加入 effect 依赖数组而导致
  // 闭包捕获旧的 messages / offlineNoticeShown。
  const handleSendRef = useRef(handleSend)
  handleSendRef.current = handleSend
  const hasAutoSent = useRef(false)
  useEffect(() => {
    if (initialMessage && !hasAutoSent.current) {
      hasAutoSent.current = true
      const t = setTimeout(() => handleSendRef.current(initialMessage), 800)
      return () => clearTimeout(t)
    }
  }, [initialMessage])

  // 最近一条 assistant 回复（用于追问推荐）
  const lastAssistant = [...messages].reverse().find((m) => m.role === 'assistant')
  const showFollowUps =
    !isLoading && !isTyping && !!lastAssistant && messages.some((m) => m.role === 'user')

  return (
    <div data-testid="creature-chat" className="mt-6 border border-acc-bronze/30 rounded-lg overflow-hidden bg-bg-raised">
      {/* Header */}
      <div className="px-4 py-2 bg-bg-deep border-b border-acc-bronze/30 flex items-center gap-2">
        <span className="text-acc-gold text-sm">💬</span>
        <span className="font-display text-ink-primary text-sm">与{creature.name}对话</span>
        <span
          className={`text-xs ml-auto ${isOffline ? 'text-acc-cinnabar' : 'text-ink-faint'}`}
          data-testid="chat-mode-badge"
        >
          {isOffline ? '离线模式' : '在线模式'}
        </span>
      </div>

      {/* Messages area */}
      <div
        ref={scrollRef}
        className="px-4 py-3 h-64 overflow-y-auto space-y-3"
        data-testid="chat-messages"
      >
        {messages.length === 0 && (
          <div className="text-center py-8">
            <p className="text-ink-primary text-sm mb-3">
              向{creature.name}提问，了解它的故事……
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              {SUGGESTED_QUESTIONS.map((q) => (
                <button
                  key={q}
                  onClick={() => handleSend(q)}
                  disabled={isLoading}
                  className="px-3 py-2 text-xs rounded-full bg-bg-deep text-ink-primary border border-acc-bronze/30 hover:border-acc-gold hover:text-acc-gold-bright transition-colors disabled:opacity-50"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 首次进入（仅有开场白，无用户消息）时展示快捷问题 */}
        {messages.length === 1 && messages[0]?.role === 'assistant' && !isLoading && !isTyping && (
          <div className="flex flex-wrap gap-2 justify-center pt-2" data-testid="chat-opening-followups">
            {SUGGESTED_QUESTIONS.map((q) => (
              <button
                key={q}
                onClick={() => handleSend(q)}
                className="px-3 py-2 text-xs rounded-full bg-bg-deep text-ink-primary border border-acc-bronze/30 hover:border-acc-gold hover:text-acc-gold-bright transition-colors"
              >
                {q}
              </button>
            ))}
          </div>
        )}

        {messages.map((msg, i) => {
          if (msg.role === 'system') {
            return (
              <div key={i} className="flex justify-center" data-testid={`chat-msg-${i}`}>
                <div className="max-w-[90%] text-center px-3 py-1.5 rounded text-xs text-acc-gold bg-acc-cinnabar/10 border border-acc-cinnabar/30">
                  {msg.content}
                </div>
              </div>
            )
          }
          if (msg.role === 'user') {
            return (
              <div
                key={i}
                className="flex justify-end"
                data-testid={`chat-msg-${i}`}
              >
                <div className="max-w-[80%] px-3 py-2 rounded-lg text-sm bg-acc-bronze/20 text-ink-primary">
                  {msg.content}
                </div>
              </div>
            )
          }
          return (
            <AssistantMessage
              key={i}
              messageIndex={i}
              content={msg.content}
              creature={creature}
              isSpeaking={speakingIndex === i}
              onToggleSpeak={toggleSpeak}
              onTypingDone={handleTypingDone}
              isDialectSpeaking={dialectSpeakingIndex === i}
              onToggleDialectSpeak={toggleDialectSpeak}
              dialectLabel={getDialectLabel(creature.province)}
            />
          )
        })}

        {isLoading && (
          <div className="flex justify-start" data-testid="chat-loading">
            <div className="bg-bg-deep px-3 py-2 rounded-lg text-ink-faint text-sm">
              <span className="animate-pulse">{creature.name}正在沉思</span>
              <span className="animate-pulse">……</span>
            </div>
          </div>
        )}

        {/* 上下文相关追问（每轮对话结束后展示） */}
        {showFollowUps && lastAssistant && (
          <div className="flex flex-wrap gap-2 pt-1" data-testid="chat-followups">
            {getFollowUps(lastAssistant.content).map((q) => (
              <button
                key={q}
                onClick={() => handleSend(q)}
                disabled={inputDisabled}
                className="px-3 py-2 text-xs rounded-full bg-bg-deep text-ink-primary border border-acc-bronze/30 hover:border-acc-gold hover:text-acc-gold-bright transition-colors disabled:opacity-50"
              >
                {q}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="px-3 py-2 border-t border-acc-bronze/30 flex gap-2">
        <input
          type="text"
          inputMode="text"
          enterKeyHint="send"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          onFocus={(e) => e.target.scrollIntoView({ behavior: 'smooth', block: 'center' })}
          placeholder={`向${creature.name}提问…`}
          disabled={inputDisabled}
          className="flex-1 bg-bg-deep text-ink-primary text-base px-3 py-1.5 rounded border border-acc-bronze/30 focus:border-acc-gold focus:outline-none placeholder:text-ink-faint disabled:opacity-60"
          data-testid="chat-input"
        />
        <button
          onClick={() => handleSend()}
          disabled={inputDisabled || !input.trim()}
          className="px-4 py-2.5 rounded bg-acc-cinnabar/20 text-acc-gold-bright border border-acc-cinnabar/40 hover:bg-acc-cinnabar/30 transition-colors text-sm disabled:opacity-50"
          data-testid="chat-send"
        >
          发送
        </button>
      </div>
    </div>
  )
}
