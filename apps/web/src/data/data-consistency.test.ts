import { describe, it, expect } from 'vitest'
import { creatures } from './loadCreatures'

// 《山海经》中规范的"经"名（source 中可识别的篇章名）
const canonicalScrolls = [
  '西山经', '北山经', '东山经', '南山经', '中山经',
  '大荒北经', '大荒东经', '大荒南经', '大荒西经',
  '海内北经', '海内东经', '海内南经', '海内西经',
  '海外北经', '海外东经', '海外南经', '海外西经',
]

// 有效省名集合（含"两广"这一合法的特殊值）
const validProvinces = new Set([
  '北京', '天津', '河北', '山西', '内蒙古', '辽宁', '吉林', '黑龙江',
  '上海', '江苏', '浙江', '安徽', '福建', '江西', '山东', '河南',
  '湖北', '湖南', '广东', '广西', '海南', '重庆', '四川', '贵州',
  '云南', '西藏', '陕西', '甘肃', '青海', '宁夏', '新疆', '两广',
  // 以下三项为数据中实际出现的合法地区，补充加入有效集合
  '台湾', '香港', '澳门',
])

describe('creatures data consistency', () => {
  it('source and scroll fields are consistent', () => {
    for (const c of creatures) {
      // 从 source 中用正则提取《山海经·XXX》中的 XXX 部分（取首个"·"前的经名段）
      const match = c.source.match(/《山海经·([^·》]+)/)
      // source 不含《山海经·XXX》结构（如"《山海经》逸文…""《庄子·…》"），无可比经名，跳过
      if (!match) continue
      const seg = match[1]
      // 仅校验规范经名；"中次X经""海内经"等非规范命名不在校验范围内
      if (!canonicalScrolls.includes(seg)) continue
      expect(
        c.scroll,
        `${c.id}：source 经名 "${seg}" 应与 scroll 字段一致`,
      ).toBe(seg)
    }
  })

  it('all provinces are valid', () => {
    for (const c of creatures) {
      expect(
        validProvinces.has(c.province),
        `${c.id}：省份 "${c.province}" 不在有效省名集合中`,
      ).toBe(true)
    }
  })

  it('id matches pinyin pattern', () => {
    // 有效的拼音 slug：全小写字母、连字符分隔
    const pinyinSlug = /^[a-z]+(-[a-z]+)*$/
    for (const c of creatures) {
      // chu-shuo（烛龙）是已知例外：其 id 并非"烛龙"的真实拼音（应为 zhu-long），
      // 因历史/资源兼容原因保留，此处跳过。
      if (c.id === 'chu-shuo') continue
      expect(
        pinyinSlug.test(c.id),
        `${c.id}：id 不是有效的拼音 slug（全小写、连字符分隔）`,
      ).toBe(true)
    }
  })

  it('no duplicate ids', () => {
    const ids = creatures.map((c) => c.id)
    const uniqueIds = new Set(ids)
    expect(ids.length, '存在重复的 creature id').toBe(uniqueIds.size)
  })

  it('original_text does not contain contradictions', () => {
    // 常见颜色词
    const colors = ['赤', '白', '青', '黑', '黄', '丹', '红', '紫', '绿', '苍', '玄']
    const colorGroup = colors.join('|')
    // 检测"颜色+部位+而+颜色+同部位"的自相矛盾模式（如"赤喙而白喙"）。
    // 用反向引用确保"而"两侧描述的是同一部位，避免误报"苍文而白首"这类合法的并列描述。
    const contradiction = new RegExp(
      `(${colorGroup})([^而，。；·"\\s]+)而(${colorGroup})\\2`,
    )
    for (const c of creatures) {
      expect(
        contradiction.test(c.original_text),
        `${c.id}：原文存在颜色自相矛盾的描述`,
      ).toBe(false)
    }
  })

  it('all creatures have valid confidence values', () => {
    const validConfidences = ['high', 'medium', 'creative']
    for (const c of creatures) {
      expect(
        validConfidences.includes(c.confidence),
        `${c.id}：confidence "${c.confidence}" 不在有效值集合中`,
      ).toBe(true)
    }
  })
})
