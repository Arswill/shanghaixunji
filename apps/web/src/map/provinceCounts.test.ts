import { describe, it, expect } from 'vitest'
import { getProvinceCreatureCounts, getProvinceCount } from './provinceCounts'

describe('provinceCounts', () => {
  it('returns counts for provinces with creatures', () => {
    const counts = getProvinceCreatureCounts()
    expect(counts['陕西']).toBeGreaterThan(0)
    expect(counts['河南']).toBeGreaterThan(0)
  })

  it('every province has at least one creature', () => {
    const allProvinces = [
      '北京', '天津', '河北', '山西', '内蒙古', '辽宁', '吉林', '黑龙江',
      '上海', '江苏', '浙江', '安徽', '福建', '江西', '山东', '河南',
      '湖北', '湖南', '广东', '广西', '海南', '重庆', '四川', '贵州',
      '云南', '西藏', '陕西', '甘肃', '青海', '宁夏', '新疆', '台湾',
      '香港', '澳门',
    ]
    for (const p of allProvinces) {
      expect(getProvinceCount(p)).toBeGreaterThan(0)
    }
  })

  it('returns 0 for unknown provinces', () => {
    expect(getProvinceCount('不存在省')).toBe(0)
  })

  it('total counts match creature count', () => {
    const counts = getProvinceCreatureCounts()
    const total = Object.values(counts).reduce((a, b) => a + b, 0)
    // "两广" creatures are counted for both 广东 and 广西, so total may exceed 22
    expect(total).toBeGreaterThanOrEqual(22)
  })
})
