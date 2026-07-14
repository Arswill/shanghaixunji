import { useState } from 'react'
import type { Creature } from '../data/creatures.schema'
import type { EvolutionStage } from '../collection/evolution'

interface CreatureTextCardProps {
  creature: Creature
  stage?: EvolutionStage
  untilNext?: number
}

interface TabDef {
  id: 'original' | 'translation' | 'location' | 'lore'
  label: string
  content: string
  sub?: string
  requiredStage: EvolutionStage
}

export function CreatureTextCard({ creature, stage = 1, untilNext = 0 }: CreatureTextCardProps) {
  const [activeTab, setActiveTab] = useState<'original' | 'translation' | 'location' | 'lore'>('original')

  const tabs: TabDef[] = [
    { id: 'original', label: '古籍原文', content: creature.original_text, sub: creature.source, requiredStage: 1 },
    { id: 'translation', label: '白话译义', content: creature.translation, requiredStage: 2 },
    { id: 'location', label: '今地考证', content: creature.modern_location, sub: creature.confidence_notes, requiredStage: 3 },
    { id: 'lore', label: '神兽志略', content: creature.description, requiredStage: 2 },
  ]

  const activeContent = tabs.find((t) => t.id === activeTab)
  const isLocked = activeContent ? activeContent.requiredStage > stage : false

  return (
    <div className="celestial-card p-5 sm:p-6">
      {/* Tab buttons */}
      <div className="flex flex-wrap gap-1.5 mb-4 pb-3 border-b border-acc-bronze/20">
        {tabs.map((tab) => {
          const locked = tab.requiredStage > stage
          return (
            <button
              key={tab.id}
              onClick={() => !locked && setActiveTab(tab.id)}
              disabled={locked}
              className={`px-3 py-1.5 text-xs rounded-lg transition-all font-display tracking-wider ${
                activeTab === tab.id
                  ? 'bg-cinnabar/15 text-immortal-gold-bright border border-cinnabar/40 shadow-sm'
                  : locked
                    ? 'text-ink-faint/40 cursor-not-allowed border border-transparent'
                    : 'text-ink-dan hover:text-ink-heaven border border-transparent hover:bg-celestial-fog/40'
              }`}
            >
              {tab.label}
              {locked && ' 🔒'}
            </button>
          )
        })}
      </div>

      {/* Active tab content */}
      <div className="min-h-[100px]">
        {activeContent && !isLocked && (
          <div>
            <p className="text-ink-heaven leading-[1.9] font-display text-[15px]">
              {activeContent.content}
            </p>
            {activeContent.sub && (
              <p className="text-ink-faint text-xs mt-3 italic border-l-2 border-immortal-gold/20 pl-3">
                {activeContent.sub}
              </p>
            )}
            {activeTab === 'location' && (
              <span className={`inline-block mt-3 text-xs px-2.5 py-1 rounded-md font-display ${
                creature.confidence === 'high' ? 'bg-jade-cui/15 text-jade-cui-light border border-jade-cui/30' :
                creature.confidence === 'medium' ? 'bg-immortal-gold/15 text-immortal-gold-bright border border-immortal-gold/30' :
                'bg-ink-faint/15 text-ink-dan border border-ink-faint/30'
              }`}>
                {creature.confidence === 'high' ? '✦ 高置信度' : creature.confidence === 'medium' ? '✦ 中置信度' : '✦ 创意附会'}
              </span>
            )}
          </div>
        )}
        {activeContent && isLocked && (
          <LockedMessage stage={stage} untilNext={untilNext} requiredStage={activeContent.requiredStage} />
        )}
      </div>
    </div>
  )
}

function LockedMessage({
  stage,
  untilNext,
  requiredStage,
}: {
  stage: EvolutionStage
  untilNext: number
  requiredStage: EvolutionStage
}) {
  const labels: Record<EvolutionStage, string> = {
    1: '一阶·原文形态',
    2: '二阶·白话形态',
    3: '三阶·考证形态',
  }
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center border border-dashed border-acc-bronze/30 rounded-lg bg-bg-deep/40">
      <span className="text-2xl mb-2">🔒</span>
      <p className="text-ink-muted font-display text-sm mb-1">
        该内容需进化至「{labels[requiredStage]}」后解锁
      </p>
      {untilNext > 0 && stage < requiredStage && (
        <p className="text-ink-faint text-xs">
          再发现并收录 {untilNext} 只同卷神兽即可进阶
        </p>
      )}
    </div>
  )
}
