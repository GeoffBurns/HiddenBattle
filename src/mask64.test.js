/* eslint-env jest */

/* global describe, it, expect */
import { Mask64 } from './mask64.js'

describe('Mask64', () => {
  let mask

  beforeEach(() => {
    mask = new Mask64(8, 8)
  })

  describe('constructor', () => {
    it('should initialize with correct width and height', () => {
      expect(mask.width).toBe(8)
      expect(mask.height).toBe(8)
      expect(mask.bits).toBe(0n)
      expect(mask.layers).toBeInstanceOf(BigUint64Array)
    })

    it('should initialize layers to zero', () => {
      expect(mask.layers[0]).toBe(0n)
      expect(mask.layers[1]).toBe(0n)
    })
  })

  describe('index', () => {
    it('should calculate correct index', () => {
      expect(mask.index(0, 0)).toBe(0n)
      expect(mask.index(1, 0)).toBe(1n)
      expect(mask.index(0, 1)).toBe(8n)
      expect(mask.index(7, 7)).toBe(63n)
    })
  })

  describe('bitPos', () => {
    it('should calculate bit position for 2-bit encoding', () => {
      expect(mask.bitPos(0, 0)).toBe(0n)
      expect(mask.bitPos(1, 0)).toBe(2n)
      expect(mask.bitPos(0, 1)).toBe(16n)
    })
  })

  describe('layerBit', () => {
    it('should compute layer bit mask', () => {
      const bit = mask.layerBit(0, 0)
      expect(bit).toBe(1n)

      const bit2 = mask.layerBit(1, 0)
      expect(bit2).toBe(2n)
    })
  })

  describe('at and set', () => {
    it('should set and get color values', () => {
      mask.bits = mask.set(0, 0, 1)
      expect(mask.at(0, 0)).toBe(1)
    })

    it('should support all valid colors', () => {
      mask.bits = mask.set(0, 0, 3)
      expect(mask.at(0, 0)).toBe(3)
    })

    it('should isolate colors in different cells', () => {
      mask.bits = mask.set(0, 0, 2)
      mask.bits = mask.set(1, 0, 1)
      expect(mask.at(0, 0)).toBe(2)
      expect(mask.at(1, 0)).toBe(1)
    })

    it('should overwrite previous colors', () => {
      mask.bits = mask.set(0, 0, 1)
      expect(mask.at(0, 0)).toBe(1)

      mask.bits = mask.set(0, 0, 3)
      expect(mask.at(0, 0)).toBe(3)
    })
  })

  describe('testFor', () => {
    it('should test for specific color', () => {
      mask.bits = mask.set(0, 0, 2)
      expect(mask.testFor(0, 0, 2)).toBe(true)
      expect(mask.testFor(0, 0, 1)).toBe(false)
    })

    it('should return false for unset positions', () => {
      expect(mask.testFor(0, 0, 1)).toBe(false)
    })
  })

  describe('isNonZero', () => {
    it('should detect non-zero values', () => {
      expect(mask.isNonZero(0, 0)).toBe(false)

      mask.bits = mask.set(0, 0, 1)
      expect(mask.isNonZero(0, 0)).toBe(true)
    })

    it('should distinguish zero from non-zero', () => {
      mask.bits = mask.set(3, 3, 2)
      expect(mask.isNonZero(3, 3)).toBe(true)
      expect(mask.isNonZero(3, 2)).toBe(false)
    })
  })

  describe('check', () => {
    it('should throw on invalid colors', () => {
      expect(() => mask.check(4)).toThrow()
      expect(() => mask.check(-1)).toThrow()
    })

    it('should accept valid colors 0-3', () => {
      expect(() => mask.check(0)).not.toThrow()
      expect(() => mask.check(1)).not.toThrow()
      expect(() => mask.check(2)).not.toThrow()
      expect(() => mask.check(3)).not.toThrow()
    })
  })
})
