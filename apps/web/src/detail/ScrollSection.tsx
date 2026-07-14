interface ScrollSectionProps {
  id: string
  title: string
  subtitle: string
  children: React.ReactNode
  refProp?: React.RefObject<HTMLElement | null>
}

export function ScrollSection({ id, title, subtitle, children, refProp }: ScrollSectionProps) {
  return (
    <section
      ref={refProp}
      id={id}
      className="relative py-8 px-4 sm:px-6 animate-fade-in"
    >
      {/* 顶部金色分割线 */}
      <div className="flex items-center gap-3 mb-6 max-w-5xl mx-auto">
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-immortal-gold/30 to-immortal-gold/50" />
        <span className="text-[9px] text-ink-faint tracking-[0.2em] font-display whitespace-nowrap">
          {subtitle}
        </span>
        <div className="flex-1 h-px bg-gradient-to-l from-transparent via-immortal-gold/30 to-immortal-gold/50" />
      </div>
      {/* 卷轴标题题签 */}
      <div className="flex items-center justify-center gap-3 mb-6">
        <span className="ink-divider w-10" />
        <h3 className="font-display text-lg text-ink-heaven tracking-[0.25em]">{title}</h3>
        <span className="ink-divider w-10" />
      </div>
      <div className="max-w-5xl mx-auto">
        {children}
      </div>
    </section>
  )
}
