import { useEffect } from 'react'
import { getCreaturesByProvince } from '../data/loadCreatures'
import { useCollection } from '../collection/useCollection'

interface ProvincePreviewSheetProps {
  province: string
  onExplore: () => void
  onList: () => void
  onClose: () => void
}

/* ── 省份预览浮层 ── */
export function ProvincePreviewSheet({ province, onExplore, onList, onClose }: ProvincePreviewSheetProps) {
  const provinceCreatures = getCreaturesByProvince(province)
  const discovered = useCollection((s) => s.discovered)

  // 弹窗打开时：锁定背景滚动 + 支持 ESC 关闭，彻底隔绝底层地图交互
  useEffect(() => {
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prevOverflow
      window.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-[2000] flex items-end sm:items-center justify-center bg-bg-deep p-0 sm:p-4 animate-fade-in"
      onClick={onClose}
      onMouseMove={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      data-testid="province-preview-sheet"
      role="presentation"
      aria-label="关闭"
    >
      <div
        className="w-full max-w-2xl celestial-card rounded-t-2xl sm:rounded-2xl p-6 max-h-[80dvh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
        onMouseMove={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* 画框四角 */}
        <div className="ink-corner-tl" />
        <div className="ink-corner-tr" />
        <div className="ink-corner-bl" />
        <div className="ink-corner-br" />

        <div className="flex items-center justify-between mb-5 relative">
          <div>
            <div className="text-xs tracking-[0.4em] text-cinnabar/70 font-display mb-1">✦ 仙家指引 ✦</div>
            <h3 className="font-display text-2xl text-ink-heaven text-glow-cinnabar">{province}</h3>
            <p className="text-ink-dan text-sm mt-1">
              共有 <span className="text-immortal-gold font-display">{provinceCreatures.length}</span> 只神兽栖息于此
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-ink-dan hover:text-cinnabar text-xl px-3 py-2 transition-colors"
            aria-label="关闭"
          >
            ✕
          </button>
        </div>

        <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 mb-6">
          {provinceCreatures.slice(0, 12).map((c, i) => {
            const isDiscovered = discovered.includes(c.id)
            return (
              <div
                key={c.id}
                className={`aspect-square rounded-lg border overflow-hidden relative animate-fade-in ${
                  isDiscovered
                    ? 'border-immortal-gold/50 shadow-rune'
                    : 'border-ink-faint/20 opacity-50'
                }`}
                style={{ animationDelay: `${i * 0.05}s` }}
              >
                {c.image ? (
                  <img src={c.image} alt={c.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-celestial-mist text-cinnabar font-display text-lg">
                    {c.name.charAt(0)}
                  </div>
                )}
                {!isDiscovered && (
                  <div className="absolute inset-0 flex items-center justify-center bg-ink-heaven/40 text-[10px] text-celestial-white font-display">
                    未遇
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <div className="flex gap-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <button
            type="button"
            onClick={onExplore}
            className="flex-1 celestial-btn justify-center !py-3"
            style={{ color: 'var(--cinnabar)' }}
          >
            <span className="text-lg">✦</span>
            <span>探寻此地</span>
            <span className="text-lg">✦</span>
          </button>
          <button
            type="button"
            onClick={onList}
            className="flex-1 px-4 py-3 rounded-full bg-celestial-mist/60 text-ink-zhong border border-immortal-gold/40 hover:border-cinnabar hover:text-cinnabar transition-colors font-display"
          >
            查阅山海图鉴
          </button>
        </div>
      </div>
    </div>
  )
}
