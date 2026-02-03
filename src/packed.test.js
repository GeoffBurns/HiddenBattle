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
    expect(p.words).toBe(Math.ceil((8 * 8) / 16))
    expect(p.BW).toBe(2)
    expect(p.BS).toBe(2)
    expect(p.CM).toBe((1 << 2) - 1)
  })

  it('index and bitPos compute positions', () => {
    expect(p.index(0, 0)).toBe(0)
    expect(p.index(1, 0)).toBe(1)
    expect(p.index(0, 1)).toBe(8)
    expect(p.bitPos(0, 0)).toBe(0)
    expect(p.bitPos(1, 0)).toBe(1)
    expect(p.bitPos(0, 1)).toBe(16) // BW * width = 2*8 =16
  })

  it('readRefFromPos and refFromPos return expected refs', () => {
    const pos = 5
    const ref = p.readRefFromPos(pos)
    expect(ref.boardIdx).toBe(pos >>> 4)
    expect(ref.boardPos).toBe((pos & 15) << 1)

    const full = p.refFromPos(pos)
    expect(full).toHaveProperty('boardIdx')
    expect(full).toHaveProperty('mask')
    expect(full).toHaveProperty('boardPos')
    expect(full.mask).toBe(p.bitMask(full.boardPos))
  })

  it('leftShift and rightShift produce expected values', () => {
    const val = p.leftShift(3, 4)
    expect(val).toBe((3 & p.CM) << 4)
    const val2 = p.rightShift(2, 6)
    expect(val2).toBe((2 & p.CM) << 6)
  })

  it('setRef and getRef roundtrip', () => {
    const pos = 7
    const { boardIdx, boardPos } = p.readRefFromPos(pos)
    const mask = p.bitMask(boardPos)
    // initially zero
    expect(p.getRef(boardIdx, boardPos)).toBe(0)
    const newVal = p.setRef(boardIdx, mask, 2, boardPos)
    // write to bits and read back
    p.bits[boardIdx] = newVal
    expect(p.getRef(boardIdx, boardPos)).toBe(2)
  })

  it('set and at operate on (x,y)', () => {
    p.set(1, 2, 3)
    expect(p.at(1, 2)).toBe(3)
    // other cell unchanged
    expect(p.at(0, 0)).toBe(0)
  })

  it('testFor reports presence of color', () => {
    p.set(3, 3, 2)
    expect(p.testFor(3, 3, 2)).toBe(true)
    expect(p.testFor(3, 3, 1)).toBe(false)
  })

  it('getPos and value work with raw positions', () => {
    const pos = p.bitPos(4, 1)
    // ensure empty
    expect(p.value(pos)).toBe(0)
    p.setPos(pos, 1)
    expect(p.value(pos)).toBe(1)
  })
  it('getPos and value work with raw positions', () => {
    const pos = p.bitPos(4, 1)
    // ensure empty
    expect(p.value(pos)).toBe(0)
    p.setPos(pos, 1)
    expect(p.value(pos)).toBe(1)
  })
  it('ascii', () => {
    const pos = p.bitPos(4, 1)
    // ensure empty
    p.setPos(pos, 1)
    expect(p.toAscii()).toBe(
      `........\n....1...\n........\n........\n........\n........\n........\n........`
    )
    p.set(0, 0, 3)
    p.set(7, 7, 2)
    expect(p.toAscii()).toBe(
      `3.......\n....1...\n........\n........\n........\n........\n........\n.......2`
    )
    p.setRange(2, 2, 5)
    expect(p.toAscii()).toBe(
      `3.......\n....1...\n..1111..\n..1111..\n..1111..\n..1111..\n........\n.......2`
    )
    p.clearRange(3, 3, 4)
    expect(p.toAscii()).toBe(
      `3.......\n....1...\n..1111..\n..1001..\n..1001..\n..1111..\n........\n.......2`
    )
  })
})
