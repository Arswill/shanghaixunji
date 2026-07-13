import { useMemo } from 'react'
import { useSolarTerm } from './useSolarTerm'
import { useSolarQuest } from './useSolarQuest'
import { useSolarQuestStore } from './solarQuestStore'

interface SolarTermBannerProps {
  /** 用于测试的固定日期；不传则使用当前时间 */
  date?: Date
}

/**
 * 节气限时事件横幅。
 *
 * 展示当前节气、事件标题、下一个节气倒计时、任务链进度。
 * 任务完成条件由玩家的真实行为（探索、遭遇、收集）自动判定，
 * 全部完成后显示「节气印」装饰并可领取限时奖励。
 */
export function SolarTermBanner({ date }: SolarTermBannerProps) {
  const { currentTerm, nextTerm, daysUntilNext } = useSolarTerm(date)
  const questCompleted = useSolarQuest(currentTerm)
  const rewardClaimed = useSolarQuestStore((s) => !!s.claimedTerms[currentTerm.name])
  const claimReward = useSolarQuestStore((s) => s.claimReward)

  const allComplete = useMemo(
    () => questCompleted.length === 3 && questCompleted.every(Boolean),
    [questCompleted],
  )
  const completedCount = useMemo(
    () => questCompleted.filter(Boolean).length,
    [questCompleted],
  )

  return (
    <div
      data-testid="solar-term-banner"
      className="relative rounded-xl border border-acc-gold/40 bg-bg-deep/80 overflow-hidden p-2.5"
      style={{
        backgroundImage:
          'linear-gradient(135deg, rgba(184,146,74,0.10), rgba(122,90,138,0.06), transparent)',
      }}
    >
      {/* 顶部：标题 + 倒计时 */}
      <div className="flex items-center gap-1.5 border-b border-acc-bronze/20 pb-1 mb-1">
        <span className="text-base shrink-0" aria-hidden>
          🌗
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-display text-xs text-acc-gold truncate" data-testid="solar-term-title">
            {currentTerm.eventTitle}
          </p>
          <p className="text-[10px] text-ink-muted truncate">
            今日 {currentTerm.name} · {currentTerm.creatureName}出没
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-[10px] text-ink-faint">距离 {nextTerm.name}</p>
          <p className="font-display text-xs text-acc-gold">{daysUntilNext} 天</p>
        </div>
      </div>

      {/* 事件描述 + 任务链 */}
      <div className="space-y-0.5">
        <p className="text-[10px] text-ink-primary leading-tight">
          {currentTerm.eventDescription}
        </p>

        <div className="space-y-0.5">
          <div className="flex items-center justify-between text-[10px] text-ink-muted">
            <span>限时任务</span>
            <span>
              {completedCount}/{currentTerm.quest.length}
            </span>
          </div>
          <div className="h-1 bg-bg-base rounded-full overflow-hidden border border-acc-bronze/20">
            <div
              className="h-full bg-gradient-to-r from-acc-bronze to-acc-gold transition-all duration-500"
              style={{
                width: `${(completedCount / currentTerm.quest.length) * 100}%`,
              }}
            />
          </div>
          <div className="flex flex-wrap gap-x-2 text-[10px] text-ink-muted leading-tight">
            {currentTerm.quest.map((step, index) => {
              const done = questCompleted[index]
              return (
                <span
                  key={step.title}
                  data-testid={`solar-quest-step-${index}`}
                  className={`${
                    done ? 'text-acc-gold' : 'text-ink-muted'
                  }`}
                >
                  <span className="font-display mr-0.5">
                    {done ? '✓' : `${index + 1}.`}
                  </span>
                  <span className={done ? 'line-through opacity-80' : ''}>
                    {step.title}
                  </span>
                </span>
              )
            })}
          </div>
        </div>

        {/* 奖励领取 */}
        {allComplete && !rewardClaimed && (
          <button
            type="button"
            data-testid="solar-reward-claim"
            onClick={() => claimReward(currentTerm.name, currentTerm.creatureIds)}
            className="w-full py-1 rounded border border-acc-gold/60 bg-acc-gold/10 text-acc-gold text-[10px] hover:bg-acc-gold/20 transition-colors leading-tight"
          >
            领取节气奖励：羁绊加成 + 限时头像框
          </button>
        )}
        {allComplete && rewardClaimed && (
          <p className="text-center text-acc-gold text-[10px]" data-testid="solar-reward-claimed">
            奖励已领取
          </p>
        )}
      </div>

      {/* 节气印装饰：全部完成后显示 */}
      {allComplete && (
        <div
          data-testid="solar-term-seal"
          className="absolute top-1.5 right-1.5 pointer-events-none animate-seal-stamp"
          style={{
            width: '32px',
            height: '32px',
            border: '1.5px solid rgba(184,146,74,0.85)',
            borderRadius: '3px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'rgba(184,146,74,0.9)',
            transform: 'rotate(-6deg)',
            opacity: 0.85,
          }}
        >
          <span className="font-display text-[8px] leading-none text-center">
            节气<br />印
          </span>
        </div>
      )}
    </div>
  )
}
