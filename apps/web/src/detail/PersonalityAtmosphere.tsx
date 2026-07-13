import type { Personality } from '../chat/chatPrompts'

/**
 * 性格氛围配置 — 仙侠版
 * 仙侠色彩：东方青龙-紫、东海白虎-金、南海朱雀-赤、北方玄武-玄、海外大荒-墨
 */
export const PERSONALITY_ATMOSPHERE: Record<
  Personality,
  {
    label: string
    gradient: string
    particleColor: string
    accent: string
    seal: string
    texture: string
    rune: string
  }
> = {
  ferocious: {
    label: '斗战胜',
    gradient: 'from-celestial-mist via-cinnabar/15 to-celestial-paper',
    particleColor: 'bg-cinnabar/40',
    accent: 'text-cinnabar',
    seal: 'border-cinnabar/60 text-cinnabar bg-cinnabar/10',
    texture:
      'radial-gradient(circle at 30% 20%, rgba(200, 66, 58, 0.20) 0%, transparent 55%)',
    rune: '#c8423a',
  },
  auspicious: {
    label: '瑞应之',
    gradient: 'from-celestial-mist via-jade-cui/15 to-celestial-paper',
    particleColor: 'bg-immortal-gold/45',
    accent: 'text-immortal-gold',
    seal: 'border-immortal-gold/60 text-immortal-gold bg-immortal-gold/10',
    texture:
      'radial-gradient(circle at 70% 20%, rgba(212, 168, 87, 0.18) 0%, transparent 55%)',
    rune: '#d4a857',
  },
  disastrous: {
    label: '凶煞出',
    gradient: 'from-celestial-mist via-thunder/15 to-celestial-paper',
    particleColor: 'bg-thunder/40',
    accent: 'text-thunder',
    seal: 'border-thunder/60 text-thunder bg-thunder/10',
    texture:
      'radial-gradient(circle at 50% 30%, rgba(123, 78, 160, 0.18) 0%, transparent 55%)',
    rune: '#7b4ea0',
  },
  mysterious: {
    label: '玄隐者',
    gradient: 'from-celestial-mist via-ink-faint/30 to-celestial-paper',
    particleColor: 'bg-ink-dan/35',
    accent: 'text-ink-dan',
    seal: 'border-ink-dan/60 text-ink-dan bg-ink-dan/10',
    texture:
      'radial-gradient(circle at 20% 70%, rgba(45, 74, 94, 0.15) 0%, transparent 55%)',
    rune: '#5a6b80',
  },
}

export interface XianActionProps {
  icon: string
  label: string
  onClick: () => void
  testId?: string
  accent?: boolean
}

export function XianAction({ icon, label, onClick, testId, accent }: XianActionProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      data-testid={testId}
      className={`group flex flex-col items-center gap-1 px-3 sm:px-4 py-2 rounded-xl
        celestial-card hover:!border-cinnabar transition-all duration-300 min-w-[72px]
        ${accent ? 'ring-1 ring-cinnabar/40' : ''}`}
    >
      <span className="text-lg text-immortal-gold group-hover:scale-110 group-hover:text-cinnabar transition-all">
        {icon}
      </span>
      <span className="text-[11px] text-ink-zhong group-hover:text-cinnabar font-display tracking-wider transition-colors">
        {label}
      </span>
    </button>
  )
}
