/* eslint-env jest */

/* global describe, it, expect, beforeEach, jest */

import { Score } from './Score.js'

// Mock the makeKey utility
jest.mock('../utilities.js', () => ({
  makeKey: jest.fn((r, c) => `${r},${c}`)
}))

describe('Score', () => {
  let score

  beforeEach(() => {
    jest.clearAllMocks()
    score = new Score()
  })

  describe('constructor', () => {
    it('should initialize with empty shot set', () => {
      expect(score.shot).toEqual(new Set())
      expect(score.shot.size).toBe(0)
    })

    it('should initialize with empty semi set', () => {
      expect(score.semi).toEqual(new Set())
      expect(score.semi.size).toBe(0)
    })

    it('should initialize autoMisses to 0', () => {
      expect(score.autoMisses).toBe(0)
    })
  })

  describe('reset', () => {
    it('should clear shot set', () => {
      score.shot.add('0,0')
      score.shot.add('1,1')
      score.reset()
      expect(score.shot.size).toBe(0)
    })

    it('should clear semi set', () => {
      score.semi.add('2,3')
      score.semi.add('4,5')
      score.reset()
      expect(score.semi.size).toBe(0)
    })

    it('should reset autoMisses to 0', () => {
      score.autoMisses = 5
      score.reset()
      expect(score.autoMisses).toBe(0)
    })

    it('should reset all properties together', () => {
      score.shot.add('0,0')
      score.semi.add('1,1')
      score.autoMisses = 3
      score.reset()
      expect(score.shot.size).toBe(0)
      expect(score.semi.size).toBe(0)
      expect(score.autoMisses).toBe(0)
    })
  })

  describe('newShotKey', () => {
    it('should return key for new shot location', () => {
      const key = score.newShotKey(0, 0)
      expect(key).toBe('0,0')
    })

    it('should return key for different coordinates', () => {
      const key = score.newShotKey(5, 7)
      expect(key).toBe('5,7')
    })

    it('should return null if shot already exists at location', () => {
      score.shot.add('3,4')
      const key = score.newShotKey(3, 4)
      expect(key).toBeNull()
    })

    it('should not add to shot set', () => {
      score.newShotKey(1, 2)
      expect(score.shot.size).toBe(0)
    })

    it('should handle negative coordinates', () => {
      const key = score.newShotKey(-1, -2)
      expect(key).toBe('-1,-2')
    })

    it('should return different keys for different coordinates', () => {
      const key1 = score.newShotKey(0, 0)
      const key2 = score.newShotKey(0, 1)
      expect(key1).not.toBe(key2)
    })
  })

  describe('createShotKey', () => {
    it('should create and add a new shot key', () => {
      const key = score.createShotKey(0, 0)
      expect(key).toBe('0,0')
      expect(score.shot.has('0,0')).toBe(true)
    })

    it('should return null if location already shot', () => {
      score.shot.add('2,3')
      const key = score.createShotKey(2, 3)
      expect(key).toBeNull()
    })

    it('should increase shot set size', () => {
      score.createShotKey(1, 1)
      expect(score.shot.size).toBe(1)
      score.createShotKey(2, 2)
      expect(score.shot.size).toBe(2)
    })

    it('should not add duplicate shots', () => {
      score.createShotKey(3, 3)
      score.createShotKey(3, 3)
      expect(score.shot.size).toBe(1)
    })

    it('should add multiple different shots', () => {
      score.createShotKey(0, 0)
      score.createShotKey(1, 1)
      score.createShotKey(2, 2)
      expect(score.shot.size).toBe(3)
      expect(score.shot.has('0,0')).toBe(true)
      expect(score.shot.has('1,1')).toBe(true)
      expect(score.shot.has('2,2')).toBe(true)
    })
  })

  describe('shotReveal', () => {
    it('should move shot from shot set to semi set', () => {
      score.shot.add('0,0')
      score.shotReveal('0,0')
      expect(score.shot.has('0,0')).toBe(false)
      expect(score.semi.has('0,0')).toBe(true)
    })

    it('should remove from shot set', () => {
      score.shot.add('1,2')
      const initialSize = score.shot.size
      score.shotReveal('1,2')
      expect(score.shot.size).toBe(initialSize - 1)
    })

    it('should add to semi set', () => {
      score.semi.add('existing,key')
      score.shot.add('new,key')
      score.shotReveal('new,key')
      expect(score.semi.size).toBe(2)
      expect(score.semi.has('existing,key')).toBe(true)
      expect(score.semi.has('new,key')).toBe(true)
    })

    it('should handle multiple reveals', () => {
      score.shot.add('0,0')
      score.shot.add('1,1')
      score.shot.add('2,2')
      score.shotReveal('0,0')
      score.shotReveal('1,1')
      expect(score.shot.size).toBe(1)
      expect(score.semi.size).toBe(2)
    })

    it('should not affect autoMisses', () => {
      score.autoMisses = 2
      score.shot.add('3,3')
      score.shotReveal('3,3')
      expect(score.autoMisses).toBe(2)
    })
  })

  describe('noOfShots', () => {
    it('should return 0 when no shots fired', () => {
      expect(score.noOfShots()).toBe(0)
    })

    it('should return number of shots without auto misses', () => {
      score.shot.add('0,0')
      score.shot.add('1,1')
      expect(score.noOfShots()).toBe(2)
    })

    it('should subtract auto misses from shot count', () => {
      score.shot.add('0,0')
      score.shot.add('1,1')
      score.shot.add('2,2')
      score.autoMisses = 1
      expect(score.noOfShots()).toBe(2)
    })

    it('should handle more auto misses', () => {
      score.shot.add('0,0')
      score.shot.add('1,1')
      score.shot.add('2,2')
      score.shot.add('3,3')
      score.autoMisses = 3
      expect(score.noOfShots()).toBe(1)
    })

    it('should return 0 when auto misses equal shots', () => {
      score.shot.add('0,0')
      score.shot.add('1,1')
      score.autoMisses = 2
      expect(score.noOfShots()).toBe(0)
    })

    it('should not be affected by semi set', () => {
      score.shot.add('0,0')
      score.semi.add('1,1')
      expect(score.noOfShots()).toBe(1)
    })
  })

  describe('addAutoMiss', () => {
    it('should create and add auto miss shot', () => {
      const key = score.addAutoMiss(0, 0)
      expect(key).toBe('0,0')
      expect(score.shot.has('0,0')).toBe(true)
    })

    it('should increment autoMisses counter', () => {
      expect(score.autoMisses).toBe(0)
      score.addAutoMiss(1, 1)
      expect(score.autoMisses).toBe(1)
      score.addAutoMiss(2, 2)
      expect(score.autoMisses).toBe(2)
    })

    it('should return null if location already shot', () => {
      score.shot.add('3,3')
      const key = score.addAutoMiss(3, 3)
      expect(key).toBeNull()
      expect(score.autoMisses).toBe(0) // Not incremented
    })

    it('should add multiple auto misses', () => {
      score.addAutoMiss(0, 0)
      score.addAutoMiss(1, 1)
      score.addAutoMiss(2, 2)
      expect(score.autoMisses).toBe(3)
      expect(score.shot.size).toBe(3)
    })

    it('should add auto miss to shot set', () => {
      score.addAutoMiss(4, 5)
      expect(score.shot.has('4,5')).toBe(true)
    })

    it('should prevent duplicate auto misses', () => {
      score.addAutoMiss(5, 5)
      const key = score.addAutoMiss(5, 5)
      expect(key).toBeNull()
      expect(score.autoMisses).toBe(1)
      expect(score.shot.size).toBe(1)
    })
  })

  describe('integration scenarios', () => {
    it('should track mixed shots and auto misses', () => {
      score.createShotKey(0, 0) // regular shot
      score.addAutoMiss(1, 1) // auto miss
      score.createShotKey(2, 2) // regular shot
      expect(score.shot.size).toBe(3)
      expect(score.autoMisses).toBe(1)
      expect(score.noOfShots()).toBe(2) // 3 total - 1 auto miss
    })

    it('should handle shot reveal workflow', () => {
      score.createShotKey(0, 0)
      score.createShotKey(1, 1)
      score.shotReveal('0,0')
      expect(score.shot.size).toBe(1)
      expect(score.semi.size).toBe(1)
      expect(score.noOfShots()).toBe(1)
    })

    it('should handle full game scenario', () => {
      // Player fires shots
      score.createShotKey(3, 4)
      score.createShotKey(5, 6)
      score.addAutoMiss(7, 8)
      expect(score.noOfShots()).toBe(2)

      // Some shots are revealed
      score.shotReveal('3,4')
      expect(score.shot.size).toBe(2) // (5,6) and (7,8)
      expect(score.semi.size).toBe(1) // (3,4)

      // Reset for new game
      score.reset()
      expect(score.shot.size).toBe(0)
      expect(score.semi.size).toBe(0)
      expect(score.autoMisses).toBe(0)
      expect(score.noOfShots()).toBe(0)
    })

    it('should prevent duplicate shots across different methods', () => {
      score.createShotKey(2, 2)
      const autoMissKey = score.addAutoMiss(2, 2)
      expect(autoMissKey).toBeNull()
      expect(score.shot.size).toBe(1)
      expect(score.autoMisses).toBe(0)
    })

    it('should maintain state through multiple operations', () => {
      // Add several shots
      for (let i = 0; i < 5; i++) {
        score.createShotKey(i, i)
      }
      expect(score.noOfShots()).toBe(5)

      // Add some auto misses
      for (let i = 0; i < 2; i++) {
        score.addAutoMiss(5 + i, 5 + i)
      }
      expect(score.noOfShots()).toBe(5) // Regular shots only
      expect(score.autoMisses).toBe(2)

      // Reveal some shots
      score.shotReveal('0,0')
      score.shotReveal('1,1')
      expect(score.semi.size).toBe(2)
      expect(score.shot.size).toBe(5) // 3 unrevealed regulars + 2 autos
    })

    it('should handle edge case of all shots being auto misses', () => {
      score.addAutoMiss(0, 0)
      score.addAutoMiss(1, 1)
      score.addAutoMiss(2, 2)
      expect(score.shot.size).toBe(3)
      expect(score.autoMisses).toBe(3)
      expect(score.noOfShots()).toBe(0)
    })
  })

  describe('data structure integrity', () => {
    it('should maintain shot as a Set', () => {
      expect(score.shot instanceof Set).toBe(true)
      score.shot.add('test')
      expect(score.shot instanceof Set).toBe(true)
    })

    it('should maintain semi as a Set', () => {
      expect(score.semi instanceof Set).toBe(true)
      score.semi.add('test')
      expect(score.semi instanceof Set).toBe(true)
    })

    it('should not have overlapping keys between shot and semi', () => {
      score.createShotKey(0, 0)
      score.shotReveal('0,0')
      expect(score.shot.has('0,0')).toBe(false)
      expect(score.semi.has('0,0')).toBe(true)
    })

    it('should maintain integer autoMisses count', () => {
      score.addAutoMiss(0, 0)
      score.addAutoMiss(1, 1)
      expect(Number.isInteger(score.autoMisses)).toBe(true)
      expect(score.autoMisses).toBe(2)
    })
  })
})
