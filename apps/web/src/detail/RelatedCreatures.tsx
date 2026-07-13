import { useMemo } from 'react'
import { creatures, type CreatureWithAssets } from '../data/loadCreatures'
import type { EvolutionStage } from '../collection/evolution'

/**
 * 关系网络：同省/同卷的其他神兽
 */
export function getRelatedCreatures(creature: CreatureWithAssets, limit = 6): CreatureWithAssets[] {
  const scored = creatures
    .filter((c) => c.id !== creature.id)
    .map((c) => {
      let score = 0
      if (c.province === creature.province) score += 2
      if (c.scroll === creature.scroll) score += 1
      return { creature: c, score }
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)

  return scored.slice(0, limit).map((item) => item.creature)
}

interface RelatedCreaturesProps {
  creature: CreatureWithAssets
  evolutionStage: EvolutionStage
  goCreature: (id: string) => void
}

export function RelatedCreatures({ creature, evolutionStage, goCreature }: RelatedCreaturesProps) {
  const relatedCreatures = useMemo(
    () => getRelatedCreatures(creature, 6),
    [creature]
  )

  if (evolutionStage < 2) return null
  if (relatedCreatures.length === 0) {
    return <p className="text-sm text-acc-bronze/40">暂无关联神兽记载</p>
  }

  return (
    <section className="px-4 sm:px-6 py-10 border-t border-immortal-gold/20 max-w-5xl mx-auto">
      <div className="flex items-center justify-center gap-3 mb-6">
        <span className="ink-divider w-12" />
        <h3 className="font-display text-xl text-ink-heaven tracking-[0.3em]">同门仙友</h3>
        <span className="ink-divider w-12" />
      </div>
      <p className="text-center text-ink-faint text-[10px] tracking-widest mb-6 font-display">
        RELATED IMMORTAL BEASTS
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {relatedCreatures.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => goCreature(c.id)}
            className="group relative overflow-hidden rounded-xl celestial-card hover:!border-cinnabar transition-all duration-300 text-left"
          >
            <div className="aspect-square overflow-hidden relative">
              {c.image ? (
                <img
                  src={c.image}
                  alt=""
                  aria-hidden="true"
                  role="presentation"
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-celestial-paper text-cinnabar font-brush text-2xl">
                  {c.name.charAt(0)}
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-ink-heaven/40 to-transparent" />
            </div>
            <div className="p-2.5">
              <p className="font-brush text-ink-heaven text-base truncate group-hover:text-cinnabar transition-colors">
                {c.name}
              </p>
              <p className="text-ink-dan text-[10px] truncate font-display">{c.province}</p>
            </div>
          </button>
        ))}
      </div>
    </section>
  )
}
