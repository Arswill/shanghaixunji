import { create } from 'zustand'

export type View = 'home' | 'province' | 'detail' | 'bestiary' | 'guardian'

interface ViewState {
  view: View
  provinceId: string | null
  creatureId: string | null
  initialMessage?: string
  goHome: () => void
  goProvince: (province: string) => void
  goCreature: (creatureId: string) => void
  goBestiary: () => void
  goGuardian: () => void
  setInitialMessage: (msg: string | undefined) => void
}

export const useViewStore = create<ViewState>((set) => ({
  view: 'home',
  provinceId: null,
  creatureId: null,
  initialMessage: undefined,
  goHome: () => set({ view: 'home', provinceId: null, creatureId: null }),
  goProvince: (province) => set({ view: 'province', provinceId: province, creatureId: null }),
  goCreature: (creatureId) => set({ view: 'detail', creatureId }),
  goBestiary: () => set({ view: 'bestiary', provinceId: null, creatureId: null }),
  goGuardian: () => set({ view: 'guardian', provinceId: null, creatureId: null }),
  setInitialMessage: (msg) => set({ initialMessage: msg }),
}))
