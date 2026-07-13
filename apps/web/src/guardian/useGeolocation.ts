import { useCallback, useState } from 'react'

/**
 * 家乡守护神 · 地理定位工具
 *
 * 通过 `navigator.geolocation.getCurrentPosition` 获取经纬度，
 * 再用内置的中国 34 省经纬度边界框进行粗略匹配，确定用户所在省份。
 * 不依赖任何外部地理编码 API，离线可用。
 */

/** 单个省份的矩形边界框（粗略即可）。 */
interface ProvinceBox {
  /** 省份短名，与神兽数据中的 province 字段一致 */
  name: string
  /** 纬度最小值（南） */
  minLat: number
  /** 纬度最大值（北） */
  maxLat: number
  /** 经度最小值（西） */
  minLon: number
  /** 经度最大值（东） */
  maxLon: number
}

/**
 * 中国 34 个省级行政区的粗略矩形边界框。
 *
 * 注意：矩形框之间存在大量重叠（例如北京、天津完全落在河北框内），
 * 因此数组按"由具体到宽泛"的顺序排列——特别行政区、直辖市、
 * 面积较小的省份排在前面，面积最大的省份排在最后。
 * `getProvinceFromCoords` 会返回第一个匹配的省份。
 */
const PROVINCE_BOXES: ProvinceBox[] = [
  // ── 特别行政区（最小，优先匹配）──
  { name: '澳门', minLat: 22.10, maxLat: 22.22, minLon: 113.52, maxLon: 113.62 },
  { name: '香港', minLat: 22.08, maxLat: 22.60, minLon: 113.80, maxLon: 114.52 },
  { name: '台湾', minLat: 21.85, maxLat: 25.35, minLon: 119.40, maxLon: 122.10 },
  { name: '上海', minLat: 30.65, maxLat: 31.90, minLon: 120.85, maxLon: 122.20 },
  { name: '天津', minLat: 38.55, maxLat: 40.30, minLon: 116.70, maxLon: 118.05 },
  { name: '北京', minLat: 39.40, maxLat: 41.10, minLon: 115.40, maxLon: 117.50 },
  { name: '海南', minLat: 18.10, maxLat: 20.20, minLon: 108.60, maxLon: 111.10 },
  { name: '宁夏', minLat: 35.20, maxLat: 39.40, minLon: 104.30, maxLon: 107.75 },
  { name: '重庆', minLat: 28.20, maxLat: 32.25, minLon: 105.30, maxLon: 110.25 },

  // ── 中等省份 ──
  { name: '浙江', minLat: 27.00, maxLat: 31.20, minLon: 118.00, maxLon: 123.00 },
  { name: '福建', minLat: 23.50, maxLat: 28.30, minLon: 115.90, maxLon: 120.60 },
  { name: '江苏', minLat: 30.70, maxLat: 35.20, minLon: 116.30, maxLon: 121.95 },
  { name: '安徽', minLat: 29.40, maxLat: 34.70, minLon: 114.90, maxLon: 119.70 },
  { name: '江西', minLat: 24.50, maxLat: 30.10, minLon: 113.50, maxLon: 118.55 },
  { name: '辽宁', minLat: 38.70, maxLat: 43.50, minLon: 118.80, maxLon: 125.80 },
  { name: '吉林', minLat: 40.80, maxLat: 46.30, minLon: 121.60, maxLon: 131.30 },
  { name: '山东', minLat: 34.40, maxLat: 38.40, minLon: 114.80, maxLon: 122.70 },
  { name: '山西', minLat: 34.50, maxLat: 40.70, minLon: 110.20, maxLon: 114.60 },
  { name: '贵州', minLat: 24.60, maxLat: 29.20, minLon: 103.60, maxLon: 109.60 },
  { name: '广西', minLat: 20.90, maxLat: 26.40, minLon: 104.50, maxLon: 112.10 },
  { name: '广东', minLat: 20.20, maxLat: 25.55, minLon: 109.70, maxLon: 117.20 },
  { name: '湖南', minLat: 24.60, maxLat: 30.10, minLon: 108.80, maxLon: 114.30 },
  { name: '湖北', minLat: 29.10, maxLat: 33.30, minLon: 108.20, maxLon: 116.10 },
  { name: '河南', minLat: 31.40, maxLat: 36.40, minLon: 110.30, maxLon: 116.65 },
  { name: '陕西', minLat: 31.70, maxLat: 39.60, minLon: 105.50, maxLon: 111.25 },
  { name: '河北', minLat: 36.00, maxLat: 42.60, minLon: 113.40, maxLon: 119.85 },
  { name: '云南', minLat: 21.10, maxLat: 29.20, minLon: 97.50, maxLon: 106.20 },
  { name: '黑龙江', minLat: 43.40, maxLat: 53.60, minLon: 121.20, maxLon: 135.10 },
  { name: '甘肃', minLat: 32.30, maxLat: 42.80, minLon: 92.10, maxLon: 108.75 },
  { name: '四川', minLat: 26.00, maxLat: 34.30, minLon: 97.30, maxLon: 108.55 },
  { name: '青海', minLat: 31.60, maxLat: 39.20, minLon: 89.40, maxLon: 103.15 },
  { name: '西藏', minLat: 26.80, maxLat: 36.50, minLon: 78.40, maxLon: 99.10 },

  // ── 面积最大的省份（最后匹配）──
  { name: '新疆', minLat: 34.30, maxLat: 49.20, minLon: 73.50, maxLon: 96.45 },
  { name: '内蒙古', minLat: 37.40, maxLat: 53.55, minLon: 97.20, maxLon: 126.05 },
]

/** 中国大陆大致经纬度范围，用于快速判断是否在中国境内。 */
const CHINA_BOUNDS = {
  minLat: 18.0,
  maxLat: 53.6,
  minLon: 73.5,
  maxLon: 135.1,
}

/**
 * 根据经纬度用内置的省份边界框粗略匹配中国 34 省。
 * 按从具体到宽泛的顺序返回第一个匹配的省份；不在任何省内则返回 null。
 *
 * @param lat 纬度
 * @param lon 经度
 * @returns 省份短名（如"广东"）或 null
 */
export function getProvinceFromCoords(lat: number, lon: number): string | null {
  // 快速排除：明显不在中国境内
  if (
    lat < CHINA_BOUNDS.minLat ||
    lat > CHINA_BOUNDS.maxLat ||
    lon < CHINA_BOUNDS.minLon ||
    lon > CHINA_BOUNDS.maxLon
  ) {
    return null
  }

  for (const box of PROVINCE_BOXES) {
    if (
      lat >= box.minLat &&
      lat <= box.maxLat &&
      lon >= box.minLon &&
      lon <= box.maxLon
    ) {
      return box.name
    }
  }
  return null
}

/** 是否支持地理定位（浏览器环境且存在 geolocation API）。 */
export function isGeolocationSupported(): boolean {
  return (
    typeof navigator !== 'undefined' &&
    typeof navigator.geolocation !== 'undefined' &&
    typeof navigator.geolocation.getCurrentPosition === 'function'
  )
}

/** useGeolocation hook 的返回值。 */
export interface GeolocationState {
  /** 已匹配到的省份短名，未定位时为 null */
  province: string | null
  /** 是否正在获取定位 */
  loading: boolean
  /** 错误信息（中文友好提示），无错误时为 null */
  error: string | null
  /** 触发一次定位请求 */
  request: () => void
  /** 重置为初始状态 */
  reset: () => void
}

/**
 * GeolocationPositionError 的错误码常量。
 * 使用数值而非 err.PERMISSION_DENIED 等符号属性，更健壮
 * （部分实现 / mock 不在实例上暴露这些常量）。
 */
const ERR_PERMISSION_DENIED = 1
const ERR_POSITION_UNAVAILABLE = 2
const ERR_TIMEOUT = 3

/** 权限被拒绝时返回的友好提示文案（同时也作为该错误类型的标识）。 */
const PERMISSION_DENIED_MESSAGE = '定位权限被拒绝，请在浏览器设置中允许获取位置后重试。'

/**
 * 将 GeolocationPositionError 的 error code 转换为中文友好提示。
 */
function describePositionError(err: GeolocationPositionError): string {
  switch (err.code) {
    case ERR_PERMISSION_DENIED:
      return PERMISSION_DENIED_MESSAGE
    case ERR_POSITION_UNAVAILABLE:
      return '暂时无法获取位置信息，请稍后再试。'
    case ERR_TIMEOUT:
      return '定位超时，请检查网络或重试。'
    default:
      return err.message || '定位失败，请稍后再试。'
  }
}

/**
 * 判断给定的错误文案是否由「定位权限被拒绝」引起。
 *
 * useGeolocation 仅向外暴露字符串形式的 error，调用方无法直接拿到 error code。
 * 此函数复用 describePositionError 内部的常量，确保判断与文案生成同源、不依赖魔法字符串。
 */
export function isPermissionDeniedError(error: string | null | undefined): boolean {
  return error === PERMISSION_DENIED_MESSAGE
}

/**
 * 地理定位 Hook：调用 `navigator.geolocation.getCurrentPosition`
 * 获取经纬度并匹配省份。
 *
 * 不会在挂载时自动请求定位，需要用户显式调用 `request()`。
 *
 * @example
 * ```tsx
 * const { province, loading, error, request } = useGeolocation()
 * ```
 */
export function useGeolocation(): GeolocationState {
  const [province, setProvince] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const request = useCallback(() => {
    if (!isGeolocationSupported()) {
      setError('当前浏览器不支持地理定位，请更换浏览器后重试。')
      return
    }

    setLoading(true)
    setError(null)
    setProvince(null)

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords
        const matched = getProvinceFromCoords(latitude, longitude)
        setLoading(false)
        if (matched) {
          setProvince(matched)
        } else {
          setError('未在中国境内检测到你的位置，家乡守护神仅服务九州大地。')
        }
      },
      (err) => {
        setLoading(false)
        setError(describePositionError(err))
      },
      // enableHighAccuracy 会更慢，这里用粗略定位即可匹配省份
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 },
    )
  }, [])

  const reset = useCallback(() => {
    setProvince(null)
    setLoading(false)
    setError(null)
  }, [])

  return { province, loading, error, request, reset }
}
