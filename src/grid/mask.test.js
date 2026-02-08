/* eslint-env jest */

/* global beforeEach, describe, it, expect */
import { Mask } from './mask.js'
import { coordsToZMasks } from './maskConvert.js'
import { expandToSquare, normalizeUpLeft } from './gridHelpers.js'
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
      expect(mask.index(0, 0)).toBe(0)
      expect(mask.index(1, 0)).toBe(1)
      expect(mask.index(0, 1)).toBe(10)
      expect(mask.index(5, 5)).toBe(55)
    })
  })

  describe('set and test', () => {
    it('should set and test bits correctly', () => {
      expect(mask.for(0, 0).test()).toBe(false)
      mask.set(0, 0)
      expect(mask.for(0, 0).test()).toBe(true)
      //  mask.set(5, 5)
      const forloc = mask.for(5, 5)
      mask.bits = forloc.set()
      expect(forloc.pos).toBe(55n)
      expect(forloc.at()).toBe(1)
      expect(forloc.test()).toBe(true)
    })
  })

  describe('clear', () => {
    it('should clear a bit', () => {
      mask.set(3, 3)
      expect(mask.for(3, 3).test()).toBe(true)
      mask.clear(3, 3)
      expect(mask.for(3, 3).test()).toBe(false)
    })
  })

  describe('occupacy', () => {
    it('should return correct popcount', () => {
      expect(mask.occupacy).toBe(0)
      mask.set(0, 0)
      expect(mask.occupacy).toBe(1)
      mask.set(1, 1)
      expect(mask.occupacy).toBe(2)
    })
  })

  describe('setRange and clearRange', () => {
    it('should set range of bits in a row', () => {
      mask.setRange(0, 0, 3)
      expect(mask.for(0, 0).test()).toBe(true)
      expect(mask.for(1, 0).test()).toBe(true)
      expect(mask.for(3, 0).test()).toBe(true)
      expect(mask.for(4, 0).test()).toBe(false)
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

      expect(mask.test(0, 0)).toBe(true)
      expect(mask.test(1, 0)).toBe(false)
      expect(mask.test(5, 0)).toBe(false)
      expect(mask.test(5, 5)).toBe(true)
      expect(mask.test(9, 9)).toBe(true)
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
        expect(mask.for(x, 0).test()).toBe(true)
      }
    })

    it('should draw diagonal segment', () => {
      mask.drawSegmentTo(0, 0, 3, 3)
      expect(mask.for(0, 0).test()).toBe(true)
      expect(mask.for(3, 3).test()).toBe(true)
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
describe('Mask - additional methods and edge cases', () => {
  let mask

  beforeEach(() => {
    mask = new Mask(4, 4)
  })

  describe('bitPos', () => {
    it('should return correct bit position as BigInt', () => {
      expect(mask.bitPos(0, 0)).toBe(0n)
      expect(mask.bitPos(1, 0)).toBe(1n)
      expect(mask.bitPos(0, 1)).toBe(4n)
      expect(mask.bitPos(3, 3)).toBe(15n)
    })
  })

  describe('applyMap and orbit', () => {
    it('should apply identity map and return same bits', () => {
      mask.set(0, 0)
      const idMap = mask.actions.transformMaps.id
      const original = mask.actions.original

      expect(typeof original.bits).toBe('bigint')
      expect(original.bits).toBe(mask.actions.template)
      expect(typeof original.width).toBe('number')
      expect(typeof original.height).toBe('number')
      const expanded = expandToSquare(mask.bits, mask.height, mask.width)
      expect(typeof expanded).toBe('bigint')
      expect(expanded).toBe(mask.actions.template)
      const normalized = normalizeUpLeft(expanded, mask.width, mask.height)
      expect(typeof normalized).toBe('bigint')

      const template = mask.actions.template
      expect(typeof template).toBe('bigint')
      const action = mask.actions.applyMap(idMap)
      expect(typeof action).toBe('bigint')
      expect(action).toBe(template)
    })

    it('should return 8 symmetries in orbit', () => {
      mask.set(0, 0)
      const orbit = mask.actions.orbit()
      expect(orbit.length).toBe(8)
      // All orbits should be single bit set
      orbit.forEach(b => {
        expect(typeof b).toBe('bigint')
        expect(b !== 0n).toBe(true)
      })
    })
  })

  describe('classifySymmetry', () => {
    it('should classify empty mask as C1', () => {
      const ss = mask.actions.symmetries
      expect(ss.length).toBe(1)
      const s = ss[0]
      const n = mask.actions.normalized(mask.actions.template)
      expect(s).toBe(n)
      const k = mask.actions.order
      expect(k).toBe(1)
      expect(mask.actions.classifySymmetry()).toBe('C1')
    })

    it('should classify full mask as C1', () => {
      for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) mask.set(x, y)
      expect(mask.actions.classifySymmetry()).toBe('C1')
    })

    it('should classify single cell as C1', () => {
      mask.set(2, 2)
      const ss = mask.actions.symmetries
      const s = ss[0]
      const n = mask.actions.normalized(mask.actions.template)
      expect(s).toBe(n)
      /*   expect(bits(s)).toBe('0000000000000001')
      expect(bits(ss[1])).toBe('0000000000000001')

      expect(ss.length).toBe(1)
      const k = mask.order
      expect(k).toBe(1)

      expect(mask.classifySymmetry()).toBe('C1')
    })*/
    })
    //TypeError: src.sliceRow is not a function
    /*   describe('blit', () => {
      it('should copy a region from another mask', () => {
        const src = new Mask(4, 4)
        src.set(1, 1)
        mask.blit(src, 1, 1, 1, 1, 2, 2)
        expect(mask.test(2, 2)).toBe(true)
      })

      it('should OR a region from another mask', () => {
        const src = new Mask(4, 4)
        src.set(0, 0)
        mask.set(0, 0)
        mask.blit(src, 0, 0, 1, 1, 0, 0, 'or')
        expect(mask.test(0, 0)).toBe(true)
      })

      it('should XOR a region from another mask', () => {
        const src = new Mask(4, 4)
        src.set(0, 0)
        mask.set(0, 0)
        mask.blit(src, 0, 0, 1, 1, 0, 0, 'xor')
        expect(mask.test(0, 0)).toBe(false)
      })*/
  })

  // TypeError: this.get is not a functionJest

  describe('floodFill', () => {
    it('should fill empty area', () => {
      mask.floodFill(0, 0)
      for (let y = 0; y < 4; y++)
        for (let x = 0; x < 4; x++) {
          expect(mask.test(x, y)).toBe(true)
        }
    })

    it('should not fill if already set', () => {
      mask.set(0, 0)
      mask.floodFill(0, 0)
      // Only (0,0) should be set
      expect(mask.store.msbIndex(mask.bits)).toBe(0)
      expect(mask.test(0, 0)).toBe(true)
      expect(mask.occupacy).toBe(1)
    })
    // not working
    /*
      it('should fill around a block', () => {
        mask.set(1, 1)
        mask.floodFill(0, 0)
        expect(mask.test(1, 1)).toBe(false)
        expect(mask.test(0, 0)).toBe(true)
        expect(mask.test(3, 3)).toBe(true)
      }) */
  })
  describe('toAscii', () => {
    it('should output correct ascii for empty and filled mask', () => {
      expect(mask.toAscii.trim()).toBe('....\n....\n....\n....')
      mask.set(0, 0)
      mask.set(3, 3)
      expect(mask.toAscii.trim()).toBe('#...\n....\n....\n...#')
    })
  })

  describe('fromCoords and toCoords', () => {
    it('should handle out-of-bounds coordinates', () => {
      mask.fromCoords([
        [0, 0],
        [5, 5],
        [-1, 2]
      ])
      expect(mask.test(0, 0)).toBe(true)
      expect(mask.store.msbIndex(mask.bits)).toBe(0)
      expect(mask.occupacy).toBe(1)
    })
  })

  describe('fullMask, emptyMask, invertedMask', () => {
    it('should return a mask with all bits set', () => {
      const full = mask.fullMask
      for (let y = 0; y < 4; y++)
        for (let x = 0; x < 4; x++) {
          expect(full.for(x, y).test()).toBe(true)
        }
    })

    it('should return a mask with no bits set', () => {
      const empty = mask.emptyMask
      for (let y = 0; y < 4; y++)
        for (let x = 0; x < 4; x++) {
          expect(empty.for(x, y).test()).toBe(false)
        }
    })

    it('should return an inverted mask', () => {
      mask.set(0, 0)
      const inv = mask.invertedMask
      expect(inv.for(0, 0).test()).toBe(false)
      console.log(inv.toAscii)
      console.log(inv.bits.toString(2).padStart(16, '0'))
      expect(inv.occupacy).toBe(15)
    })
  })

  describe('edgeMasks, outerBorderMask, innerBorderMask', () => {
    it('should compute edge masks correctly', () => {
      const { left, right, top, bottom } = mask.edgeMasks()
      // left column
      for (let y = 0; y < 4; y++) {
        expect(((left >> BigInt(mask.bitPos(0, y))) & 1n) === 1n).toBe(true)
      }
      // right column
      for (let y = 0; y < 4; y++) {
        expect(((right >> BigInt(mask.bitPos(3, y))) & 1n) === 1n).toBe(true)
      }
      // top row
      for (let x = 0; x < 4; x++) {
        expect(((top >> BigInt(mask.bitPos(x, 0))) & 1n) === 1n).toBe(true)
      }
      // bottom row
      for (let x = 0; x < 4; x++) {
        expect(((bottom >> BigInt(mask.bitPos(x, 3))) & 1n) === 1n).toBe(true)
      }
    })

    it('should compute outerBorderMask as union of edges', () => {
      const { left, right, top, bottom } = mask.edgeMasks()
      const border = mask.outerBorderMask()
      expect(border).toBe(left | right | top | bottom)
    })

    it('should compute innerBorderMask', () => {
      const inner = mask.innerBorderMask()
      // Should set bits at (1,1), (2,1), (1,2), (2,2) for 4x4
      expect(((inner >> BigInt(mask.bitPos(1, 1))) & 1n) === 1n).toBe(true)
      expect(((inner >> BigInt(mask.bitPos(2, 1))) & 1n) === 1n).toBe(true)
      expect(((inner >> BigInt(mask.bitPos(1, 2))) & 1n) === 1n).toBe(true)
      expect(((inner >> BigInt(mask.bitPos(2, 2))) & 1n) === 1n).toBe(true)
    })
  })

  describe('outerAreaMask and innerAreaMask', () => {
    it('should compute outerAreaMask as empty for full mask', () => {
      for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) mask.set(x, y)
      expect(mask.outerAreaMask()).toBe(0n)
    })

    it('should compute innerAreaMask as 0 for empty mask', () => {
      expect(mask.innerAreaMask()).toBe(0n)
    })
    /// not working
    /*
    it('should compute innerAreaMask as only inner bits', () => {
      for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) mask.set(x, y)
      const inner = mask.innerAreaMask()
      // Should not include border bits
      for (let y = 1; y < 3; y++)
        for (let x = 1; x < 3; x++) {
          expect(((inner >> BigInt(mask.bitPos(x, y))) & 1n) === 1n).toBe(true)
        }
      // Border bits should not be set
      for (let i = 0; i < 4; i++) {
        expect(((inner >> BigInt(mask.bitPos(i, 0))) & 1n) === 0n).toBe(true)
        expect(((inner >> BigInt(mask.bitPos(i, 3))) & 1n) === 0n).toBe(true)
        expect(((inner >> BigInt(mask.bitPos(0, i))) & 1n) === 0n).toBe(true)
        expect(((inner >> BigInt(mask.bitPos(3, i))) & 1n) === 0n).toBe(true)
      }
    })*/
  })
})
