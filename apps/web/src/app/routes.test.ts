import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { syncStateFromHash } from './routes'
import { useViewStore } from './useViewStore'

/**
 * syncStateFromHash：把 window.location.hash 同步到 useViewStore。
 *
 * 这里采用「直接操作真实 store + 断言状态」的方式（任务允许的方案之一），
 * 而非 vi.mock：因为 useViewStore 是无持久化的轻量 store，断言其状态
 * 转换（view / creatureId / provinceId）即可精确反映 goHome/goCreature/goProvince
 * 的调用结果，且更贴近真实集成行为。
 */
describe('syncStateFromHash', () => {
  beforeEach(() => {
    // 每个用例前重置视图状态与 hash，避免用例间互相干扰
    useViewStore.getState().goHome()
    window.location.hash = ''
  })

  afterEach(() => {
    window.location.hash = ''
  })

  it('有效 hash #/creature/jiu-wei-hu 正确跳转到 creature（detail）视图', () => {
    window.location.hash = '#/creature/jiu-wei-hu'
    syncStateFromHash()

    const state = useViewStore.getState()
    expect(state.view).toBe('detail')
    expect(state.creatureId).toBe('jiu-wei-hu')
  })

  it('有效省份 hash #/province/湖南 正确跳转到 province 视图', () => {
    // 湖南存在神兽（如九尾狐），getCreaturesByProvince 返回非空
    window.location.hash = '#/province/湖南'
    syncStateFromHash()

    const state = useViewStore.getState()
    expect(state.view).toBe('province')
    expect(state.provinceId).toBe('湖南')
  })

  it('无效 creature hash #/creature/nonexistent 回退到 home（B2-17 校验逻辑）', () => {
    window.location.hash = '#/creature/nonexistent'
    syncStateFromHash()

    const state = useViewStore.getState()
    expect(state.view).toBe('home')
    expect(state.creatureId).toBeNull()
  })

  it('无效省份 hash #/province/火星 回退到 home', () => {
    window.location.hash = '#/province/火星'
    syncStateFromHash()

    const state = useViewStore.getState()
    expect(state.view).toBe('home')
    expect(state.provinceId).toBeNull()
  })

  it('空 hash 回退到 home', () => {
    window.location.hash = ''
    syncStateFromHash()

    expect(useViewStore.getState().view).toBe('home')
  })

  it('根 hash #/ 回退到 home', () => {
    window.location.hash = '#/'
    syncStateFromHash()

    expect(useViewStore.getState().view).toBe('home')
  })
})
