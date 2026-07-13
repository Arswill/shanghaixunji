import { useRef, useCallback, useState, useMemo } from 'react'
import type { CreatureWithAssets } from '../data/loadCreatures'
import { detectPersonality, type Personality } from '../chat/chatPrompts'
import { getRarity, RARITY_CONFIG } from '../collection/rarity'
import { getEncounterTemplateData, loadImage, canvasToBlob } from './shareTemplates'

interface EncounterShareCardProps {
  creature: CreatureWithAssets
  collectedCount?: number
  collectNumber?: number
  onExport?: (url: string) => void
}

/** 画布尺寸：9:16 竖版海报。 */
export const ENCOUNTER_CARD_W = 750
export const ENCOUNTER_CARD_H = 1334

/** 性格 → 分享卡氛围配置。 */
const PERSONALITY_CARD_STYLE: Record<
  Personality,
  {
    topColor: string
    bottomColor: string
    accent: string
    particle: string
    seal: string
  }
> = {
  ferocious: {
    topColor: '#1f100c',
    bottomColor: '#0a0504',
    accent: '#a8332a',
    particle: 'rgba(168,51,42,0.35)',
    seal: '凶猛',
  },
  auspicious: {
    topColor: '#1a1810',
    bottomColor: '#0e0c08',
    accent: '#c9a227',
    particle: 'rgba(201,162,39,0.35)',
    seal: '祥瑞',
  },
  disastrous: {
    topColor: '#0c1418',
    bottomColor: '#05080a',
    accent: '#2a5a6a',
    particle: 'rgba(42,90,106,0.4)',
    seal: '灾厄',
  },
  mysterious: {
    topColor: '#161412',
    bottomColor: '#0a0908',
    accent: '#7a6438',
    particle: 'rgba(184,146,74,0.3)',
    seal: '神秘',
  },
}

export function EncounterShareCard({
  creature,
  collectedCount = 0,
  collectNumber,
  onExport,
}: EncounterShareCardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [generating, setGenerating] = useState(false)

  const personality = useMemo(() => detectPersonality(creature), [creature])
  const style = PERSONALITY_CARD_STYLE[personality]
  const rarity = useMemo(() => getRarity(creature), [creature])
  const rarityConfig = RARITY_CONFIG[rarity]
  const template = useMemo(
    () => getEncounterTemplateData(creature, collectedCount, collectNumber),
    [creature, collectedCount, collectNumber],
  )

  const goldenQuote = useMemo(() => {
    const text = creature.original_text
    if (text.length <= 28) return text
    const firstSentence = text.split(/[。；]/)[0]
    if (firstSentence && firstSentence.length <= 36) return `${firstSentence}。`
    return `${text.slice(0, 32)}……`
  }, [creature.original_text])

  const drawParticles = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      ctx.save()
      for (let i = 0; i < 40; i++) {
        const x = Math.random() * ENCOUNTER_CARD_W
        const y = Math.random() * ENCOUNTER_CARD_H
        const r = Math.random() * 2.5 + 0.5
        ctx.globalAlpha = Math.random() * 0.5 + 0.1
        ctx.fillStyle = style.particle
        ctx.beginPath()
        ctx.arc(x, y, r, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.restore()
    },
    [style.particle],
  )

  const generateCard = useCallback(async () => {
    const canvas = canvasRef.current
    if (!canvas) return

    setGenerating(true)
    try {
      canvas.width = ENCOUNTER_CARD_W
      canvas.height = ENCOUNTER_CARD_H
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      // ── 1. 性格化渐变背景 ──
      const bg = ctx.createLinearGradient(0, 0, 0, ENCOUNTER_CARD_H)
      bg.addColorStop(0, style.topColor)
      bg.addColorStop(0.6, '#0e0c09')
      bg.addColorStop(1, style.bottomColor)
      ctx.fillStyle = bg
      ctx.fillRect(0, 0, ENCOUNTER_CARD_W, ENCOUNTER_CARD_H)

      // 纹理：暗角 + 中心微光
      const vignette = ctx.createRadialGradient(
        ENCOUNTER_CARD_W / 2,
        ENCOUNTER_CARD_H / 2,
        100,
        ENCOUNTER_CARD_W / 2,
        ENCOUNTER_CARD_H / 2,
        ENCOUNTER_CARD_H * 0.8,
      )
      vignette.addColorStop(0, 'rgba(255,255,255,0.02)')
      vignette.addColorStop(1, 'rgba(0,0,0,0.45)')
      ctx.fillStyle = vignette
      ctx.fillRect(0, 0, ENCOUNTER_CARD_W, ENCOUNTER_CARD_H)

      // 粒子层
      drawParticles(ctx)

      // ── 2. 外框与顶部装饰线 ──
      ctx.strokeStyle = 'rgba(184, 146, 74, 0.35)'
      ctx.lineWidth = 2
      ctx.strokeRect(24, 24, ENCOUNTER_CARD_W - 48, ENCOUNTER_CARD_H - 48)

      const topY = 110
      ctx.strokeStyle = 'rgba(184, 146, 74, 0.5)'
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.moveTo(120, topY)
      ctx.lineTo(290, topY)
      ctx.moveTo(460, topY)
      ctx.lineTo(630, topY)
      ctx.stroke()

      // 中央菱形装饰
      ctx.fillStyle = style.accent
      ctx.beginPath()
      ctx.moveTo(375, topY - 8)
      ctx.lineTo(383, topY)
      ctx.lineTo(375, topY + 8)
      ctx.lineTo(367, topY)
      ctx.closePath()
      ctx.fill()

      // ── 3. Logo / 项目名 ──
      ctx.fillStyle = '#d8c9a8'
      ctx.font = 'bold 42px "Noto Serif SC", serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('山海寻迹', ENCOUNTER_CARD_W / 2, topY + 52)

      ctx.fillStyle = '#8a7d63'
      ctx.font = '18px sans-serif'
      ctx.fillText('SHANHAI XUNJI', ENCOUNTER_CARD_W / 2, topY + 92)

      // ── 4. 性格印章 ──
      const sealY = 230
      ctx.strokeStyle = style.accent
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.arc(ENCOUNTER_CARD_W / 2, sealY, 36, 0, Math.PI * 2)
      ctx.stroke()
      ctx.fillStyle = style.accent
      ctx.font = 'bold 24px "Noto Serif SC", serif'
      ctx.fillText(style.seal, ENCOUNTER_CARD_W / 2, sealY)

      // ── 5. 神兽画像 ──
      const imgBox = { x: 135, y: 300, w: 480, h: 480 }
      const glow = ctx.createRadialGradient(
        ENCOUNTER_CARD_W / 2,
        imgBox.y + imgBox.h / 2,
        80,
        ENCOUNTER_CARD_W / 2,
        imgBox.y + imgBox.h / 2,
        320,
      )
      glow.addColorStop(0, rarityConfig.color)
      glow.addColorStop(1, 'transparent')
      ctx.fillStyle = glow
      ctx.fillRect(0, 0, ENCOUNTER_CARD_W, ENCOUNTER_CARD_H)

      ctx.strokeStyle = rarityConfig.color
      ctx.lineWidth = 3
      ctx.strokeRect(imgBox.x - 2, imgBox.y - 2, imgBox.w + 4, imgBox.h + 4)
      ctx.fillStyle = '#242017'
      ctx.fillRect(imgBox.x, imgBox.y, imgBox.w, imgBox.h)

      await drawCreatureImage(ctx, creature, imgBox)

      // ── 6. 名称 + 拼音 ──
      const nameY = 880
      ctx.fillStyle = '#d8c9a8'
      ctx.font = 'bold 80px "Noto Serif SC", serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(creature.name, ENCOUNTER_CARD_W / 2, nameY)

      ctx.fillStyle = '#8a7d63'
      ctx.font = '28px sans-serif'
      ctx.fillText(creature.pinyin, ENCOUNTER_CARD_W / 2, nameY + 58)

      // ── 7. 稀有度 ──
      const rarityY = nameY + 120
      ctx.fillStyle = rarityConfig.color
      ctx.font = 'bold 40px sans-serif'
      ctx.fillText(rarityConfig.stars, ENCOUNTER_CARD_W / 2, rarityY)
      ctx.font = '22px sans-serif'
      ctx.fillText(rarityConfig.label, ENCOUNTER_CARD_W / 2, rarityY + 38)

      // ── 8. 原文金句 ──
      const quoteY = rarityY + 110
      ctx.fillStyle = '#d8c9a8'
      ctx.font = '28px "Noto Serif SC", serif'
      ctx.textAlign = 'center'
      const quoteLines = wrapText(ctx, `「${goldenQuote}」`, ENCOUNTER_CARD_W - 120)
      let lineY = quoteY
      for (const line of quoteLines.slice(0, 3)) {
        ctx.fillText(line, ENCOUNTER_CARD_W / 2, lineY)
        lineY += 44
      }

      // ── 9. 收集序号 ──
      ctx.fillStyle = style.accent
      ctx.font = 'bold 26px sans-serif'
      ctx.textAlign = 'right'
      ctx.textBaseline = 'top'
      ctx.fillText(`No. ${String(template.collectNumber).padStart(3, '0')}`, ENCOUNTER_CARD_W - 48, 48)

      // ── 10. 出处与底部 ──
      ctx.fillStyle = '#5a5040'
      ctx.font = '20px sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(
        `${creature.source} · ${creature.scroll} · ${creature.province}`,
        ENCOUNTER_CARD_W / 2,
        ENCOUNTER_CARD_H - 110,
      )

      ctx.fillStyle = '#5a5040'
      ctx.font = '18px sans-serif'
      ctx.fillText('山海寻迹 · TRAE AI 创意大赛', ENCOUNTER_CARD_W / 2, ENCOUNTER_CARD_H - 70)

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
  }, [creature, drawParticles, goldenQuote, onExport, previewUrl, rarityConfig, style, template])

  const handleDownload = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.toBlob((blob) => {
      if (!blob) return
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `山海寻迹-${creature.name}-遭遇.png`
      a.click()
      URL.revokeObjectURL(url)
    })
  }, [creature.name])

  return (
    <div className="space-y-4" data-testid="encounter-share-card">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={generateCard}
          disabled={generating}
          className="px-4 py-2.5 bg-acc-cinnabar/20 text-acc-gold-bright border border-acc-cinnabar/50 rounded hover:bg-acc-cinnabar/30 transition-colors disabled:opacity-50"
        >
          {generating ? '绘制中…' : '生成遭遇海报'}
        </button>
        {previewUrl && (
          <button
            type="button"
            onClick={handleDownload}
            data-testid="encounter-download"
            className="px-4 py-2.5 bg-acc-bronze/20 text-ink-heaven border border-acc-bronze/40 rounded hover:bg-acc-bronze/30 transition-colors"
          >
            下载 PNG
          </button>
        )}
      </div>

      {previewUrl && (
        <div className="animate-fade-in">
          <p className="text-ink-faint text-xs mb-2">遭遇瞬间预览（750×1334）：</p>
          <img
            src={previewUrl}
            alt={`${creature.name} 遭遇海报`}
            className="max-h-[480px] max-w-full w-auto rounded-lg border border-acc-bronze/30"
          />
        </div>
      )}

      <canvas ref={canvasRef} className="hidden" />
    </div>
  )
}

/**
 * 将神兽图片绘制到指定矩形区域（保持比例、居中裁切）。
 */
async function drawCreatureImage(
  ctx: CanvasRenderingContext2D,
  creature: CreatureWithAssets,
  box: { x: number; y: number; w: number; h: number },
): Promise<void> {
  if (!creature.image) {
    ctx.fillStyle = '#d8c9a8'
    ctx.font = 'bold 120px "Noto Serif SC", serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(creature.name, box.x + box.w / 2, box.y + box.h / 2)
    return
  }

  try {
    const img = await loadImage(creature.image)
    const imgRatio = img.width / img.height
    const boxRatio = box.w / box.h
    let sx = 0
    let sy = 0
    let sw = img.width
    let sh = img.height
    if (imgRatio > boxRatio) {
      sw = img.height * boxRatio
      sx = (img.width - sw) / 2
    } else {
      sh = img.width / boxRatio
      sy = (img.height - sh) / 2
    }
    ctx.drawImage(img, sx, sy, sw, sh, box.x, box.y, box.w, box.h)
  } catch {
    ctx.fillStyle = '#d8c9a8'
    ctx.font = 'bold 120px "Noto Serif SC", serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(creature.name, box.x + box.w / 2, box.y + box.h / 2)
  }
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const chars = text.split('')
  const lines: string[] = []
  let current = ''
  for (const char of chars) {
    const test = current + char
    if (ctx.measureText(test).width > maxWidth && current) {
      lines.push(current)
      current = char
    } else {
      current = test
    }
  }
  if (current) lines.push(current)
  return lines
}
