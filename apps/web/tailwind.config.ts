import type { Config } from 'tailwindcss'
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        /* ── 仙侠底色 (Xianxia Base) — 暗色，对齐 tokens.css :root ── */
        bg: {
          base: '#1a1814',       /* = --celestial-mist */
          deep: '#0e0c09',       /* = --celestial-jade */
          raised: '#242017',     /* = --celestial-white */
          night: '#050810',      /* = --celestial-night */
        },
        /* ── 卷轴底色 (Scroll) — 用于输入框/tooltip背景 ── */
        scroll: {
          deep: '#15120c',       /* 卷轴深色背景 */
          DEFAULT: '#1f1c16',    /* 卷轴标准背景 */
          light: '#2a2418',      /* 卷轴浅色背景 */
        },
        /* ── 仙墨 (Immortal Ink) — 暗色翻转：深底浅字 ── */
        ink: {
          primary: '#d8c9a8',    /* = --ink-zhong 主文字 */
          muted: '#9a8d73',      /* = --ink-dan 次文字（提亮） */
          faint: '#7a6e5a',      /* = --ink-light 辅助（提亮，确保WCAG对比度） */
          heaven: '#f0f5f1',     /* = --ink-heaven 最亮 */
          deep: '#d8e0e8',       /* = --ink-deep */
          zhong: '#d8c9a8',      /* = --ink-zhong */
        },
        /* ── 五行仙色 (Five Element Immortal Colors) — 暗色适配 ── */
        acc: {
          cinnabar: '#a8332a',       /* = --cinnabar */
          cinnabarBright: '#c8423a', /* = --cinnabar-bright */
          cinnabarDeep: '#6a1a16',   /* = --cinnabar-deep */
          jade: '#3a6a4a',           /* = --jade-cui */
          jadeLight: '#5a8a6b',      /* = --jade-cui-light */
          jadeDeep: '#2a4a38',       /* = --jade-cui-deep */
          gold: '#b8924a',           /* = --immortal-gold */
          goldBright: '#d4a857',     /* = --immortal-gold-bright */
          goldDeep: '#7a6438',       /* = --immortal-gold-deep */
          goldGlow: '#b8924a',       /* = --immortal-gold-glow */
          azure: '#5d8aab',          /* = --xuan-qing */
          azureLight: '#8aabcd',     /* = --xuan-qing-light */
          azureDeep: '#3a5870',      /* = --xuan-qing-deep */
          crimson: '#8a2a2a',
          bronze: '#7a6438',         /* = --immortal-gold-deep */
          thunder: '#7b4ea0',        /* = --thunder-purple */
          thunderLight: '#9d6fc4',   /* = --thunder-purple-light */
          peach: '#d08898',          /* = --peach-pink */
        },
        /* ── 五方神兽 (Five Direction Beasts) — 暗色适配 ── */
        region: {
          south: '#5a8a6b',          /* 南方朱雀 — 翠青 */
          west: '#c8a050',           /* 西方白虎 — 昆仑金 */
          north: '#5a6e8a',          /* 北方玄武 */
          east: '#7b4ea0',           /* 东方青龙 — 紫青 */
          central: '#a8332a',        /* 中央 — 朱砂 */
          outer: '#8a7d63',          /* 海外 — 淡墨 */
        },
        /* ── 稀有度 (Immortal Grades) ── */
        rarity: {
          ssr: '#c8423a',            /* 仙品 */
          sr: '#d4a857',             /* 灵品 */
          r: '#5a8a6b',              /* 凡品 */
        },
        /* ── 仙境氛围色 — 暗色 ── */
        celestial: {
          jade: '#0e0c09',           /* = --celestial-jade */
          mist: '#1a1814',           /* = --celestial-mist */
          white: '#242017',          /* = --celestial-white */
          paper: '#1f1c16',          /* = --celestial-paper */
          fog: '#2a2418',            /* = --celestial-fog */
          night: '#050810',          /* = --celestial-night */
        },
        thunder: {
          DEFAULT: '#7b4ea0',
          light: '#9d6fc4',
          deep: '#4a2b6b',
          violet: '#b886d6',
        },
        peach: {
          DEFAULT: '#d08898',
          blossom: '#e0a0a8',
          deep: '#a8606a',
        },
      },
      fontFamily: {
        display: ['ZCOOL XiaoWei', 'Noto Serif SC', 'Songti SC', 'serif'],
        brush: ['Ma Shan Zheng', 'ZCOOL XiaoWei', 'cursive'],
        body: ['Noto Sans SC', 'Noto Serif SC', 'PingFang SC', 'system-ui', 'sans-serif'],
        kai: ['ZCOOL XiaoWei', 'Ma Shan Zheng', 'STKaiti', 'serif'],
        seal: ['ZCOOL XiaoWei', 'STKaiti', 'KaiTi', 'serif'],
        xian: ['ZCOOL XiaoWei', 'Noto Serif SC', 'Songti SC', 'serif'],
      },
      animation: {
        /* 基础动效 */
        'fade-in': 'fade-in 0.5s var(--ease-xian) forwards',
        'fade-in-slow': 'fade-in-slow 1.2s var(--ease-xian) forwards',
        'glow-pulse': 'glow-pulse 3s var(--ease-mist) infinite',

        /* 仙侠特色动效 */
        'xian-rise': 'xian-rise 5s ease-out infinite',         /* 仙气升腾 */
        'sword-fly': 'sword-fly 4s var(--ease-flying) infinite', /* 御剑飞行 */
        'mist-drift': 'mist-drift 8s var(--ease-mist) infinite', /* 仙雾飘渺 */
        'cloud-float': 'cloud-float 12s var(--ease-mist) infinite', /* 祥云缓动 */
        'thunder-flash': 'thunder-flash 2s var(--ease-thunder) infinite', /* 紫电 */
        'rune-rotate': 'rune-rotate 20s linear infinite',       /* 法阵旋转 */
        'rune-pulse': 'rune-pulse 3s var(--ease-thunder) infinite', /* 法阵脉动 */
        'talisman-unfurl': 'talisman-unfurl 1.5s var(--ease-talisman) forwards', /* 符箓展开 */
        'petal-fall': 'petal-fall 8s linear infinite',          /* 桃花飘落 */
        'jade-shimmer': 'jade-shimmer 4s var(--ease-mist) infinite', /* 玉光流转 */
        'gold-shimmer': 'gold-shimmer 3s var(--ease-mist) infinite', /* 仙金闪烁 */
        'star-twinkle': 'star-twinkle 4s var(--ease-mist) infinite', /* 星辰明灭 */
        'ink-fade-in': 'ink-fade-in 0.7s var(--ease-xian) forwards',
        'ink-float': 'ink-float 4s var(--ease-mist) infinite',
        'ink-breathe': 'ink-breathe 5s var(--ease-mist) infinite',
        'brush-write': 'brush-write 1.5s var(--ease-xian) forwards',
        'seal-stamp': 'seal-stamp 0.6s var(--ease-thunder) forwards',
        'gold-flash': 'gold-flash 1.5s var(--ease-xian) forwards',
        'ink-spread': 'ink-spread 1.2s var(--ease-mist) forwards',
        'mist-clear': 'mist-clear 1.5s var(--ease-mist) forwards',
        'float': 'float 6s var(--ease-mist) infinite',
        'breathe': 'breathe 4s var(--ease-mist) infinite',
        'ember-rise': 'ember-rise 4s ease-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'bronze-gate': 'bronze-gate 1.2s var(--ease-xian) forwards',
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(10px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in-slow': {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'glow-pulse': {
          '0%, 100%': { opacity: '0.6' },
          '50%': { opacity: '1' },
        },
        /* 仙气升腾 */
        'xian-rise': {
          '0%': { transform: 'translateY(0) translateX(0) scale(0.8)', opacity: '0' },
          '20%': { opacity: '0.7' },
          '80%': { opacity: '0.4' },
          '100%': { transform: 'translateY(-100px) translateX(20px) scale(1.4)', opacity: '0' },
        },
        /* 御剑飞行 */
        'sword-fly': {
          '0%': { transform: 'translateX(-100px) translateY(0) rotate(-5deg)', opacity: '0' },
          '20%': { opacity: '1' },
          '50%': { transform: 'translateX(50vw) translateY(-15px) rotate(0deg)' },
          '80%': { opacity: '0.7' },
          '100%': { transform: 'translateX(110vw) translateY(5px) rotate(5deg)', opacity: '0' },
        },
        /* 仙雾飘渺 */
        'mist-drift': {
          '0%, 100%': { transform: 'translateX(-5%) translateY(0) scale(1)', opacity: '0.6' },
          '50%': { transform: 'translateX(5%) translateY(-10px) scale(1.05)', opacity: '0.8' },
        },
        /* 祥云缓动 */
        'cloud-float': {
          '0%': { transform: 'translateX(-10%) translateY(0)' },
          '50%': { transform: 'translateX(10%) translateY(-15px)' },
          '100%': { transform: 'translateX(-10%) translateY(0)' },
        },
        /* 紫电 */
        'thunder-flash': {
          '0%, 100%': { opacity: '0' },
          '10%, 30%': { opacity: '0.9' },
          '20%, 40%': { opacity: '0.2' },
          '50%, 70%': { opacity: '0.7' },
          '60%': { opacity: '0.1' },
        },
        /* 法阵旋转 */
        'rune-rotate': {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        /* 法阵脉动 */
        'rune-pulse': {
          '0%, 100%': { transform: 'scale(1)', opacity: '0.6' },
          '50%': { transform: 'scale(1.05)', opacity: '1' },
        },
        /* 符箓展开 */
        'talisman-unfurl': {
          '0%': { clipPath: 'inset(0 50% 0 50%)', opacity: '0' },
          '100%': { clipPath: 'inset(0 0 0 0)', opacity: '1' },
        },
        /* 桃花飘落 */
        'petal-fall': {
          '0%': { transform: 'translateY(-20px) translateX(0) rotate(0deg)', opacity: '0' },
          '10%': { opacity: '0.9' },
          '90%': { opacity: '0.6' },
          '100%': { transform: 'translateY(110vh) translateX(80px) rotate(720deg)', opacity: '0' },
        },
        /* 玉光流转 */
        'jade-shimmer': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        /* 仙金闪烁 */
        'gold-shimmer': {
          '0%, 100%': { opacity: '0.4', filter: 'brightness(1)' },
          '50%': { opacity: '0.9', filter: 'brightness(1.2)' },
        },
        /* 星辰明灭 */
        'star-twinkle': {
          '0%, 100%': { opacity: '0.2', transform: 'scale(0.8)' },
          '50%': { opacity: '1', transform: 'scale(1.2)' },
        },
        /* 水墨(兼容) */
        'ink-fade-in': {
          '0%': { opacity: '0', filter: 'blur(8px)', transform: 'scale(0.97)' },
          '100%': { opacity: '1', filter: 'blur(0)', transform: 'scale(1)' },
        },
        'ink-float': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        'ink-breathe': {
          '0%, 100%': { opacity: '0.5', transform: 'scale(1)' },
          '50%': { opacity: '0.8', transform: 'scale(1.03)' },
        },
        'brush-write': {
          '0%': { clipPath: 'inset(0 100% 0 0)', opacity: '0' },
          '60%': { clipPath: 'inset(0 0 0 0)', opacity: '1' },
          '100%': { clipPath: 'inset(0 0 0 0)', opacity: '1' },
        },
        'seal-stamp': {
          '0%': { transform: 'scale(0) rotate(-15deg)', opacity: '0' },
          '60%': { transform: 'scale(1.15) rotate(-5deg)', opacity: '0.95' },
          '100%': { transform: 'scale(1) rotate(-6deg)', opacity: '1' },
        },
        'gold-flash': {
          '0%': { opacity: '0', transform: 'scale(0.5)', filter: 'brightness(2) blur(10px)' },
          '40%': { opacity: '1', transform: 'scale(1.05)', filter: 'brightness(1.5) blur(2px)' },
          '100%': { opacity: '1', transform: 'scale(1)', filter: 'brightness(1) blur(0px)' },
        },
        'ink-spread': {
          '0%': { transform: 'scale(0.8)', opacity: '0', filter: 'blur(20px)' },
          '50%': { opacity: '1' },
          '100%': { transform: 'scale(1)', opacity: '1', filter: 'blur(0px)' },
        },
        'mist-clear': {
          '0%': { opacity: '0', filter: 'blur(30px)' },
          '100%': { opacity: '1', filter: 'blur(0px)' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        'breathe': {
          '0%, 100%': { transform: 'scale(1)', opacity: '0.95' },
          '50%': { transform: 'scale(1.02)', opacity: '1' },
        },
        'ember-rise': {
          '0%': { transform: 'translateY(0) scale(1)', opacity: '0' },
          '10%': { opacity: '0.6' },
          '90%': { opacity: '0.3' },
          '100%': { transform: 'translateY(-100vh) scale(0.5)', opacity: '0' },
        },
        'shimmer': {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'bronze-gate': {
          '0%': { clipPath: 'inset(0 50% 0 50%)', opacity: '0' },
          '100%': { clipPath: 'inset(0 0 0 0)', opacity: '1' },
        },
      },
      boxShadow: {
        'gold-glow': '0 0 30px rgba(212, 168, 87, 0.35)',
        'jade-glow': '0 0 24px rgba(74, 140, 107, 0.3)',
        'thunder-glow': '0 0 28px rgba(123, 78, 160, 0.4)',
        'cinnabar-glow': '0 0 24px rgba(200, 66, 58, 0.32)',
        'ssr-glow': '0 0 40px rgba(200, 66, 58, 0.4)',
        'immortal': '0 8px 32px rgba(45, 74, 94, 0.15), 0 0 0 1px rgba(212, 168, 87, 0.2)',
        'rune': '0 0 12px rgba(245, 228, 184, 0.45)',
      },
    },
  },
} satisfies Config
