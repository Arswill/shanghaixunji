import { describe, it, expect, vi, afterEach } from 'vitest'
import {
  generateFallbackResponse,
  sendChatMessage,
  type ChatMessage,
} from './chatApi'
import type { Creature } from '../data/creatures.schema'

const mockCreature: Creature = {
  id: 'bi-fang',
  name: '毕方',
  pinyin: 'Bì Fāng',
  province: '陕西',
  original_text: '有鸟焉，其状如鹤，一足，青质白文，赤喙而白喙，名曰毕方。其鸣自叫也，见则邑有讹火。',
  source: '《山海经·西山经》',
  translation: 'A fire bird like a crane',
  modern_location: '今陕西宝鸡',
  confidence: 'high',
  confidence_notes: '',
  description: '毕方是火灾之鸟，单足丹喙。',
  scroll: '西山经',
  art_description: 'crane bird',
}

describe('generateFallbackResponse', () => {
  it('responds to "who are you" with creature name', () => {
    const msgs: ChatMessage[] = [{ role: 'user', content: '你是谁？' }]
    const resp = generateFallbackResponse(mockCreature, msgs)
    expect(resp).toContain('毕方')
  })

  it('responds to appearance question with original text', () => {
    const msgs: ChatMessage[] = [{ role: 'user', content: '你长什么样？' }]
    const resp = generateFallbackResponse(mockCreature, msgs)
    expect(resp).toContain('鹤')
  })

  it('responds to location question', () => {
    const msgs: ChatMessage[] = [{ role: 'user', content: '你住在哪里？' }]
    const resp = generateFallbackResponse(mockCreature, msgs)
    expect(resp).toContain('陕西')
  })

  it('responds to ability question with omen', () => {
    const msgs: ChatMessage[] = [{ role: 'user', content: '你有什么能力？' }]
    const resp = generateFallbackResponse(mockCreature, msgs)
    expect(resp.length).toBeGreaterThan(10)
  })

  it('responds to yellow emperor question', () => {
    const msgs: ChatMessage[] = [{ role: 'user', content: '你见过黄帝吗？' }]
    const resp = generateFallbackResponse(mockCreature, msgs)
    expect(resp).toContain('黄帝')
  })

  it('gives mysterious response for unknown questions', () => {
    const msgs: ChatMessage[] = [{ role: 'user', content: '今天天气怎么样？' }]
    const resp = generateFallbackResponse(mockCreature, msgs)
    expect(resp.length).toBeGreaterThan(10)
  })

  it('handles eating questions for man-eating creatures', () => {
    const manEater: Creature = {
      ...mockCreature,
      id: 'tao-tie',
      name: '饕餮',
      original_text: '有兽焉，是食人。',
    }
    const msgs: ChatMessage[] = [{ role: 'user', content: '你吃什么？' }]
    const resp = generateFallbackResponse(manEater, msgs)
    expect(resp).toContain('食人')
  })
})

describe('sendChatMessage', () => {
  const originalFetch = globalThis.fetch

  afterEach(() => {
    globalThis.fetch = originalFetch
  })

  function mockFetch(impl: ReturnType<typeof vi.fn>) {
    globalThis.fetch = impl as unknown as typeof fetch
  }

  it('returns online content with isOffline=false when the server replies', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ content: 'AI回复' }),
    })
    mockFetch(fetchMock)

    const result = await sendChatMessage(mockCreature, [
      { role: 'user', content: '你好' },
    ])

    expect(result.content).toBe('AI回复')
    expect(result.isOffline).toBe(false)
  })

  it('falls back to rule-based response when server signals offline', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ content: '', offline: true }),
    })
    mockFetch(fetchMock)

    const result = await sendChatMessage(mockCreature, [
      { role: 'user', content: '你是谁？' },
    ])

    expect(result.isOffline).toBe(true)
    expect(result.content).toContain('毕方')
  })

  it('falls back to offline mode on network error', async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error('network down'))
    mockFetch(fetchMock)

    const result = await sendChatMessage(mockCreature, [
      { role: 'user', content: '你是谁？' },
    ])

    expect(result.isOffline).toBe(true)
    expect(result.content).toContain('毕方')
  })

  it('falls back to offline mode on non-ok response', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: false, status: 500 })
    mockFetch(fetchMock)

    const result = await sendChatMessage(mockCreature, [
      { role: 'user', content: '你是谁？' },
    ])

    expect(result.isOffline).toBe(true)
  })

  it('does not forward system messages to the server', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ content: 'AI回复' }),
    })
    mockFetch(fetchMock)

    const msgs: ChatMessage[] = [
      { role: 'system', content: 'UI-only notice' },
      { role: 'user', content: '你好' },
    ]
    await sendChatMessage(mockCreature, msgs)

    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [, options] = fetchMock.mock.calls[0] as [
      string,
      { body: string },
    ]
    const body = JSON.parse(options.body)
    expect(body.messages).toEqual([{ role: 'user', content: '你好' }])
  })

  it('posts creature and messages to /api/chat', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ content: 'AI回复' }),
    })
    mockFetch(fetchMock)

    await sendChatMessage(mockCreature, [{ role: 'user', content: '你好' }])

    const [url, options] = fetchMock.mock.calls[0] as [
      string,
      { method: string; body: string },
    ]
    expect(url).toBe('/api/chat')
    expect(options.method).toBe('POST')
    const body = JSON.parse(options.body)
    expect(body.creature.name).toBe('毕方')
  })
})
