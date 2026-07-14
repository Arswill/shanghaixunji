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
    <section className="px-4 sm:px-6 py-8 max-w-5xl mx-auto">
      {/* 顶部金色分割线 */}
      <div className="flex items-center gap-3 mb-5">
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-immortal-gold/30 to-immortal-gold/50" />
        <span className="text-[9px] text-ink-faint tracking-[0.2em] font-display whitespace-nowrap">
          RELATED IMMORTAL BEASTS
        </span>
        <div className="flex-1 h-px bg-gradient-to-l from-transparent via-immortal-gold/30 to-immortal-gold/50" />
      </div>
      <div className="flex items-center justify-center gap-3 mb-5">
        <span className="ink-divider w-10" />
        <h3 className="font-display text-lg text-ink-heaven tracking-[0.25em]">同门仙友</h3>
        <span className="ink-divider w-10" />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {relatedCreatures.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => goCreature(c.id)}
            className="group relative overflow-hidden rounded-xl celestial-card hover:!border-cinnabar/50 transition-all duration-300 text-left"
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
              <div className="absolute inset-0 bg-gradient-to-t from-celestial-jade/80 via-transparent to-transparent" />
            </div>
            <div className="p-2.5">
              <p className="font-brush text-ink-heaven text-base truncate group-hover:text-cinnabar-bright transition-colors">
                {c.name}
              </p>
              <p className="text-ink-dan text-[10px] truncate font-display tracking-wider">{c.province}</p>
            </div>
          </button>
        ))}
      </div>
    </section>
  )
}
