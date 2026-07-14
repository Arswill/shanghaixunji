// src/app/HeroCreatureSection.tsx
// 第一区容器：100dvh 全屏，3D 场景 + 神兽信息 + 交互按钮

import { useState, useMemo } from 'react'
import { useGuardianStore } from '../guardian/guardianStore'
import { useCollection } from '../collection/useCollection'
import { getCurrentSeasonCreatureIds } from '../collection/solarTerms'
import { creatures } from '../data/loadCreatures'
import { CreatureCinematicViewer } from '../effects/CreatureCinematicViewer'
import { DialectPlayer } from './DialectPlayer'
import type { CreatureWithAssets } from '../data/loadCreatures'
import { has3DModel } from '../effects/creature-3d-manifest'

// 有 3D 模型 + 有方言音频的精选神兽（首页轮换池）
// 排除了 qi-lin(山西/无音频) 和 kun-peng(海南/无音频)
const FEATURED_IDS = [
  'jiu-wei-hu', 'ying-long', 'bi-fang', 'zhu-que',
  'bai-hu', 'bai-ze', 'xuan-wu', 'qiong-qi', 'xing-tian', 'tao-tie',
] as const

interface HeroCreatureSectionProps {
  onExplore: () => void
  goCreature: (id: string) => void
  setInitialMessage: (msg: string) => void
}

export function HeroCreatureSection({ onExplore, goCreature, setInitialMessage }: HeroCreatureSectionProps) {
  const discovered = useCollection((s) => s.discovered)
  const guardianProvince = useGuardianStore((s) => s.province)
  const [input, setInput] = useState('')

  // 神兽选择逻辑（混合策略）— 首页优先节气神兽，无3D时显示2D画像
  const creaturePool = useMemo(() => {
    const toCreature = (ids: string[]) =>
      ids.map(id => creatures.find(c => c.id === id)).filter(Boolean) as CreatureWithAssets[]

    // 优先级1：已定位家乡省的神兽
    if (guardianProvince) {
      const provinceCreatures = creatures.filter(c =>
        c.province === guardianProvince ||
        (guardianProvince === '两广' && (c.province === '广东' || c.province === '广西'))
      )
      if (provinceCreatures.length > 0) {
        const with3d = provinceCreatures.filter(c => has3DModel(c.id))
        const without3d = provinceCreatures.filter(c => !has3DModel(c.id))
        return [...with3d, ...without3d]
      }
    }

    // 优先级2：节气推荐神兽（不论是否有3D模型，无3D时显示2D画像）
    const seasonIds = getCurrentSeasonCreatureIds()
    if (seasonIds.length > 0) {
      const seasonCreatures = toCreature(seasonIds)
      if (seasonCreatures.length > 0) return seasonCreatures
    }

    // 优先级3：精选推荐（全都有 3D 模型，12只轮换）
    return toCreature([...FEATURED_IDS])
  }, [guardianProvince, discovered])

  // 初始索引：节气神兽池通常只有1-2只，从0开始；精选池按日期轮换
  const [currentIndex, setCurrentIndex] = useState(0)

  const currentCreature = creaturePool[currentIndex] ?? creaturePool[0]

  const handlePrev = () => setCurrentIndex(i => (i - 1 + creaturePool.length) % creaturePool.length)
  const handleNext = () => setCurrentIndex(i => (i + 1) % creaturePool.length)
  const handleSend = () => {
    if (!input.trim() || !currentCreature) return
    setInitialMessage(input.trim())
    goCreature(currentCreature.id)
    setInput('')
  }

  if (!currentCreature) return null

  return (
    <section className="relative h-[100dvh] min-h-[600px] w-full flex flex-col items-center justify-center overflow-hidden">
      {/* 3D 场景 */}
      <div className="absolute inset-0 z-0">
        <CreatureCinematicViewer creatureId={currentCreature.id} creatureName={currentCreature.name} />
      </div>

      {/* 神兽信息（底部） */}
      <div className="relative z-10 mt-auto mb-8 text-center space-y-6 px-4 max-w-lg">
        {/* 神兽名称 + 切换箭头 */}
        <div className="flex items-center justify-center gap-4">
          <button onClick={handlePrev} className="text-ink-muted hover:text-acc-gold text-2xl transition-colors" aria-label="上一只">&#x25C0;</button>
          <div>
            <h2 className="font-brush text-3xl md:text-4xl text-ink-heaven">{currentCreature.name}</h2>
            <p className="text-ink-muted text-sm font-display">{currentCreature.pinyin} &middot; {currentCreature.source}</p>
          </div>
          <button onClick={handleNext} className="text-ink-muted hover:text-acc-gold text-2xl transition-colors" aria-label="下一只">&#x25B6;</button>
        </div>

        {/* 对话输入框 */}
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            placeholder={`💬 向${currentCreature.name}提问…`}
            className="flex-1 bg-scroll-deep/80 text-ink-primary text-base px-4 py-2.5 rounded-full border border-acc-bronze/30 focus:border-acc-gold focus:outline-none placeholder:text-ink-faint"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            className="px-5 py-2.5 rounded-full bg-acc-cinnabar/20 text-acc-gold border border-acc-cinnabar/40 hover:bg-acc-cinnabar/30 transition-colors disabled:opacity-50"
          >
            发送
          </button>
        </div>

        {/* 方言 + 探索按钮 */}
        <div className="flex items-center justify-center gap-4">
          <DialectPlayer
            creatureId={currentCreature.id}
            province={currentCreature.province}
            text={currentCreature.original_text}
          />
          <button
            onClick={onExplore}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full ancient-btn"
          >
            <span>&#x1F5FA;</span>
            <span>探索地图</span>
          </button>
        </div>
        
        {/* 向下滚动指示 */}
        <div className="animate-bounce text-ink-faint text-xl mt-4">
          <span>&#x2304;</span>
        </div>
      </div>
    </section>
  )
}
