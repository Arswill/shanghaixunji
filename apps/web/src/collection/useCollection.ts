import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface CollectionState {
  discovered: string[]  // creature IDs
  discover: (creatureId: string) => boolean  // returns true if new discovery
  isDiscovered: (creatureId: string) => boolean
  reset: () => void
  discoveredCount: () => number
}

export const useCollection = create<CollectionState>()(
  persist(
    (set, get) => ({
      discovered: [],
      discover: (creatureId: string) => {
        const state = get()
        if (state.discovered.includes(creatureId)) return false
        set({ discovered: [...state.discovered, creatureId] })
        return true
      },
      isDiscovered: (creatureId: string) => get().discovered.includes(creatureId),
      reset: () => set({ discovered: [] }),
      discoveredCount: () => get().discovered.length,
    }),
    { name: 'shanhai-collection' }  // localStorage key
  )
)

// Navigation helper for the bestiary view. The actual view wiring happens in
// AppShell during the integration phase (the view store is owned by another
// module); this keeps CollectionBadge decoupled from useViewStore.
export function navigateToBestiary() {
  // This will be wired up in AppShell integration
  window.location.hash = '#/bestiary'
}
