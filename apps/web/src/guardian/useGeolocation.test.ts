import { describe, it, expect } from 'vitest'
import { getProvinceFromCoords, isGeolocationSupported } from './useGeolocation'

describe('getProvinceFromCoords', () => {
  it('matches provinces by their bounding boxes', () => {
    // 广州
    expect(getProvinceFromCoords(23.13, 113.26)).toBe('广东')
    // 西安
    expect(getProvinceFromCoords(34.34, 108.94)).toBe('陕西')
    // 成都
    expect(getProvinceFromCoords(30.67, 104.06)).toBe('四川')
    // 济南
    expect(getProvinceFromCoords(36.67, 117.00)).toBe('山东')
  })

  it('prefers municipalities over the surrounding province (北京 before 河北)', () => {
    // 北京市中心 —— 落在河北框内，但北京框更具体，应优先匹配
    expect(getProvinceFromCoords(39.90, 116.40)).toBe('北京')
    // 天津
    expect(getProvinceFromCoords(39.13, 117.20)).toBe('天津')
    // 上海
    expect(getProvinceFromCoords(31.23, 121.47)).toBe('上海')
  })

  it('matches special administrative regions', () => {
    // 香港
    expect(getProvinceFromCoords(22.32, 114.17)).toBe('香港')
    // 澳门
    expect(getProvinceFromCoords(22.20, 113.55)).toBe('澳门')
    // 台北
    expect(getProvinceFromCoords(25.03, 121.56)).toBe('台湾')
  })

  it('matches remote provinces', () => {
    // 乌鲁木齐 → 新疆
    expect(getProvinceFromCoords(43.83, 87.62)).toBe('新疆')
    // 拉萨 → 西藏
    expect(getProvinceFromCoords(29.65, 91.13)).toBe('西藏')
    // 海口 → 海南
    expect(getProvinceFromCoords(20.04, 110.35)).toBe('海南')
  })

  it('returns null for coordinates outside China', () => {
    // 太平洋（经度超出范围）
    expect(getProvinceFromCoords(35.7, 139.7)).toBeNull()
    // 美国
    expect(getProvinceFromCoords(37.0, -100.0)).toBeNull()
    // 赤道
    expect(getProvinceFromCoords(0, 0)).toBeNull()
    // 欧洲
    expect(getProvinceFromCoords(48.8, 2.3)).toBeNull()
  })
})

describe('isGeolocationSupported', () => {
  it('returns a boolean in jsdom', () => {
    expect(typeof isGeolocationSupported()).toBe('boolean')
  })
})
