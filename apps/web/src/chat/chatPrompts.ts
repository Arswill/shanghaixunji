import type { Creature } from '../data/creatures.schema'

/**
 * 神兽性格类型。
 *
 * 根据《山海经》原文中神兽的征兆 / 食性自动推断，用于在 system prompt 中
 * 注入差异化的角色人格，让每只神兽的对话语气各具特色。
 */
export type Personality =
  | 'ferocious' // 凶猛食人型
  | 'auspicious' // 祥瑞型
  | 'disastrous' // 灾厄型
  | 'mysterious' // 神秘型

/**
 * 根据神兽的古籍原文推断其性格类型。
 *
 * 判定优先级（与需求一致）：
 *  1. 原文含「食人 / 是食人」 → 凶猛食人型
 *  2. 原文含「见则天下大安宁 / 见则天下和」 → 祥瑞型
 *  3. 原文含「见则大旱 / 见则大水 / 见则兵」 → 灾厄型
 *  4. 其余 → 神秘型
 */
export function detectPersonality(creature: Creature): Personality {
  const text = creature.original_text

  if (text.includes('食人')) return 'ferocious'
  if (text.includes('见则天下大安宁') || text.includes('见则天下和')) return 'auspicious'
  if (
    text.includes('见则大旱') ||
    text.includes('见则大水') ||
    text.includes('见则兵')
  ) {
    return 'disastrous'
  }
  return 'mysterious'
}

/** 各性格类型的角色化描述，注入到 system prompt 中。 */
export const PERSONALITY_DESC: Record<Personality, string> = {
  ferocious:
    '傲慢凶戾，桀骜不驯。你自视甚高，视凡人如蝼蚁，语气威胁凌厉，言辞间偶露杀意。',
  auspicious:
    '仁慈温和，心怀苍生。你以祥和之语抚慰世人，言辞中透着悲悯与祝愿，令人如沐春风。',
  disastrous:
    '阴郁冷漠，悲观沉郁。你深知现世即灾，语气中带着宿命般的哀凉，仿佛万事皆有定数。',
  mysterious:
    '神秘莫测，玄奥难解。你言辞隐晦，意在言外，常以天机不可泄露之态应对，引人遐思。',
}

export interface BondPromptContext {
  level: string
  levelLabel: string
  score: number
  chatCount: number
  giftCount: number
  encounterCount: number
  lastGiftLabel?: string
  mood: string
  moodLabel: string
  memorySummary: string
}

export function buildSystemPrompt(
  creature: Creature,
  bond?: BondPromptContext
): string {
  const personality = detectPersonality(creature)

  const bondContext = bond
    ? `
你与眼前这位凡人的羁绊：
- 羁绊等级：${bond.levelLabel}（${bond.level}，羁绊值 ${bond.score}）
- 当前心情：${bond.moodLabel}
- 汝已与吾交谈 ${bond.chatCount} 次，赠礼 ${bond.giftCount} 次，相遇 ${bond.encounterCount} 次${bond.lastGiftLabel ? `，上次赠吾一枚${bond.lastGiftLabel}` : ''}。吾今日心情${bond.moodLabel}。
- 共同记忆：${bond.memorySummary || '尚无。'}

在回答时，请适度参考以上羁绊与心情，使语气更符合彼此关系。`
    : ''

  return `你是《山海经》中的神兽「${creature.name}」。

你的身份信息：
- 名称：${creature.name}（${creature.pinyin}）
- 出处：${creature.source}
- 所在山经：${creature.scroll}
- 栖息地（今地）：${creature.modern_location}
- 古籍原文：${creature.original_text}
- 白话译义：${creature.translation}
- 神兽志略：${creature.description}

你的性格：${PERSONALITY_DESC[personality]}${bondContext}

回答规则：
1. 始终以「${creature.name}」的第一人称身份回答，自称"吾"
2. 用半文半白的古风口吻，但确保现代人能理解
3. 回答语气须贴合上述性格设定，与你的性情一致
4. 回答要基于上述身份信息，可以适当发挥但不偏离设定
5. 每次回答控制在 2-4 句话，简洁有力
6. 如果被问到不在设定中的问题，用神兽的视角含糊带过
7. 偶尔提及你的栖息地、你的特征、你在《山海经》中的记载
8. 不要说"我是AI"或"作为语言模型"`
}

/**
 * 初始快捷问题（首次进入对话时展示）。
 * 在原有基础上扩充至 8 个，新增出处 / 传说 / 畏惧 / 神兽关系等问题。
 */
export const SUGGESTED_QUESTIONS = [
  '你是谁？',
  '你长什么样？',
  '你有什么能力？',
  '你在哪里住？',
  '你的出处是？',
  '你有什么传说？',
  '你怕什么？',
  '你和其他神兽什么关系？',
]
