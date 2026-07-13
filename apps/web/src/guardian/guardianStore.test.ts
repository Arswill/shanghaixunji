import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { useGuardianStore } from './guardianStore'

describe('useGuardianStore', () => {
  beforeEach(() => {
    useGuardianStore.getState().reset()
    localStorage.clear()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('setGuardian 设置 guardianId / province / assignedAt', () => {
    vi.setSystemTime(new Date('2026-06-27T10:00:00Z'))
    useGuardianStore.getState().setGuardian('bi-fang', '湖南')

    const state = useGuardianStore.getState()
    expect(state.guardianId).toBe('bi-fang')
    expect(state.province).toBe('湖南')
    expect(state.assignedAt).toBe(Date.now())
    // setGuardian 同时重置运势计数
    expect(state.fortuneCount).toBe(0)
    expect(state.lastFortuneAt).toBe(0)
  })

  it('rerollGuardian 更新 guardianId 与 assignedAt，且保留 province（B2-25 修复）', () => {
    vi.setSystemTime(new Date('2026-06-27T10:00:00Z'))
    useGuardianStore.getState().setGuardian('bi-fang', '湖南')
    const firstAssignedAt = useGuardianStore.getState().assignedAt
    expect(firstAssignedAt).toBeGreaterThan(0)

    // 推进时间后再 reroll
    vi.setSystemTime(new Date('2026-06-28T10:00:00Z'))
    useGuardianStore.getState().rerollGuardian('jiu-wei-hu')

    const state = useGuardianStore.getState()
    expect(state.guardianId).toBe('jiu-wei-hu')
    expect(state.assignedAt).toBe(Date.now())
    expect(state.assignedAt).toBeGreaterThan(firstAssignedAt)
    // reroll 不应清空 province（B2-25：仅更新 guardianId 与 assignedAt）
    expect(state.province).toBe('湖南')
  })

  it('rerollGuardian 不重置已累积的运势计数', () => {
    vi.setSystemTime(new Date('2026-06-27T10:00:00Z'))
    useGuardianStore.getState().setGuardian('bi-fang', '湖南')
    useGuardianStore.getState().consultFortune()
    useGuardianStore.getState().consultFortune()
    expect(useGuardianStore.getState().fortuneCount).toBe(2)

    useGuardianStore.getState().rerollGuardian('jiu-wei-hu')
    // reroll 只改 guardianId/assignedAt，运势计数应保留
    expect(useGuardianStore.getState().fortuneCount).toBe(2)
  })

  it('reset 清空所有状态', () => {
    vi.setSystemTime(new Date('2026-06-27T10:00:00Z'))
    useGuardianStore.getState().setGuardian('bi-fang', '湖南')
    useGuardianStore.getState().consultFortune()

    useGuardianStore.getState().reset()

    const state = useGuardianStore.getState()
    expect(state.guardianId).toBeNull()
    expect(state.province).toBeNull()
    expect(state.assignedAt).toBe(0)
    expect(state.fortuneCount).toBe(0)
    expect(state.lastFortuneAt).toBe(0)
  })
})
