import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { getCreatureById } from '../data/loadCreatures'
import { detectPersonality, type Personality } from '../chat/chatPrompts'

export type BondLevel = 'stranger' | 'acquainted' | 'bonded' | 'kindred'
export type Mood = 'joyful' | 'calm' | 'wary' | 'listless'
export type GiftType = 'spirit-fruit' | 'ancient-jade' | 'cinnabar'

export interface Bond {
  level: BondLevel
  score: number
  chatCount: number
  giftCount: number
  encounterCount: number
  lastInteraction: number
  mood: Mood
  /** 最后赠礼日期（YYYY-MM-DD），用于每日限次重置 */
  giftGivenDate: string
  /** 当日已赠礼次数 */
  giftCountToday: number
}

/** 每只神兽每日赠礼上限 */
export const MAX_GIFTS_PER_DAY = 3

export const LEVEL_THRESHOLDS: Record<BondLevel, number> = {
  stranger: 0,
  acquainted: 50,
  bonded: 150,
  kindred: 300,
}

export const GIFT_PREFERENCE: Record<Personality, GiftType> = {
  ferocious: 'ancient-jade',
  auspicious: 'spirit-fruit',
  disastrous: 'cinnabar',
  mysterious: 'ancient-jade',
}

export const LEVEL_LABEL: Record<BondLevel, string> = {
  stranger: '初识',
  acquainted: '相知',
  bonded: '化形',
  kindred: '共生',
}

export const MOOD_LABEL: Record<Mood, string> = {
  joyful: '欣喜',
  calm: '平静',
  wary: '警惕',
  listless: '慵懒',
}

export const GIFT_LABEL: Record<GiftType, string> = {
  'spirit-fruit': '灵果',
  'ancient-jade': '古玉',
  cinnabar: '朱砂',
}

/** 交谈羁绊增量 */
const CHAT_SCORE_GAIN = 5
/** 遭遇羁绊增量 */
const ENCOUNTER_SCORE_GAIN = 10
/** 赠礼喜爱增量 */
const GIFT_LIKED_SCORE_GAIN = 20
/** 赠礼普通增量 */
const GIFT_NORMAL_SCORE_GAIN = 5
/** 七天毫秒数（用于判定心境慵懒） */
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000
/** 保留的最近交互记录数 */
const MAX_RECENT_INTERACTIONS = 5
/** 心境判定所需的最近交互窗口大小 */
const MOOD_WINDOW_SIZE = 3

const EMPTY_BOND: Bond = {
  level: 'stranger',
  score: 0,
  chatCount: 0,
  giftCount: 0,
  encounterCount: 0,
  lastInteraction: 0,
  mood: 'calm',
  giftGivenDate: '',
  giftCountToday: 0,
}

/** 返回今日日期字符串（YYYY-MM-DD），用于赠礼每日限次判定。 */
function getTodayString(date: Date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

type InteractionType = 'chat' | 'gift' | 'encounter'

interface InteractionRecord {
  type: InteractionType
  timestamp: number
  giftType?: GiftType
  liked?: boolean
}

interface BondState {
  bonds: Record<string, Bond>
  interactions: Record<string, InteractionRecord[]>
  recordChat: (creatureId: string) => void
  recordEncounter: (creatureId: string) => void
  /** 一次性增加指定分数（不记录遭遇次数，避免与 recordEncounter 的 score+10 重复定义） */
  addScore: (creatureId: string, amount: number) => void
  giveGift: (creatureId: string, giftType: GiftType) => boolean
  /** 返回某神兽今日已赠礼次数（日期变化时自动归零）。 */
  getGiftCountToday: (creatureId: string) => number
  getBond: (creatureId: string) => Bond
  getMood: (creatureId: string) => Mood
  getLastGift: (creatureId: string) => { type: GiftType; liked: boolean } | undefined
  reset: () => void
}

function computeLevel(score: number): BondLevel {
  if (score >= LEVEL_THRESHOLDS.kindred) return 'kindred'
  if (score >= LEVEL_THRESHOLDS.bonded) return 'bonded'
  if (score >= LEVEL_THRESHOLDS.acquainted) return 'acquainted'
  return 'stranger'
}

function addInteraction(
  interactions: Record<string, InteractionRecord[]>,
  creatureId: string,
  interaction: InteractionRecord
): InteractionRecord[] {
  const existing = interactions[creatureId] || []
  return [...existing, interaction].slice(-MAX_RECENT_INTERACTIONS)
}

function determineMood(
  records: InteractionRecord[] | undefined,
  lastInteraction: number
): Mood {
  const now = Date.now()

  if (lastInteraction > 0 && now - lastInteraction > SEVEN_DAYS_MS) {
    return 'listless'
  }

  if (records && records.length > 0) {
    const latest = records[records.length - 1]
    if (latest.type === 'gift' && latest.liked === false) {
      return 'wary'
    }

    const recent = records.slice(-MOOD_WINDOW_SIZE)
    if (recent.length >= MOOD_WINDOW_SIZE && recent.every((r) => r.type === 'chat')) {
      return 'joyful'
    }
  }

  return 'calm'
}

export const useBondStore = create<BondState>()(
  persist(
    (set, get) => ({
      bonds: {},
      interactions: {},

      recordChat: (creatureId: string) => {
        const now = Date.now()
        set((state) => {
          const bond = state.bonds[creatureId] || { ...EMPTY_BOND }
          const updatedBond: Bond = {
            ...bond,
            chatCount: bond.chatCount + 1,
            score: bond.score + CHAT_SCORE_GAIN,
            lastInteraction: now,
          }
          updatedBond.level = computeLevel(updatedBond.score)
          const records = addInteraction(state.interactions, creatureId, {
            type: 'chat',
            timestamp: now,
          })
          updatedBond.mood = determineMood(records, now)

          return {
            bonds: { ...state.bonds, [creatureId]: updatedBond },
            interactions: { ...state.interactions, [creatureId]: records },
          }
        })
      },

      recordEncounter: (creatureId: string) => {
        const now = Date.now()
        set((state) => {
          const bond = state.bonds[creatureId] || { ...EMPTY_BOND }
          const updatedBond: Bond = {
            ...bond,
            encounterCount: bond.encounterCount + 1,
            score: bond.score + ENCOUNTER_SCORE_GAIN,
            lastInteraction: now,
          }
          updatedBond.level = computeLevel(updatedBond.score)
          const records = addInteraction(state.interactions, creatureId, {
            type: 'encounter',
            timestamp: now,
          })
          updatedBond.mood = determineMood(records, now)

          return {
            bonds: { ...state.bonds, [creatureId]: updatedBond },
            interactions: { ...state.interactions, [creatureId]: records },
          }
        })
      },

      addScore: (creatureId: string, amount: number) => {
        const now = Date.now()
        set((state) => {
          const bond = state.bonds[creatureId] || { ...EMPTY_BOND }
          const updatedBond: Bond = {
            ...bond,
            score: bond.score + amount,
            lastInteraction: now,
          }
          updatedBond.level = computeLevel(updatedBond.score)
          // 不新增交互记录，仅依据既有记录重算心境
          updatedBond.mood = determineMood(state.interactions[creatureId], now)
          return {
            bonds: { ...state.bonds, [creatureId]: updatedBond },
          }
        })
      },

      giveGift: (creatureId: string, giftType: GiftType) => {
        const now = Date.now()
        const today = getTodayString()
        const creature = getCreatureById(creatureId)
        const personality = creature ? detectPersonality(creature) : 'mysterious'
        const preferred = GIFT_PREFERENCE[personality]
        const liked = giftType === preferred

        // 每日限次：同一天已赠满 MAX_GIFTS_PER_DAY 次则不再加分
        const existingBond = get().bonds[creatureId] || { ...EMPTY_BOND }
        const countToday =
          existingBond.giftGivenDate === today ? existingBond.giftCountToday : 0
        if (countToday >= MAX_GIFTS_PER_DAY) {
          return false
        }

        set((state) => {
          const bond = state.bonds[creatureId] || { ...EMPTY_BOND }
          const currentCountToday =
            bond.giftGivenDate === today ? bond.giftCountToday : 0
          const scoreGain = liked ? GIFT_LIKED_SCORE_GAIN : GIFT_NORMAL_SCORE_GAIN
          const updatedBond: Bond = {
            ...bond,
            giftCount: bond.giftCount + 1,
            giftCountToday: currentCountToday + 1,
            giftGivenDate: today,
            score: bond.score + scoreGain,
            lastInteraction: now,
          }
          updatedBond.level = computeLevel(updatedBond.score)
          const records = addInteraction(state.interactions, creatureId, {
            type: 'gift',
            timestamp: now,
            giftType,
            liked,
          })
          updatedBond.mood = determineMood(records, now)

          return {
            bonds: { ...state.bonds, [creatureId]: updatedBond },
            interactions: { ...state.interactions, [creatureId]: records },
          }
        })
        return true
      },

      getGiftCountToday: (creatureId: string) => {
        const today = getTodayString()
        const bond = get().bonds[creatureId] || { ...EMPTY_BOND }
        return bond.giftGivenDate === today ? bond.giftCountToday : 0
      },

      getBond: (creatureId: string) => {
        return get().bonds[creatureId] || EMPTY_BOND
      },

      getMood: (creatureId: string) => {
        const bond = get().bonds[creatureId] || { ...EMPTY_BOND }
        const records = get().interactions[creatureId]
        return determineMood(records, bond.lastInteraction)
      },

      getLastGift: (creatureId: string) => {
        const records = get().interactions[creatureId] || []
        const lastGift = [...records].reverse().find((r) => r.type === 'gift')
        if (!lastGift || !lastGift.giftType) return undefined
        return { type: lastGift.giftType, liked: lastGift.liked ?? false }
      },

      reset: () => set({ bonds: {}, interactions: {} }),
    }),
    { name: 'shanhai-bonds' }
  )
)
