import { describe, it, expect } from 'vitest'
import { buildMemoryContext } from './memorySummary'
import type { ChatMessage } from './chatApi'

const CREATURE_ID = 'bi-fang'

describe('buildMemoryContext', () => {
  it('returns default text when there are no user messages', () => {
    const messages: ChatMessage[] = [
      { role: 'assistant', content: '吾乃毕方。' },
      { role: 'system', content: '离线模式' },
    ]
    expect(buildMemoryContext(CREATURE_ID, messages)).toBe('你们尚未深谈。')
  })

  it('counts user messages and mentions top topics', () => {
    const messages: ChatMessage[] = [
      { role: 'user', content: '你掌控火焰吗？' },
      { role: 'assistant', content: '吾掌火。' },
      { role: 'user', content: '你与水有何渊源？' },
    ]
    const summary = buildMemoryContext(CREATURE_ID, messages)
    expect(summary).toContain('近日汝与毕方交谈 2 次')
    expect(summary).toContain('汝常问起火焰')
  })

  it('records gifts mentioned by the player', () => {
    const messages: ChatMessage[] = [
      { role: 'user', content: '我送你一枚古玉' },
      { role: 'user', content: '还有灵果你要吗' },
    ]
    const summary = buildMemoryContext(CREATURE_ID, messages)
    expect(summary).toContain('汝曾提及赠礼：古玉、灵果')
  })

  it('records the latest promise', () => {
    const messages: ChatMessage[] = [
      { role: 'user', content: '我答应下次再来看你' },
      { role: 'assistant', content: '好。' },
      { role: 'user', content: '下次一定带你喜欢的古玉' },
    ]
    const summary = buildMemoryContext(CREATURE_ID, messages)
    expect(summary).toContain('汝曾许诺：')
    expect(summary).toContain('下次一定带你喜欢的古玉')
  })

  it('truncates long promises', () => {
    const longPromise = '我承诺下一次见面一定会带很多很多你喜欢的古玉和灵果给你'
    const messages: ChatMessage[] = [{ role: 'user', content: longPromise }]
    const summary = buildMemoryContext(CREATURE_ID, messages)
    expect(summary).toContain('……')
    expect(summary).not.toContain(longPromise)
  })

  it('ignores messages beyond user role', () => {
    const messages: ChatMessage[] = [
      { role: 'user', content: '你怕什么？' },
      { role: 'assistant', content: '吾不惧凡火。' },
    ]
    const summary = buildMemoryContext(CREATURE_ID, messages)
    expect(summary).toContain('交谈 1 次')
    expect(summary).not.toContain('吾不惧凡火')
  })

  it('uses creature id fallback when creature is unknown', () => {
    const messages: ChatMessage[] = [{ role: 'user', content: '你好' }]
    const summary = buildMemoryContext('unknown-creature', messages)
    expect(summary).toContain('近日汝与unknown-creature交谈 1 次')
  })
})
