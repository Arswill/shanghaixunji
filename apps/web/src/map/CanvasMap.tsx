import { useRef, useMemo, useState, useEffect, useCallback } from 'react'
import * as d3 from 'd3'
import { geoMercator, geoPath, geoContains } from 'd3-geo'
import type { Feature, FeatureCollection, Geometry } from 'geojson'

// ═══════════════════════════════════════════
// Types
// ═══════════════════════════════════════════

export interface ProvinceStyle {
  fillColor: string
  fillOpacity: number
  strokeColor: string
  strokeWidth: number
  strokeOpacity: number
  dashArray: number[] | null
  /** 描边外发光颜色 */
  glowColor?: string
  /** 描边外发光半径（像素） */
  glowBlur?: number
}

export interface TooltipData {
  name: string
  scrollName: string
  regionName: string
  count: number
  status: string
}

interface CanvasMapProps {
  features: Feature<Geometry, { name: string }>[]
  onSelect: (province: string) => void
  getStyle: (province: string, isHover: boolean) => ProvinceStyle
  getTooltip: (province: string) => TooltipData
  className?: string
}

// ═══════════════════════════════════════════
// CanvasMap — D3 geo projection + Canvas 2D rendering
// ═══════════════════════════════════════════

export function CanvasMap({
  features,
  onSelect,
  getStyle,
  getTooltip,
  className = '',
}: CanvasMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [hoveredProvince, setHoveredProvince] = useState<string | null>(null)
  const [tooltip, setTooltip] = useState<{ x: number; y: number; data: TooltipData } | null>(null)
  const [scale, setScale] = useState(1)
  const [translate, setTranslate] = useState<[number, number]>([0, 0])

  // Memoized projection
  const projection = useMemo(() => {
    const [w, h] = [800, 600]
    const proj = geoMercator()
      .center([104, 38])
      .scale(600)
      .translate([w / 2, h / 2])
    return proj
  }, [])

  const pathGen = useMemo(() => geoPath(projection), [projection])

  // Pre-compute feature list (names extracted once)
  const projectedFeatures = useMemo(() => {
    return features.map((f) => {
      const name = f.properties?.name ?? ''
      return { feature: f, name }
    })
  }, [features])

  // Render loop
  const render = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const container = containerRef.current
    if (!container) return

    const rect = container.getBoundingClientRect()
    const dpr = window.devicePixelRatio || 1
    const w = rect.width
    const h = rect.height

    canvas.width = w * dpr
    canvas.height = h * dpr
    canvas.style.width = `${w}px`
    canvas.style.height = `${h}px`

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, w, h)

    // Update projection to fit container
    const proj = geoMercator()
      .center([104, 38])
      .scale(600 * scale * (w / 800))
      .translate([w / 2 + translate[0], h / 2 + translate[1]])

    const pg = geoPath(proj)

    // ═══ Pass 1: Fill all provinces ═══
    for (const { feature, name } of projectedFeatures) {
      const pathStr = pg(feature)
      if (!pathStr) continue

      const isHover = hoveredProvince === name
      const style = getStyle(name, isHover)

      const p = new Path2D(pathStr)
      ctx.fillStyle = style.fillColor
      ctx.globalAlpha = style.fillOpacity

      // Glow effect
      if (style.glowColor && style.glowBlur && style.glowBlur > 0) {
        ctx.save()
        ctx.shadowColor = style.glowColor
        ctx.shadowBlur = style.glowBlur
        ctx.fill(p)
        ctx.restore()
      }

      ctx.fill(p)
    }

    ctx.globalAlpha = 1

    // ═══ Pass 2: Stroke all province borders ON TOP of fills ═══
    for (const { feature, name } of projectedFeatures) {
      const pathStr = pg(feature)
      if (!pathStr) continue

      const isHover = hoveredProvince === name
      const style = getStyle(name, isHover)

      const p = new Path2D(pathStr)
      ctx.strokeStyle = style.strokeColor
      ctx.lineWidth = style.strokeWidth
      ctx.globalAlpha = style.strokeOpacity
      if (style.dashArray) {
        ctx.setLineDash(style.dashArray)
      } else {
        ctx.setLineDash([])
      }
      ctx.stroke(p)
      ctx.setLineDash([])
    }

    ctx.globalAlpha = 1

    // Draw province labels — 印章式落款（古籍字体 + 朱砂色）
    const hoveredName = hoveredProvince

    // Helper: manually compute projected centroid from raw GeoJSON coords
    const computeLabelPos = (feature: Feature<Geometry>): [number, number] | null => {
      const geom = feature.geometry
      if (!geom) return null
      let coords: number[][] = []
      if (geom.type === 'Polygon') {
        coords = geom.coordinates[0] // outer ring
      } else if (geom.type === 'MultiPolygon') {
        // Use the largest polygon's outer ring
        let largest = geom.coordinates[0][0]
        for (const poly of geom.coordinates) {
          if (poly[0].length > largest.length) largest = poly[0]
        }
        coords = largest
      }
      if (coords.length === 0) return null
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
      for (const [lon, lat] of coords) {
        const p = proj([lon, lat])
        if (!p) continue
        if (p[0] < minX) minX = p[0]
        if (p[1] < minY) minY = p[1]
        if (p[0] > maxX) maxX = p[0]
        if (p[1] > maxY) maxY = p[1]
      }
      if (minX === Infinity) return null
      return [(minX + maxX) / 2, (minY + maxY) / 2]
    }

    for (const { feature, name } of projectedFeatures) {
      const pos = computeLabelPos(feature)
      if (!pos) continue
      const [cx, cy] = pos
      if (isNaN(cx) || isNaN(cy)) continue
      if (cx < 0 || cx > w || cy < 0 || cy > h) continue
      const style = getStyle(name, false)
      const isDisc = style.fillOpacity > 0.7
      const isHover = hoveredName === name

      ctx.font = isDisc ? "bold 14px 'ZCOOL XiaoWei', 'Noto Serif SC', serif" : "bold 13px 'ZCOOL XiaoWei', 'Noto Serif SC', serif"
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      // 文字描边 — 确保在任何背景上可读
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.85)'
      ctx.lineWidth = 3.5
      ctx.strokeText(name, cx, cy)
      ctx.fillStyle = isDisc ? 'rgba(255, 213, 79, 1)' : 'rgba(230, 220, 180, 1)'
      if (isHover) {
        ctx.fillStyle = 'rgba(255, 240, 120, 1)'
        ctx.font = "bold 16px 'ZCOOL XiaoWei', 'Noto Serif SC', serif"
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.9)'
        ctx.lineWidth = 4
        ctx.strokeText(name, cx, cy)
      }
      ctx.fillText(name, cx, cy)
    }
  }, [projectedFeatures, hoveredProvince, getStyle, scale, translate])

  useEffect(() => {
    render()
  }, [render])

  // Resize observer
  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const ro = new ResizeObserver(() => render())
    ro.observe(container)
    return () => ro.disconnect()
  }, [render])

  // Mouse / touch handling
  const getProvinceFromEvent = useCallback((clientX: number, clientY: number): string | null => {
    const canvas = canvasRef.current
    if (!canvas) return null
    const rect = canvas.getBoundingClientRect()
    const x = clientX - rect.left
    const y = clientY - rect.top

    const proj = geoMercator()
      .center([104, 38])
      .scale(600 * scale * (rect.width / 800))
      .translate([rect.width / 2 + translate[0], rect.height / 2 + translate[1]])

    for (const { feature, name } of projectedFeatures) {
      if (geoContains(feature as Feature<Geometry>, proj.invert?.([x, y]) ?? [0, 0])) {
        return name
      }
    }
    return null
  }, [projectedFeatures, scale, translate])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const name = getProvinceFromEvent(e.clientX, e.clientY)
    setHoveredProvince(name)
    if (name) {
      const data = getTooltip(name)
      const canvas = canvasRef.current
      if (canvas) {
        const rect = canvas.getBoundingClientRect()
        setTooltip({ x: e.clientX - rect.left, y: e.clientY - rect.top, data })
      }
    } else {
      setTooltip(null)
    }
  }, [getProvinceFromEvent, getTooltip])

  const handleClick = useCallback((e: React.MouseEvent) => {
    const name = getProvinceFromEvent(e.clientX, e.clientY)
    if (name) onSelect(name)
  }, [getProvinceFromEvent, onSelect])

  const handleMouseLeave = useCallback(() => {
    setHoveredProvince(null)
    setTooltip(null)
  }, [])

  // Zoom controls
  const handleZoomIn = () => setScale((s) => Math.min(s * 1.3, 4))
  const handleZoomOut = () => setScale((s) => Math.max(s / 1.3, 0.8))
  const handleZoomReset = () => { setScale(1); setTranslate([0, 0]) }

  return (
    <div ref={containerRef} className={`relative w-full h-full ${className}`}>
      <canvas
        ref={canvasRef}
        onMouseMove={handleMouseMove}
        onClick={handleClick}
        onMouseLeave={handleMouseLeave}
        className="w-full h-full cursor-pointer"
      />
      {/* Tooltip — 古籍卷轴式：深底金字边框 */}
      {tooltip && (
        <div
          className="absolute pointer-events-none bg-scroll-deep/95 border border-acc-gold/50 rounded px-3 py-2 text-xs z-50"
          style={{
            left: tooltip.x + 12,
            top: tooltip.y - 50,
            boxShadow: '0 0 16px rgba(200, 160, 64, 0.3), inset 0 0 0 1px rgba(200, 160, 64, 0.2)',
          }}
        >
          <div className="font-display text-acc-gold text-sm mb-1">{tooltip.data.name}</div>
          <div className="text-ink-muted text-[10px]">{tooltip.data.scrollName} · {tooltip.data.regionName}疆</div>
          <div className="text-ink-dan text-[10px] mt-0.5">{tooltip.data.count} 只神兽</div>
          <div className="mt-0.5" dangerouslySetInnerHTML={{ __html: tooltip.data.status }} />
        </div>
      )}
      {/* Zoom controls */}
      <div className="absolute bottom-3 right-3 flex gap-1 z-30">
        <button onClick={handleZoomIn} className="w-8 h-8 rounded-full bg-bg-deep/80 border border-acc-bronze/30 text-ink-primary text-sm hover:border-acc-gold">+</button>
        <button onClick={handleZoomOut} className="w-8 h-8 rounded-full bg-bg-deep/80 border border-acc-bronze/30 text-ink-primary text-sm hover:border-acc-gold">−</button>
        <button onClick={handleZoomReset} className="w-8 h-8 rounded-full bg-bg-deep/80 border border-acc-bronze/30 text-ink-primary text-xs hover:border-acc-gold">⟳</button>
      </div>
    </div>
  )
}
