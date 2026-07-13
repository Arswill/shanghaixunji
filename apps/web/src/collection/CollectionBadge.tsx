import { useCollection } from './useCollection'
import { creatures } from '../data/loadCreatures'
import { useViewStore } from '../app/useViewStore'

export function CollectionBadge() {
  const count = useCollection((s) => s.discovered.length)
  const total = creatures.length
  const goBestiary = useViewStore((s) => s.goBestiary)

  return (
    <button
      data-testid="collection-badge"
      onClick={goBestiary}
      className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-bg-raised border border-acc-bronze/40 hover:border-acc-gold transition-colors"
    >
      <span className="text-acc-gold text-sm">📕</span>
      <span className="text-ink-primary text-xs font-display">
        {count}<span className="text-ink-faint">/{total}</span>
      </span>
    </button>
  )
}
