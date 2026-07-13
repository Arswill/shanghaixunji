import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useTypewriter } from './useTypewriter'

describe('useTypewriter', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('starts empty and types over time', () => {
    const { result } = renderHook(() => useTypewriter('abc', 50, 0))
    expect(result.current.displayed).toBe('')
    expect(result.current.isDone).toBe(false)

    // startDelay=0 fires the first character immediately. Stepping one timer
    // at a time (via advanceTimersToNextTimer) lets us assert each character
    // appears in sequence. A final empty iteration flips isDone once every
    // character has been displayed.
    act(() => { vi.advanceTimersToNextTimer() })
    expect(result.current.displayed).toBe('a')

    act(() => { vi.advanceTimersToNextTimer() })
    expect(result.current.displayed).toBe('ab')

    act(() => { vi.advanceTimersToNextTimer() })
    expect(result.current.displayed).toBe('abc')

    act(() => { vi.advanceTimersToNextTimer() })
    expect(result.current.isDone).toBe(true)
  })

  it('skip shows full text immediately', () => {
    const { result } = renderHook(() => useTypewriter('hello', 50, 0))
    act(() => { result.current.skip() })
    expect(result.current.displayed).toBe('hello')
    expect(result.current.isDone).toBe(true)
  })
})
