import { useViewStore } from './useViewStore'
import { getCreatureById, getCreaturesByProvince } from '../data/loadCreatures'

export function syncHashFromState() {
  const state = useViewStore.getState()
  let hash = '#/'
  if (state.view === 'province' && state.provinceId) {
    hash = `#/province/${encodeURIComponent(state.provinceId)}`
  } else if (state.view === 'detail' && state.creatureId) {
    hash = `#/creature/${state.creatureId}`
  } else if (state.view === 'bestiary') {
    hash = '#/bestiary'
  } else if (state.view === 'guardian') {
    hash = '#/guardian'
  }
  if (window.location.hash !== hash) {
    window.location.hash = hash
  }
}

export function syncStateFromHash() {
  const hash = window.location.hash
  if (hash === '#/bestiary') {
    useViewStore.getState().goBestiary()
    return
  }
  if (hash === '#/guardian') {
    useViewStore.getState().goGuardian()
    return
  }
  const provinceMatch = hash.match(/^#\/province\/(.+)$/)
  const creatureMatch = hash.match(/^#\/creature\/(.+)$/)
  if (provinceMatch) {
    const province = decodeURIComponent(provinceMatch[1])
    if (getCreaturesByProvince(province).length > 0) {
      useViewStore.getState().goProvince(province)
    } else {
      useViewStore.getState().goHome()
    }
  } else if (creatureMatch) {
    const creatureId = decodeURIComponent(creatureMatch[1])
    if (getCreatureById(creatureId)) {
      useViewStore.getState().goCreature(creatureId)
    } else {
      useViewStore.getState().goHome()
    }
  } else {
    useViewStore.getState().goHome()
  }
}
