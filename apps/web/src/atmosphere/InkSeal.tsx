/**
 * 仙侠篆刻印章组件 - 仙侠风 (Xianxia Seal)
 *
 * 使用 CSS 实现朱砂印泥纹理与旋转效果，模拟仙家法印盖印。
 * 与 InkSeal 不同：使用仙侠字体 + 金边 + 仙光晕染
 */

interface XianxiaSealProps {
  /** 印章文字 (1-4字) */
  text: string
  /** 尺寸 */
  size?: number
  /** 点击回调 */
  onClick?: () => void
  /** 额外 className */
  className?: string
  /** 旋转角度 */
  rotation?: number
  /** 测试 id */
  testId?: string
  /** 印章类型：方印/圆印 */
  shape?: 'square' | 'round'
  /** 变体：朱砂/仙金 */
  variant?: 'cinnabar' | 'gold'
}

export function XianxiaSeal({
  text,
  size = 64,
  onClick,
  className = '',
  rotation = -8,
  testId,
  shape = 'square',
  variant = 'cinnabar',
}: XianxiaSealProps) {
  const isButton = !!onClick
  const Tag = isButton ? 'button' : 'div'

  const colorMap = {
    cinnabar: {
      border: '#c8423a',
      text: '#c8423a',
      glow: 'rgba(200, 66, 58, 0.3)',
      bg: 'rgba(255, 245, 244, 0.4)',
    },
    gold: {
      border: '#d4a857',
      text: '#8c6b30',
      glow: 'rgba(212, 168, 87, 0.3)',
      bg: 'rgba(245, 228, 184, 0.4)',
    },
  }
  const colors = colorMap[variant]

  return (
    <Tag
      {...(isButton ? { type: 'button' as const, onClick } : {})}
      data-testid={testId}
      aria-label={text}
      className={`${className} inline-flex items-center justify-center shrink-0
        font-seal font-bold
        transition-all duration-500
        ${isButton ? 'cursor-pointer hover:scale-105 active:scale-95' : 'pointer-events-none'}`}
      style={{
        width: size,
        height: size,
        fontSize: size * 0.32,
        borderRadius: shape === 'round' ? '50%' : '3px',
        border: `2.5px solid ${colors.border}`,
        color: colors.text,
        background: `linear-gradient(135deg, ${colors.bg} 0%, rgba(255,255,255,0.3) 100%)`,
        transform: `rotate(${rotation}deg)`,
        writingMode: 'vertical-rl' as any,
        textOrientation: 'upright' as any,
        letterSpacing: '2px',
        lineHeight: 1,
        boxShadow: `0 0 14px ${colors.glow}, inset 0 0 6px ${colors.glow}`,
        maskImage: 'radial-gradient(circle at 50% 50%, black 80%, transparent 100%)',
        WebkitMaskImage: 'radial-gradient(circle at 50% 50%, black 80%, transparent 100%)',
      }}
    >
      {text}
    </Tag>
  )
}

/**
 * 仙家法印 — 圆型朱砂印，比方印更庄严
 */
export function ImmortalSeal({
  text,
  size = 48,
  className = '',
  rotation = -3,
}: {
  text: string
  size?: number
  className?: string
  rotation?: number
}) {
  return (
    <span
      className={`${className} inline-flex items-center justify-center shrink-0 font-seal font-bold celestial-seal`}
      style={{
        width: size,
        height: size,
        fontSize: size * 0.32,
        borderRadius: '50%',
        transform: `rotate(${rotation}deg)`,
        writingMode: 'vertical-rl' as any,
        textOrientation: 'upright' as any,
        letterSpacing: '1px',
        lineHeight: 1,
      }}
    >
      {text}
    </span>
  )
}

/**
 * 兼容旧版本：导出 InkSeal 别名指向 XianxiaSeal
 */
export const InkSeal = XianxiaSeal
export const SealBadge = ({ text, size = 48 }: { text: string; size?: number }) => (
  <XianxiaSeal text={text} size={size} rotation={-3} />
)
