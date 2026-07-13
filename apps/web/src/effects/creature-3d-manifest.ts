/**
 * 3D 模型清单 — 映射神兽 ID 到 GLB 模型路径
 *
 * 仅列出具备 3D 模型（GLB）的神兽。
 * 路径相对于 public/ 目录。
 */

/** 拥有 3D 模型的神兽 ID 集合 */
export const CREATURES_WITH_3D: ReadonlySet<string> = new Set([
  'bai-hu',
  'bai-she',
  'bai-ze',
  'bi-fang',
  'bi-xi',
  'bi-yi-niao',
  'bing-can',
  'can-ma',
  'chang-you',
  'chi-ru',
  'chi-you',
  'chu-shuo',
  'er-shu',
  'fei-fei',
  'fei-lian',
  'fei-teng',
  'feng-bo',
  'fu-zhu',
  'gou-chen',
  'gu-diao',
  'hai-huang-shou',
  'han-ba',
  'han-fu',
  'hao-zhi',
  'hua-huai',
  'hua-she',
  'hua-yu',
  'huan-shu',
  'hun-dun',
  'ji-meng',
  'jian',
  'jiao-chong',
  'jiao-long',
  'jiao-ren',
  'jiao-tu',
  'jie-gou',
  'jing-wei',
  'jiu-wei-hu',
  'kun-peng',
  'qi-lin',
  'tao-tie',
  'ying-long',
  'zhu-que',
  // SSR 补齐模型
  'qiong-qi',
  'tao-wu',
  'pi-xiu',
  'xing-tian',
  'xuan-wu',
])

/** GLB 模型基础路径（相对 public/） */
const MODEL_BASE = '/assets/models'

/**
 * 获取神兽的 3D 模型 URL。
 * @returns GLB 文件 URL，无模型时返回 null
 */
export function getModelUrl(creatureId: string): string | null {
  if (!CREATURES_WITH_3D.has(creatureId)) return null
  return `${MODEL_BASE}/${creatureId}.glb`
}

/**
 * 判断神兽是否拥有 3D 模型。
 */
export function has3DModel(creatureId: string): boolean {
  return CREATURES_WITH_3D.has(creatureId)
}
