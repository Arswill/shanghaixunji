export const palette = {
  bg: { base: '#1a1814', deep: '#0e0c09', raised: '#242017' },
  ink: { primary: '#d8c9a8', muted: '#8a7d63', faint: '#5a5040' },
  accent: {
    cinnabar: '#a8332a',
    jade: '#3a6a4a',
    bronze: '#7a6438',
    gold: '#b8924a',
    goldBright: '#d4a857',
    azure: '#5d8aab',
    crimson: '#6a1a16',
  },
  surface: { weathered: '#2a2418', crack: '#5a5040', fog: '#0e0c09' },
  region: {
    south: '#3a5a3a', // 南山经 - 暗翠（= --region-south）
    west: '#8a6428', // 西山经 - 暗金（= --region-west）
    north: '#2a4858', // 北山经 - 暗青（= --region-north）
    east: '#5a3a78', // 东山经 - 暗紫（= --region-east）
    central: '#a8332a', // 中山经 - 暗砂（= --region-central）
    outer: '#5a6b80', // 海外大荒 - 暗墨（= --region-outer）
  },
  rarity: {
    ssr: '#a8332a',
    sr: '#b8924a',
    r: '#3a6a4a',
  },
} as const

export const typeScale = {
  display: 'clamp(2.5rem, 4vw, 4rem)',
  h1: 'clamp(1.75rem, 3vw, 2.5rem)',
  h2: 'clamp(1.25rem, 2vw, 1.75rem)',
  body: '1rem',
  caption: '0.8125rem',
} as const

export const timing = {
  instant: '100ms',
  fast: '200ms',
  normal: '400ms',
  slow: '800ms',
  ceremonial: '1500ms',
} as const

export const easing = {
  ink: 'cubic-bezier(0.22, 1, 0.36, 1)',
  seal: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  mist: 'cubic-bezier(0.65, 0, 0.35, 1)',
} as const
