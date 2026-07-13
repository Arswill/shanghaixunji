import type { CreatureWithAssets } from '../data/loadCreatures'

/** 分享模板类型。 */
export type ShareTemplateType = 'encounter' | 'bond' | 'scroll'

/** 遭遇瞬间模板数据。 */
export interface EncounterTemplateData {
  /** 玩家已收集神兽总数。 */
  collectedCount: number
  /** 当前神兽在玩家收集序列中的序号（第几只）。 */
  collectNumber: number
}

/** 羁绊维度键。 */
export type BondDimensionKey = 'chat' | 'gift' | 'explore' | 'fate' | 'lore'

/** 羁绊维度定义。 */
export interface BondDimension {
  key: BondDimensionKey
  label: string
  /** 0-100 */
  value: number
}

/** 羁绊星图模板数据。 */
export interface BondTemplateData {
  dimensions: BondDimension[]
  /** 羁绊总值（0-500）。 */
  totalBond: number
}

/** 长卷切片项。 */
export interface ScrollSlice {
  creature: CreatureWithAssets
  collected: boolean
}

/** 山海长卷模板数据。 */
export interface ScrollTemplateData {
  slices: ScrollSlice[]
  /** 长卷中已收集数量。 */
  collectedCount: number
  /** 长卷总切片数。 */
  totalCount: number
}

/** 三种模板的中文标签。 */
export const SHARE_TEMPLATE_LABELS: Record<ShareTemplateType, string> = {
  encounter: '遭遇瞬间',
  bond: '羁绊星图',
  scroll: '山海长卷',
}

/** 默认五维标签。 */
export const BOND_DIMENSION_LABELS: Record<BondDimensionKey, string> = {
  chat: '聊天',
  gift: '赠礼',
  explore: '探索',
  fate: '缘分',
  lore: '传说',
}

/**
 * 获取遭遇瞬间模板数据。
 *
 * @param _creature 当前神兽（保留用于未来扩展，当前模板未使用）
 * @param collectedCount 玩家已收集总数
 * @param collectNumber 当前神兽收集序号（从 1 开始）；未提供时返回已收集总数 + 1
 */
export function getEncounterTemplateData(
  _creature: CreatureWithAssets,
  collectedCount: number,
  collectNumber?: number,
): EncounterTemplateData {
  return {
    collectedCount,
    collectNumber: collectNumber ?? Math.max(1, collectedCount + 1),
  }
}

/**
 * 获取默认羁绊数据。
 *
 * 维度值基于神兽与玩家的潜在互动：
 * - 聊天：以原文长度估算可聊深度（中等）
 * - 赠礼：与置信度相关（高置信度更易建立羁绊）
 * - 探索：与现代地考证完整度相关
 * - 缘分：与同 province / scroll 的神兽数量正相关
 * - 传说：与原文完整度相关
 */
export function getDefaultBondData(creature: CreatureWithAssets, allCreatures: CreatureWithAssets[] = []): BondTemplateData {
  const chat = Math.min(100, 30 + creature.original_text.length / 4)
  const gift = creature.confidence === 'high' ? 80 : creature.confidence === 'medium' ? 60 : 40
  const explore = Math.min(100, 30 + creature.modern_location.length * 2)
  const fate = allCreatures.filter((c) => c.id !== creature.id && (c.province === creature.province || c.scroll === creature.scroll)).length * 8 + 20
  const lore = Math.min(100, 25 + creature.original_text.length / 3)

  const dimensions: BondDimension[] = [
    { key: 'chat', label: BOND_DIMENSION_LABELS.chat, value: Math.round(chat) },
    { key: 'gift', label: BOND_DIMENSION_LABELS.gift, value: Math.round(gift) },
    { key: 'explore', label: BOND_DIMENSION_LABELS.explore, value: Math.round(explore) },
    { key: 'fate', label: BOND_DIMENSION_LABELS.fate, value: Math.round(Math.min(100, fate)) },
    { key: 'lore', label: BOND_DIMENSION_LABELS.lore, value: Math.round(lore) },
  ]

  return {
    dimensions,
    totalBond: dimensions.reduce((sum, d) => sum + d.value, 0),
  }
}

/**
 * 基于玩家真实互动数据计算羁绊五维。
 *
 * 将 bondStore 中的真实互动记录映射到五维：
 * - 聊天：chatCount → 每次 +10，满 10 次 100
 * - 赠礼：giftCount → 每次 +15，满 7 次 100
 * - 探索：encounterCount → 每次 +10，满 10 次 100
 * - 缘分：score → 每 3 分 1 维度，满 300 分 100
 * - 传说：evolutionStage（1/2/3）+ 原文长度
 *
 * @param creature 当前神兽
 * @param bond 玩家与该神兽的真实羁绊记录
 * @param evolutionStage 该神兽当前的进化阶段（1/2/3）
 */
export function getBondDimensions(
  creature: CreatureWithAssets,
  bond: { chatCount: number; giftCount: number; encounterCount: number; score: number },
  evolutionStage: number,
): BondDimension[] {
  const chat = Math.min(100, bond.chatCount * 10)
  const gift = Math.min(100, bond.giftCount * 15)
  const explore = Math.min(100, bond.encounterCount * 10)
  const fate = Math.min(100, Math.round(bond.score / 3))
  const lore = Math.min(
    100,
    Math.round(evolutionStage * 30 + creature.original_text.length / 6),
  )

  return [
    { key: 'chat', label: BOND_DIMENSION_LABELS.chat, value: chat },
    { key: 'gift', label: BOND_DIMENSION_LABELS.gift, value: gift },
    { key: 'explore', label: BOND_DIMENSION_LABELS.explore, value: explore },
    { key: 'fate', label: BOND_DIMENSION_LABELS.fate, value: fate },
    { key: 'lore', label: BOND_DIMENSION_LABELS.lore, value: lore },
  ]
}

/**
 * 获取山海长卷切片数据。
 *
 * 展示玩家已收集神兽，并在中间高亮当前神兽；未收集位置用占位切片补齐，
 * 使长卷始终呈现连续卷轴感。
 *
 * @param collectedCreatures 玩家已收集的神兽列表
 * @param allCreatures 全部神兽列表
 * @param focusCreatureId 当前要高亮的神兽 ID
 * @param maxSlices 最大切片数量（默认 12）
 */
export function getScrollTemplateData(
  collectedCreatures: CreatureWithAssets[],
  allCreatures: CreatureWithAssets[],
  focusCreatureId?: string,
  maxSlices = 12,
): ScrollTemplateData {
  const collectedIds = new Set(collectedCreatures.map((c) => c.id))

  // 已收集切片优先放在前面，当前关注对象置顶
  let slices: ScrollSlice[] = collectedCreatures.map((c) => ({
    creature: c,
    collected: true,
  }))

  if (focusCreatureId) {
    const focusIndex = slices.findIndex((s) => s.creature.id === focusCreatureId)
    if (focusIndex > 0) {
      const [focus] = slices.splice(focusIndex, 1)
      slices.unshift(focus)
    }
  }

  // 用未收集神兽填充剩余位置，保持长卷连续
  const remaining = maxSlices - slices.length
  if (remaining > 0) {
    const uncollected = allCreatures
      .filter((c) => !collectedIds.has(c.id))
      .slice(0, remaining)
    slices = slices.concat(uncollected.map((c) => ({ creature: c, collected: false })))
  }

  return {
    slices: slices.slice(0, maxSlices),
    collectedCount: collectedCreatures.length,
    totalCount: allCreatures.length,
  }
}

/** 雷达图绘制配置。 */
export interface RadarChartOptions {
  centerX: number
  centerY: number
  radius: number
  fillColor?: string
  strokeColor?: string
  gridColor?: string
  labelColor?: string
  font?: string
}

/**
 * 在 Canvas 上绘制五维雷达图。
 *
 * @param ctx Canvas 2D 上下文
 * @param dimensions 五个维度的值（0-100）
 * @param options 绘制配置
 */
export function drawRadarChart(
  ctx: CanvasRenderingContext2D,
  dimensions: BondDimension[],
  options: RadarChartOptions,
): void {
  const { centerX, centerY, radius } = options
  const count = dimensions.length
  if (count === 0) return

  const angleStep = (Math.PI * 2) / count
  const startAngle = -Math.PI / 2

  const gridColor = options.gridColor ?? 'rgba(184, 146, 74, 0.25)'
  const strokeColor = options.strokeColor ?? '#c9a227'
  const fillColor = options.fillColor ?? 'rgba(201, 162, 39, 0.25)'
  const labelColor = options.labelColor ?? '#d8c9a8'
  const font = options.font ?? 'bold 22px "Noto Serif SC", sans-serif'

  ctx.save()

  // 绘制网格（4 层）
  ctx.strokeStyle = gridColor
  ctx.lineWidth = 1
  for (let level = 1; level <= 4; level++) {
    const r = (radius * level) / 4
    ctx.beginPath()
    for (let i = 0; i < count; i++) {
      const angle = startAngle + i * angleStep
      const x = centerX + Math.cos(angle) * r
      const y = centerY + Math.sin(angle) * r
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.closePath()
    ctx.stroke()
  }

  // 绘制轴线
  ctx.beginPath()
  for (let i = 0; i < count; i++) {
    const angle = startAngle + i * angleStep
    ctx.moveTo(centerX, centerY)
    ctx.lineTo(centerX + Math.cos(angle) * radius, centerY + Math.sin(angle) * radius)
  }
  ctx.stroke()

  // 绘制数据区域
  const points = dimensions.map((d, i) => {
    const angle = startAngle + i * angleStep
    const r = (Math.min(100, Math.max(0, d.value)) / 100) * radius
    return {
      x: centerX + Math.cos(angle) * r,
      y: centerY + Math.sin(angle) * r,
    }
  })

  ctx.beginPath()
  points.forEach((p, i) => {
    if (i === 0) ctx.moveTo(p.x, p.y)
    else ctx.lineTo(p.x, p.y)
  })
  ctx.closePath()
  ctx.fillStyle = fillColor
  ctx.fill()
  ctx.strokeStyle = strokeColor
  ctx.lineWidth = 2.5
  ctx.stroke()

  // 绘制顶点
  points.forEach((p) => {
    ctx.beginPath()
    ctx.arc(p.x, p.y, 4, 0, Math.PI * 2)
    ctx.fillStyle = strokeColor
    ctx.fill()
  })

  // 绘制标签
  ctx.fillStyle = labelColor
  ctx.font = font
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  dimensions.forEach((d, i) => {
    const angle = startAngle + i * angleStep
    const labelRadius = radius + 34
    const x = centerX + Math.cos(angle) * labelRadius
    const y = centerY + Math.sin(angle) * labelRadius
    ctx.fillText(d.label, x, y)
  })

  ctx.restore()
}

/**
 * 将 Canvas 转换为 PNG Blob。
 */
export function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), 'image/png')
  })
}

/**
 * 加载图片并返回 HTMLImageElement。
 */
export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`))
    img.src = src
  })
}
