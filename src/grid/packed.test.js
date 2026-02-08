/* eslint-env jest */

/* global describe, it, expect, beforeEach */
import { Packed, bits, fillMask2BitPattern, rangeBitMask } from './packed.js'

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
    expect(p.bitPos(1, 0)).toBe(2)
    expect(p.bitPos(0, 1)).toBe(16) // BW * width = 2*8 =16
  })

  it('readRefFromPos and refFromPos return expected refs', () => {
    const idx = 5
    const pos = 10
    const ref = p.readRefFromPos(pos)
    const ref2 = p.readRefFromIdx(idx)

    expect(ref.boardIdx).toBe(0)
    expect(ref.boardPos).toBe(10)
    expect(ref2.boardIdx).toBe(0)
    expect(ref2.boardPos).toBe(10)
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
    expect(val2).toBe((2 & p.CM) >> 6)
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
  it('toAscii produces output', () => {
    const pos = p.bitPos(4, 1)
    // ensure empty
    p.setPos(pos, 1)
    const ascii1 = p.toAscii()
    expect(typeof ascii1).toBe('string')
    expect(ascii1).toContain('1')

    p.set(0, 0, 3)
    const ascii2 = p.toAscii()
    expect(ascii2).toContain('3')
  })
  it('ref and Pos', () => {
    const pos = p.bitPos(7, 7)
    expect(pos).toBe(126)
    const { boardIdx, mask, boardPos } = p.refFromPos(pos)

    const expectedMask = 3 << (15 * 2)
    expect(mask).toBe(expectedMask)
    expect(boardPos).toBe(30)
    expect(boardIdx).toBe(3)
  })
  it('refFromPos', () => {
    const { boardIdx, mask, boardPos } = p.refFromPos(8)
    expect(boardIdx).toBe(0)
    expect(boardPos).toBe(8)
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
    const ref = p.readRefFromIdx(20)
    const entries = Object.entries(ref)
    expect(entries.length).toBe(2)
    const keys = Object.keys(ref)
    expect(keys).toContain('boardIdx')
    expect(keys).toContain('boardPos')
    const values = Object.values(ref)
    expect(values.length).toBe(2)
    expect(values[0]).toBe(1)
    expect(values[1]).toBe(8)
    expect(ref.boardPos).toBe(8)
    expect(ref.boardIdx).toBe(1)
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
    const { boardIdx, mask, boardPos } = p.ref(0, 0)
    expect(boardIdx).toBe(0)
    expect(mask).toBe(3)
    expect(boardPos).toBe(0)
  })
  it('ref', () => {
    const { boardIdx, mask, boardPos } = p.ref(4, 1)
    expect(boardIdx).toBe(0)

    expect(boardPos).toBe(24)
    expect(mask).toBe(3 << 24)
  })

  it('ascii', () => {
    const pos = p.bitPos(4, 1)
    // ensure empty
    p.setPos(pos, 1)
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
    expect(ref1.boardIdx).toBe(1)
    expect(ref1.boardPos).toBe(4)
    const ref2 = p.readRef(5, 2)
    expect(ref2.boardIdx).toBe(1)
    expect(ref2.boardPos).toBe(10)
    let { startPos, endPos } = p.rangeInChunk(1, ref1, ref2)
    expect(startPos).toBe(4)
    expect(endPos).toBe(10)
    const mask = fillMask2BitPattern(4, 10, 1)
    expect(bits(mask)).toBe('00000000000000000000010101010000')
    const full = rangeBitMask(4, 10)
    const chunk = p.setChunkMask(1, full, mask)
    expect(bits(chunk)).toBe('00000000000000000000010101010000')
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
