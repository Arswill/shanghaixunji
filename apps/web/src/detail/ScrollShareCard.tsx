import { useRef, useCallback, useState, useMemo } from 'react'
import type { CreatureWithAssets } from '../data/loadCreatures'
import { creatures } from '../data/loadCreatures'
import { getScrollTemplateData, loadImage, canvasToBlob } from './shareTemplates'

interface ScrollShareCardProps {
  creature: CreatureWithAssets
  collectedCreatureIds?: string[]
  onExport?: (url: string) => void
}

/** 长卷画布尺寸：宽图横卷风格。 */
const SCROLL_W = 1200
const SCROLL_H = 600

export function ScrollShareCard({ creature, collectedCreatureIds = [], onExport }: ScrollShareCardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [generating, setGenerating] = useState(false)

  const template = useMemo(() => {
    const collected = creatures.filter((c) => collectedCreatureIds.includes(c.id))
    return getScrollTemplateData(collected, creatures, creature.id, 10)
  }, [creature.id, collectedCreatureIds])

  const generateScroll = useCallback(async () => {
    const canvas = canvasRef.current
    if (!canvas) return

    setGenerating(true)
    try {
      canvas.width = SCROLL_W
      canvas.height = SCROLL_H
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      // 卷轴底色
      const bg = ctx.createLinearGradient(0, 0, SCROLL_W, 0)
      bg.addColorStop(0, '#1a1810')
      bg.addColorStop(0.5, '#242017')
      bg.addColorStop(1, '#1a1810')
      ctx.fillStyle = bg
      ctx.fillRect(0, 0, SCROLL_W, SCROLL_H)

      // 卷轴纹理
      ctx.fillStyle = 'rgba(184,146,74,0.04)'
      for (let i = 0; i < SCROLL_W; i += 40) {
        ctx.fillRect(i, 0, 1, SCROLL_H)
      }

      // 上下边饰
      ctx.strokeStyle = 'rgba(184,146,74,0.4)'
      ctx.lineWidth = 3
      ctx.strokeRect(24, 24, SCROLL_W - 48, SCROLL_H - 48)

      // 标题
      ctx.fillStyle = '#d8c9a8'
      ctx.font = 'bold 36px "Noto Serif SC", serif'
      ctx.textAlign = 'left'
      ctx.textBaseline = 'top'
      ctx.fillText('山海长卷', 52, 48)

      ctx.fillStyle = '#8a7d63'
      ctx.font = '18px sans-serif'
      ctx.fillText(
        `已收集 ${template.collectedCount} / ${template.totalCount}  ·  当前：${creature.name}`,
        52,
        92,
      )

      // 切片区域
      const sliceCount = template.slices.length
      const gap = 16
      const marginX = 52
      const marginY = 140
      const availableW = SCROLL_W - marginX * 2
      const availableH = SCROLL_H - marginY - 80
      const sliceW = Math.floor((availableW - gap * (sliceCount - 1)) / sliceCount)
      const sliceH = availableH

      for (let i = 0; i < sliceCount; i++) {
        const slice = template.slices[i]
        const x = marginX + i * (sliceW + gap)
        const y = marginY

        // 切片背景
        ctx.fillStyle = slice.collected ? '#2a2418' : '#1a1814'
        ctx.fillRect(x, y, sliceW, sliceH)

        // 是否当前神兽高亮
        const isFocus = slice.creature.id === creature.id
        if (isFocus) {
          ctx.strokeStyle = '#c9a227'
          ctx.lineWidth = 3
          ctx.strokeRect(x - 2, y - 2, sliceW + 4, sliceH + 4)
        } else {
          ctx.strokeStyle = slice.collected ? 'rgba(184,146,74,0.25)' : 'rgba(90,80,64,0.25)'
          ctx.lineWidth = 1
          ctx.strokeRect(x, y, sliceW, sliceH)
        }

        // 画像或占位
        if (slice.collected && slice.creature.image) {
          try {
            const img = await loadImage(slice.creature.image)
            const ratio = img.width / img.height
            const boxRatio = sliceW / sliceH
            let sx = 0
            let sy = 0
            let sw = img.width
            let sh = img.height
            if (ratio > boxRatio) {
              sw = img.height * boxRatio
              sx = (img.width - sw) / 2
            } else {
              sh = img.width / boxRatio
              sy = (img.height - sh) / 2
            }
            ctx.save()
            ctx.beginPath()
            ctx.rect(x, y, sliceW, sliceH)
            ctx.clip()
            ctx.drawImage(img, sx, sy, sw, sh, x, y, sliceW, sliceH)
            ctx.restore()
          } catch {
            drawPlaceholder(ctx, slice.creature.name, x, y, sliceW, sliceH)
          }
        } else {
          drawPlaceholder(ctx, slice.collected ? slice.creature.name : '？', x, y, sliceW, sliceH)
        }

        // 切片名称
        ctx.fillStyle = slice.collected ? '#d8c9a8' : '#5a5040'
        ctx.font = `bold ${Math.min(18, sliceW / 4)}px "Noto Serif SC", serif`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'bottom'
        ctx.fillText(slice.creature.name, x + sliceW / 2, y + sliceH - 12)
      }

      // 底部提示
      ctx.fillStyle = '#5a5040'
      ctx.font = '16px sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'bottom'
      ctx.fillText('山海寻迹 · 收集属于你的神兽长卷', SCROLL_W / 2, SCROLL_H - 36)

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
  }, [creature, onExport, previewUrl, template])

  const handleDownload = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.toBlob((blob) => {
      if (!blob) return
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `山海寻迹-${creature.name}-长卷.png`
      a.click()
      URL.revokeObjectURL(url)
    })
  }, [creature.name])

  return (
    <div className="space-y-4" data-testid="scroll-share-card">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={generateScroll}
          disabled={generating}
          className="px-4 py-2.5 bg-acc-cinnabar/20 text-acc-gold-bright border border-acc-cinnabar/50 rounded hover:bg-acc-cinnabar/30 transition-colors disabled:opacity-50"
        >
          {generating ? '绘制中…' : '生成长卷切片'}
        </button>
        {previewUrl && (
          <button
            type="button"
            onClick={handleDownload}
            data-testid="scroll-download"
            className="px-4 py-2.5 bg-acc-bronze/20 text-ink-heaven border border-acc-bronze/40 rounded hover:bg-acc-bronze/30 transition-colors"
          >
            下载 PNG
          </button>
        )}
      </div>

      {previewUrl && (
        <div className="animate-fade-in">
          <p className="text-ink-faint text-xs mb-2">山海长卷预览（1200×600）：</p>
          <img
            src={previewUrl}
            alt={`${creature.name} 山海长卷`}
            className="max-h-[300px] max-w-full w-auto rounded-lg border border-acc-bronze/30"
          />
        </div>
      )}

      <canvas ref={canvasRef} className="hidden" />
    </div>
  )
}

function drawPlaceholder(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  w: number,
  h: number,
) {
  ctx.save()
  ctx.fillStyle = 'rgba(184,146,74,0.08)'
  ctx.fillRect(x, y, w, h)
  ctx.fillStyle = '#5a5040'
  ctx.font = `bold ${Math.min(48, w / 3)}px "Noto Serif SC", serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(text, x + w / 2, y + h / 2)
  ctx.restore()
}
