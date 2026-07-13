import { creatures } from '../data/loadCreatures'
import { palette } from '../design/tokens'

export type RegionId = 'south' | 'west' | 'north' | 'east' | 'central' | 'outer'

export interface RegionInfo {
  id: RegionId
  name: string // 疆域名，如 "苍青"
  scrollName: string // 山经名，如 "南山经"
  colorVar: string // CSS 变量名（主色）
  washVar: string // CSS 变量名（水墨晕染层）
  color: string // 十六进制色值
}

export const REGIONS: Record<RegionId, RegionInfo> = {
  south: { id: 'south', name: '苍青', scrollName: '南山经', colorVar: '--region-south', washVar: '--region-south-wash', color: palette.region.south },
  west: { id: 'west', name: '赭石', scrollName: '西山经', colorVar: '--region-west', washVar: '--region-west-wash', color: palette.region.west },
  north: { id: 'north', name: '玄青', scrollName: '北山经', colorVar: '--region-north', washVar: '--region-north-wash', color: palette.region.north },
  east: { id: 'east', name: '紫黛', scrollName: '东山经', colorVar: '--region-east', washVar: '--region-east-wash', color: palette.region.east },
  central: { id: 'central', name: '黄土', scrollName: '中山经', colorVar: '--region-central', washVar: '--region-central-wash', color: palette.region.central },
  outer: { id: 'outer', name: '混沌', scrollName: '海外大荒', colorVar: '--region-outer', washVar: '--region-outer-wash', color: palette.region.outer },
}

/** scroll 字段值 → 神话疆域 id */
const SCROLL_TO_REGION: Record<string, RegionId> = {
  南山经: 'south',
  西山经: 'west',
  北山经: 'north',
  东山经: 'east',
  中山经: 'central',
  海外东经: 'outer',
  海外南经: 'outer',
  海外西经: 'outer',
  海外北经: 'outer',
  海内东经: 'outer',
  海内南经: 'outer',
  海内西经: 'outer',
  海内北经: 'outer',
  海内经: 'outer',
  大荒东经: 'outer',
  大荒南经: 'outer',
  大荒西经: 'outer',
  大荒北经: 'outer',
}

/** 山经优先级：同票时靠前者优先 */
const SHAN_JING_PRIORITY: string[] = ['南山经', '西山经', '北山经', '东山经', '中山经']

function buildProvinceRegionMap(): Record<string, RegionId> {
  const byProvince: Record<string, string[]> = {}
  for (const c of creatures) {
    const provinces = c.province === '两广' ? ['广东', '广西'] : [c.province]
    for (const p of provinces) {
      if (!byProvince[p]) byProvince[p] = []
      byProvince[p].push(c.scroll)
    }
  }

  const map: Record<string, RegionId> = {}
  for (const [province, scrolls] of Object.entries(byProvince)) {
    const shanJingScrolls = scrolls.filter((s) => SHAN_JING_PRIORITY.includes(s))
    let chosenRegion: RegionId

    if (shanJingScrolls.length > 0) {
      // 有山经神兽时，以出现最多的山经为准；同票按优先级
      const votes: Record<string, number> = {}
      for (const s of shanJingScrolls) {
        votes[s] = (votes[s] || 0) + 1
      }
      const sorted = Object.entries(votes).sort((a, b) => {
        if (b[1] !== a[1]) return b[1] - a[1]
        return SHAN_JING_PRIORITY.indexOf(a[0]) - SHAN_JING_PRIORITY.indexOf(b[0])
      })
      chosenRegion = SCROLL_TO_REGION[sorted[0][0]] ?? 'outer'
    } else {
      // 纯海外大荒则取多数票
      const votes: Record<RegionId, number> = { south: 0, west: 0, north: 0, east: 0, central: 0, outer: 0 }
      for (const s of scrolls) {
        const r = SCROLL_TO_REGION[s] ?? 'outer'
        votes[r] = (votes[r] || 0) + 1
      }
      const sorted = Object.entries(votes).sort((a, b) => b[1] - a[1])
      chosenRegion = (sorted[0]?.[0] as RegionId) ?? 'outer'
    }

    map[province] = chosenRegion
  }
  return map
}

const PROVINCE_REGION = buildProvinceRegionMap()

/** 获取省份所属神话疆域 id */
export function getProvinceRegion(province: string): RegionId {
  return PROVINCE_REGION[province] ?? 'outer'
}

/** 获取省份所属山经卷册名（用于 Tooltip 等展示） */
export function getProvinceScrollName(province: string): string {
  const region = REGIONS[getProvinceRegion(province)]
  return region.scrollName
}

/** 获取省份所属神话疆域信息 */
export function getProvinceRegionInfo(province: string): RegionInfo {
  return REGIONS[getProvinceRegion(province)]
}
