/* eslint-env jest */

/* global describe, beforeEach,it, expect */
import { Mask4 } from './mask4.js'

describe('Mask4', () => {
  let mask

  beforeEach(() => {
    mask = new Mask4(10, 10)
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

  describe('bitPos', () => {
    it('should calculate bit position for 2-bit color encoding', () => {
      const pos = mask.bitPos(0, 0)
      expect(typeof pos).toBe('bigint')
      expect(pos).toBe(0n)
    })

    it('should compute different positions for different coords', () => {
      const pos1 = mask.bitPos(0, 0)
      const pos2 = mask.bitPos(1, 0)
      expect(pos2).toBeGreaterThan(pos1)
    })
  })

  describe('set and at', () => {
    it('should set color at position', () => {
      mask.bits = mask.set(0, 0, 1)
      expect(mask.at(0, 0)).toBe(1)
    })

    it('should set different color values', () => {
      mask.bits = mask.set(0, 0, 2)
      expect(mask.at(0, 0)).toBe(2)

      mask.bits = mask.set(1, 0, 3)
      expect(mask.at(1, 0)).toBe(3)
    })

    it('should start at zero', () => {
      expect(mask.at(0, 0)).toBe(0)
    })

    it('should overwrite previous color', () => {
      mask.bits = mask.set(0, 0, 1)
      expect(mask.at(0, 0)).toBe(1)

      mask.bits = mask.set(0, 0, 2)
      expect(mask.at(0, 0)).toBe(2)
    })
  })

  describe('check', () => {
    it('should throw on invalid color', () => {
      expect(() => mask.check(4)).toThrow()
      expect(() => mask.check(-1)).toThrow()
    })

    it('should accept valid colors', () => {
      expect(() => mask.check(0)).not.toThrow()
      expect(() => mask.check(1)).not.toThrow()
      expect(() => mask.check(3)).not.toThrow()
    })
  })

  describe('testFor', () => {
    it('should test for specific color', () => {
      mask.bits = mask.set(0, 0, 2)
      expect(mask.testFor(0, 0, 2)).toBe(true)
      expect(mask.testFor(0, 0, 1)).toBe(false)
    })

    it('should return false for unset position', () => {
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
      mask.bits = mask.set(5, 5, 3)
      expect(mask.isNonZero(5, 5)).toBe(true)
      expect(mask.isNonZero(5, 4)).toBe(false)
    })
  })
})
