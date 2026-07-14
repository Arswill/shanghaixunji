import { useState } from 'react'
import type { Creature } from '../data/creatures.schema'
import { detectPersonality } from '../chat/chatPrompts'
import {
  useBondStore,
  type BondLevel,
  type GiftType,
  LEVEL_LABEL,
  MOOD_LABEL,
  GIFT_LABEL,
  LEVEL_THRESHOLDS,
  GIFT_PREFERENCE,
  MAX_GIFTS_PER_DAY,
} from './bondStore'
import { trackEvent } from '../analytics/analytics'

interface BondPanelProps {
  creature: Creature
}

const GIFT_TYPES: GiftType[] = ['spirit-fruit', 'ancient-jade', 'cinnabar']

/** 赠礼反馈自动消失延时（毫秒） */
const GIFT_FEEDBACK_TIMEOUT = 2500

export function BondPanel({ creature }: BondPanelProps) {
  const bond = useBondStore((s) => s.getBond(creature.id))
  const giveGift = useBondStore((s) => s.giveGift)
  const [giftFeedback, setGiftFeedback] = useState<string | null>(null)

  const nextThreshold = getNextThreshold(bond.level)
  const prevThreshold = LEVEL_THRESHOLDS[bond.level]
  const progress = nextThreshold
    ? Math.min(
        100,
        Math.max(0, ((bond.score - prevThreshold) / (nextThreshold - prevThreshold)) * 100)
      )
    : 100

  const hasInteracted = bond.lastInteraction > 0

  // 每日赠礼限次：日期变化时自动归零
  const now = new Date()
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  const giftCountToday = bond.giftGivenDate === todayStr ? bond.giftCountToday : 0
  const giftLimitReached = giftCountToday >= MAX_GIFTS_PER_DAY

  return (
    <div
      data-testid="bond-panel"
      className="p-5 rounded-xl bg-bg-raised/50 border border-acc-bronze/30 relative overflow-hidden"
    >
      {/* 呼吸光效背景 */}
      <div
        className="absolute inset-0 pointer-events-none animate-breathe opacity-30"
        style={{
          background:
            'radial-gradient(circle at 50% 0%, rgba(184,146,74,0.12) 0%, transparent 60%)',
        }}
        aria-hidden="true"
      />

      <div className="relative flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span
            data-testid="bond-level-badge"
            className="px-3 py-1 text-xs font-display tracking-widest border-2 border-acc-gold/70 text-acc-gold bg-acc-gold/10 rounded-sm transform -rotate-2 shadow-[0_0_12px_rgba(184,146,74,0.25)]"
          >
            {LEVEL_LABEL[bond.level]}
          </span>
          <span
            data-testid="bond-mood-badge"
            className={`text-xs px-2 py-0.5 rounded-full border ${moodBadgeClass(bond.mood)}`}
          >
            {MOOD_LABEL[bond.mood]}
          </span>
        </div>
        <div className="text-right">
          <div className="text-xs text-ink-faint">羁绊值</div>
          <div data-testid="bond-score" className="text-lg font-display text-acc-gold">
            {bond.score}
          </div>
        </div>
      </div>

      {/* 金色进度条 */}
      <div className="relative mb-5">
        <div className="h-2 w-full rounded-full bg-bg-deep border border-acc-bronze/30 overflow-hidden">
          <div
            data-testid="bond-progress"
            className="h-full rounded-full bg-gradient-to-r from-acc-bronze via-acc-gold to-acc-gold-bright transition-all duration-700 ease-out shadow-[0_0_10px_rgba(201,162,39,0.5)]"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex justify-between mt-1 text-[10px] text-ink-faint">
          <span>{LEVEL_LABEL[bond.level]}</span>
          <span data-testid="bond-progress-text">
            {nextThreshold ? `${bond.score} / ${nextThreshold}` : '已达共生'}
          </span>
        </div>
      </div>

      {/* 互动统计 */}
      <div className="relative grid grid-cols-3 gap-3 mb-5">
        <StatBox label="交谈" value={bond.chatCount} testId="bond-stat-chat" />
        <StatBox label="赠礼" value={bond.giftCount} testId="bond-stat-gift" />
        <StatBox label="相遇" value={bond.encounterCount} testId="bond-stat-encounter" />
      </div>

      {/* 羁绊特权 */}
      <div className="relative mb-4 p-3 rounded-lg bg-bg-deep/60 border border-acc-bronze/20">
        <p className="text-[11px] text-acc-gold mb-1.5">羁绊特权</p>
        <ul className="space-y-1 text-[11px] text-ink-muted">
          <li className={bond.level !== 'stranger' ? 'text-ink-primary' : ''}>
            {bond.level === 'stranger' ? '🔒 相识：解锁基础对话与赠礼' : '✓ 相识：基础对话与赠礼已解锁'}
          </li>
          <li className={bond.level !== 'stranger' && bond.level !== 'acquainted' ? 'text-ink-primary' : ''}>
            {bond.level === 'stranger' || bond.level === 'acquainted'
              ? '🔒 结契：解锁进阶对话语气与每日运势'
              : '✓ 结契：进阶对话语气与每日运势已解锁'}
          </li>
          <li className={bond.level === 'kindred' ? 'text-ink-primary' : ''}>
            {bond.level !== 'kindred'
              ? '🔒 共生：解锁专属羁绊星图与深度对话'
              : '✓ 共生：专属羁绊星图与深度对话已解锁'}
          </li>
        </ul>
      </div>

      {/* 赠礼 */}
      <div className="relative">
        <p className="text-xs text-ink-muted mb-2">
          赠礼以增羁绊
          <span className="ml-2 text-ink-faint">
            今日 {giftCountToday}/{MAX_GIFTS_PER_DAY}
          </span>
        </p>
        <div className="flex flex-wrap gap-2">
          {GIFT_TYPES.map((type) => (
            <button
              key={type}
              type="button"
              data-testid={`gift-btn-${type}`}
              disabled={giftLimitReached}
              onClick={() => {
                  const success = giveGift(creature.id, type)
                  if (!success) {
                    setGiftFeedback(`今日已向${creature.name}赠满 ${MAX_GIFTS_PER_DAY} 次礼，明日再来。`)
                    setTimeout(() => setGiftFeedback(null), GIFT_FEEDBACK_TIMEOUT)
                    return
                  }
                  trackEvent({ name: 'gift_given', creatureId: creature.id, giftType: type })
                  const personality = detectPersonality(creature)
                  const preferred = GIFT_PREFERENCE[personality]
                  if (type === preferred) {
                    setGiftFeedback(`${creature.name}对${GIFT_LABEL[type]}甚是喜爱，羁绊大涨。`)
                  } else {
                    setGiftFeedback(`${creature.name}收下了${GIFT_LABEL[type]}，虽未至喜爱，亦领你心意。`)
                  }
                  setTimeout(() => setGiftFeedback(null), GIFT_FEEDBACK_TIMEOUT)
                }}
              className="px-3 py-1.5 text-xs rounded border border-acc-bronze/40 bg-bg-deep text-ink-muted hover:border-acc-gold hover:text-acc-gold transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-acc-bronze/40 disabled:hover:text-ink-muted"
            >
              {GIFT_LABEL[type]}
            </button>
          ))}
        </div>
        {giftLimitReached && (
          <p className="mt-2 text-xs text-ink-faint" data-testid="gift-limit-reached">
            今日已赠满，明日再来。
          </p>
        )}
        {giftFeedback && (
          <p className="mt-2 text-xs text-acc-gold animate-pulse">{giftFeedback}</p>
        )}
      </div>

      {!hasInteracted && (
        <p className="relative mt-4 text-center text-xs text-ink-faint">
          与 {creature.name} 交谈或赠礼，开启你们的羁绊。
        </p>
      )}
    </div>
  )
}

function getNextThreshold(level: BondLevel): number | null {
  const order: BondLevel[] = ['stranger', 'acquainted', 'bonded', 'kindred']
  const idx = order.indexOf(level)
  return idx < order.length - 1 ? LEVEL_THRESHOLDS[order[idx + 1]] : null
}

function moodBadgeClass(mood: string): string {
  switch (mood) {
    case 'joyful':
      return 'border-acc-gold/60 text-acc-gold bg-acc-gold/10'
    case 'wary':
      return 'border-acc-cinnabar/60 text-acc-cinnabar bg-acc-cinnabar/10'
    case 'listless':
      return 'border-ink-muted/60 text-ink-muted bg-ink-muted/10'
    default:
      return 'border-acc-jade/60 text-acc-jade bg-acc-jade/10'
  }
}

function StatBox({
  label,
  value,
  testId,
}: {
  label: string
  value: number
  testId?: string
}) {
  return (
    <div className="text-center p-2 rounded bg-bg-deep/60 border border-acc-bronze/20">
      <div data-testid={testId} className="text-lg font-display text-ink-primary">
        {value}
      </div>
      <div className="text-[10px] text-ink-faint">{label}</div>
    </div>
  )
}
