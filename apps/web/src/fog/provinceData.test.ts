import { describe, it, expect } from 'vitest'
import {
  PROVINCE_ADJACENCY,
  UNLOCK_DOORS,
  getDoorForProvince,
  getAdjacentProvinces,
  ALL_PROVINCES,
  DOOR_LABELS,
  DOOR_DESCRIPTIONS,
  type DoorType,
} from './provinceData'

describe('provinceData', () => {
  describe('PROVINCE_ADJACENCY', () => {
    it('contains 34 province-level divisions', () => {
      expect(ALL_PROVINCES.length).toBe(34)
    })

    it(' adjacency is symmetric for all pairs', () => {
      for (const [province, neighbors] of Object.entries(PROVINCE_ADJACENCY)) {
        for (const neighbor of neighbors) {
          const reverseNeighbors = PROVINCE_ADJACENCY[neighbor]
          expect(reverseNeighbors).toBeDefined()
          expect(reverseNeighbors).toContain(province)
        }
      }
    })

    it('includes key provinces', () => {
      expect(PROVINCE_ADJACENCY['陕西']).toBeDefined()
      expect(PROVINCE_ADJACENCY['北京']).toBeDefined()
      expect(PROVINCE_ADJACENCY['上海']).toBeDefined()
    })

    it('Taiwan has no land neighbors', () => {
      expect(PROVINCE_ADJACENCY['台湾']).toEqual([])
    })
  })

  describe('getAdjacentProvinces', () => {
    it('returns neighbors for known province', () => {
      const shaanxiNeighbors = getAdjacentProvinces('陕西')
      expect(shaanxiNeighbors.length).toBeGreaterThan(0)
      expect(shaanxiNeighbors).toContain('山西')
    })

    it('returns empty array for unknown province', () => {
      expect(getAdjacentProvinces('不存在省')).toEqual([])
    })
  })

  describe('UNLOCK_DOORS', () => {
    it('has 6 door types', () => {
      const types = new Set(UNLOCK_DOORS.map((d) => d.type))
      expect(types.size).toBe(6)
      expect(types.has('adjacency')).toBe(true)
      expect(types.has('creature')).toBe(true)
      expect(types.has('riddle')).toBe(true)
      expect(types.has('task')).toBe(true)
      expect(types.has('seasonal')).toBe(true)
      expect(types.has('bond')).toBe(true)
    })

    it('has 20 adjacency doors', () => {
      const adjacencyDoors = UNLOCK_DOORS.filter((d) => d.type === 'adjacency')
      expect(adjacencyDoors.length).toBe(20)
    })

    it('has 4 creature doors', () => {
      const creatureDoors = UNLOCK_DOORS.filter((d) => d.type === 'creature')
      expect(creatureDoors.length).toBe(4)
    })

    it('has 4 riddle doors', () => {
      const riddleDoors = UNLOCK_DOORS.filter((d) => d.type === 'riddle')
      expect(riddleDoors.length).toBe(4)
    })

    it('has 2 task doors', () => {
      const taskDoors = UNLOCK_DOORS.filter((d) => d.type === 'task')
      expect(taskDoors.length).toBe(2)
    })

    it('has 2 seasonal doors', () => {
      const seasonalDoors = UNLOCK_DOORS.filter((d) => d.type === 'seasonal')
      expect(seasonalDoors.length).toBe(2)
    })

    it('has 2 bond doors', () => {
      const bondDoors = UNLOCK_DOORS.filter((d) => d.type === 'bond')
      expect(bondDoors.length).toBe(2)
    })

    it('all riddle doors have answerCreatureId', () => {
      const riddleDoors = UNLOCK_DOORS.filter((d) => d.type === 'riddle')
      for (const door of riddleDoors) {
        expect(door.answerCreatureId).toBeTruthy()
        expect(door.riddle).toBeTruthy()
      }
    })

    it('all task doors have taskCreatureId', () => {
      const taskDoors = UNLOCK_DOORS.filter((d) => d.type === 'task')
      for (const door of taskDoors) {
        expect(door.taskCreatureId).toBeTruthy()
        expect(door.taskDescription).toBeTruthy()
      }
    })

    it('all seasonal doors have requiredSolarTerm', () => {
      const seasonalDoors = UNLOCK_DOORS.filter((d) => d.type === 'seasonal')
      for (const door of seasonalDoors) {
        expect(door.requiredSolarTerm).toBeTruthy()
      }
    })

    it('all bond doors have requiredBondLevel = 2 (bonded)', () => {
      const bondDoors = UNLOCK_DOORS.filter((d) => d.type === 'bond')
      for (const door of bondDoors) {
        expect(door.requiredBondLevel).toBe(2)
      }
    })

    it('total doors = 34 (all provinces except home have doors)', () => {
      // 34 doors for 34 provinces (home province is auto-unlocked but still has a door config)
      expect(UNLOCK_DOORS.length).toBe(34)
    })

    it('door provinces do not duplicate', () => {
      const provinces = UNLOCK_DOORS.map((d) => d.province)
      const unique = new Set(provinces)
      expect(unique.size).toBe(provinces.length)
    })
  })

  describe('getDoorForProvince', () => {
    it('returns door config for known province', () => {
      const door = getDoorForProvince('上海')
      expect(door).toBeDefined()
      expect(door?.type).toBe('bond')
    })

    it('returns undefined for unknown province', () => {
      expect(getDoorForProvince('不存在省')).toBeUndefined()
    })
  })

  describe('DOOR_LABELS and DOOR_DESCRIPTIONS', () => {
    it('has labels for all 6 door types', () => {
      const types: DoorType[] = ['adjacency', 'creature', 'riddle', 'task', 'seasonal', 'bond']
      for (const type of types) {
        expect(DOOR_LABELS[type]).toBeTruthy()
        expect(DOOR_DESCRIPTIONS[type]).toBeTruthy()
      }
    })

    it('has Chinese labels', () => {
      expect(DOOR_LABELS.adjacency).toBe('接壤门')
      expect(DOOR_LABELS.riddle).toBe('谜题门')
      expect(DOOR_LABELS.bond).toBe('羁绊门')
    })
  })
})
