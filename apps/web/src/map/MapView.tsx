import { useMemo, useCallback } from 'react'
import type { Feature, Geometry } from 'geojson'
import { provinces } from './provinceConfig'
import { getProvinceCount } from './provinceCounts'
import { getProvinceRegionInfo, type RegionInfo } from './provinceRegion'
import { useCollection } from '../collection/useCollection'
import { creatures } from '../data/loadCreatures'
import { InkSeal } from '../atmosphere/InkSeal'
import { CanvasMap, type ProvinceStyle, type TooltipData } from './CanvasMap'

// ═══════════════════════════════════════════
// Color constants — 暗色仙侠基调
// ═══════════════════════════════════════════

const COLORS = {
  // 高对比度配色 — 确保在暗色背景上清晰可见
  moJiao: '#ffd54f',                  // 明金 — 已探索描边
  moQing: '#e0c060',                  // 暖金 — 未探索描边（提高可见度）
  paperMist: 'rgb(55, 45, 30)',       // 暖青铜色 — 未探索省份填充（实色，无alpha叠加）
  regionWash: {
    south: 'rgb(40, 120, 70)',        // 南山经 — 石绿
    west: 'rgb(140, 100, 40)',        // 西山经 — 赭石
    north: 'rgb(40, 100, 150)',       // 北山经 — 石青
    east: 'rgb(110, 60, 140)',        // 东山经 — 紫烟
    central: 'rgb(150, 55, 35)',      // 中山经 — 朱砂
    outer: 'rgb(80, 75, 60)',         // 海外大荒 — 烟墨
  } as Record<string, string>,
  glow: {
    discovered: 'rgba(255, 213, 79, 0.9)',
    hover: 'rgba(255, 220, 100, 1)',
  },
} as const

/** 根据发现状态与疆域信息生成省份 Canvas 样式 */
function getProvinceStyle(
  region: RegionInfo,
  count: number,
  discovered: boolean,
  isHover: boolean
): ProvinceStyle {
  const baseStroke = discovered ? COLORS.moJiao : COLORS.moQing
  const baseStrokeWidth = discovered ? (isHover ? 4 : 3) : (isHover ? 3.5 : 2.8)
  const baseStrokeOpacity = 1

  if (!discovered) {
    return {
      fillColor: COLORS.paperMist,
      fillOpacity: isHover ? 0.95 : 0.88,
      strokeColor: baseStroke,
      strokeWidth: baseStrokeWidth,
      strokeOpacity: baseStrokeOpacity,
      dashArray: [6, 4],
      glowColor: isHover ? COLORS.glow.hover : undefined,
      glowBlur: isHover ? 10 : 0,
    }
  }

  const density = 0.9
  return {
    fillColor: COLORS.regionWash[region.id] ?? COLORS.regionWash.outer,
    fillOpacity: isHover ? 1 : density,
    strokeColor: baseStroke,
    strokeWidth: baseStrokeWidth,
    strokeOpacity: baseStrokeOpacity,
    dashArray: [12, 3, 4, 5, 2, 7],
    glowColor: isHover ? COLORS.glow.hover : COLORS.glow.discovered,
    glowBlur: isHover ? 16 : 7,
  }
}

/** 生成 tooltip 数据 */
function buildTooltip(
  name: string,
  region: RegionInfo,
  count: number,
  discovered: boolean
): TooltipData {
  const status = discovered
    ? `<div style="color: #3a6a4a;">✦ 已造访 · ${count} 只神兽</div>`
    : `<div style="color: #b8924a;">可探索 · ${count} 只神兽</div>`

  return {
    name,
    scrollName: region.scrollName,
    regionName: region.name,
    count,
    status,
  }
}

// ═══════════════════════════════════════════
// MapView — D3 Canvas 版本（全开地图，无迷雾）
// ═══════════════════════════════════════════

export function MapView({ onSelect }: { onSelect: (p: string) => void }) {
  const discovered = useCollection((state) => state.discovered)

  const discoveredProvinces = useMemo(() => {
    const set = new Set<string>()
    for (const c of creatures) {
      if (discovered.includes(c.id)) {
        const provinces = c.province === '两广' ? ['广东', '广西'] : [c.province]
        for (const p of provinces) set.add(p)
      }
    }
    return set
  }, [discovered])

  // ── Pre-compute province states ──
  const provinceStates = useMemo(() => {
    const map: Record<string, {
      region: RegionInfo
      count: number
      isDiscovered: boolean
    }> = {}
    for (const f of provinces.features) {
      const name = (f as Feature<Geometry, { name: string }>).properties?.name
      if (!name) continue
      const count = getProvinceCount(name)
      const region = getProvinceRegionInfo(name)
      const isDiscovered = discoveredProvinces.has(name)
      map[name] = { region, count, isDiscovered }
    }
    return map
  }, [discoveredProvinces])

  // ── Style function for CanvasMap ──
  const handleGetStyle = useCallback((province: string, isHover: boolean): ProvinceStyle => {
    const s = provinceStates[province]
    if (!s) {
      return {
        fillColor: COLORS.paperMist,
        fillOpacity: 0.5,
        strokeColor: COLORS.moQing,
        strokeWidth: 1,
        strokeOpacity: 0.6,
        dashArray: null,
        glowColor: undefined,
        glowBlur: 0,
      }
    }
    return getProvinceStyle(s.region, s.count, s.isDiscovered, isHover)
  }, [provinceStates])

  // ── Tooltip function for CanvasMap ──
  const handleGetTooltip = useCallback((province: string): TooltipData => {
    const s = provinceStates[province]
    if (!s) {
      return { name: province, scrollName: '', regionName: '', count: 0, status: '' }
    }
    return buildTooltip(province, s.region, s.count, s.isDiscovered)
  }, [provinceStates])

  // ── Click handler: all provinces directly selectable ──
  const handleSelect = useCallback((name: string) => {
    onSelect(name)
  }, [onSelect])

  const features = provinces.features as Feature<Geometry, { name: string }>[]

  return (
    <div className="relative h-[55dvh] min-h-[320px] sm:h-[60vh] md:h-[65vh] w-full overflow-hidden rounded-xl ink-map-frame">
      {/* 宣纸底图 */}
      <div className="absolute inset-0 ink-map-paper pointer-events-none" aria-hidden="true" />

      {/* 暗角晕染 */}
      <div className="absolute inset-0 ink-map-vignette pointer-events-none" aria-hidden="true" />

      {/* 水墨远山剪影 */}
      <div className="absolute inset-x-0 bottom-0 h-40 pointer-events-none ink-map-mountains" aria-hidden="true" />

      {/* 水墨云雾层 — 降到地图下方，不遮挡省份 */}
      <div className="pointer-events-none absolute inset-0 z-[5] overflow-hidden" aria-hidden="true">
        {INK_MIST_CLOUDS.map((cloud) => (
          <span
            key={cloud.id}
            className="ink-mist-cloud"
            style={{
              left: cloud.left,
              top: cloud.top,
              width: cloud.width,
              height: cloud.height,
              animationDelay: cloud.delay,
              animationDuration: cloud.duration,
            }}
          />
        ))}
      </div>

      {/* ═══ D3 Canvas 地图核心 ═══ */}
      <div className="absolute inset-0 z-10">
        <CanvasMap
          features={features}
          onSelect={handleSelect}
          getStyle={handleGetStyle}
          getTooltip={handleGetTooltip}
        />
      </div>

      {/* 画框四角装饰 */}
      <div className="ink-corner-tl" aria-hidden="true" />
      <div className="ink-corner-tr" aria-hidden="true" />
      <div className="ink-corner-bl" aria-hidden="true" />
      <div className="ink-corner-br" aria-hidden="true" />

      {/* 方位印章 */}
      <div className="absolute top-5 right-5 z-[1000] pointer-events-none hidden sm:block animate-seal-stamp" style={{ animationDelay: '1.4s' }} aria-hidden="true">
        <InkSeal text="山海" size={64} rotation={-8} />
      </div>

      {/* 角落落款 */}
      <div
        className="absolute top-5 left-5 z-[500] pointer-events-none hidden sm:flex flex-col items-start gap-0.5 text-mo-qing/60 font-kai text-xs leading-relaxed"
        aria-hidden="true"
      >
        <span>上古九州神兽分布</span>
        <span>壬寅年摹</span>
      </div>

      {/* 神话疆域氛围粒子 — 降到地图下方 */}
      <div className="pointer-events-none absolute inset-0 z-[5] overflow-hidden">
        {ATMOSPHERE_PARTICLES.map((p) => (
          <span
            key={p.id}
            className={`map-particle ${p.tone === 'cyan' ? 'map-particle-cyan' : ''}`}
            style={{
              left: p.left,
              top: p.top,
              animationDelay: p.delay,
              animationDuration: p.duration,
              width: p.size,
              height: p.size,
            }}
          />
        ))}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════
// Static data
// ═══════════════════════════════════════════

const ATMOSPHERE_PARTICLES = [
  { id: 1, left: '12%', top: '78%', delay: '0s', duration: '9s', size: 4, tone: 'gold' as const },
  { id: 2, left: '28%', top: '62%', delay: '1.2s', duration: '11s', size: 3, tone: 'cyan' as const },
  { id: 3, left: '45%', top: '85%', delay: '2.5s', duration: '10s', size: 5, tone: 'gold' as const },
  { id: 4, left: '58%', top: '55%', delay: '0.8s', duration: '12s', size: 3, tone: 'gold' as const },
  { id: 5, left: '72%', top: '72%', delay: '3.1s', duration: '9s', size: 4, tone: 'cyan' as const },
  { id: 6, left: '86%', top: '48%', delay: '1.8s', duration: '13s', size: 3, tone: 'gold' as const },
  { id: 7, left: '18%', top: '38%', delay: '4.2s', duration: '10s', size: 4, tone: 'cyan' as const },
  { id: 8, left: '38%', top: '22%', delay: '0.4s', duration: '11s', size: 3, tone: 'gold' as const },
  { id: 9, left: '65%', top: '30%', delay: '2.2s', duration: '12s', size: 5, tone: 'gold' as const },
  { id: 10, left: '82%', top: '18%', delay: '3.6s', duration: '10s', size: 3, tone: 'cyan' as const },
  { id: 11, left: '50%', top: '42%', delay: '1.0s', duration: '9s', size: 4, tone: 'gold' as const },
  { id: 12, left: '7%', top: '55%', delay: '5.0s', duration: '13s', size: 3, tone: 'gold' as const },
]

const INK_MIST_CLOUDS = [
  { id: 1, left: '-5%', top: '8%', width: '45%', height: '18%', delay: '0s', duration: '18s' },
  { id: 2, left: '60%', top: '5%', width: '40%', height: '15%', delay: '3s', duration: '22s' },
  { id: 3, left: '25%', top: '55%', width: '35%', height: '14%', delay: '6s', duration: '20s' },
  { id: 4, left: '70%', top: '70%', width: '30%', height: '12%', delay: '9s', duration: '24s' },
  { id: 5, left: '5%', top: '75%', width: '38%', height: '16%', delay: '12s', duration: '19s' },
]
