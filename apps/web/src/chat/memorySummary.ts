import type { ChatMessage } from './chatApi'
import { getCreatureById } from '../data/loadCreatures'

export interface MemoryFact {
  type: 'gift' | 'promise' | 'topic' | 'encounter'
  text: string
}

const TOPIC_KEYWORDS = [
  { keyword: '火', label: '火焰' },
  { keyword: '水', label: '水势' },
  { keyword: '山', label: '山川' },
  { keyword: '食人', label: '食人之说' },
  { keyword: '见则', label: '现世之兆' },
  { keyword: '黄帝', label: '上古帝王' },
  { keyword: '蚩尤', label: '兵主之战' },
  { keyword: '栖息', label: '栖居之地' },
  { keyword: '形貌', label: '形貌' },
  { keyword: '能力', label: '神力' },
]

const GIFT_KEYWORDS: Record<string, string> = {
  灵果: '灵果',
  古玉: '古玉',
  朱砂: '朱砂',
}

const PROMISE_KEYWORDS = ['答应', '约定', '承诺', '一定', '下次', '明日', '改日']

/**
 * 根据最近 10 条对话记录生成简短记忆摘要。
 *
 * 规则：
 * 1. 统计玩家主动提及的话题关键词，取最频繁的 1-2 个。
 * 2. 记录玩家提及的礼物（灵果 / 古玉 / 朱砂）。
 * 3. 记录玩家可能的承诺 / 约定语句。
 * 4. 返回适合注入 system prompt 的古风短句。
 */
export function buildMemoryContext(
  creatureId: string,
  recentMessages: ChatMessage[]
): string {
  const creature = getCreatureById(creatureId)
  const name = creature?.name ?? creatureId

  const userMessages = recentMessages
    .filter((m) => m.role === 'user')
    .map((m) => m.content)

  if (userMessages.length === 0) {
    return '你们尚未深谈。'
  }

  const topicCounts: Record<string, number> = {}
  for (const msg of userMessages) {
    for (const { keyword, label } of TOPIC_KEYWORDS) {
      if (msg.includes(keyword)) {
        topicCounts[label] = (topicCounts[label] || 0) + 1
      }
    }
  }

  const gifts = new Set<string>()
  const promises: string[] = []
  for (const msg of userMessages) {
    for (const [keyword, label] of Object.entries(GIFT_KEYWORDS)) {
      if (msg.includes(keyword)) gifts.add(label)
    }
    if (PROMISE_KEYWORDS.some((k) => msg.includes(k))) {
      promises.push(msg)
    }
  }

  const topTopics = Object.entries(topicCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([label]) => label)

  const parts: string[] = []
  parts.push(`近日汝与${name}交谈 ${userMessages.length} 次。`)

  if (topTopics.length > 0) {
    parts.push(`汝常问起${topTopics.join('、')}。`)
  }

  if (gifts.size > 0) {
    parts.push(`汝曾提及赠礼：${Array.from(gifts).join('、')}。`)
  }

  if (promises.length > 0) {
    const latestPromise = promises[promises.length - 1]
    const short = latestPromise.length > 24 ? `${latestPromise.slice(0, 24)}……` : latestPromise
    parts.push(`汝曾许诺：「${short}」`)
  }

  return parts.join('')
}
