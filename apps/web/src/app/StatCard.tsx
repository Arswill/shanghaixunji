export function StatXianCard({ value, label, sub, accent }: {
  value: number
  label: string
  sub: string
  accent?: boolean
}) {
  return (
    <div className="text-center">
      <div
        className={`font-display text-3xl md:text-4xl ${accent ? 'text-cinnabar text-glow-cinnabar' : 'text-ink-heaven'}`}
        style={{ fontFamily: 'var(--font-xian)' }}
      >
        {value}
      </div>
      <div className={`text-sm mt-1 tracking-[0.2em] font-display ${accent ? 'text-cinnabar/80' : 'text-ink-zhong'}`}>
        {label}
      </div>
      <div className="text-ink-dan text-[10px] mt-0.5 tracking-wider">
        {sub}
      </div>
    </div>
  )
}
