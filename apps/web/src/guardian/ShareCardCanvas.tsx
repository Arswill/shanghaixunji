import { useRef, useCallback, useState } from 'react'
import type { CreatureWithAssets } from '../data/loadCreatures'
import { getRarity, RARITY_CONFIG } from '../collection/rarity'

interface ShareCardCanvasProps {
  /** 被选为守护神的神兽 */
  creature: CreatureWithAssets
  /** 用户所在的省份（用于印章） */
  province: string
  /** 守护神称号（由稀有度生成，如"天命守护"） */
  guardianTitle: string
}

/** 分享卡画布尺寸（手机竖屏）。 */
const CARD_W = 750
const CARD_H = 1334

/**
 * 家乡守护神 · 分享卡生成器
 *
 * 使用 Canvas API 绘制 750x1334 的竖屏分享图，暗黑奇幻风格：
 * 深色渐变背景 + 金色装饰线 + 神兽画像 + 省份印章 + 稀有度与称号。
 * 通过 `canvas.toBlob()` 生成可下载的 PNG 图片。
 */
export function ShareCardCanvas({ creature, province, guardianTitle }: ShareCardCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [generating, setGenerating] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  const rarity = getRarity(creature)
  const rarityConfig = RARITY_CONFIG[rarity]

  /**
   * 绘制分享卡并生成预览 / 下载。
   */
  const drawCard = useCallback(async () => {
    const canvas = canvasRef.current
    if (!canvas) return

    setGenerating(true)
    try {
      canvas.width = CARD_W
      canvas.height = CARD_H
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      // ── 1. 背景渐变 #0e0c09 → #1a1814 ──
      const bg = ctx.createLinearGradient(0, 0, 0, CARD_H)
      bg.addColorStop(0, '#1a1814')
      bg.addColorStop(1, '#0e0c09')
      ctx.fillStyle = bg
      ctx.fillRect(0, 0, CARD_W, CARD_H)

      // 整体金色细边框
      ctx.strokeStyle = 'rgba(184, 146, 74, 0.35)'
      ctx.lineWidth = 2
      ctx.strokeRect(24, 24, CARD_W - 48, CARD_H - 48)

      // ── 2. 顶部金色装饰线 + "山海寻迹" 标题 ──
      const topY = 110
      // 左右装饰线
      ctx.strokeStyle = 'rgba(184, 146, 74, 0.6)'
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.moveTo(120, topY)
      ctx.lineTo(290, topY)
      ctx.moveTo(460, topY)
      ctx.lineTo(630, topY)
      ctx.stroke()
      // 中央菱形装饰
      ctx.fillStyle = '#b8924a'
      ctx.beginPath()
      ctx.moveTo(375, topY - 8)
      ctx.lineTo(383, topY)
      ctx.lineTo(375, topY + 8)
      ctx.lineTo(367, topY)
      ctx.closePath()
      ctx.fill()

      ctx.fillStyle = '#d8c9a8'
      ctx.font = 'bold 44px "Noto Serif SC", serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('山海寻迹', CARD_W / 2, topY + 50)

      ctx.fillStyle = '#8a7d63'
      ctx.font = '20px sans-serif'
      ctx.fillText('Shanhai Xunji · 家乡守护神', CARD_W / 2, topY + 92)

      // ── 3. 中部神兽画像 ──
      const imgBox = { x: 175, y: 270, w: 400, h: 400 }
      // 画像边框（按稀有度配色）
      ctx.strokeStyle = rarityConfig.color
      ctx.lineWidth = 3
      ctx.strokeRect(imgBox.x - 2, imgBox.y - 2, imgBox.w + 4, imgBox.h + 4)
      // 画像背景
      ctx.fillStyle = '#242017'
      ctx.fillRect(imgBox.x, imgBox.y, imgBox.w, imgBox.h)

      const drewImage = await drawCreatureImage(ctx, creature, imgBox)
      if (!drewImage) {
        // 没有图片：居中绘制神兽名
        ctx.fillStyle = '#d8c9a8'
        ctx.font = 'bold 120px "Noto Serif SC", serif'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(creature.name, imgBox.x + imgBox.w / 2, imgBox.y + imgBox.h / 2)
      }

      // ── 4. 画像下方省份印章（红色圆形印章风格） ──
      const seal = { x: CARD_W / 2, y: 770, r: 78 }
      // 印章外圆
      ctx.fillStyle = '#a8332a'
      ctx.beginPath()
      ctx.arc(seal.x, seal.y, seal.r, 0, Math.PI * 2)
      ctx.fill()
      // 印章内圈留白
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)'
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.arc(seal.x, seal.y, seal.r - 10, 0, Math.PI * 2)
      ctx.stroke()
      // 印章文字（省份名，白色）
      ctx.fillStyle = '#ffffff'
      ctx.font = 'bold 44px "Noto Serif SC", serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(province, seal.x, seal.y)
      // 印章下方小字
      ctx.fillStyle = '#8a7d63'
      ctx.font = '22px sans-serif'
      ctx.fillText('故土印记', seal.x, seal.y + seal.r + 28)

      // ── 5. 底部：稀有度星级 + 守护神文案 + 称号 ──
      const bottomY = 980
      // 稀有度星级
      ctx.fillStyle = rarityConfig.color
      ctx.font = 'bold 40px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(rarityConfig.stars, CARD_W / 2, bottomY)
      ctx.fillStyle = rarityConfig.color
      ctx.font = '22px sans-serif'
      ctx.fillText(rarityConfig.label, CARD_W / 2, bottomY + 36)

      // "我的家乡守护神是{神兽名}"
      ctx.fillStyle = '#d8c9a8'
      ctx.font = 'bold 38px "Noto Serif SC", serif'
      ctx.fillText('我的家乡守护神是', CARD_W / 2, bottomY + 96)

      ctx.fillStyle = '#b8924a'
      ctx.font = 'bold 72px "Noto Serif SC", serif'
      ctx.fillText(creature.name, CARD_W / 2, bottomY + 170)

      // 守护神称号
      ctx.fillStyle = '#d8c9a8'
      ctx.font = '32px "Noto Serif SC", serif'
      ctx.fillText(`「${guardianTitle}」`, CARD_W / 2, bottomY + 235)

      // ── 6. 最底部小字 ──
      ctx.fillStyle = '#5a5040'
      ctx.font = '20px sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('山海寻迹 · TRAE AI 创意大赛', CARD_W / 2, CARD_H - 70)

      // 生成预览 URL
      const blob = await canvasToBlob(canvas)
      if (blob) {
        if (previewUrl) URL.revokeObjectURL(previewUrl)
        setPreviewUrl(URL.createObjectURL(blob))
      }
    } finally {
      setGenerating(false)
    }
  }, [creature, province, guardianTitle, rarityConfig, previewUrl])

  /** 下载当前分享卡为 PNG。 */
  const handleDownload = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.toBlob((blob) => {
      if (!blob) return
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `守护神-${creature.name}-${province}.png`
      a.click()
      URL.revokeObjectURL(url)
    })
  }, [creature, province])

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={drawCard}
          disabled={generating}
          data-testid="guardian-share-generate"
          className="px-4 py-2.5 bg-acc-bronze/20 text-ink-heaven border border-acc-bronze/40 rounded hover:bg-acc-bronze/30 transition-colors text-sm disabled:opacity-50"
        >
          {generating ? '绘制中…' : '生成分享图'}
        </button>
        {previewUrl && (
          <button
            onClick={handleDownload}
            data-testid="guardian-share-download"
            className="px-4 py-2.5 bg-acc-cinnabar/20 text-acc-gold-bright border border-acc-cinnabar/50 rounded hover:bg-acc-cinnabar/30 transition-colors text-sm"
          >
            保存图片
          </button>
        )}
      </div>

      {previewUrl && (
        <div className="mt-2">
          <p className="text-ink-faint text-xs mb-2">分享图预览：</p>
          <img
            src={previewUrl}
            alt={`${creature.name} 守护神分享卡`}
            data-testid="guardian-share-preview"
            className="max-h-[480px] max-w-full w-auto rounded-lg border border-acc-bronze/30"
          />
        </div>
      )}

      {/* 隐藏的画布，用于绘制 */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  )
}

/**
 * 将神兽图片绘制到指定矩形区域（保持比例、居中裁切）。
 * @returns 是否成功绘制了图片
 */
async function drawCreatureImage(
  ctx: CanvasRenderingContext2D,
  creature: CreatureWithAssets,
  box: { x: number; y: number; w: number; h: number },
): Promise<boolean> {
  if (!creature.image) return false

  try {
    const img = await loadImage(creature.image)
    // 保持比例的居中裁切绘制（cover）
    const imgRatio = img.width / img.height
    const boxRatio = box.w / box.h
    let sx = 0, sy = 0, sw = img.width, sh = img.height
    if (imgRatio > boxRatio) {
      // 图片更宽，裁掉左右
      sw = img.height * boxRatio
      sx = (img.width - sw) / 2
    } else {
      // 图片更高，裁掉上下
      sh = img.width / boxRatio
      sy = (img.height - sh) / 2
    }
    ctx.drawImage(img, sx, sy, sw, sh, box.x, box.y, box.w, box.h)
    return true
  } catch {
    return false
  }
}

/** 加载一张图片，支持跨域；失败时 reject。 */
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`))
    img.src = src
  })
}

/** 将 canvas 转为 Blob（Promise 版）。 */
function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), 'image/png')
  })
}
