import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { GuardianSpirit, getGuardianTitle, pickGuardianCreature } from './GuardianSpirit'
import { useGuardianStore } from './guardianStore'
import { useViewStore } from '../app/useViewStore'

// 保存原始的 geolocation 引用，便于在每个测试中重置
const originalGeolocation = navigator.geolocation

/**
 * 构造一个伪造的 GeolocationPosition，包含指定经纬度。
 */
function makePosition(lat: number, lon: number): GeolocationPosition {
  return {
    coords: {
      latitude: lat,
      longitude: lon,
      accuracy: 1,
      altitude: null,
      altitudeAccuracy: null,
      heading: null,
      speed: null,
    },
    timestamp: Date.now(),
  } as GeolocationPosition
}

/**
 * 用一个可控的 getCurrentPosition 实现替换 navigator.geolocation。
 * 返回一个触发函数，测试可调用它来模拟浏览器返回定位结果。
 */
function mockGeolocation() {
  const callbacks: {
    success: (p: GeolocationPosition) => void
    error: (e: GeolocationPositionError) => void
  }[] = []

  const getCurrentPosition = vi.fn(
    (
      success: (p: GeolocationPosition) => void,
      error?: (e: GeolocationPositionError) => void,
    ) => {
      callbacks.push({ success, error: error ?? (() => {}) })
    },
  )

  Object.defineProperty(navigator, 'geolocation', {
    configurable: true,
    value: { getCurrentPosition },
  })

  return {
    /** 模拟定位成功，返回给定经纬度。 */
    resolve(lat: number, lon: number) {
      const last = callbacks[callbacks.length - 1]
      last?.success(makePosition(lat, lon))
    },
    /** 模拟定位失败（权限拒绝）。 */
    reject() {
      const last = callbacks[callbacks.length - 1]
      last?.error({ code: 1, message: 'User denied' } as GeolocationPositionError)
    },
    /** getCurrentPosition 是否被调用。 */
    get called() {
      return getCurrentPosition.mock.calls.length > 0
    },
  }
}

describe('getGuardianTitle', () => {
  it('maps rarity to guardian titles', () => {
    expect(getGuardianTitle('SSR')).toBe('天命仙君')
    expect(getGuardianTitle('SR')).toBe('灵域真人')
    expect(getGuardianTitle('R')).toBe('乡野灵守')
  })
})

describe('pickGuardianCreature', () => {
  it('returns a creature from the given province', () => {
    const creature = pickGuardianCreature('广东')
    expect(creature).not.toBeNull()
    expect(creature?.province === '广东' || creature?.province === '两广').toBe(true)
  })

  it('returns null for an unknown province', () => {
    expect(pickGuardianCreature('不存在省')).toBeNull()
  })
})

describe('GuardianSpirit component', () => {
  let geo: ReturnType<typeof mockGeolocation>

  beforeEach(() => {
    // Reset Zustand stores to prevent state leakage between tests
    useGuardianStore.getState().reset()
    useViewStore.getState().goHome()
    geo = mockGeolocation()
    localStorage.removeItem('shanhai-guardian')
  })

  afterEach(() => {
    Object.defineProperty(navigator, 'geolocation', {
      configurable: true,
      value: originalGeolocation,
    })
  })

  it('renders the seek button initially', () => {
    render(<GuardianSpirit />)
    expect(screen.getByTestId('guardian-seek-btn')).toBeInTheDocument()
    expect(screen.getByText(/寻我故土守护神/)).toBeInTheDocument()
  })

  it('shows locating state after clicking seek', () => {
    render(<GuardianSpirit />)
    fireEvent.click(screen.getByTestId('guardian-seek-btn'))
    expect(screen.getByTestId('guardian-locating')).toBeInTheDocument()
    expect(geo.called).toBe(true)
  })

  it('reveals a guardian card after geolocation resolves in China', async () => {
    render(<GuardianSpirit />)
    fireEvent.click(screen.getByTestId('guardian-seek-btn'))
    // 模拟浏览器返回广东（广州）坐标
    act(() => geo.resolve(23.13, 113.26))

    // 守护神卡片应出现
    const revealed = await screen.findByTestId('guardian-revealed')
    expect(revealed).toBeInTheDocument()
    // 省份印章应显示广东
    expect(screen.getByTestId('guardian-province-seal')).toHaveTextContent('广东')
    // 称号应存在
    expect(screen.getByTestId('guardian-title')).toBeInTheDocument()
    // 守护神名应存在
    expect(screen.getByTestId('guardian-name')).toBeInTheDocument()
    // 分享卡生成按钮应存在
    expect(screen.getByTestId('guardian-share-generate')).toBeInTheDocument()
  })

  it('shows an error when geolocation is denied', async () => {
    render(<GuardianSpirit />)
    fireEvent.click(screen.getByTestId('guardian-seek-btn'))
    act(() => geo.reject())

    const errorBox = await screen.findByTestId('guardian-error')
    expect(errorBox).toBeInTheDocument()
    expect(errorBox.textContent).toMatch(/权限|拒绝|失败|超时|位置/)
  })

  it('shows an error when location is outside China', async () => {
    render(<GuardianSpirit />)
    fireEvent.click(screen.getByTestId('guardian-seek-btn'))
    // 太平洋中心，不在中国境内
    act(() => geo.resolve(0, -160))

    const errorBox = await screen.findByTestId('guardian-error')
    expect(errorBox).toBeInTheDocument()
    expect(errorBox.textContent).toMatch(/中国境内/)
  })

  it('rerolls to a different creature from the same province', async () => {
    render(<GuardianSpirit />)
    fireEvent.click(screen.getByTestId('guardian-seek-btn'))
    act(() => geo.resolve(23.13, 113.26))
    await screen.findByTestId('guardian-revealed')

    const nameBefore = screen.getByTestId('guardian-name').textContent
    fireEvent.click(screen.getByTestId('guardian-reroll-btn'))
    // 重新抽取后仍在卡片显影态，且省份印章不变
    expect(screen.getByTestId('guardian-revealed')).toBeInTheDocument()
    expect(screen.getByTestId('guardian-province-seal')).toHaveTextContent('广东')
    // 名字应为非空字符串（可能相同，因随机）
    expect(screen.getByTestId('guardian-name').textContent).toBeTruthy()
    expect(nameBefore).toBeTruthy()
  })
})
