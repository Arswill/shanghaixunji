import { useState, useMemo } from 'react'
import type { CreatureWithAssets } from '../data/loadCreatures'
import { useCollection } from '../collection/useCollection'
import { SHARE_TEMPLATE_LABELS, getBondDimensions, type ShareTemplateType } from './shareTemplates'
import { useBondStore } from '../bond/bondStore'
import { getEvolutionStage } from '../collection/evolution'
import { EncounterShareCard } from './EncounterShareCard'
import { BondStarChart } from './BondStarChart'
import { ScrollShareCard } from './ScrollShareCard'

interface ShareCardProps {
  creature: CreatureWithAssets
}

const TEMPLATE_TYPES: ShareTemplateType[] = ['encounter', 'bond', 'scroll']

export function ShareCard({ creature }: ShareCardProps) {
  const [template, setTemplate] = useState<ShareTemplateType>('encounter')
  const collectedCreatureIds = useCollection((s) => s.discovered)
  const collectedCount = useMemo(() => collectedCreatureIds.length, [collectedCreatureIds])

  const bond = useBondStore((s) => s.getBond(creature.id))
  const evolutionStage = useMemo(
    () => getEvolutionStage(creature.id, collectedCreatureIds),
    [creature.id, collectedCreatureIds],
  )
  const bondDimensions = useMemo(
    () => getBondDimensions(creature, bond, evolutionStage),
    [creature, bond, evolutionStage],
  )

  return (
    <div className="space-y-4" data-testid="share-card">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-ink-primary text-sm">分享模板：</span>
        {TEMPLATE_TYPES.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTemplate(t)}
            data-testid={`share-template-${t}`}
            className={`px-3 py-2.5 text-sm rounded border transition-colors ${
              template === t
                ? 'bg-acc-cinnabar/20 text-acc-gold-bright border-acc-cinnabar/50'
                : 'bg-bg-deep/70 text-ink-primary border-acc-bronze/30 hover:border-acc-gold hover:text-acc-gold-bright'
            }`}
          >
            {SHARE_TEMPLATE_LABELS[t]}
          </button>
        ))}
      </div>

      {template === 'encounter' && (
        <EncounterShareCard
          creature={creature}
          collectedCount={collectedCount}
          collectNumber={collectedCreatureIds.indexOf(creature.id) + 1 || undefined}
        />
      )}
      {template === 'bond' && <BondStarChart creature={creature} dimensions={bondDimensions} />}
      {template === 'scroll' && (
        <ScrollShareCard creature={creature} collectedCreatureIds={collectedCreatureIds} />
      )}
    </div>
  )
}
