import { useMemo, useRef, useState } from 'react'
import { useCollection } from './useCollection'
import { useViewStore } from '../app/useViewStore'
import { creatures } from '../data/loadCreatures'
import {
  VOLUMES,
  getCreaturesInVolume,
  getVolumeProgress,
} from './volumeConfig'
import './bestiary.css'

const MIN_SCALE = 0.5
const MAX_SCALE = 1.5
const ZOOM_STEP = 0.1

/**
 * 山海全景长卷。
 *
 * 横向滚动的古卷轴视图，按五卷 + 海外大荒分区。
 * 已收集的神兽亮显，未收集的灰显/迷雾；点击已收集可跳转详情。
 * 支持横向拖拽与 Ctrl/⌘ + 滚轮缩放。
 */
export function ShanhaiScroll() {
  const discovered = useCollection((s) => s.discovered)
  const goCreature = useViewStore((s) => s.goCreature)

  const containerRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)
  const [dragging, setDragging] = useState(false)
  const dragOrigin = useRef({ x: 0, scrollLeft: 0 })

  const total = creatures.length
  const found = discovered.length

  const progressPct = total > 0 ? (found / total) * 100 : 0

  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault()
      const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP
      setScale((s) => Math.min(Math.max(s + delta, MIN_SCALE), MAX_SCALE))
    }
  }

  const startDrag = (e: React.MouseEvent) => {
    if (!containerRef.current) return
    setDragging(true)
    dragOrigin.current = {
      x: e.pageX - containerRef.current.offsetLeft,
      scrollLeft: containerRef.current.scrollLeft,
    }
  }

  const moveDrag = (e: React.MouseEvent) => {
    if (!dragging || !containerRef.current) return
    const x = e.pageX - containerRef.current.offsetLeft
    const walk = (x - dragOrigin.current.x) * 1.5
    containerRef.current.scrollLeft = dragOrigin.current.scrollLeft - walk
  }

  const endDrag = () => setDragging(false)

  const startTouchDrag = (e: React.TouchEvent) => {
    if (!containerRef.current || e.touches.length === 0) return
    setDragging(true)
    dragOrigin.current = {
      x: e.touches[0].clientX - containerRef.current.offsetLeft,
      scrollLeft: containerRef.current.scrollLeft,
    }
  }

  const moveTouchDrag = (e: React.TouchEvent) => {
    if (!dragging || !containerRef.current || e.touches.length === 0) return
    const x = e.touches[0].clientX - containerRef.current.offsetLeft
    const walk = (x - dragOrigin.current.x) * 1.5
    containerRef.current.scrollLeft = dragOrigin.current.scrollLeft - walk
  }

  return (
    <div data-testid="shanhai-scroll" className="space-y-4">
      {/* 长卷容器 */}
      <div
        ref={containerRef}
        onWheel={handleWheel}
        onMouseDown={startDrag}
        onMouseMove={moveDrag}
        onMouseUp={endDrag}
        onMouseLeave={endDrag}
        onTouchStart={startTouchDrag}
        onTouchMove={moveTouchDrag}
        onTouchEnd={endDrag}
        className="relative overflow-x-auto overflow-y-hidden rounded-xl border-y-4 border-x-2 border-acc-gold/50 bg-bg-deep/80 cursor-grab active:cursor-grabbing select-none"
        style={{
          backgroundImage:
            'linear-gradient(90deg, rgba(14,12,9,0.95) 0%, rgba(26,22,16,0.85) 50%, rgba(14,12,9,0.95) 100%)',
          scrollbarWidth: 'thin',
          touchAction: 'pan-x',
        }}
      >
        {/* 卷轴两端装饰 */}
        <div className="absolute left-0 top-0 bottom-0 w-3 bg-gradient-to-r from-acc-bronze/40 to-transparent pointer-events-none z-10" />
        <div className="absolute right-0 top-0 bottom-0 w-3 bg-gradient-to-l from-acc-bronze/40 to-transparent pointer-events-none z-10" />

        <div
          className="flex items-stretch gap-6 p-6 min-w-max transition-transform duration-200 ease-out origin-top-left"
          style={{ transform: `scale(${scale})` }}
        >
          {VOLUMES.map((volume) => (
            <VolumeSection
              key={volume.id}
              volume={volume}
              discovered={discovered}
              onCreatureClick={goCreature}
            />
          ))}
        </div>
      </div>

      {/* 缩放提示 */}
      <p className="text-[10px] text-ink-faint text-center">
        Ctrl / ⌘ + 滚轮缩放 · 拖拽横向滚动
      </p>

      {/* 底部总进度与卷册完成度 */}
      <div className="rounded-lg border border-acc-bronze/30 bg-bg-deep/60 px-4 py-3 space-y-3">
        <div>
          <div className="flex items-center justify-between text-sm text-ink-primary mb-1.5">
            <span className="font-display">收集总进度</span>
            <span className="text-acc-gold" data-testid="scroll-total-progress">
              {found}/{total}
            </span>
          </div>
          <div className="h-2.5 bg-bg-base rounded-full overflow-hidden border border-acc-bronze/20">
            <div
              className="h-full bg-gradient-to-r from-acc-bronze to-acc-gold transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
          {VOLUMES.map((volume) => {
            const { found: vFound, total: vTotal } = getVolumeProgress(
              volume,
              discovered,
            )
            const complete = vTotal > 0 && vFound >= vTotal
            return (
              <div
                key={volume.id}
                data-testid={`scroll-volume-summary-${volume.id}`}
                className="rounded border border-acc-bronze/20 bg-bg-deep/50 px-2 py-1.5"
              >
                <div className="flex items-center gap-1 text-xs">
                  <span
                    className="inline-block w-2 h-2 rounded-full"
                    style={{ backgroundColor: volume.color }}
                  />
                  <span className="text-ink-primary truncate">{volume.name}</span>
                  {complete && <span className="text-acc-gold text-xs">✦</span>}
                </div>
                <div className="text-[10px] text-ink-muted mt-0.5">
                  {vFound}/{vTotal}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function VolumeSection({
  volume,
  discovered,
  onCreatureClick,
}: {
  volume: (typeof VOLUMES)[number]
  discovered: string[]
  onCreatureClick: (creatureId: string) => void
}) {
  const volCreatures = useMemo(
    () => getCreaturesInVolume(volume),
    [volume],
  )
  const { found, total } = useMemo(
    () => getVolumeProgress(volume, discovered),
    [volume, discovered],
  )
  const complete = total > 0 && found >= total
  const pct = total > 0 ? (found / total) * 100 : 0

  return (
    <section
      data-testid={`scroll-volume-${volume.id}`}
      className="relative flex flex-col rounded-lg border border-acc-bronze/30 bg-black/40 p-4 min-w-[280px] max-w-[320px]"
      style={{
        backgroundImage: `linear-gradient(180deg, ${volume.color}08, transparent 40%)`,
      }}
    >
      {/* 水墨晕染背景 */}
      <div
        className="absolute inset-0 rounded-lg pointer-events-none opacity-30"
        style={{
          background: `radial-gradient(circle at 20% 30%, ${volume.color}22, transparent 50%)`,
        }}
      />

      <div className="relative mb-3 border-b border-acc-bronze/30 pb-2">
        <h3 className="font-display text-lg" style={{ color: volume.color }}>
          {volume.name}
        </h3>
        <p className="text-xs text-ink-muted">{volume.subtitle}</p>
        <div className="flex items-center justify-between mt-1.5">
          <span
            className="text-[10px] text-ink-muted"
            data-testid={`scroll-volume-progress-${volume.id}`}
          >
            {found}/{total}
          </span>
          {complete && (
            <span className="text-[10px] text-acc-gold">✦ 已集齐</span>
          )}
        </div>
        <div className="h-1 bg-bg-base rounded-full overflow-hidden mt-1">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${pct}%`, backgroundColor: volume.color }}
          />
        </div>
      </div>

      <div className="relative grid grid-cols-5 gap-1.5">
        {volCreatures.map((c) => {
          const isFound = discovered.includes(c.id)
          return (
            <button
              key={c.id}
              data-testid={`scroll-creature-${c.id}`}
              onClick={() => isFound && onCreatureClick(c.id)}
              disabled={!isFound}
              title={c.name}
              className={`relative aspect-square rounded border overflow-hidden transition ${
                isFound
                  ? 'cursor-pointer hover:scale-110 hover:z-10'
                  : 'cursor-not-allowed opacity-55 grayscale'
              }`}
              style={{ borderColor: isFound ? volume.color : '#3a3220' }}
            >
              {isFound ? (
                <>
                  {c.image ? (
                    <img
                      src={c.image}
                      alt={c.name}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover"
                      draggable={false}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-bg-raised">
                      <span className="font-display text-ink-primary text-lg">
                        {c.name[0]}
                      </span>
                    </div>
                  )}
                  <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-0.5">
                    <p className="text-[9px] text-white text-center truncate">
                      {c.name}
                    </p>
                  </div>
                </>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-bg-deep">
                  <span className="text-ink-faint text-sm">?</span>
                  {/* 迷雾遮罩 */}
                  <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-black/30 pointer-events-none" />
                </div>
              )}
            </button>
          )
        })}
      </div>
    </section>
  )
}
