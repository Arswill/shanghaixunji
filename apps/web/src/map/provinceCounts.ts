import { creatures } from '../data/loadCreatures'

export function getProvinceCreatureCounts(): Record<string, number> {
  const counts: Record<string, number> = {}
  for (const c of creatures) {
    // Handle "两广" which maps to both 广东 and 广西
    if (c.province === '两广') {
      counts['广东'] = (counts['广东'] || 0) + 1
      counts['广西'] = (counts['广西'] || 0) + 1
    } else {
      counts[c.province] = (counts[c.province] || 0) + 1
    }
  }
  return counts
}

export function getProvinceCount(province: string): number {
  const counts = getProvinceCreatureCounts()
  return counts[province] || 0
}
