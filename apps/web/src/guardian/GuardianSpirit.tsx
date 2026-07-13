import { useEffect, useState } from 'react'
import type { CreatureWithAssets } from '../data/loadCreatures'
import { getCreaturesByProvince, getCreatureById } from '../data/loadCreatures'
import { getRarity, RARITY_CONFIG, type Rarity } from '../collection/rarity'
import { useGeolocation, isPermissionDeniedError } from './useGeolocation'
import { ShareCardCanvas } from './ShareCardCanvas'
import { useGuardianStore, isSameDay } from './guardianStore'
import { useViewStore } from '../app/useViewStore'
import { RuneCircle, XianqiParticles } from '../atmosphere/XianxiaAtmosphere'

// 34 省级行政区列表
export const ALL_PROVINCES = [
  '北京', '天津', '河北', '山西', '内蒙古',
  '辽宁', '吉林', '黑龙江',
  '上海', '江苏', '浙江', '安徽', '福建', '江西', '山东',
  '河南', '湖北', '湖南', '广东', '广西', '海南',
  '重庆', '四川', '贵州', '云南', '西藏',
  '陕西', '甘肃', '青海', '宁夏', '新疆',
  '台湾', '香港', '澳门',
]

/**
 * 仙侠版守护神称号
 * - SSR → 天命守护
 * - SR → 灵域守护
 * - R → 乡野守护
 */
export function getGuardianTitle(rarity: Rarity): string {
  switch (rarity) {
    case 'SSR':
      return '天命仙君'
    case 'SR':
      return '灵域真人'
    case 'R':
      return '乡野灵守'
  }
}

export function pickGuardianCreature(province: string): CreatureWithAssets | null {
  const pool = getCreaturesByProvince(province)
  if (pool.length === 0) return null
  const idx = Math.floor(Math.random() * pool.length)
  return pool[idx]
}

const DAILY_FORTUNES = [
  { title: '吉星高照', text: '今日灵气充沛，宜探索未知之境，神兽见你亦心生欢喜。' },
  { title: '稳中求进', text: '今日地脉平稳，循序渐进可得奇缘，不必急于求成。' },
  { title: '藏锋守拙', text: '今日混沌未开，宜守不宜攻，静待时机再出山海。' },
  { title: '福祸相依', text: '今日异象频生，行事务须谨慎，然险中亦藏大机缘。' },
  { title: '天命所归', text: '今日星辰顺行，与你命格相合，正是收录神兽的良辰。' },
]

function getDailyFortune(guardianId: string) {
  const seed = `${guardianId}-${new Date().toDateString()}`
  const hash = seed.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0)
  return DAILY_FORTUNES[hash % DAILY_FORTUNES.length]
}

const RARITY_XIAN = {
  SSR: { label: '仙品', icon: '✦✦✦', color: '#c8423a' },
  SR: { label: '灵品', icon: '✦✦', color: '#d4a857' },
  R: { label: '凡品', icon: '✦', color: '#4a8c6b' },
} as const

export function GuardianSpirit() {
  const { province, loading, error, request, reset } = useGeolocation()
  const [guardian, setGuardianCreature] = useState<CreatureWithAssets | null>(null)
  const [guardianProvince, setGuardianProvince] = useState<string>('')
  const [noCreature, setNoCreature] = useState(false)

  // 只订阅需要的字段，避免 store 任意变更（如运势查询/重抽）触发不必要的 effect 重跑。
  // 注意：geolocation 的 province/reset 与 store 的 province/reset 同名，故将 store
  // 端字段重命名为 assignedProvince/resetGuardian；本地 setter setGuardianCreature 也
  // 让位给 store 的 setGuardian 动作。
  const guardianId = useGuardianStore((s) => s.guardianId)
  const assignedProvince = useGuardianStore((s) => s.province)
  const assignedAt = useGuardianStore((s) => s.assignedAt)
  const consultFortune = useGuardianStore((s) => s.consultFortune)
  const rerollGuardian = useGuardianStore((s) => s.rerollGuardian)
  const resetGuardian = useGuardianStore((s) => s.reset)
  const setGuardian = useGuardianStore((s) => s.setGuardian)
  const goCreature = useViewStore((s) => s.goCreature)
  const [showFortune, setShowFortune] = useState(false)

  useEffect(() => {
    if (guardianId && assignedProvince) {
      const stored = getCreatureById(guardianId)
      if (stored) {
        setGuardianCreature(stored)
        setGuardianProvince(assignedProvince)
      }
    }
  }, [guardianId, assignedProvince])

  useEffect(() => {
    if (!province) return

    if (
      guardianId &&
      assignedProvince === province &&
      isSameDay(assignedAt, Date.now())
    ) {
      const stored = getCreatureById(guardianId)
      if (stored) {
        setGuardianCreature(stored)
        setGuardianProvince(province)
        setNoCreature(false)
        return
      }
    }

    const picked = pickGuardianCreature(province)
    if (picked) {
      setGuardianCreature(picked)
      setGuardianProvince(province)
      setNoCreature(false)
      setGuardian(picked.id, province)
    } else {
      // 无神兽省份：清理旧守护神，避免 guardianId 残留导致刷新后旧守护神重现
      setNoCreature(true)
      resetGuardian()
    }
  }, [province, guardianId, assignedProvince, assignedAt, setGuardian, resetGuardian])

  const handleSeek = () => {
    reset()
    setGuardianCreature(null)
    setGuardianProvince('')
    setNoCreature(false)
    request()
  }

  const handleReroll = () => {
    if (guardianProvince) {
      const picked = pickGuardianCreature(guardianProvince)
      if (picked) {
        setGuardianCreature(picked)
        rerollGuardian(picked.id)
      }
    }
  }

  const handleConsultFortune = () => {
    consultFortune()
    setShowFortune(true)
  }

  // 定位权限被拒绝时的降级方案：手动选择省份，按省份查找神兽并写入 store。
  const handleManualProvinceSelect = (selectedProvince: string) => {
    if (!selectedProvince) return
    const picked = pickGuardianCreature(selectedProvince)
    if (picked) {
      setGuardianCreature(picked)
      setGuardianProvince(selectedProvince)
      setNoCreature(false)
      setGuardian(picked.id, selectedProvince)
    } else {
      setNoCreature(true)
      resetGuardian()
    }
  }

  const rarity = guardian ? getRarity(guardian) : null
  const rarityConfig = rarity ? RARITY_CONFIG[rarity] : null
  const rarityXian = rarity ? RARITY_XIAN[rarity] : null
  const guardianTitle = rarity ? getGuardianTitle(rarity) : ''

  const revealed = guardian !== null && rarity !== null && rarityConfig !== null && rarityXian !== null
  const locating = loading && !revealed

  return (
    <div data-testid="guardian-spirit" className="py-4 max-w-2xl mx-auto">
      {/* ═══ 标题区：仙家题签 ═══ */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-3 mb-2">
          <span className="ink-divider w-12" />
          <span className="text-cinnabar text-sm font-display tracking-[0.3em]">
            ✦ 故土仙缘 ✦
          </span>
          <span className="ink-divider w-12" />
        </div>
        <h2 className="font-brush text-4xl md:text-5xl text-cinnabar tracking-[0.15em] mt-3 text-glow-cinnabar">
          家乡守护神
        </h2>
        <p className="text-ink-dan text-sm mt-3 leading-relaxed max-w-xl mx-auto font-display">
          许久以前，《山海经》记载每一方水土皆有灵兽镇守。
          <br className="hidden sm:block" />
          授以定位之权，寻你故土之上、命里注定的那一只守护神。
        </p>
      </div>

      {/* ═══ 定位中：法阵旋转 ═══ */}
      {locating && (
        <div className="text-center py-12 animate-fade-in" data-testid="guardian-locating">
          <div className="inline-flex flex-col items-center gap-5">
            <div className="relative w-24 h-24">
              <RuneCircle size={96} animated color="#d4a857" />
              <span className="absolute inset-0 flex items-center justify-center text-immortal-gold text-3xl animate-rune-pulse text-glow-gold">
                ✦
              </span>
            </div>
            <p className="text-ink-zhong text-sm font-display tracking-wider">
              正在感应你的故土方位…
            </p>
            <p className="text-ink-faint text-xs font-display">遥知地脉 · 御气寻仙</p>
          </div>
        </div>
      )}

      {/* ═══ 已揭示：守护神卡片 ═══ */}
      {revealed && guardian && rarityConfig && rarityXian && (
        <div className="animate-fade-in space-y-6" data-testid="guardian-revealed">
          {/* 守护神卡片：卷轴 + 印章 */}
          <div
            className="relative mx-auto max-w-md rounded-2xl overflow-hidden border-2 celestial-card !shadow-immortal"
            style={{
              borderColor: rarityXian.color,
              boxShadow: `0 0 32px ${rarityXian.color}40, inset 0 0 24px rgba(255, 255, 255, 0.05)`,
            }}
          >
            {/* 画框四角 */}
            <div className="ink-corner-tl" aria-hidden="true" />
            <div className="ink-corner-tr" aria-hidden="true" />
            <div className="ink-corner-bl" aria-hidden="true" />
            <div className="ink-corner-br" aria-hidden="true" />

            {/* 顶部稀有度条 */}
            <div
              className="h-1 w-full"
              style={{
                background: `linear-gradient(to right, transparent, ${rarityXian.color}, transparent)`,
              }}
            />

            {/* 仙气背景 */}
            <XianqiParticles count={8} />

            {/* 神兽画像 */}
            <div className="relative aspect-square bg-celestial-paper overflow-hidden">
              {guardian.image ? (
                <img
                  src={guardian.image}
                  alt={`${guardian.name}画像`}
                  className="w-full h-full object-cover"
                  data-testid="guardian-image"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="font-brush text-cinnabar text-7xl">{guardian.name}</span>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-celestial-paper via-transparent to-transparent pointer-events-none" />
              {/* 稀有度星级 */}
              <span
                className="absolute top-3 right-3 text-lg font-display px-2 py-1 rounded celestial-card"
                style={{ color: rarityXian.color }}
                data-testid="guardian-rarity-stars"
              >
                {rarityXian.icon}
              </span>
            </div>

            {/* 卡片信息区 */}
            <div className="px-6 py-5 text-center space-y-3 relative">
              {/* 省份印章 */}
              <div className="flex justify-center -mt-12 relative z-10">
                <div
                  className="flex items-center justify-center w-16 h-16 rounded-full border-2 border-celestial-white/90"
                  style={{
                    transform: 'rotate(-6deg)',
                    background: rarityXian.color,
                    boxShadow: `0 0 16px ${rarityXian.color}80`,
                  }}
                  data-testid="guardian-province-seal"
                >
                  <span className="font-brush text-celestial-white text-base font-bold tracking-wider">
                    {guardianProvince}
                  </span>
                </div>
              </div>

              {/* 守护神称号 */}
              <p
                className="font-display text-sm tracking-[0.3em]"
                style={{ color: rarityXian.color }}
                data-testid="guardian-title"
              >
                「{guardianTitle}」
              </p>

              {/* 神兽名 */}
              <h3 className="font-brush text-cinnabar text-4xl text-glow-cinnabar" data-testid="guardian-name">
                {guardian.name}
              </h3>
              <p className="text-ink-dan text-xs font-display">
                {guardian.pinyin} · {rarityXian.label}
              </p>

              {/* 守护神文案 */}
              <p className="text-ink-zhong text-sm pt-1 font-display">
                你的家乡守护神是
                <span className="text-immortal-gold font-display px-1">{guardian.name}</span>
              </p>
              <p className="text-ink-faint text-[10px] italic font-display">
                {guardian.source} · {guardian.scroll}
              </p>
            </div>
          </div>

          {/* 操作区：仙家法器 */}
          <div className="flex flex-wrap items-center justify-center gap-3">
            <XianGuardBtn onClick={handleReroll} testId="guardian-reroll-btn">
              ↻ 再寻一只
            </XianGuardBtn>
            <XianGuardBtn onClick={handleConsultFortune}>今日运势</XianGuardBtn>
            {guardian && (
              <XianGuardBtn onClick={() => goCreature(guardian.id)} accent>
                与{guardian.name}对话
              </XianGuardBtn>
            )}
            <XianGuardBtn onClick={handleSeek}>重新定位</XianGuardBtn>
          </div>

          {/* ═══ 守护神对话区：自动触发 + 快捷问题 ═══ */}
          {guardian && (
            <GuardianDialogue
              guardian={guardian}
              province={guardianProvince}
              onAsk={(_q) => goCreature(guardian.id)}
            />
          )}

          {/* 今日运势 */}
          {showFortune && guardian && (
            <div className="max-w-md mx-auto p-5 rounded-xl celestial-card text-center animate-fade-in">
              <div className="text-cinnabar font-brush text-xl mb-2 text-glow-cinnabar">
                {getDailyFortune(guardian.id).title}
              </div>
              <p className="text-ink-zhong text-sm leading-relaxed font-display">
                {getDailyFortune(guardian.id).text}
              </p>
            </div>
          )}

          {/* 分享卡 */}
          <div className="pt-2 border-t border-immortal-gold/20">
            <ShareCardCanvas
              creature={guardian}
              province={guardianProvince}
              guardianTitle={guardianTitle}
            />
          </div>
        </div>
      )}

      {/* ═══ 初始状态：寻找按钮 ═══ */}
      {!revealed && !locating && (
        <div className="text-center space-y-5 animate-fade-in">
          {/* 法阵圈中央 */}
          <div className="flex justify-center mb-4">
            <RuneCircle size={140} animated color="#d4a857" />
          </div>

          <button
            onClick={handleSeek}
            data-testid="guardian-seek-btn"
            className="group relative inline-flex items-center gap-3 px-10 py-4 rounded-full
                       celestial-btn !shadow-immortal"
          >
            <span
              className="absolute -inset-0.5 rounded-full border border-immortal-gold/40 animate-rune-pulse pointer-events-none"
              aria-hidden="true"
            />
            <span className="text-cinnabar text-xl animate-rune-pulse">✦</span>
            <span className="text-base tracking-[0.2em]">寻我故土守护神</span>
            <span className="text-cinnabar text-xl animate-rune-pulse">✦</span>
          </button>

          {error && (
            <div
              data-testid="guardian-error"
              className="mx-auto max-w-md p-4 rounded-xl border border-cinnabar/40 bg-cinnabar/10 text-ink-zhong text-sm font-display"
            >
              <p className="text-cinnabar font-brush text-lg mb-1">未能寻得守护神</p>
              <p>{error}</p>
              <button
                onClick={handleSeek}
                className="mt-3 text-immortal-gold hover:text-cinnabar text-xs underline-offset-2 hover:underline"
              >
                重新尝试
              </button>
              {isPermissionDeniedError(error) && (
                <div className="mt-4 pt-3 border-t border-cinnabar/20 text-left">
                  <label
                    htmlFor="guardian-manual-province"
                    className="block text-ink-faint text-xs mb-2"
                  >
                    权限受阻？可手动选择家乡省份寻守护神
                  </label>
                  <select
                    id="guardian-manual-province"
                    data-testid="guardian-manual-province"
                    value=""
                    onChange={(e) => handleManualProvinceSelect(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-celestial-paper border border-immortal-gold/40 text-ink-zhong text-sm font-display"
                  >
                    <option value="" disabled>
                      选择省份…
                    </option>
                    {ALL_PROVINCES.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}

          {noCreature && !error && (
            <div
              data-testid="guardian-no-creature"
              className="mx-auto max-w-md p-4 rounded-xl celestial-card text-ink-zhong text-sm font-display"
            >
              <p className="text-immortal-gold font-brush text-lg mb-1">故土暂无神兽记载</p>
              <p>你所在的省份暂未收录《山海经》神兽，可尝试重新定位或探索他乡。</p>
            </div>
          )}

          {!error && !noCreature && (
            <p className="text-ink-faint text-xs font-display tracking-wider">
              ✦ 需要授权浏览器获取你的地理位置 ✦
            </p>
          )}
        </div>
      )}
    </div>
  )
}

/* ── 守护神对话区：自动触发欢迎语 + 3 个快捷问题 ── */
const GUARDIAN_QUESTIONS = [
  '我省有哪些神兽？',
  '你的守护神力是什么？',
  '家乡有什么传说？',
]

function GuardianDialogue({
  guardian,
  province,
  onAsk,
}: {
  guardian: CreatureWithAssets
  province: string
  onAsk: (question: string) => void
}) {
  const welcomeMessage = `这里是你的家乡${province}，守护神${guardian.name}在此等候多时。`

  return (
    <div
      className="max-w-md mx-auto p-4 rounded-xl celestial-card space-y-3 animate-fade-in"
      data-testid="guardian-dialogue"
    >
      {/* 守护神欢迎语 */}
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-10 h-10 rounded-full border border-immortal-gold/40 overflow-hidden">
          {guardian.image ? (
            <img src={guardian.image} alt={guardian.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center font-brush text-cinnabar text-lg">
              {guardian.name.charAt(0)}
            </div>
          )}
        </div>
        <div className="flex-1">
          <p className="text-ink-dan text-xs font-display mb-1">{guardian.name}</p>
          <p className="text-ink-zhong text-sm leading-relaxed font-display">
            {welcomeMessage}
          </p>
        </div>
      </div>

      {/* 快捷问题 */}
      <div className="flex flex-wrap gap-2 pt-1" data-testid="guardian-quick-questions">
        {GUARDIAN_QUESTIONS.map((q) => (
          <button
            key={q}
            onClick={() => onAsk(q)}
            className="px-3 py-2 text-xs rounded-full bg-bg-deep text-ink-primary border border-acc-bronze/30 hover:border-acc-gold hover:text-acc-gold-bright transition-colors font-display"
          >
            {q}
          </button>
        ))}
      </div>
    </div>
  )
}

/* ── 仙家法器按钮（守护神页专用） ── */
function XianGuardBtn({
  onClick,
  children,
  testId,
  accent,
}: {
  onClick: () => void
  children: React.ReactNode
  testId?: string
  accent?: boolean
}) {
  return (
    <button
      onClick={onClick}
      data-testid={testId}
      className={`px-4 py-2 rounded-full text-sm font-display tracking-wider transition-all celestial-card
        ${accent ? '!border-cinnabar text-cinnabar' : 'text-ink-heaven'}`}
    >
      {children}
    </button>
  )
}
