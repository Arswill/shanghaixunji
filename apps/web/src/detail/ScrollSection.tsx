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
      className="relative py-10 px-4 sm:px-6 border-t border-immortal-gold/20 animate-fade-in"
    >
      {/* 卷轴标题题签 */}
      <div className="flex items-center justify-center gap-3 mb-7">
        <span className="ink-divider w-12" />
        <h3 className="font-display text-xl text-ink-heaven tracking-[0.3em]">{title}</h3>
        <span className="ink-divider w-12" />
        <span className="absolute -mt-7 text-[9px] text-ink-faint tracking-widest font-display">
          {subtitle}
        </span>
      </div>
      {children}
    </section>
  )
}
