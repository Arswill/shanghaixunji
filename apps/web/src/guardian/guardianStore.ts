import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface GuardianState {
  /** Selected guardian creature id */
  guardianId: string | null
  /** Province used to pick the guardian */
  province: string | null
  /** Timestamp of the day the guardian was assigned (used for daily fortune) */
  assignedAt: number
  /** Number of times the user has consulted the daily fortune */
  fortuneCount: number
  /** Last consulted timestamp */
  lastFortuneAt: number
  setGuardian: (creatureId: string, province: string) => void
  rerollGuardian: (creatureId: string) => void
  consultFortune: () => void
  reset: () => void
}

export const useGuardianStore = create<GuardianState>()(
  persist(
    (set) => ({
      guardianId: null,
      province: null,
      assignedAt: 0,
      fortuneCount: 0,
      lastFortuneAt: 0,
      setGuardian: (creatureId, province) =>
        set({
          guardianId: creatureId,
          province,
          assignedAt: Date.now(),
          fortuneCount: 0,
          lastFortuneAt: 0,
        }),
      rerollGuardian: (creatureId) =>
        set({ guardianId: creatureId, assignedAt: Date.now() }),
      consultFortune: () =>
        set((state) => ({
          fortuneCount: state.fortuneCount + 1,
          lastFortuneAt: Date.now(),
        })),
      reset: () =>
        set({
          guardianId: null,
          province: null,
          assignedAt: 0,
          fortuneCount: 0,
          lastFortuneAt: 0,
        }),
    }),
    { name: 'shanhai-guardian' }
  )
)

export function isSameDay(a: number, b: number): boolean {
  const da = new Date(a)
  const db = new Date(b)
  return (
    da.getFullYear() === db.getFullYear() &&
    da.getMonth() === db.getMonth() &&
    da.getDate() === db.getDate()
  )
}
