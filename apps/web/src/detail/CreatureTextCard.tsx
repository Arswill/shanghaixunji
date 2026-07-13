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
    <div>
      {/* Tab buttons */}
      <div className="flex flex-wrap gap-2 mb-3 border-b border-acc-bronze/30 pb-2">
        {tabs.map((tab) => {
          const locked = tab.requiredStage > stage
          return (
            <button
              key={tab.id}
              onClick={() => !locked && setActiveTab(tab.id)}
              disabled={locked}
              className={`px-3 py-1 text-sm rounded transition-colors ${
                activeTab === tab.id
                  ? 'bg-acc-cinnabar/20 text-acc-gold border border-acc-cinnabar/50'
                  : locked
                    ? 'text-ink-faint/50 cursor-not-allowed border border-transparent'
                    : 'text-ink-muted hover:text-ink-primary border border-transparent'
              }`}
            >
              {tab.label}
              {locked && ' 🔒'}
            </button>
          )
        })}
      </div>

      {/* Active tab content */}
      <div className="min-h-[120px]">
        {activeContent && !isLocked && (
          <div>
            <p className="text-ink-primary leading-relaxed font-display">
              {activeContent.content}
            </p>
            {activeContent.sub && (
              <p className="text-ink-faint text-xs mt-2">{activeContent.sub}</p>
            )}
            {activeTab === 'location' && (
              <span className={`inline-block mt-2 text-xs px-2 py-0.5 rounded ${
                creature.confidence === 'high' ? 'bg-acc-jade/20 text-acc-jade' :
                creature.confidence === 'medium' ? 'bg-acc-bronze/20 text-acc-bronze' :
                'bg-ink-faint/20 text-ink-faint'
              }`}>
                {creature.confidence === 'high' ? '高置信度' : creature.confidence === 'medium' ? '中置信度' : '创意附会'}
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
