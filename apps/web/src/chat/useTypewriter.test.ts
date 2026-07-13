import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useTypewriter } from './useTypewriter'

describe('useTypewriter (chat)', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('starts empty and types one character per tick', () => {
    const { result } = renderHook(() => useTypewriter('abc', 50))
    expect(result.current.displayed).toBe('')
    expect(result.current.isDone).toBe(false)

    act(() => {
      vi.advanceTimersToNextTimer()
    })
    expect(result.current.displayed).toBe('a')

    act(() => {
      vi.advanceTimersToNextTimer()
    })
    expect(result.current.displayed).toBe('ab')

    act(() => {
      vi.advanceTimersToNextTimer()
    })
    expect(result.current.displayed).toBe('abc')

    act(() => {
      vi.advanceTimersToNextTimer()
    })
    expect(result.current.isDone).toBe(true)
  })

  it('marks done immediately for empty text', () => {
    const { result } = renderHook(() => useTypewriter('', 50))
    expect(result.current.isDone).toBe(true)
    expect(result.current.displayed).toBe('')
  })

  it('skip reveals the full text instantly', () => {
    const { result } = renderHook(() => useTypewriter('山海经', 50))
    act(() => {
      result.current.skip()
    })
    expect(result.current.displayed).toBe('山海经')
    expect(result.current.isDone).toBe(true)
  })

  it('resets and re-types when the text changes', () => {
    const { result, rerender } = renderHook(
      ({ text }) => useTypewriter(text, 50),
      { initialProps: { text: '甲' } }
    )

    act(() => {
      vi.advanceTimersToNextTimer()
    })
    expect(result.current.displayed).toBe('甲')

    rerender({ text: '乙' })
    expect(result.current.displayed).toBe('')
    expect(result.current.isDone).toBe(false)

    act(() => {
      vi.advanceTimersToNextTimer()
    })
    expect(result.current.displayed).toBe('乙')
  })
})
