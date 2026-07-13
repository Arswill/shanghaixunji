import { useMemo } from 'react'
import { creatures, type CreatureWithAssets } from '../data/loadCreatures'
import { useCollection } from './useCollection'
import { getRarity, RARITY_CONFIG } from './rarity'

/**
 * AI 探险手记 —— 山海见闻录。
 *
 * 按发现顺序记录每只已发现神兽的一条「见闻条目」，顶部生成个性化序言，
 * 底部在收集满 50% 时解锁结语。暗黑古卷风格。
 */

/** 见闻条目描述生成模板：根据 scroll / province / original_text 生成一句话。 */
export function buildJournalEntry(c: CreatureWithAssets): string {
  const source = c.original_text || c.description
  const prefix = source ? source.slice(0, 20) : ''
  const ellipsis = source.length > 20 ? '……' : ''
  return `于${c.province}遇${c.name}，《${c.scroll}》有载，"${prefix}${ellipsis}"`
}

/** 根据发现数量与稀有度分布生成序言。 */
function buildPrologue(discoveredList: CreatureWithAssets[]): string {
  const n = discoveredList.length
  if (n === 0) {
    return '山海浩渺，鸿蒙未判。吾携此卷，踏遍九州，尚无所见。今开卷以待，唯俟异兽自现于途。'
  }
  // 稀有度分布
  let ssr = 0, sr = 0, r = 0
  for (const c of discoveredList) {
    const rar = getRarity(c)
    if (rar === 'SSR') ssr++
    else if (rar === 'SR') sr++
    else r++
  }
  if (n < 5) {
    return `吾初涉山海，方遇异兽 ${n} 种。所见虽少，已觉天地之奇。卷帙初展，前路漫漫，未知之兽尚多，且行且记。`
  }
  if (n < 20) {
    return `行至中途，吾已录异兽 ${n} 种。其中传说 ${ssr}、稀有 ${sr}、常见 ${r}。山川渐熟，神兽渐稠，每至一处必有新遇，此卷渐丰。`
  }
  if (n < 50) {
    return `历九州、涉四海，吾已识异兽 ${n} 种，传说 ${ssr}、稀有 ${sr}、常见 ${r}。山海图卷过半，奇诡之兽纷至沓来，渐窥天地造化之全貌。`
  }
  return `跋涉万里，吾已收录异兽 ${n} 种，传说 ${ssr}、稀有 ${sr}、常见 ${r}。山海经中神兽几尽入吾卷，纵使最幽微之处亦有所得，此卷几成全帙。`
}

/** 结语：收集满 50% 解锁。 */
function buildEpilogue(discoveredList: CreatureWithAssets[], total: number): string | null {
  if (discoveredList.length / total < 0.5) return null
  const n = discoveredList.length
  if (n >= total) {
    return '山海经百兽尽入吾卷，自此图穷匕见，万类霜天竞自由。此卷既成，可传后世，使后来者按图索骥，复见上古神兽之容。是为结语。'
  }
  return `吾录异兽 ${n} 种，已逾半数。山海之奇，十之七八在此卷中。余者深藏幽冥，非大毅力大机缘不可得。然行百里者半九十，吾当勉力，以全此卷。是为结语。`
}

export function ExplorationJournal({ onClose }: { onClose?: () => void }) {
  const discovered = useCollection((s) => s.discovered)
  const total = creatures.length

  // 按发现顺序（discovered 数组顺序）解析神兽
  const discoveredList = useMemo<CreatureWithAssets[]>(
    () =>
      discovered
        .map((id) => creatures.find((c) => c.id === id))
        .filter((c): c is CreatureWithAssets => Boolean(c)),
    [discovered],
  )

  const prologue = useMemo(() => buildPrologue(discoveredList), [discoveredList])
  const epilogue = useMemo(() => buildEpilogue(discoveredList, total), [discoveredList, total])
  const rate = total > 0 ? discoveredList.length / total : 0

  return (
    <div
      data-testid="exploration-journal"
      className="relative bg-bg-deep border border-acc-bronze/40 rounded-lg p-5 sm:p-7 text-ink-primary"
      style={{
        backgroundImage:
          'radial-gradient(circle at 20% 10%, rgba(122,90,138,0.08), transparent 40%), radial-gradient(circle at 80% 90%, rgba(184,146,74,0.08), transparent 45%)',
      }}
    >
      {/* 装饰性边角 */}
      <div className="pointer-events-none absolute inset-0 rounded-lg border border-acc-gold/10" />

      {/* 顶部：序言 + 进度 */}
      <div className="relative mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-display text-xl text-acc-gold tracking-widest">山海见闻录</h3>
          <div className="flex items-center gap-3">
            <span className="text-xs text-ink-muted font-display">
              {discoveredList.length} / {total}
            </span>
            {onClose && (
              <button
                onClick={onClose}
                className="text-ink-faint hover:text-acc-gold transition-colors text-sm"
                aria-label="收起见闻录"
              >
                ✕
              </button>
            )}
          </div>
        </div>
        <div className="flex-1 h-2 bg-bg-base rounded-full overflow-hidden border border-acc-bronze/20 mb-4">
          <div
            className="h-full bg-gradient-to-r from-acc-bronze via-acc-gold to-acc-cinnabar transition-all duration-500"
            style={{ width: `${rate * 100}%` }}
          />
        </div>
        <p className="font-display text-sm leading-relaxed text-ink-muted indent-7 first-letter:text-acc-gold first-letter:text-lg">
          {prologue}
        </p>
      </div>

      {/* 见闻条目列表 */}
      {discoveredList.length === 0 ? (
        <div className="text-center py-10 text-ink-faint font-display">
          <p className="text-3xl mb-2">🕯</p>
          <p className="text-sm">尚未有所见闻，且去山海间寻访异兽……</p>
        </div>
      ) : (
        <ul className="space-y-3 max-h-[28rem] overflow-y-auto pr-2">
          {discoveredList.map((c, idx) => {
            const rarity = getRarity(c)
            const config = RARITY_CONFIG[rarity]
            return (
              <li
                key={c.id}
                data-testid={`journal-entry-${c.id}`}
                className="flex gap-3 items-start bg-bg-raised/60 border border-acc-bronze/20 rounded-md p-3 hover:border-acc-gold/40 transition-colors"
              >
                {/* 缩略图 */}
                <div
                  className="w-12 h-12 shrink-0 rounded border overflow-hidden flex items-center justify-center bg-bg-deep"
                  style={{ borderColor: config.color }}
                >
                  {c.image ? (
                    <img src={c.image} alt={c.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="font-display text-ink-primary text-lg">{c.name[0]}</span>
                  )}
                </div>
                {/* 文字 */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-display text-acc-gold text-sm">第 {idx + 1} 只</span>
                    <span className="font-display text-ink-primary text-sm">{c.name}</span>
                    <span className="text-xs" style={{ color: config.color }}>{config.stars}</span>
                  </div>
                  <p className="text-xs leading-relaxed text-ink-muted">{buildJournalEntry(c)}</p>
                </div>
              </li>
            )
          })}
        </ul>
      )}

      {/* 底部：结语（满 50% 解锁） */}
      {epilogue && (
        <div className="relative mt-6 pt-4 border-t border-acc-bronze/30">
          <p className="font-display text-sm leading-relaxed text-ink-muted indent-7 first-letter:text-acc-cinnabar first-letter:text-lg">
            {epilogue}
          </p>
        </div>
      )}
    </div>
  )
}
