import { getCreaturesByProvince } from '../data/loadCreatures'
import { useViewStore } from '../app/useViewStore'
import { useCollection } from '../collection/useCollection'
import { getRarity } from '../collection/rarity'

const RARITY_LABELS = {
  SSR: { label: '仙品', color: 'text-cinnabar', border: 'border-cinnabar', glow: 'shadow-cinnabar-glow' },
  SR: { label: '灵品', color: 'text-immortal-gold', border: 'border-immortal-gold', glow: 'shadow-gold-glow' },
  R: { label: '凡品', color: 'text-jade-cui', border: 'border-jade-cui/50', glow: 'shadow-jade-glow' },
} as const

export function ProvinceCreatureList({ province }: { province: string }) {
  const goCreature = useViewStore((s) => s.goCreature)
  const creatures = getCreaturesByProvince(province)
  const discovered = useCollection((s) => s.discovered)

  return (
    <div data-testid="province-creature-list" className="py-6">
      {/* 标题区：仙家题签 */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-3 mb-2">
          <span className="ink-divider w-12" />
          <span className="text-cinnabar text-sm font-display tracking-[0.3em]">✦ 山海图录 ✦</span>
          <span className="ink-divider w-12" />
        </div>
        <h2 className="font-brush text-4xl md:text-5xl text-cinnabar tracking-[0.15em] mt-3 text-glow-cinnabar">
          {province}
        </h2>
        <p className="text-ink-dan text-sm mt-2 font-display tracking-wider">
          此方山水，育 <span className="text-immortal-gold">{creatures.length}</span> 只神兽
        </p>
      </div>

      {creatures.length === 0 ? (
        <p className="text-center text-ink-dan py-12 font-display">此方水土未录神兽。</p>
      ) : (
        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto">
          {creatures.map((c, i) => {
            const isDiscovered = discovered.includes(c.id)
            const rarity = getRarity(c)
            const rarityInfo = RARITY_LABELS[rarity]
            return (
              <li
                key={c.id}
                className="animate-ink-fade-in"
                style={{ animationDelay: `${i * 0.06}s` }}
              >
                <button
                  onClick={() => goCreature(c.id)}
                  data-testid="province-creature-card"
                  className={`group relative w-full text-left p-0 rounded-xl overflow-hidden celestial-card
                              transition-all duration-500 hover:scale-[1.02]`}
                >
                  {/* 画框四角 */}
                  <div className="ink-corner-tl" aria-hidden="true" />
                  <div className="ink-corner-tr" aria-hidden="true" />
                  <div className="ink-corner-bl" aria-hidden="true" />
                  <div className="ink-corner-br" aria-hidden="true" />

                  <div className="flex">
                    {/* 画像 */}
                    <div className="relative w-24 h-24 shrink-0">
                      {c.image ? (
                        <img
                          src={c.image}
                          alt={c.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className={`w-full h-full flex items-center justify-center font-brush text-3xl ${rarityInfo.color} bg-celestial-paper`}>
                          {c.name.charAt(0)}
                        </div>
                      )}
                      {/* 仙雾遮盖 (未发现) */}
                      {!isDiscovered && (
                        <div className="absolute inset-0 flex items-center justify-center bg-ink-heaven/60 backdrop-blur-sm">
                          <span className="text-celestial-white text-xs font-display tracking-widest">
                            未遇
                          </span>
                        </div>
                      )}
                      {/* 仙品标 */}
                      {isDiscovered && (
                        <div className={`absolute top-1 left-1 px-1.5 py-0.5 text-[10px] font-display tracking-wider rounded-sm
                          ${rarity === 'SSR' ? 'bg-cinnabar text-celestial-white' :
                            rarity === 'SR' ? 'bg-immortal-gold text-ink-heaven' :
                            'bg-jade-cui text-celestial-white'}`}>
                          {rarityInfo.label}
                        </div>
                      )}
                    </div>

                    {/* 信息 */}
                    <div className="flex-1 p-3 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className={`font-brush text-xl ${isDiscovered ? 'text-ink-heaven' : 'text-ink-dan'}`}>
                          {c.name}
                        </h3>
                        <span className="text-ink-faint text-[10px] font-mono">
                          {c.pinyin}
                        </span>
                      </div>
                      <p className="text-ink-dan text-xs line-clamp-2 leading-relaxed">
                        {c.description}
                      </p>
                      <div className="text-ink-faint text-[10px] mt-1 font-display">
                        《{c.source}》
                      </div>
                    </div>
                  </div>
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
