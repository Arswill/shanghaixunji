export type ElementType = 'fire' | 'water' | 'wind' | 'thunder' | 'light'

export interface CreatureVisualConfig {
  glowColor: string
  parallaxIntensity: number
  particleType: ElementType
}

const CORE_CREATURES: Record<string, CreatureVisualConfig> = {
  'bi-fang': { glowColor: '#ff6b35', parallaxIntensity: 0.03, particleType: 'fire' },
  'jiu-wei-hu': { glowColor: '#ffa726', parallaxIntensity: 0.025, particleType: 'light' },
  'ying-long': { glowColor: '#42a5f5', parallaxIntensity: 0.035, particleType: 'water' },
  'qi-lin': { glowColor: '#ffd54f', parallaxIntensity: 0.02, particleType: 'light' },
  'bai-ze': { glowColor: '#fff59d', parallaxIntensity: 0.02, particleType: 'light' },
  'hun-dun': { glowColor: '#ab47bc', parallaxIntensity: 0.04, particleType: 'thunder' },
  'chi-you': { glowColor: '#ef5350', parallaxIntensity: 0.035, particleType: 'fire' },
  'han-ba': { glowColor: '#ff7043', parallaxIntensity: 0.03, particleType: 'fire' },
  'fei-fei': { glowColor: '#ff8a65', parallaxIntensity: 0.025, particleType: 'fire' },
  'chu-shuo': { glowColor: '#f4511e', parallaxIntensity: 0.03, particleType: 'fire' },
  'fei-lian': { glowColor: '#80cbc4', parallaxIntensity: 0.035, particleType: 'wind' },
  'kun-peng': { glowColor: '#26c6da', parallaxIntensity: 0.04, particleType: 'water' },
  'tao-tie': { glowColor: '#8d6e63', parallaxIntensity: 0.03, particleType: 'thunder' },
  'qiong-qi': { glowColor: '#9575cd', parallaxIntensity: 0.035, particleType: 'thunder' },
  'pi-xiu': { glowColor: '#ffd54f', parallaxIntensity: 0.02, particleType: 'light' },
  'xie-zhi': { glowColor: '#fff176', parallaxIntensity: 0.02, particleType: 'light' },
  'bai-hu': { glowColor: '#e0e0e0', parallaxIntensity: 0.025, particleType: 'light' },
  'di-jiang': { glowColor: '#78909c', parallaxIntensity: 0.03, particleType: 'wind' },
  'fu-zhu': { glowColor: '#4dd0e1', parallaxIntensity: 0.03, particleType: 'water' },
  'hai-huang-shou': { glowColor: '#29b6f6', parallaxIntensity: 0.035, particleType: 'water' },
  'huan-shu': { glowColor: '#66bb6a', parallaxIntensity: 0.025, particleType: 'wind' },
  'hua-she': { glowColor: '#9ccc65', parallaxIntensity: 0.03, particleType: 'thunder' },
  'gu-diao': { glowColor: '#ff7043', parallaxIntensity: 0.025, particleType: 'fire' },
  'dang-kang': { glowColor: '#26a69a', parallaxIntensity: 0.025, particleType: 'water' },
  'chang-you': { glowColor: '#9e9d24', parallaxIntensity: 0.025, particleType: 'wind' },
  'er-shu': { glowColor: '#7cb342', parallaxIntensity: 0.02, particleType: 'wind' },
  'gou-chen': { glowColor: '#7e57c2', parallaxIntensity: 0.03, particleType: 'thunder' },
  'bi-xi': { glowColor: '#00acc1', parallaxIntensity: 0.025, particleType: 'water' },
  'feng-bo': { glowColor: '#5c6bc0', parallaxIntensity: 0.035, particleType: 'thunder' },
  'fei-teng': { glowColor: '#66bb6a', parallaxIntensity: 0.03, particleType: 'wind' },
}

const DEFAULT_CONFIG: CreatureVisualConfig = {
  glowColor: '#88ccff',
  parallaxIntensity: 0.025,
  particleType: 'wind',
}

export function getCreatureConfig(id: string): CreatureVisualConfig {
  return CORE_CREATURES[id] ?? DEFAULT_CONFIG
}

export const PARTICLE_COLORS: Record<ElementType, string> = {
  fire: '#ff5722',
  water: '#2196f3',
  wind: '#4caf50',
  thunder: '#9c27b0',
  light: '#ffc107',
}