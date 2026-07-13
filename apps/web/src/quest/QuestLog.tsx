import { useEffect } from 'react'
import { useQuestStore } from './questStore'
import { useSolarTerm } from '../collection/useSolarTerm'
import { useSolarQuest } from '../collection/useSolarQuest'
import { useCollection } from '../collection/useCollection'
import { useGuardianStore } from '../guardian/guardianStore'

interface QuestLogProps {
  className?: string
}

/**
 * 任务日志：合并展示「主线任务」与「当前节气任务」。
 *
 * 主线任务来自 useQuestStore（真正的 Zustand store），展示进度 / 完成状态 / 奖励领取。
 * 节气任务来自 useSolarQuest，展示当前节气 3 步任务的完成情况。
 */
export function QuestLog({ className }: QuestLogProps) {
  const quests = useQuestStore((s) => s.quests)
  const claimReward = useQuestStore((s) => s.claimReward)
  const recomputeProgress = useQuestStore((s) => s.recomputeProgress)

  // 订阅触发源状态，变化时重新计算任务进度
  const discovered = useCollection((s) => s.discovered)
  const guardianId = useGuardianStore((s) => s.guardianId)

  const { currentTerm } = useSolarTerm(new Date())
  const solarCompleted = useSolarQuest(currentTerm)

  useEffect(() => {
    recomputeProgress()
  }, [recomputeProgress, discovered, guardianId])

  const completedCount = quests.filter((q) => q.completed).length

  return (
    <div
      data-testid="quest-log"
      className={`rounded-lg border border-acc-bronze/30 bg-bg-deep/60 p-4 ${className ?? ''}`}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-acc-gold">山海任务录</h3>
        <span className="text-xs text-ink-faint">
          {completedCount}/{quests.length}
        </span>
      </div>

      {/* 主线任务 */}
      <div className="space-y-2 mb-4">
        <p className="text-xs text-ink-muted">主线任务</p>
        {quests.map((quest) => (
          <div
            key={quest.id}
            data-testid={`quest-${quest.id}`}
            className={`rounded border px-3 py-2 text-xs transition-colors ${
              quest.completed
                ? 'border-acc-gold/40 bg-acc-gold/5'
                : 'border-ink-faint/20 bg-bg-deep/40'
            }`}
          >
            <div className="flex items-center justify-between">
              <span
                className={`font-medium ${
                  quest.completed ? 'text-acc-gold' : 'text-ink-muted'
                }`}
              >
                {quest.completed ? '✓ ' : ''}
                {quest.title}
              </span>
              <span className="text-ink-faint">
                {quest.progress}/{quest.target}
              </span>
            </div>
            <p className="mt-1 text-ink-faint leading-relaxed">{quest.description}</p>
            <div className="mt-1 flex items-center justify-between">
              <span className="text-ink-faint">
                触发：{quest.trigger} · 奖励：{quest.reward.description}
              </span>
              {quest.completed && !quest.rewardClaimed && (
                <button
                  type="button"
                  data-testid={`quest-claim-${quest.id}`}
                  onClick={() => claimReward(quest.id)}
                  className="ml-2 shrink-0 rounded border border-acc-gold/50 px-2 py-0.5 text-acc-gold hover:bg-acc-gold/10"
                >
                  领取奖励
                </button>
              )}
              {quest.rewardClaimed && (
                <span className="ml-2 shrink-0 text-ink-faint">已领取</span>
              )}
            </div>
            {/* 进度条 */}
            <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-bg-deep">
              <div
                className="h-full rounded-full bg-acc-gold/60 transition-all"
                style={{
                  width: `${quest.target > 0 ? Math.min(100, (quest.progress / quest.target) * 100) : 0}%`,
                }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* 节气任务 */}
      <div className="space-y-2">
        <p className="text-xs text-ink-muted">
          节气任务 · <span className="text-acc-gold">{currentTerm.name}</span>
        </p>
        {currentTerm.quest.map((step, index) => (
          <div
            key={index}
            data-testid={`solar-quest-step-${index}`}
            className={`flex items-start gap-2 rounded border px-3 py-2 text-xs ${
              solarCompleted[index]
                ? 'border-acc-gold/40 bg-acc-gold/5'
                : 'border-ink-faint/20 bg-bg-deep/40'
            }`}
          >
            <span className={solarCompleted[index] ? 'text-acc-gold' : 'text-ink-faint'}>
              {solarCompleted[index] ? '✓' : '…'}
            </span>
            <div>
              <p className="text-ink-muted">{step.title}</p>
              <p className="text-ink-faint leading-relaxed">{step.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
