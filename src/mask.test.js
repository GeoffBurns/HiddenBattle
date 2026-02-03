/* eslint-env jest */

/* global beforeEach, describe, it, expect */
import { Mask } from './mask.js'
import { coordsToZMasks } from './maskConvert.js'
//import { beforeEach, describe, it, expect } from '@jest/globals'

// Jest test suite
describe('Mask', () => {
  let mask

  beforeEach(() => {
    mask = new Mask(10, 10)
  })

  describe('constructor', () => {
    it('should initialize with correct width and height', () => {
      expect(mask.width).toBe(10)
      expect(mask.height).toBe(10)
      expect(mask.bits).toBe(0n)
    })
  })

  describe('index', () => {
    it('should calculate correct bit index', () => {
      expect(mask.index(0, 0)).toBe(0n)
      expect(mask.index(1, 0)).toBe(1n)
      expect(mask.index(0, 1)).toBe(10n)
      expect(mask.index(5, 5)).toBe(55n)
    })
  })

  describe('set and test', () => {
    it('should set and test bits correctly', () => {
      expect(mask.test(0, 0)).toBe(false)
      mask.set(0, 0)
      expect(mask.test(0, 0)).toBe(true)
      mask.set(5, 5)
      expect(mask.test(5, 5)).toBe(true)
    })
  })

  describe('clear', () => {
    it('should clear a bit', () => {
      mask.set(3, 3)
      expect(mask.test(3, 3)).toBe(true)
      mask.clear(3, 3)
      expect(mask.test(3, 3)).toBe(false)
    })
  })

  describe('size', () => {
    it('should return correct popcount', () => {
      expect(mask.size).toBe(0)
      mask.set(0, 0)
      expect(mask.size).toBe(1)
      mask.set(1, 1)
      expect(mask.size).toBe(2)
    })
  })

  describe('setRange and clearRange', () => {
    it('should set range of bits in a row', () => {
      mask.setRange(0, 0, 3)
      expect(mask.test(0, 0)).toBe(true)
      expect(mask.test(1, 0)).toBe(true)
      expect(mask.test(3, 0)).toBe(true)
      expect(mask.test(4, 0)).toBe(false)
    })

    it('should clear range of bits in a row', () => {
      mask.setRange(0, 0, 5)
      mask.clearRange(0, 1, 3)
      expect(mask.test(0, 0)).toBe(true)
      expect(mask.test(1, 0)).toBe(false)
      expect(mask.test(4, 0)).toBe(true)
    })
  })

  describe('fromCoords and toCoords', () => {
    it('should convert from and to coordinates', () => {
      const coords = [
        [0, 0],
        [5, 5],
        [9, 9]
      ]
      mask.fromCoords(coords)
      const result = mask.toCoords
      expect(result.sort()).toEqual(coords.sort())
    })

    it('should handle empty coordinates', () => {
      mask.fromCoords([])
      expect(mask.toCoords).toEqual([])
    })
  })

  describe('drawSegment', () => {
    it('should draw a line segment', () => {
      mask.drawSegmentTo(0, 0, 5, 0)
      for (let x = 0; x <= 5; x++) {
        expect(mask.test(x, 0)).toBe(true)
      }
    })

    it('should draw diagonal segment', () => {
      mask.drawSegmentTo(0, 0, 3, 3)
      expect(mask.test(0, 0)).toBe(true)
      expect(mask.test(3, 3)).toBe(true)
    })
  })

  describe('fullBits', () => {
    it('should return mask with all bits set', () => {
      const full = mask.fullBits
      expect(full).toBe((1n << BigInt(100)) - 1n)
    })
  })
})
// Jest test suite
describe('coordsToZMasks', () => {
  it('should group coordinates by z value', () => {
    const coords = [
      [0, 0, 1],
      [1, 1, 1],
      [2, 2, 2]
    ]
    const masks = coordsToZMasks(coords, 10, 10)
    expect(masks.has(1)).toBe(true)
    expect(masks.has(2)).toBe(true)
  })

  it('should ignore out of bounds coordinates', () => {
    const coords = [
      [0, 0, 1],
      [15, 15, 1]
    ]
    const masks = coordsToZMasks(coords, 10, 10)
    expect(masks.size).toBe(1)
  })
})
