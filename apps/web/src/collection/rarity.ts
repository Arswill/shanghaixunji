export type Rarity = 'SSR' | 'SR' | 'R'

// 知名神兽名单（SSR级）——16 只，广为人知、出现在流行文化中的神兽
const FAMOUS_CREATURES = new Set([
  // 原有知名神兽
  'jiu-wei-hu', 'chu-shuo', 'tao-tie', 'ying-long', 'qi-lin',
  'bai-ze', 'hun-dun', 'jing-wei',
  // 四凶补齐
  'qiong-qi', 'tao-wu',
  // 四象
  'zhu-que', 'bai-hu', 'xuan-wu',
  // 知名神兽
  'kun-peng', 'pi-xiu', 'xing-tian',
])

export function getRarity(creature: { id: string; confidence: string }): Rarity {
  if (FAMOUS_CREATURES.has(creature.id)) return 'SSR'
  if (creature.confidence === 'high' || creature.confidence === 'medium') return 'SR'
  return 'R'
}

export const RARITY_CONFIG: Record<Rarity, { label: string; color: string; glow: string; stars: string }> = {
  SSR: { label: '传说', color: '#ff6b35', glow: '0 0 20px rgba(255,107,53,0.5)', stars: '★★★' },
  SR: { label: '稀有', color: '#b8924a', glow: '0 0 12px rgba(184,146,74,0.4)', stars: '★★' },
  R: { label: '常见', color: '#6b8f71', glow: '0 0 8px rgba(107,143,113,0.3)', stars: '★' },
}
