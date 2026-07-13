// src/effects/creature-cinematic-config.ts
// 配置层：所有神兽的电影感视觉配置
// SSR（16 只）专属配置 + SR/R（27 只）自动生成

import { getCreatureConfig } from './creature-parallax-config'
import { getRarity } from '../collection/rarity'

// ─── 场景主题枚举 ───
export type SceneTheme =
  // SSR 专属主题（16 个）
  | 'moonlit-peach-forest'    // 九尾狐
  | 'thunderstorm-sky'        // 应龙
  | 'volcanic-fire'           // 朱雀
  | 'autumn-mountain'         // 白虎
  | 'abyssal-waters'          // 玄武
  | 'sea-sky-horizon'         // 鲲鹏
  | 'kunlun-paradise'         // 麒麟
  | 'pure-darkness'           // 烛龙
  | 'underworld-abyss'        // 饕餮
  | 'void-vortex'             // 混沌
  | 'misty-mountain'          // 白泽
  | 'distant-ocean'           // 精卫
  | 'dark-shadow-mountain'    // 穷奇
  | 'wasteland-ravine'        // 梼杌
  | 'golden-palace'           // 貔貅
  | 'battlefield-ruins'       // 刑天
  // SR/R 共享主题（6 个）
  | 'fairy-forest'            // 青丘月林
  | 'cloud-thunder-sky'       // 雷云天际
  | 'lava-volcano'            // 火山熔岩
  | 'deep-waters'             // 深渊水域
  | 'desolate-wilderness'     // 幽冥荒野
  | 'immortal-clouds'         // 仙山云雾

// ─── 五行属性（扩展 earth）───
export type ElementType = 'fire' | 'water' | 'wind' | 'thunder' | 'light' | 'earth'

// ─── 入场动作类型 ───
export type EntranceType =
  | 'leap'    // 抛物线跃入
  | 'dive'    // 俯冲
  | 'rise'    // 垂直升起
  | 'walk'    // 水平移动
  | 'reveal'  // 原地渐显
  | 'emerge'  // 从远到近
  | 'spin'    // 旋转入场
  | 'rush'    // 猛冲向前

// ─── 环境衬托 ───
export interface EnvEffectConfig {
  category: 'particles' | 'fluid' | 'clouds'
  particles?: {
    type: 'petals' | 'clouds' | 'fire' | 'lightning' | 'rocks' | 'gold' | 'water_drops'
    count: number
    color: [string, string]
    motion: 'swirl' | 'burst' | 'fall' | 'trail' | 'spread'
  }
  fluid?: {
    type: 'ripple' | 'splash' | 'distortion'
    color: string
    intensity: number
  }
  clouds?: {
    type: 'thunder' | 'mist' | 'auspicious' | 'layered'
    color: [string, string]
    density: number
    motion: 'converge' | 'disperse' | 'surround' | 'trail'
  }
}

// ─── 背景层配置 ───
export interface BackgroundLayerConfig {
  geometry: 'mountain' | 'forest' | 'rockwall' | 'water' | 'clouds' | 'void' | 'palace' | 'battlefield'
  color: string
  shaderParams?: Record<string, number | string>
}

export interface SceneConfig {
  theme: SceneTheme
  fogColor: string
  fogDensity: number
  farLayer: BackgroundLayerConfig
  midLayer: BackgroundLayerConfig
  nearLayer: BackgroundLayerConfig
  lighting: {
    ambient: { color: string; intensity: number }
    main: { color: string; intensity: number; position: [number, number, number] }
    rim: { color: string; intensity: number; position: [number, number, number] }
  }
}

// ─── 完整配置 ───
export interface CinematicConfig {
  creatureId: string
  rarity: 'SSR' | 'SR' | 'R'
  element: ElementType

  palette: {
    primary: string
    secondary: string
    background: string
    accent: string
  }

  scene: SceneConfig

  entrance: {
    type: EntranceType
    startPose: { x: number; y: number; z: number; rotationY: number }
    endPose: { x: number; y: number; z: number; rotationY: number }
    duration: number
    easing: string
    trailEffect?: 'particles' | 'fire' | 'water' | 'lightning' | 'shadow' | 'gold'
    impactEffect?: 'shockwave' | 'crack' | 'splash' | 'burst' | 'none'
  }

  envEffect: EnvEffectConfig

  timing: {
    inkSpread: number
    magicCircle: number
    particleConverge: number
    modelReveal: number
    bloomFadeIn: number
  }

  particles: {
    count: number
    size: number
    speed: number
    radius: number
  }
}

// ─── 默认时间线参数 ───
export const DEFAULT_TIMING = {
  inkSpread: 0.8,
  magicCircle: 1.0,
  particleConverge: 1.0,
  modelReveal: 1.2,
  bloomFadeIn: 1.0,
}

// ─── 默认粒子参数 ───
export const DEFAULT_PARTICLES = {
  SSR: { count: 240, size: 0.05, speed: 0.8, radius: 2.0 },
  SR: { count: 160, size: 0.05, speed: 0.8, radius: 2.0 },
  R: { count: 120, size: 0.05, speed: 0.8, radius: 2.0 },
}

// ═══════════════════════════════════════════════
// SSR 专属配置（16 只）
// ═══════════════════════════════════════════════

interface SSRPartial {
  element: ElementType
  palette: CinematicConfig['palette']
  scene: SceneConfig
  entrance: CinematicConfig['entrance']
  envEffect: EnvEffectConfig
}

const SSR_CONFIGS: Record<string, SSRPartial> = {
  'jiu-wei-hu': {
    element: 'light',
    palette: { primary: '#ffa726', secondary: '#ff8a65', background: '#080608', accent: '#fff3e0' },
    scene: {
      theme: 'moonlit-peach-forest',
      fogColor: '#2a1a20', fogDensity: 0.02,
      farLayer: { geometry: 'mountain', color: '#3a2a30' },
      midLayer: { geometry: 'forest', color: '#4a3a40' },
      nearLayer: { geometry: 'void', color: '#1a1015' },
      lighting: {
        ambient: { color: '#e8d5c4', intensity: 0.4 },
        main: { color: '#fff3e0', intensity: 0.8, position: [3, 5, 2] },
        rim: { color: '#ff8a65', intensity: 0.5, position: [-3, 2, -2] },
      },
    },
    entrance: {
      type: 'leap',
      startPose: { x: 4, y: -1, z: 0, rotationY: -Math.PI / 4 },
      endPose: { x: 0, y: 0, z: 0, rotationY: 0 },
      duration: 1.5, easing: 'power2.out',
      trailEffect: 'particles', impactEffect: 'none',
    },
    envEffect: {
      category: 'particles',
      particles: { type: 'petals', count: 80, color: ['#ff8a65', '#fff3e0'], motion: 'swirl' },
    },
  },
  'ying-long': {
    element: 'water',
    palette: { primary: '#42a5f5', secondary: '#1e88e5', background: '#050810', accent: '#82b1ff' },
    scene: {
      theme: 'thunderstorm-sky',
      fogColor: '#1a1a2a', fogDensity: 0.025,
      farLayer: { geometry: 'clouds', color: '#2a2a3a' },
      midLayer: { geometry: 'clouds', color: '#3a3a4a' },
      nearLayer: { geometry: 'void', color: '#0a0a1a' },
      lighting: {
        ambient: { color: '#1a1a2a', intensity: 0.3 },
        main: { color: '#82b1ff', intensity: 1.0, position: [2, 4, 3] },
        rim: { color: '#42a5f5', intensity: 0.6, position: [-2, 1, -3] },
      },
    },
    entrance: {
      type: 'dive',
      startPose: { x: -3, y: 4, z: -5, rotationY: Math.PI / 6 },
      endPose: { x: 0, y: 0, z: 0, rotationY: 0 },
      duration: 1.5, easing: 'power3.in',
      trailEffect: 'lightning', impactEffect: 'shockwave',
    },
    envEffect: {
      category: 'clouds',
      clouds: { type: 'thunder', color: ['#2a2a3a', '#1a1a2a'], density: 0.6, motion: 'surround' },
    },
  },
  'zhu-que': {
    element: 'fire',
    palette: { primary: '#ff6b35', secondary: '#ff9800', background: '#080302', accent: '#ffc107' },
    scene: {
      theme: 'volcanic-fire',
      fogColor: '#2a0a0a', fogDensity: 0.03,
      farLayer: { geometry: 'mountain', color: '#3a1010' },
      midLayer: { geometry: 'rockwall', color: '#4a1515' },
      nearLayer: { geometry: 'void', color: '#1a0505' },
      lighting: {
        ambient: { color: '#2a0a0a', intensity: 0.4 },
        main: { color: '#ff6b35', intensity: 1.0, position: [0, 3, 2] },
        rim: { color: '#ffc107', intensity: 0.7, position: [3, 1, -2] },
      },
    },
    entrance: {
      type: 'rise',
      startPose: { x: 0, y: -3, z: 0, rotationY: 0 },
      endPose: { x: 0, y: 0, z: 0, rotationY: 0 },
      duration: 1.5, easing: 'power2.out',
      trailEffect: 'fire', impactEffect: 'burst',
    },
    envEffect: {
      category: 'particles',
      particles: { type: 'fire', count: 120, color: ['#ff6b35', '#ffc107'], motion: 'burst' },
    },
  },
  'bai-hu': {
    element: 'light',
    palette: { primary: '#e0e0e0', secondary: '#bdbdbd', background: '#060806', accent: '#cfd8dc' },
    scene: {
      theme: 'autumn-mountain',
      fogColor: '#1a1e1a', fogDensity: 0.022,
      farLayer: { geometry: 'mountain', color: '#2a2e2a' },
      midLayer: { geometry: 'forest', color: '#3a3e3a' },
      nearLayer: { geometry: 'void', color: '#0a0e0a' },
      lighting: {
        ambient: { color: '#cfd8dc', intensity: 0.4 },
        main: { color: '#e0e0e0', intensity: 0.9, position: [3, 5, 2] },
        rim: { color: '#bdbdbd', intensity: 0.4, position: [-3, 2, -2] },
      },
    },
    entrance: {
      type: 'leap',
      startPose: { x: -4, y: -1, z: 0, rotationY: Math.PI / 4 },
      endPose: { x: 0, y: 0, z: 0, rotationY: 0 },
      duration: 1.3, easing: 'power2.out',
      trailEffect: 'lightning', impactEffect: 'shockwave',
    },
    envEffect: {
      category: 'particles',
      particles: { type: 'lightning', count: 60, color: ['#e0e0e0', '#ffffff'], motion: 'spread' },
    },
  },
  'xuan-wu': {
    element: 'water',
    palette: { primary: '#00acc1', secondary: '#0097a7', background: '#030610', accent: '#4dd0e1' },
    scene: {
      theme: 'abyssal-waters',
      fogColor: '#0a1a2a', fogDensity: 0.03,
      farLayer: { geometry: 'water', color: '#0a1525' },
      midLayer: { geometry: 'water', color: '#102030' },
      nearLayer: { geometry: 'water', color: '#050a15' },
      lighting: {
        ambient: { color: '#0a1a2a', intensity: 0.3 },
        main: { color: '#00acc1', intensity: 0.8, position: [0, 4, 2] },
        rim: { color: '#4dd0e1', intensity: 0.5, position: [-2, 1, -3] },
      },
    },
    entrance: {
      type: 'rise',
      startPose: { x: 0, y: -3, z: 0, rotationY: 0 },
      endPose: { x: 0, y: 0, z: 0, rotationY: 0 },
      duration: 2.0, easing: 'power2.out',
      trailEffect: 'water', impactEffect: 'splash',
    },
    envEffect: {
      category: 'fluid',
      fluid: { type: 'ripple', color: '#00acc1', intensity: 0.8 },
    },
  },
  'kun-peng': {
    element: 'water',
    palette: { primary: '#26c6da', secondary: '#80deea', background: '#030810', accent: '#b2ebf2' },
    scene: {
      theme: 'sea-sky-horizon',
      fogColor: '#1a2a3a', fogDensity: 0.02,
      farLayer: { geometry: 'water', color: '#1a2535' },
      midLayer: { geometry: 'clouds', color: '#2a3545' },
      nearLayer: { geometry: 'water', color: '#0a1520' },
      lighting: {
        ambient: { color: '#1a2a3a', intensity: 0.4 },
        main: { color: '#80deea', intensity: 0.9, position: [2, 4, 3] },
        rim: { color: '#26c6da', intensity: 0.5, position: [-2, 2, -2] },
      },
    },
    entrance: {
      type: 'emerge',
      startPose: { x: 0, y: -2, z: -8, rotationY: 0 },
      endPose: { x: 0, y: 0, z: 0, rotationY: 0 },
      duration: 1.8, easing: 'power2.out',
      trailEffect: 'water', impactEffect: 'splash',
    },
    envEffect: {
      category: 'fluid',
      fluid: { type: 'splash', color: '#26c6da', intensity: 0.7 },
    },
  },
  'qi-lin': {
    element: 'light',
    palette: { primary: '#ffd54f', secondary: '#ffb300', background: '#080600', accent: '#fff8e1' },
    scene: {
      theme: 'kunlun-paradise',
      fogColor: '#2a2010', fogDensity: 0.018,
      farLayer: { geometry: 'mountain', color: '#3a2a15' },
      midLayer: { geometry: 'clouds', color: '#4a3520' },
      nearLayer: { geometry: 'void', color: '#15100a' },
      lighting: {
        ambient: { color: '#fff8e1', intensity: 0.5 },
        main: { color: '#ffd54f', intensity: 1.0, position: [2, 5, 2] },
        rim: { color: '#ffb300', intensity: 0.5, position: [-2, 2, -2] },
      },
    },
    entrance: {
      type: 'walk',
      startPose: { x: 4, y: 0, z: 0, rotationY: -Math.PI / 2 },
      endPose: { x: 0, y: 0, z: 0, rotationY: 0 },
      duration: 2.0, easing: 'none',
      trailEffect: 'particles', impactEffect: 'none',
    },
    envEffect: {
      category: 'clouds',
      clouds: { type: 'auspicious', color: ['#ffd54f', '#fff8e1'], density: 0.5, motion: 'surround' },
    },
  },
  'chu-shuo': {
    element: 'fire',
    palette: { primary: '#f4511e', secondary: '#ff7043', background: '#030000', accent: '#ffab40' },
    scene: {
      theme: 'pure-darkness',
      fogColor: '#000000', fogDensity: 0.015,
      farLayer: { geometry: 'void', color: '#000000' },
      midLayer: { geometry: 'void', color: '#050000' },
      nearLayer: { geometry: 'void', color: '#000000' },
      lighting: {
        ambient: { color: '#000000', intensity: 0.0 },
        main: { color: '#f4511e', intensity: 0.3, position: [0, 0, 3] },
        rim: { color: '#ffab40', intensity: 0.2, position: [0, 2, -2] },
      },
    },
    entrance: {
      type: 'reveal',
      startPose: { x: 0, y: 0, z: 0, rotationY: 0 },
      endPose: { x: 0, y: 0, z: 0, rotationY: 0 },
      duration: 2.5, easing: 'power1.inOut',
      trailEffect: 'particles', impactEffect: 'none',
    },
    envEffect: {
      category: 'particles',
      particles: { type: 'fire', count: 100, color: ['#f4511e', '#ffab40'], motion: 'swirl' },
    },
  },
  'tao-tie': {
    element: 'thunder',
    palette: { primary: '#8d6e63', secondary: '#a1887f', background: '#050200', accent: '#bcaaa4' },
    scene: {
      theme: 'underworld-abyss',
      fogColor: '#1a0a0a', fogDensity: 0.028,
      farLayer: { geometry: 'rockwall', color: '#2a1010' },
      midLayer: { geometry: 'rockwall', color: '#3a1515' },
      nearLayer: { geometry: 'rockwall', color: '#0a0505' },
      lighting: {
        ambient: { color: '#1a0a0a', intensity: 0.3 },
        main: { color: '#8d6e63', intensity: 0.7, position: [0, 4, 2] },
        rim: { color: '#bcaaa4', intensity: 0.4, position: [-2, 1, -2] },
      },
    },
    entrance: {
      type: 'rise',
      startPose: { x: 0, y: -3, z: 0, rotationY: 0 },
      endPose: { x: 0, y: 0, z: 0, rotationY: 0 },
      duration: 1.8, easing: 'power2.out',
      trailEffect: 'shadow', impactEffect: 'crack',
    },
    envEffect: {
      category: 'particles',
      particles: { type: 'rocks', count: 60, color: ['#8d6e63', '#3a1515'], motion: 'fall' },
    },
  },
  'hun-dun': {
    element: 'thunder',
    palette: { primary: '#ab47bc', secondary: '#7e57c2', background: '#030008', accent: '#ce93d8' },
    scene: {
      theme: 'void-vortex',
      fogColor: '#0a000a', fogDensity: 0.02,
      farLayer: { geometry: 'void', color: '#0a000a' },
      midLayer: { geometry: 'void', color: '#150515' },
      nearLayer: { geometry: 'void', color: '#05000a' },
      lighting: {
        ambient: { color: '#150515', intensity: 0.3 },
        main: { color: '#ab47bc', intensity: 0.8, position: [0, 3, 2] },
        rim: { color: '#ce93d8', intensity: 0.6, position: [-2, 1, -2] },
      },
    },
    entrance: {
      type: 'spin',
      startPose: { x: 0, y: 0, z: -3, rotationY: 0 },
      endPose: { x: 0, y: 0, z: 0, rotationY: Math.PI * 2 },
      duration: 2.0, easing: 'power2.inOut',
      trailEffect: 'particles', impactEffect: 'burst',
    },
    envEffect: {
      category: 'fluid',
      fluid: { type: 'distortion', color: '#ab47bc', intensity: 0.6 },
    },
  },
  'bai-ze': {
    element: 'light',
    palette: { primary: '#fff59d', secondary: '#fff176', background: '#060604', accent: '#ffffff' },
    scene: {
      theme: 'misty-mountain',
      fogColor: '#e8e4d4', fogDensity: 0.025,
      farLayer: { geometry: 'mountain', color: '#d8d4c4' },
      midLayer: { geometry: 'clouds', color: '#e8e4d4' },
      nearLayer: { geometry: 'void', color: '#a8a494' },
      lighting: {
        ambient: { color: '#fff59d', intensity: 0.5 },
        main: { color: '#ffffff', intensity: 0.9, position: [2, 4, 2] },
        rim: { color: '#fff176', intensity: 0.5, position: [-2, 2, -2] },
      },
    },
    entrance: {
      type: 'walk',
      startPose: { x: 4, y: 0, z: 0, rotationY: -Math.PI / 2 },
      endPose: { x: 0, y: 0, z: 0, rotationY: 0 },
      duration: 1.8, easing: 'power1.inOut',
      trailEffect: 'particles', impactEffect: 'none',
    },
    envEffect: {
      category: 'clouds',
      clouds: { type: 'mist', color: ['#ffffff', '#fff59d'], density: 0.7, motion: 'disperse' },
    },
  },
  'jing-wei': {
    element: 'wind',
    palette: { primary: '#80cbc4', secondary: '#4db6ac', background: '#030608', accent: '#b2dfdb' },
    scene: {
      theme: 'distant-ocean',
      fogColor: '#1a2a3a', fogDensity: 0.02,
      farLayer: { geometry: 'water', color: '#2a3a4a' },
      midLayer: { geometry: 'clouds', color: '#3a4a5a' },
      nearLayer: { geometry: 'void', color: '#0a1015' },
      lighting: {
        ambient: { color: '#1a2a3a', intensity: 0.4 },
        main: { color: '#80cbc4', intensity: 0.9, position: [3, 4, 2] },
        rim: { color: '#b2dfdb', intensity: 0.4, position: [-2, 2, -2] },
      },
    },
    entrance: {
      type: 'emerge',
      startPose: { x: 0, y: 1, z: -10, rotationY: 0 },
      endPose: { x: 0, y: 0, z: 0, rotationY: 0 },
      duration: 2.0, easing: 'power2.out',
      trailEffect: 'particles', impactEffect: 'none',
    },
    envEffect: {
      category: 'clouds',
      clouds: { type: 'layered', color: ['#80cbc4', '#b2dfdb'], density: 0.5, motion: 'trail' },
    },
  },
  'qiong-qi': {
    element: 'thunder',
    palette: { primary: '#9575cd', secondary: '#7e57c2', background: '#030006', accent: '#b39ddb' },
    scene: {
      theme: 'dark-shadow-mountain',
      fogColor: '#0a0a0a', fogDensity: 0.03,
      farLayer: { geometry: 'mountain', color: '#1a1a1a' },
      midLayer: { geometry: 'forest', color: '#2a2a2a' },
      nearLayer: { geometry: 'void', color: '#000000' },
      lighting: {
        ambient: { color: '#0a0a0a', intensity: 0.2 },
        main: { color: '#9575cd', intensity: 0.6, position: [0, 3, 2] },
        rim: { color: '#b39ddb', intensity: 0.3, position: [-2, 1, -2] },
      },
    },
    entrance: {
      type: 'rush',
      startPose: { x: 0, y: 0, z: -8, rotationY: 0 },
      endPose: { x: 0, y: 0, z: 0, rotationY: 0 },
      duration: 1.0, easing: 'power4.out',
      trailEffect: 'shadow', impactEffect: 'burst',
    },
    envEffect: {
      category: 'particles',
      particles: { type: 'clouds', count: 50, color: ['#1a1a1a', '#9575cd'], motion: 'spread' },
    },
  },
  'tao-wu': {
    element: 'earth',
    palette: { primary: '#a1887f', secondary: '#8d6e63', background: '#050300', accent: '#bcaaa4' },
    scene: {
      theme: 'wasteland-ravine',
      fogColor: '#1a1008', fogDensity: 0.028,
      farLayer: { geometry: 'mountain', color: '#2a1a08' },
      midLayer: { geometry: 'rockwall', color: '#3a2a10' },
      nearLayer: { geometry: 'rockwall', color: '#0a0500' },
      lighting: {
        ambient: { color: '#1a1008', intensity: 0.3 },
        main: { color: '#a1887f', intensity: 0.7, position: [0, 4, 2] },
        rim: { color: '#bcaaa4', intensity: 0.4, position: [-2, 1, -2] },
      },
    },
    entrance: {
      type: 'rush',
      startPose: { x: 0, y: -2, z: -3, rotationY: 0 },
      endPose: { x: 0, y: 0, z: 0, rotationY: 0 },
      duration: 1.2, easing: 'power4.out',
      trailEffect: 'shadow', impactEffect: 'crack',
    },
    envEffect: {
      category: 'particles',
      particles: { type: 'rocks', count: 50, color: ['#a1887f', '#3a2a10'], motion: 'fall' },
    },
  },
  'pi-xiu': {
    element: 'light',
    palette: { primary: '#ffd54f', secondary: '#ffb300', background: '#060400', accent: '#fff8e1' },
    scene: {
      theme: 'golden-palace',
      fogColor: '#2a2010', fogDensity: 0.02,
      farLayer: { geometry: 'palace', color: '#3a2a15' },
      midLayer: { geometry: 'palace', color: '#4a3520' },
      nearLayer: { geometry: 'void', color: '#100a00' },
      lighting: {
        ambient: { color: '#fff8e1', intensity: 0.5 },
        main: { color: '#ffd54f', intensity: 1.0, position: [2, 5, 2] },
        rim: { color: '#ffb300', intensity: 0.6, position: [-2, 2, -2] },
      },
    },
    entrance: {
      type: 'reveal',
      startPose: { x: 0, y: 0, z: 0, rotationY: 0 },
      endPose: { x: 0, y: 0, z: 0, rotationY: 0 },
      duration: 2.0, easing: 'power1.inOut',
      trailEffect: 'gold', impactEffect: 'burst',
    },
    envEffect: {
      category: 'particles',
      particles: { type: 'gold', count: 80, color: ['#ffd54f', '#fff8e1'], motion: 'burst' },
    },
  },
  'xing-tian': {
    element: 'fire',
    palette: { primary: '#d84315', secondary: '#bf360c', background: '#050302', accent: '#ff8a65' },
    scene: {
      theme: 'battlefield-ruins',
      fogColor: '#1a1508', fogDensity: 0.025,
      farLayer: { geometry: 'battlefield', color: '#2a1a08' },
      midLayer: { geometry: 'battlefield', color: '#3a2a10' },
      nearLayer: { geometry: 'void', color: '#050a05' },
      lighting: {
        ambient: { color: '#1a1508', intensity: 0.3 },
        main: { color: '#d84315', intensity: 0.9, position: [0, 3, 2] },
        rim: { color: '#ff8a65', intensity: 0.5, position: [-2, 1, -2] },
      },
    },
    entrance: {
      type: 'spin',
      startPose: { x: 3, y: 0, z: 0, rotationY: 0 },
      endPose: { x: 0, y: 0, z: 0, rotationY: Math.PI * 2 },
      duration: 1.5, easing: 'power2.inOut',
      trailEffect: 'particles', impactEffect: 'shockwave',
    },
    envEffect: {
      category: 'particles',
      particles: { type: 'fire', count: 70, color: ['#d84315', '#ff8a65'], motion: 'spread' },
    },
  },
}

// ═══════════════════════════════════════════════
// SR/R 自动生成
// ═══════════════════════════════════════════════

// SR/R 主题映射（五行 → 场景主题）
const ELEMENT_THEME_MAP: Record<ElementType, SceneTheme> = {
  fire: 'lava-volcano',
  water: 'deep-waters',
  wind: 'fairy-forest',
  thunder: 'cloud-thunder-sky',
  light: 'immortal-clouds',
  earth: 'desolate-wilderness',
}

// SR/R 默认入场动作（五行 → 入场类型）
const ELEMENT_ENTRANCE_MAP: Record<ElementType, EntranceType> = {
  fire: 'rise',
  water: 'rise',
  wind: 'emerge',
  thunder: 'dive',
  light: 'reveal',
  earth: 'rush',
}

// 五行配色
const ELEMENT_PALETTE: Record<ElementType, { primary: string; secondary: string; background: string; accent: string }> = {
  fire:    { primary: '#ff5722', secondary: '#ff8a65', background: '#080202', accent: '#ffab40' },
  water:   { primary: '#2196f3', secondary: '#64b5f6', background: '#030610', accent: '#82b1ff' },
  wind:    { primary: '#4caf50', secondary: '#81c784', background: '#030603', accent: '#a5d6a7' },
  thunder: { primary: '#9c27b0', secondary: '#ba68c8', background: '#040006', accent: '#ce93d8' },
  light:   { primary: '#ffc107', secondary: '#ffd54f', background: '#060502', accent: '#fff8e1' },
  earth:   { primary: '#795548', secondary: '#a1887f', background: '#050200', accent: '#bcaaa4' },
}

// SR/R 主题场景配置
const THEME_SCENES: Record<string, Omit<SceneConfig, 'theme'>> = {
  'lava-volcano': {
    fogColor: '#2a0a0a', fogDensity: 0.025,
    farLayer: { geometry: 'mountain', color: '#3a1010' },
    midLayer: { geometry: 'rockwall', color: '#4a1515' },
    nearLayer: { geometry: 'void', color: '#1a0505' },
    lighting: {
      ambient: { color: '#2a0a0a', intensity: 0.3 },
      main: { color: '#ff5722', intensity: 0.8, position: [0, 3, 2] },
      rim: { color: '#ffab40', intensity: 0.5, position: [-2, 1, -2] },
    },
  },
  'deep-waters': {
    fogColor: '#0a1a2a', fogDensity: 0.028,
    farLayer: { geometry: 'water', color: '#0a1525' },
    midLayer: { geometry: 'water', color: '#102030' },
    nearLayer: { geometry: 'water', color: '#050a15' },
    lighting: {
      ambient: { color: '#0a1a2a', intensity: 0.3 },
      main: { color: '#2196f3', intensity: 0.7, position: [0, 4, 2] },
      rim: { color: '#82b1ff', intensity: 0.4, position: [-2, 1, -3] },
    },
  },
  'fairy-forest': {
    fogColor: '#e8d5c4', fogDensity: 0.02,
    farLayer: { geometry: 'mountain', color: '#3a2a30' },
    midLayer: { geometry: 'forest', color: '#4a3a40' },
    nearLayer: { geometry: 'void', color: '#1a1015' },
    lighting: {
      ambient: { color: '#e8d5c4', intensity: 0.4 },
      main: { color: '#4caf50', intensity: 0.7, position: [3, 4, 2] },
      rim: { color: '#a5d6a7', intensity: 0.4, position: [-2, 2, -2] },
    },
  },
  'cloud-thunder-sky': {
    fogColor: '#1a1a2a', fogDensity: 0.025,
    farLayer: { geometry: 'clouds', color: '#2a2a3a' },
    midLayer: { geometry: 'clouds', color: '#3a3a4a' },
    nearLayer: { geometry: 'void', color: '#0a0a1a' },
    lighting: {
      ambient: { color: '#1a1a2a', intensity: 0.3 },
      main: { color: '#9c27b0', intensity: 0.7, position: [2, 4, 3] },
      rim: { color: '#ce93d8', intensity: 0.5, position: [-2, 1, -3] },
    },
  },
  'immortal-clouds': {
    fogColor: '#e8e4d4', fogDensity: 0.02,
    farLayer: { geometry: 'mountain', color: '#d8d4c4' },
    midLayer: { geometry: 'clouds', color: '#e8e4d4' },
    nearLayer: { geometry: 'void', color: '#a8a494' },
    lighting: {
      ambient: { color: '#fff8e1', intensity: 0.5 },
      main: { color: '#ffc107', intensity: 0.8, position: [2, 4, 2] },
      rim: { color: '#fff8e1', intensity: 0.5, position: [-2, 2, -2] },
    },
  },
  'desolate-wilderness': {
    fogColor: '#1a0a0a', fogDensity: 0.028,
    farLayer: { geometry: 'mountain', color: '#2a1a08' },
    midLayer: { geometry: 'forest', color: '#3a2a10' },
    nearLayer: { geometry: 'rockwall', color: '#0a0500' },
    lighting: {
      ambient: { color: '#1a0a0a', intensity: 0.3 },
      main: { color: '#795548', intensity: 0.7, position: [0, 4, 2] },
      rim: { color: '#bcaaa4', intensity: 0.4, position: [-2, 1, -2] },
    },
  },
}

// 从 creature-parallax-config 获取五行属性，映射到扩展的 ElementType
function getElementType(creatureId: string): ElementType {
  const existing = getCreatureConfig(creatureId)
  const baseType = existing.particleType as string

  // 特殊映射：梼杌 → earth
  if (creatureId === 'tao-wu') return 'earth'

  // 其他不在 CORE_CREATURES 中的神兽默认 wind
  return (baseType as ElementType) || 'wind'
}

// 获取入场起始位置
function getStartPose(type: EntranceType): { x: number; y: number; z: number; rotationY: number } {
  switch (type) {
    case 'leap': return { x: 4, y: -1, z: 0, rotationY: -Math.PI / 4 }
    case 'dive': return { x: -3, y: 4, z: -5, rotationY: Math.PI / 6 }
    case 'rise': return { x: 0, y: -3, z: 0, rotationY: 0 }
    case 'walk': return { x: 4, y: 0, z: 0, rotationY: -Math.PI / 2 }
    case 'reveal': return { x: 0, y: 0, z: 0, rotationY: 0 }
    case 'emerge': return { x: 0, y: 0, z: -8, rotationY: 0 }
    case 'spin': return { x: 0, y: 0, z: -3, rotationY: 0 }
    case 'rush': return { x: 0, y: 0, z: -8, rotationY: 0 }
  }
}

// 获取五行默认环境效果
function getDefaultEnvEffect(element: ElementType): EnvEffectConfig {
  const palette = ELEMENT_PALETTE[element]
  switch (element) {
    case 'fire':
      return { category: 'particles', particles: { type: 'fire', count: 80, color: [palette.primary, palette.accent], motion: 'burst' } }
    case 'water':
      return { category: 'fluid', fluid: { type: 'ripple', color: palette.primary, intensity: 0.6 } }
    case 'wind':
      return { category: 'particles', particles: { type: 'clouds', count: 60, color: [palette.secondary, palette.accent], motion: 'swirl' } }
    case 'thunder':
      return { category: 'particles', particles: { type: 'lightning', count: 50, color: [palette.primary, palette.accent], motion: 'spread' } }
    case 'light':
      return { category: 'clouds', clouds: { type: 'mist', color: [palette.accent, palette.secondary], density: 0.5, motion: 'surround' } }
    case 'earth':
      return { category: 'particles', particles: { type: 'rocks', count: 40, color: [palette.primary, palette.background], motion: 'fall' } }
  }
}

// ─── 主入口：获取神兽的电影感配置 ───
export function getCinematicConfig(creatureId: string): CinematicConfig {
  const ssrConfig = SSR_CONFIGS[creatureId]
  const isSSR = ssrConfig !== undefined

  // SSR 直接返回专属配置
  if (isSSR && ssrConfig) {
    return {
      creatureId,
      rarity: 'SSR',
      element: ssrConfig.element,
      palette: ssrConfig.palette,
      scene: ssrConfig.scene,
      entrance: ssrConfig.entrance,
      envEffect: ssrConfig.envEffect,
      timing: DEFAULT_TIMING,
      particles: DEFAULT_PARTICLES.SSR,
    }
  }

  // SR/R 自动生成
  const element = getElementType(creatureId)
  const rarityLevel = getRarity({ id: creatureId, confidence: 'medium' })
  const particleConfig = DEFAULT_PARTICLES[rarityLevel]
  const theme = ELEMENT_THEME_MAP[element]
  const sceneBase = THEME_SCENES[theme]
  const palette = ELEMENT_PALETTE[element]
  const entranceType = ELEMENT_ENTRANCE_MAP[element]

  return {
    creatureId,
    rarity: rarityLevel,
    element,
    palette,
    scene: { theme, ...sceneBase },
    entrance: {
      type: entranceType,
      startPose: getStartPose(entranceType),
      endPose: { x: 0, y: 0, z: 0, rotationY: 0 },
      duration: 1.5,
      easing: 'power2.out',
    },
    envEffect: getDefaultEnvEffect(element),
    timing: DEFAULT_TIMING,
    particles: particleConfig,
  }
}
