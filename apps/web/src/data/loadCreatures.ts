import rawCreatures from '../../../../data/verified/creatures_verified.json' with { type: 'json' }
import rawPatch from '../../../../data/verified/creatures_patch.json' with { type: 'json' }
import manifestData from '../assets/manifest.json' with { type: 'json' }
import type { Creature } from './creatures.schema'
import { CreaturesFileSchema } from './creatures.schema'

export type CreatureWithAssets = Creature & {
  audio: string | null
  image: string | null
}

const typedCreatures = rawCreatures as Creature[]
const patch = rawPatch as Partial<Creature>[]

function applyPatches(creatures: Creature[]): Creature[] {
  const patchMap = new Map(patch.map((p) => [p.id, p]))
  return creatures.map((c) => {
    const overrides = patchMap.get(c.id)
    return overrides ? { ...c, ...overrides } : c
  })
}

const patchedCreatures = applyPatches(typedCreatures)
const baseCreatures = CreaturesFileSchema.parse(patchedCreatures)

export const creatures: CreatureWithAssets[] = baseCreatures.map((c) => {
  const assets = (manifestData as Record<string, { audio: string | null; image: string | null }>)[c.id] || { audio: null, image: null }
  return {
    ...c,
    audio: assets.audio,
    image: assets.image,
  }
})

export function getCreaturesByProvince(province: string): CreatureWithAssets[] {
  return creatures.filter((c) => {
    // 直接匹配
    if (c.province === province) return true
    // 两广双向匹配：
    // - 查询「两广」时，也匹配 province 为「广东」或「广西」的神兽
    // - 查询「广东」/「广西」时，也匹配 province 为「两广」的神兽
    if (province === '两广' && (c.province === '广东' || c.province === '广西')) return true
    if ((province === '广东' || province === '广西') && c.province === '两广') return true
    return false
  })
}

export function getCreatureById(id: string): CreatureWithAssets | undefined {
  return creatures.find((c) => c.id === id)
}
