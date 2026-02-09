/* eslint-env jest */

/* global describe, it, expect, beforeEach */
import { Packed } from './packed.js'

describe('Packed', () => {
  let p

  beforeEach(() => {
    p = new Packed(8, 8)
  })

  it('constructs with expected properties', () => {
    expect(p.width).toBe(8)
    expect(p.height).toBe(8)
    expect(p.words).toBe(4)
    expect(p.store.BW).toBe(2)
    expect(p.store.BS).toBe(2)
    expect(p.store.CM).toBe((1 << 2) - 1)
    expect(p.bits.length).toBe(4)

    expect(p.bits).toBeInstanceOf(Uint32Array)
    expect(p.bits[0]).toBe(0)
    expect(p.bits[p.words - 1]).toBe(0)
    expect(p.bits.every(b => b === 0)).toBe(true)
  })

  it('index and bitPos compute positions', () => {
    expect(p.index(0, 0)).toBe(0)
    expect(p.index(1, 0)).toBe(1)
    expect(p.index(0, 1)).toBe(8)
    expect(p.bitPos(0, 0)).toBe(0)
    expect(p.bitPos(1, 0)).toBe(2)
    expect(p.bitPos(0, 1)).toBe(16) // BW * width = 2*8 =16
  })

  it('readRef  and ref  return expected refs', () => {
    const idx = 5
    const ref2 = p.store.readRef(idx)
    expect(ref2.word).toBe(0)
    expect(ref2.shift).toBe(10)

    const ref = p.store.ref(idx)
    expect(ref.word).toBe(0)
    expect(ref.shift).toBe(10)

    const full = p.store.ref(p.bits, idx)
    expect(full).toHaveProperty('word')
    expect(full).toHaveProperty('mask')
    expect(full).toHaveProperty('shift')
    expect(full.mask).toBe(p.store.gettingMask(full.shift))
  })

  it('leftShift and rightShift produce expected values', () => {
    const val = p.store.leftShift(3, 4)
    expect(val).toBe((3 & p.store.CM) << 4)
    const val2 = p.store.rightShift(2, 6)
    expect(val2).toBe((2 & p.store.CM) >> 6)
  })

  it('setRef and getRef roundtrip', () => {
    const idx = 7
    const { word: boardIdx, shift: boardPos } = p.store.readRef(p.bits, idx)
    const mask = p.store.gettingMask(boardPos)
    // initially zero
    expect(p.store.getRef(p.bits, boardIdx, boardPos)).toBe(0)
    const newVal = p.store.setWordBits(p.bits[boardIdx], mask, boardPos, 2)
    // write to bits and read back
    p.bits[boardIdx] = newVal

    expect(p.store.getRef(p.bits, boardIdx, boardPos)).toBe(2)
  })

  it('set and at operate on (x,y)', () => {
    expect(p.bits.length).toBe(4)
    expect(p.bits).toBeInstanceOf(Uint32Array)
    expect(p.bits[1]).toBe(0)

    const i = p.index(1, 2)
    expect(i).toBe(17)
    p.set(1, 2, 3)
    const color = p.at(1, 2)
    expect(color).toBe(3)
    // other cell unchanged
    expect(p.at(0, 0)).toBe(0)
  })

  it('testFor reports presence of color', () => {
    p.set(3, 3, 2)
    expect(p.testFor(3, 3, 2)).toBe(true)
    expect(p.testFor(3, 3, 1)).toBe(false)
  })

  it('toAscii produces output', () => {
    const i = p.index(4, 1)
    // ensure empty
    p.set(i, 1)
    const ascii1 = p.toAscii()
    expect(typeof ascii1).toBe('string')
    expect(ascii1).toContain('1')

    p.set(0, 0, 3)
    const ascii2 = p.toAscii()
    expect(ascii2).toContain('3')
  })
  it('ref and Idx', () => {
    const pos = p.index(7, 7)
    expect(pos).toBe(63)
    const { word, mask, shift } = p.store.ref(pos)

    const expectedMask = 3 << (15 * 2)
    expect(mask).toBe(expectedMask)
    expect(shift).toBe(30)
    expect(word).toBe(3)
  })
  it('ref', () => {
    const { word, mask, shift } = p.store.ref(4)
    expect(word).toBe(0)
    expect(shift).toBe(8)
    const expectedMask = 3 << 8
    expect(mask).toBe(expectedMask)
    const brdIdx = 20 >>> 4 // /16
    const brdPos = (20 & 15) << 1 // *2
    expect(brdIdx).toBe(1)
    expect(brdPos).toBe(8)
    const brdIdx2 = 40 >>> 5 // /16
    const brdPos2 = 40 & 30
    expect(brdIdx2).toBe(1)
    expect(brdPos2).toBe(8)
    const ref = p.store.readRef(20)
    const entries = Object.entries(ref)
    expect(entries.length).toBe(2)
    const keys = Object.keys(ref)
    expect(keys).toContain('word')
    expect(keys).toContain('shift')
    const values = Object.values(ref)
    expect(values.length).toBe(2)
    expect(values[0]).toBe(1)
    expect(values[1]).toBe(8)
    expect(ref.shift).toBe(8)
    expect(ref.word).toBe(1)
    /* const { boardIdx3, boardPos3 } = ref
   expect(boardPos3).toBe(8)
    expect(boardIdx3).toBe(1)
    const { boardIdx4, mask4, boardPos4 } = p.refFromIdx(20)
    expect(boardPos4).toBe(8)
    expect(boardIdx4).toBe(1)
    expect(mask4).toBe(expectedMask)
    const { boardIdx2, mask2, boardPos2 } = p.refFromPos(40)
    expect(boardPos2).toBe(8)
    expect(boardIdx2).toBe(1)
    expect(mask2).toBe(expectedMask) */
  })

  it('ref zero', () => {
    const { word, mask, shift } = p.store.ref(0, 0)
    expect(word).toBe(0)
    expect(mask).toBe(3)
    expect(shift).toBe(0)
  })
  it('ref', () => {
    const i = p.index(4, 1)
    const { word, mask, shift } = p.store.ref(i)
    expect(word).toBe(0)
    expect(shift).toBe(24)
    expect(mask).toBe(3 << 24)
  })

  it('ascii', () => {
    const pos = p.index(4, 1)
    // ensure empty
    p.store.setIdx(p.bits, pos, 1)
    expect(p.toAscii()).toBe(
      `........\n....1...\n........\n........\n........\n........\n........\n........`
    )
    p.set(0, 0, 3)
    //   p.set(6, 5, 2)
    const ascii3 = p.toAscii()
    expect(ascii3).toBe(
      `3.......\n....1...\n........\n........\n........\n........\n........\n........`
    )
    p.set(7, 7, 2)
    const ascii4 = p.toAscii()
    expect(ascii4).toBe(
      `3.......\n....1...\n........\n........\n........\n........\n........\n.......2`
    )
    const ref1 = p.readRef(2, 2)
    expect(ref1.word).toBe(1)
    expect(ref1.shift).toBe(4)
    const ref2 = p.readRef(5, 2)
    expect(ref2.word).toBe(1)
    expect(ref2.shift).toBe(10)

    p.setRange(2, 2, 5)
    expect(p.toAscii()).toBe(
      `3.......\n....1...\n..1111..\n........\n........\n........\n........\n.......2`
    )
    p.clearRange(2, 3, 4)
    const asc5 = p.toAscii()
    expect(asc5).toBe(
      `3.......\n....1...\n..1..1..\n........\n........\n........\n........\n.......2`
    )
  })
})
