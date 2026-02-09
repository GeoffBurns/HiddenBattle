// src/grid/store32.test.js
/* eslint-env jest */
/* global describe, it, expect, beforeEach */
import { Store32 } from './store32.js'

// Jest test suite
describe('Store32', () => {
  let store

  beforeEach(() => {
    store = new Store32(2, 100, 2, 10, 10)
  })

  describe('constructor', () => {
    it('should initialize with default parameters', () => {
      const s = new Store32()
      expect(s.depth).toBe(2)
      expect(s.size).toBe(0)
    })

    it('should calculate bitsPerCell correctly', () => {
      const s = new Store32(4, 100, 2, 10, 10)
      expect(s.bitsPerCell).toBe(2)
    })

    it('should set width and height', () => {
      expect(store.width).toBe(10)
      expect(store.height).toBe(10)
    })

    it('should calculate wordsPerRow correctly', () => {
      const s = new Store32(2, 100, 4, 8, 8)
      expect(s.wordsPerRow).toBeGreaterThan(0)
    })
  })

  describe('readRef', () => {
    it('should return correct word index for idx 0', () => {
      const ref = store.readRef(0)
      expect(ref.word).toBe(0)
      expect(ref.shift).toBe(0)
    })

    it('should return correct word and shift for various indices', () => {
      const ref = store.readRef(16)
      expect(ref.word).toBeGreaterThanOrEqual(0)
      expect(ref.shift).toBeGreaterThanOrEqual(0)
    })
  })

  describe('ref', () => {
    it('should include mask in returned reference', () => {
      const r = store.ref(0)
      expect(r).toHaveProperty('word')
      expect(r).toHaveProperty('shift')
      expect(r).toHaveProperty('mask')
    })
  })

  describe('gettingMask', () => {
    it('should return masks shifted correctly', () => {
      const mask = store.gettingMask(0)
      expect(mask).toBe(store.cellMask)
    })

    it('should return different masks for different shifts', () => {
      const mask1 = store.gettingMask(0)
      const mask2 = store.gettingMask(2)
      expect(mask1).not.toBe(mask2)
    })
  })

  describe('leftShift and rightShift', () => {
    it('should shift color value correctly', () => {
      const color = 2
      const shifted = store.leftShift(color, 2)
      expect(shifted).toBe(8)
    })

    it('shifts', () => {
      const color = 2
      const shifted = store.leftShift(color, 4)
      expect(shifted).toBe(32)

      const s2 = store.rightShift(color, 4)
      expect(s2).toBe(0)
    })
  })

  describe('setWordBits and getRef', () => {
    it('should set and get word bits', () => {
      let word = 0
      word = store.setWordBits(word, store.cellMask, 0, 2)
      const value = store.getRef(new Uint32Array([word]), 0, 0)
      expect(value).toBe(2)
    })
  })

  describe('rowCellMask', () => {
    it('should return correct mask for 1 cell', () => {
      const mask = store.rowCellMask(1)
      expect(mask).toBe(store.cellMask)
    })

    it('should return all bits set for 16 cells with 2 bits per cell', () => {
      const mask = store.rowCellMask(16)
      expect(mask).toBe(0xffffffff)
    })
  })

  describe('partialRowMask', () => {
    it('should return mask for numBits', () => {
      const mask = store.partialRowMask(4)
      expect(mask).toBe(15)
    })
  })

  describe('newWords', () => {
    it('should create empty word array', () => {
      const words = store.newWords(10)
      expect(words.length).toBe(10)
      expect(words[0]).toBe(0)
    })
  })

  describe('findRowBounds', () => {
    it('should return null for empty board', () => {
      const bb = store.newWords()
      const bounds = store.findRowBounds(bb)
      expect(bounds).toBeNull()
    })

    it('should find bounds for non-empty board', () => {
      const bb = store.newWords(10)
      bb[0] = 1
      const bounds = store.findRowBounds(bb)
      expect(bounds).not.toBeNull()
    })
  })

  describe('findColBounds', () => {
    it('should return null when no cells found', () => {
      const bb = store.newWords(10)
      const bounds = store.findColBounds(bb, 0, 0)
      expect(bounds).toBeNull()
    })
  })
})
