import { useMemo, useState } from 'react'
import { creatures, type CreatureWithAssets } from '../data/loadCreatures'
import { useCollection } from './useCollection'
import { getRarity, type Rarity } from './rarity'
import { useViewStore } from '../app/useViewStore'
import {
  VOLUMES,
  getVolumeProgress,
  isVolumeComplete,
  getCreaturesInVolume,
  type Volume,
} from './volumeConfig'
import { getCurrentSeasonCreatureIds } from './solarTerms'
import { SolarTermBanner } from './SolarTermBanner'
import { ShanhaiScroll } from './ShanhaiScroll'
import {
  getEvolutionStage,
  EVOLUTION_CONFIG,
  creaturesUntilNextEvolution,
} from './evolution'
import { ExplorationJournal } from './ExplorationJournal'
import './bestiary.css'

const RARITY_ORDER: Record<Rarity, number> = { SSR: 0, SR: 1, R: 2 }

const RARITY_XIAN = {
  SSR: { label: '仙品', icon: '✦✦✦', color: '#c8423a' },
  SR: { label: '灵品', icon: '✦✦', color: '#d4a857' },
  R: { label: '凡品', icon: '✦', color: '#4a8c6b' },
} as const

function sortByRarity(arr: CreatureWithAssets[]): CreatureWithAssets[] {
  return [...arr].sort((a, b) => RARITY_ORDER[getRarity(a)] - RARITY_ORDER[getRarity(b)])
}

export function BestiaryView() {
  const discovered = useCollection((s) => s.discovered)
  const goCreature = useViewStore((s) => s.goCreature)
  const total = creatures.length

  const [activeVolumeId, setActiveVolumeId] = useState<string | null>(null)
  const [showScroll, setShowScroll] = useState(false)
  const [showNarrative, setShowNarrative] = useState(false)
  const [showJournal, setShowJournal] = useState(false)
  const [search, setSearch] = useState('')

  const activeVolume = activeVolumeId
    ? VOLUMES.find((v) => v.id === activeVolumeId) ?? null
    : null

  const seasonIds = useMemo(() => new Set(getCurrentSeasonCreatureIds()), [])

  const visible = useMemo(() => {
    const base = activeVolume ? getCreaturesInVolume(activeVolume) : creatures
    return sortByRarity(base)
  }, [activeVolume])

  const filtered = useMemo(() => {
    if (!search.trim()) return visible
    const q = search.trim().toLowerCase()
    return visible.filter(
      (c) =>
        c.name.includes(q) ||
        c.pinyin.toLowerCase().includes(q) ||
        c.province.includes(q)
    )
  }, [visible, search])

  const totalProgress = total > 0 ? (discovered.length / total) * 100 : 0

  return (
    <div data-testid="bestiary-view" className="py-4">
      {/* ═══ 标题区：仙家题签 ═══ */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-3 mb-2">
          <span className="ink-divider w-12" />
          <span className="text-cinnabar text-sm font-display tracking-[0.3em]">✦ 山海图录 ✦</span>
          <span className="ink-divider w-12" />
        </div>
        <h2 className="font-brush text-4xl md:text-5xl text-cinnabar tracking-[0.15em] mt-3 text-glow-cinnabar">
          神兽图鉴
        </h2>
        <p className="text-ink-dan text-sm mt-2 font-display tracking-wider">
          {`仙元录 · 已收录 ${discovered.length} / ${total}`}
        </p>
      </div>

      {/* ═══ 总进度条：仙家金丹 ═══ */}
      <div className="mb-6 max-w-3xl mx-auto px-4">
        <div className="relative h-3 bg-celestial-paper rounded-full overflow-hidden border border-immortal-gold/30">
          <div
            className="h-full bg-gradient-to-r from-immortal-gold-deep via-immortal-gold to-immortal-gold-bright transition-all duration-700 relative"
            style={{ width: `${totalProgress}%` }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-celestial-white/30 to-transparent animate-shimmer" />
          </div>
        </div>
        <p className="text-center text-ink-faint text-[10px] mt-1.5 font-display tracking-widest">
          修真之路：{totalProgress.toFixed(0)}%
        </p>
      </div>

      {/* ═══ 节气限时神兽横幅 ═══ */}
      <div className="mb-6 max-w-3xl mx-auto px-4">
        <SolarTermBanner />
      </div>

      {/* ═══ 搜索栏 ═══ */}
      <div className="max-w-md mx-auto px-4 mb-4">
        <input
          type="text"
          inputMode="search"
          enterKeyHint="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="🔍 搜索神兽名称、拼音或省份…"
          className="w-full px-4 py-2 rounded-full celestial-card text-base font-display text-ink-zhong placeholder:text-ink-faint focus:outline-none focus:border-cinnabar"
          data-testid="bestiary-search"
        />
      </div>

      {/* ═══ 卷册标签页：仙家五经 ═══ */}
      <div className="mb-6 bestiary-tabs-scroll overflow-x-auto pb-1 px-4">
        <div className="flex gap-2 min-w-max">
          {VOLUMES.map((v) => {
            const { found, total: vTotal } = getVolumeProgress(v, discovered)
            const complete = isVolumeComplete(v, discovered)
            const active = activeVolumeId === v.id
            const pct = vTotal > 0 ? (found / vTotal) * 100 : 0
            return (
              <button
                key={v.id}
                data-testid={`volume-tab-${v.id}`}
                onClick={() => {
                  setActiveVolumeId(active ? null : v.id)
                  setShowScroll(false)
                  setShowNarrative(false)
                }}
                className={`relative shrink-0 rounded-xl border px-3 py-2 text-left transition-all celestial-card
                  ${active ? '!border-cinnabar' : ''}`}
                style={active ? { borderColor: v.color, boxShadow: `0 0 12px ${v.color}40` } : {}}
              >
                <div className="flex items-center gap-1.5">
                  <span
                    className="font-display text-sm"
                    style={{ color: active ? v.color : '#8a99b0' }}
                  >
                    {v.name}
                  </span>
                  {complete && <span className="text-immortal-gold text-xs animate-rune-pulse">✦</span>}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[11px] text-ink-dan whitespace-nowrap font-display">
                    {found}/{vTotal}
                  </span>
                  <div className="w-12 h-1 bg-celestial-paper rounded-full overflow-hidden border border-immortal-gold/20">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct}%`, backgroundColor: v.color }}
                    />
                  </div>
                </div>
              </button>
            )
          })}
          <button
            data-testid="bestiary-scroll-tab"
            onClick={() => {
              setShowScroll((s) => !s)
              setActiveVolumeId(null)
              setShowNarrative(false)
            }}
            className={`relative shrink-0 rounded-xl border px-3 py-2 text-left transition-all celestial-card
              ${showScroll ? '!border-immortal-gold' : ''}`}
          >
            <div className="flex items-center gap-1.5">
              <span
                className="font-display text-sm"
                style={{ color: showScroll ? '#d4a857' : '#8a99b0' }}
              >
                山海长卷
              </span>
            </div>
            <div className="text-[11px] text-ink-faint mt-1 whitespace-nowrap font-display">
              全景图鉴
            </div>
          </button>
        </div>
      </div>

      {activeVolume && !showScroll && (
        <VolumeHeader
          volume={activeVolume}
          discovered={discovered}
          showNarrative={showNarrative}
          onToggleNarrative={() => setShowNarrative((s) => !s)}
        />
      )}

      {showScroll ? (
        <ShanhaiScroll />
      ) : filtered.length === 0 ? (
        <p className="text-center text-acc-bronze/50 py-8">未找到匹配的神兽，换个关键词试试？</p>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3 px-4 max-w-6xl mx-auto">
          {filtered.map((c) => {
            const isFound = discovered.includes(c.id)
            const rarity = getRarity(c)
            const rarityXian = RARITY_XIAN[rarity]
            const inSeason = seasonIds.has(c.id)
            const stage = getEvolutionStage(c.id, discovered)
            const evoConfig = EVOLUTION_CONFIG[stage]
            const remaining = creaturesUntilNextEvolution(c.id, discovered)
            const evoTitle = isFound
              ? stage >= 3
                ? `${evoConfig.icon} ${evoConfig.name} · ${evoConfig.description}`
                : `${evoConfig.icon} ${evoConfig.name} · ${evoConfig.description} · 再探索 ${remaining} 只可进化`
              : ''

            const borderStyle = inSeason
              ? { borderColor: '#d4a857' }
              : { borderColor: isFound ? rarityXian.color : 'rgba(184, 197, 207, 0.3)' }
            const boxShadow = isFound
              ? `0 0 12px ${rarityXian.color}60`
              : 'none'

            return (
              <button
                key={c.id}
                data-testid={`bestiary-${c.id}`}
                onClick={() => isFound && goCreature(c.id)}
                disabled={!isFound}
                title={evoTitle}
                className={`relative aspect-square rounded-xl border-2 overflow-hidden transition-all celestial-card
                  ${
                    isFound
                      ? 'cursor-pointer hover:scale-105'
                      : 'cursor-not-allowed opacity-60'
                  } ${inSeason ? 'animate-rune-pulse' : ''}`}
                style={{ ...borderStyle, boxShadow: isFound ? boxShadow : undefined }}
              >
                {isFound ? (
                  <>
                    {c.image ? (
                      <img src={c.image} alt={c.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-celestial-paper">
                        <span className="font-brush text-cinnabar text-2xl">{c.name}</span>
                      </div>
                    )}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-ink-heaven/80 to-transparent px-1 py-0.5">
                      <p className="text-celestial-white text-[10px] text-center truncate font-display tracking-wider">
                        {c.name}
                      </p>
                    </div>
                    <span
                      className="absolute top-1 right-1 text-[10px] font-display font-bold"
                      style={{ color: rarityXian.color }}
                    >
                      {rarityXian.icon}
                    </span>
                    {inSeason && (
                      <span className="absolute top-1 left-1 text-[9px] rounded px-1 bg-immortal-gold text-ink-heaven font-display tracking-wider">
                        令
                      </span>
                    )}
                    <span
                      data-testid={`evo-stage-${c.id}`}
                      className="absolute bottom-1 right-1 text-sm leading-none drop-shadow"
                      title={evoTitle}
                    >
                      {evoConfig.icon}
                    </span>
                  </>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-celestial-paper">
                    <span className="text-ink-faint text-3xl">?</span>
                    <span className="text-ink-faint text-[10px] mt-1 font-display">{rarityXian.icon}</span>
                    {inSeason && (
                      <span className="absolute top-1 left-1 text-[9px] rounded px-1 bg-immortal-gold text-ink-heaven font-display">
                        令
                      </span>
                    )}
                  </div>
                )}
              </button>
            )
          })}
        </div>
      )}

      {/* ═══ 底部：山海见闻录入口 ═══ */}
      <div className="mt-10 pt-5 border-t border-immortal-gold/20 max-w-3xl mx-auto px-4">
        <div className="flex items-center justify-center gap-3 mb-3">
          <span className="ink-divider w-10" />
          <span className="text-cinnabar text-xs font-display tracking-[0.3em]">✦ 修真录 ✦</span>
          <span className="ink-divider w-10" />
        </div>
        <button
          data-testid="toggle-journal"
          onClick={() => setShowJournal((s) => !s)}
          className="w-full rounded-xl celestial-card !shadow-immortal hover:!border-cinnabar transition-all px-4 py-3 flex items-center justify-center gap-2"
        >
          <span className="text-immortal-gold text-base">🕯</span>
          <span className="font-display text-ink-zhong text-sm tracking-wider">
            {showJournal ? '收起山海见闻录' : '展开山海见闻录'}
          </span>
        </button>
        {showJournal && (
          <div className="bestiary-fade-in mt-4">
            <ExplorationJournal onClose={() => setShowJournal(false)} />
          </div>
        )}
      </div>
    </div>
  )
}

/** 当前卷册的小标题与「卷宗叙事」入口 — 仙侠版 */
function VolumeHeader({
  volume,
  discovered,
  showNarrative,
  onToggleNarrative,
}: {
  volume: Volume
  discovered: string[]
  showNarrative: boolean
  onToggleNarrative: () => void
}) {
  const complete = isVolumeComplete(volume, discovered)
  const { found, total } = getVolumeProgress(volume, discovered)

  return (
    <div className="mb-4 max-w-3xl mx-auto px-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <h3 className="font-brush text-2xl tracking-wider" style={{ color: volume.color }}>
            {volume.name}
            <span className="text-ink-dan text-sm font-display ml-2 tracking-wider">
              {volume.subtitle}
            </span>
          </h3>
          <p className="text-xs text-ink-faint mt-1 font-display">{volume.description}</p>
        </div>
        {complete && (
          <button
            data-testid="volume-narrative-btn"
            onClick={onToggleNarrative}
            className="shrink-0 rounded-md border px-3 py-1.5 text-xs font-display transition-colors celestial-card"
            style={{
              borderColor: volume.color,
              color: volume.color,
            }}
          >
            {showNarrative ? '收起卷宗叙事' : '卷宗叙事 ✦'}
          </button>
        )}
      </div>

      <div className="flex items-center gap-2 mt-3">
        <div className="flex-1 h-1.5 bg-celestial-paper rounded-full overflow-hidden border border-immortal-gold/30">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${total > 0 ? (found / total) * 100 : 0}%`,
              backgroundColor: volume.color,
            }}
          />
        </div>
        <span className="text-[11px] text-ink-dan whitespace-nowrap font-display">
          {found} / {total}
        </span>
      </div>

      {complete && showNarrative && (
        <div
          data-testid="volume-narrative"
          className="bestiary-fade-in mt-3 rounded-xl border celestial-card p-4"
        >
          <p className="font-display text-sm leading-loose text-ink-zhong indent-7">
            {volume.narrative}
          </p>
        </div>
      )}
    </div>
  )
}
