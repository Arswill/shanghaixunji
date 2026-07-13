import {
  EVOLUTION_CONFIG,
  type EvolutionStage,
} from '../collection/evolution'

interface EvolutionLockCardProps {
  stage: EvolutionStage
  requiredStage: EvolutionStage
  untilNext: number
  title: string
  children: React.ReactNode
}

export function EvolutionLockCard({ stage, requiredStage, untilNext, title, children }: EvolutionLockCardProps) {
  const locked = stage < requiredStage
  const labels: Record<EvolutionStage, string> = {
    1: '一阶·原文形态',
    2: '二阶·白话形态',
    3: '三阶·考证形态',
  }
  return (
    <div className="relative p-5 rounded-xl celestial-card overflow-hidden">
      <h4 className="text-immortal-gold text-sm mb-3 flex items-center gap-2 font-display tracking-wider">
        <span className="text-cinnabar">✦</span>
        {title}
        {locked && <span className="text-ink-faint/60 text-xs ml-auto">🔒 未启</span>}
      </h4>
      {locked ? (
        <div className="text-center py-8">
          <p className="text-ink-dan text-sm font-display mb-1">
            需进化至「{labels[requiredStage]}」解锁
          </p>
          {untilNext > 0 && (
            <p className="text-ink-faint text-xs mt-1">
              再发现并收录 <span className="text-immortal-gold">{untilNext}</span> 只同卷神兽即可进阶
            </p>
          )}
        </div>
      ) : (
        children
      )}
    </div>
  )
}

export function EvolutionProgress({ stage, untilNext }: { stage: EvolutionStage; untilNext: number }) {
  const config = EVOLUTION_CONFIG[stage]
  return (
    <div className="relative p-5 rounded-xl celestial-card overflow-hidden">
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xl">{config.icon}</span>
          <span className="font-display text-ink-heaven text-sm tracking-wider">{config.name}</span>
          <span className="text-ink-dan text-xs">{config.description}</span>
        </div>
        <span className="text-immortal-gold text-xs font-display tracking-wider">
          {untilNext > 0 ? `再收录 ${untilNext} 只进阶` : '✦ 已达最高形态 ✦'}
        </span>
      </div>
      <div className="h-1.5 bg-celestial-paper rounded-full overflow-hidden border border-immortal-gold/30">
        <div
          className="h-full bg-gradient-to-r from-immortal-gold-deep via-immortal-gold to-immortal-gold-bright transition-all duration-700"
          style={{ width: stage === 3 ? '100%' : stage === 2 ? '66%' : '33%' }}
        />
      </div>
    </div>
  )
}
