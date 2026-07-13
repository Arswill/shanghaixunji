import { useRef, useCallback, useState, useMemo } from 'react'
import type { CreatureWithAssets } from '../data/loadCreatures'
import { detectPersonality, type Personality } from '../chat/chatPrompts'
import { getRarity, RARITY_CONFIG } from '../collection/rarity'
import { drawRadarChart, getBondDimensions, type BondDimension, canvasToBlob } from './shareTemplates'
import { useBondStore } from '../bond/bondStore'
import { useCollection } from '../collection/useCollection'
import { getEvolutionStage } from '../collection/evolution'

interface BondStarChartProps {
  creature: CreatureWithAssets
  dimensions?: BondDimension[]
  onExport?: (url: string) => void
}

/** 雷达图画布尺寸。 */
const CHART_SIZE = 720

/** 性格 → 雷达图配色。 */
const PERSONALITY_CHART_STYLE: Record<
  Personality,
  {
    fill: string
    stroke: string
    grid: string
    label: string
    bgTop: string
    bgBottom: string
  }
> = {
  ferocious: {
    fill: 'rgba(168,51,42,0.25)',
    stroke: '#c94a3a',
    grid: 'rgba(168,51,42,0.2)',
    label: '#d8c9a8',
    bgTop: '#1f100c',
    bgBottom: '#0a0504',
  },
  auspicious: {
    fill: 'rgba(201,162,39,0.22)',
    stroke: '#e8c94a',
    grid: 'rgba(201,162,39,0.2)',
    label: '#d8c9a8',
    bgTop: '#1a1810',
    bgBottom: '#0e0c08',
  },
  disastrous: {
    fill: 'rgba(42,90,106,0.25)',
    stroke: '#4a8a9a',
    grid: 'rgba(42,90,106,0.2)',
    label: '#d8c9a8',
    bgTop: '#0c1418',
    bgBottom: '#05080a',
  },
  mysterious: {
    fill: 'rgba(184,146,74,0.22)',
    stroke: '#c9a227',
    grid: 'rgba(184,146,74,0.2)',
    label: '#d8c9a8',
    bgTop: '#161412',
    bgBottom: '#0a0908',
  },
}

export function BondStarChart({ creature, dimensions: propDimensions, onExport }: BondStarChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [generating, setGenerating] = useState(false)

  const personality = useMemo(() => detectPersonality(creature), [creature])
  const style = PERSONALITY_CHART_STYLE[personality]
  const rarity = useMemo(() => getRarity(creature), [creature])
  const rarityConfig = RARITY_CONFIG[rarity]

  // 接入真实互动数据：从 bondStore 读取羁绊记录，映射到五维
  const bond = useBondStore((s) => s.getBond(creature.id))
  const discovered = useCollection((s) => s.discovered)
  const evolutionStage = useMemo(
    () => getEvolutionStage(creature.id, discovered),
    [creature.id, discovered],
  )
  const computedDimensions = useMemo(
    () => getBondDimensions(creature, bond, evolutionStage),
    [creature, bond, evolutionStage],
  )
  const dimensions = propDimensions ?? computedDimensions
  const totalBond = useMemo(
    () => dimensions.reduce((sum, d) => sum + d.value, 0),
    [dimensions],
  )

  const generateChart = useCallback(async () => {
    const canvas = canvasRef.current
    if (!canvas) return

    setGenerating(true)
    try {
      canvas.width = CHART_SIZE
      canvas.height = CHART_SIZE
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      // 背景
      const bg = ctx.createLinearGradient(0, 0, 0, CHART_SIZE)
      bg.addColorStop(0, style.bgTop)
      bg.addColorStop(1, style.bgBottom)
      ctx.fillStyle = bg
      ctx.fillRect(0, 0, CHART_SIZE, CHART_SIZE)

      // 暗角
      const vignette = ctx.createRadialGradient(
        CHART_SIZE / 2,
        CHART_SIZE / 2,
        80,
        CHART_SIZE / 2,
        CHART_SIZE / 2,
        CHART_SIZE * 0.7,
      )
      vignette.addColorStop(0, 'rgba(255,255,255,0.02)')
      vignette.addColorStop(1, 'rgba(0,0,0,0.4)')
      ctx.fillStyle = vignette
      ctx.fillRect(0, 0, CHART_SIZE, CHART_SIZE)

      // 顶部标题
      ctx.fillStyle = '#d8c9a8'
      ctx.font = 'bold 40px "Noto Serif SC", serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(`${creature.name} · 羁绊星图`, CHART_SIZE / 2, 70)

      ctx.fillStyle = '#8a7d63'
      ctx.font = '22px sans-serif'
      ctx.fillText(`${creature.pinyin}  ·  ${rarityConfig.stars}`, CHART_SIZE / 2, 112)

      // 雷达图
      drawRadarChart(ctx, dimensions, {
        centerX: CHART_SIZE / 2,
        centerY: CHART_SIZE / 2 + 16,
        radius: 220,
        fillColor: style.fill,
        strokeColor: style.stroke,
        gridColor: style.grid,
        labelColor: style.label,
        font: 'bold 24px "Noto Serif SC", sans-serif',
      })

      // 中心羁绊值
      ctx.fillStyle = style.stroke
      ctx.font = 'bold 48px sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(String(totalBond), CHART_SIZE / 2, CHART_SIZE / 2 + 16)

      ctx.fillStyle = '#8a7d63'
      ctx.font = '18px sans-serif'
      ctx.fillText('羁绊总值', CHART_SIZE / 2, CHART_SIZE / 2 + 56)

      // 底部维度明细
      const detailY = CHART_SIZE - 90
      ctx.font = '20px "Noto Serif SC", sans-serif'
      ctx.fillStyle = '#8a7d63'
      const items = dimensions.map((d) => `${d.label} ${d.value}`)
      ctx.fillText(items.join('  ·  '), CHART_SIZE / 2, detailY)

      // 生成预览
      const blob = await canvasToBlob(canvas)
      if (blob) {
        if (previewUrl) URL.revokeObjectURL(previewUrl)
        const url = URL.createObjectURL(blob)
        setPreviewUrl(url)
        onExport?.(url)
      }
    } finally {
      setGenerating(false)
    }
  }, [creature, dimensions, onExport, previewUrl, rarityConfig, style, totalBond])

  const handleDownload = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.toBlob((blob) => {
      if (!blob) return
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `山海寻迹-${creature.name}-羁绊星图.png`
      a.click()
      URL.revokeObjectURL(url)
    })
  }, [creature.name])

  return (
    <div className="space-y-4" data-testid="bond-star-chart">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={generateChart}
          disabled={generating}
          className="px-4 py-2 bg-acc-cinnabar/20 text-acc-gold-bright border border-acc-cinnabar/50 rounded hover:bg-acc-cinnabar/30 transition-colors disabled:opacity-50"
        >
          {generating ? '绘制中…' : '生成羁绊星图'}
        </button>
        {previewUrl && (
          <button
            type="button"
            onClick={handleDownload}
            data-testid="bond-download"
            className="px-4 py-2 bg-acc-bronze/20 text-ink-heaven border border-acc-bronze/40 rounded hover:bg-acc-bronze/30 transition-colors"
          >
            下载 PNG
          </button>
        )}
      </div>

      {previewUrl && (
        <div className="animate-fade-in">
          <p className="text-ink-faint text-xs mb-2">羁绊星图预览（720×720）：</p>
          <img
            src={previewUrl}
            alt={`${creature.name} 羁绊星图`}
            className="max-h-[360px] w-auto rounded-lg border border-acc-bronze/30"
          />
        </div>
      )}

      <canvas ref={canvasRef} className="hidden" />
    </div>
  )
}
