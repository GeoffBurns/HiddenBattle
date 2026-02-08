import { MaskBase } from './MaskBase'
import { lazy } from '../utilities.js'
import { buildTransformMaps } from './buildTransformMaps.js'

export function rangeBitMask (start, end) {
  return ((~0 >>> (31 - end)) & (~0 << start)) >>> 0
}
export function setBitsRange (x, start, end) {
  const mask = rangeBitMask(start, end)
  return (x | mask) >>> 0
}
export function bits (x) {
  return x.toString(2).padStart(32, '0')
}
export function fillRange2BitPattern (x, start, end, pattern) {
  const mask = fillMask2BitPattern(start, end, pattern)

  return (x | mask) >>> 0
}
export function fillMask2BitPattern (start, e, pattern) {
  pattern &= 3
  const end = e + 1
  const rangeBits = end - start + 1
  const usableBits = rangeBits & ~1
  if (usableBits === 0) return 0 >>> 0

  let base
  switch (pattern) {
    case 0:
      base = 0x00000000
      break
    case 1:
      base = 0x55555555
      break
    case 2:
      base = 0xaaaaaaaa
      break
    case 3:
      base = 0xffffffff
      break
  }

  const mask = (base >>> (32 - usableBits)) << start

  return mask >>> 0
}
export function firstNonEmptyRow (data, widthWords) {
  for (let i = 0; i < data.length; i += widthWords) {
    for (let w = 0; w < widthWords; w++) {
      if (data[i + w] !== 0) return i / widthWords
    }
  }
  return -1
}
function firstNonEmptyColumn (data, width, height) {
  const colBits = new Uint32Array(width)

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = y * width + x
      if (data[i] !== 0) colBits[x] = 1
    }
  }

  return colBits.findIndex(v => v !== 0)
}
function normalize2Bit (data, width, height) {
  const minY = firstNonEmptyRow(data, width)
  const minX = firstNonEmptyColumn(data, width, height)

  const out = new Uint32Array(data.length)

  for (let y = minY; y < height; y++) {
    for (let x = minX; x < width; x++) {
      out[(y - minY) * width + (x - minX)] = data[y * width + x]
    }
  }

  return out
}

export class Packed extends MaskBase {
  constructor (width, height) {
    const words = Math.ceil((width * height) / 16)
    super(width, height, 2, new Uint32Array(words))
    this.words = words
    this.BW = 2
    this.MB = this.BW - 1
    this.BS = 2
    this.CM = (1 << this.BS) - 1
    this.MxC = (1 << this.BW) - 1
    this.MnC = 0
    lazy(this, 'transformMaps', () => {
      return buildTransformMaps(this.width, this.height)
    })
  }
  index (x, y) {
    return y * this.width + x
  }

  // wordIndex = floor(cellIndex / 16)
  // bitOffset = (cellIndex % 16) * 2
  bitPos (x, y) {
    return this.index(x, y) << this.MB
  }
  ref (x, y) {
    const pos = this.bitPos(x, y)
    return this.refFromPos(pos)
  }
  readRef (x, y) {
    const pos = this.bitPos(x, y)
    return this.readRefFromPos(pos)
  }
  setRange (r, c0, c1, color = 1) {
    const ref1 = this.readRef(c0, r)
    const ref2 = this.readRef(c1, r)
    for (let bIdx = ref1.boardIdx; bIdx <= ref2.boardIdx; bIdx++) {
      this.setChunkRange(bIdx, ref1, ref2, color)
    }
  }
  setChunkRange (bIdx, ref1, ref2, color = 1) {
    let { startPos, endPos } = this.rangeInChunk(bIdx, ref1, ref2)
    const mask = fillMask2BitPattern(startPos, endPos, color)
    const full = rangeBitMask(startPos, endPos)
    this.bits[bIdx] = this.setChunkMask(bIdx, full, mask)
  }

  rangeInChunk (bIdx, ref1, ref2) {
    let startPos = 0
    let endPos = 31
    if (bIdx === ref1.boardIdx) {
      startPos = ref1.boardPos
    }
    if (bIdx === ref2.boardIdx) {
      endPos = ref2.boardPos
    }
    return { startPos, endPos }
  }

  clearRange (r, c0, c1) {
    this.setRange(r, c0, c1, 0)
  }
  setPos (pos, color) {
    const { boardIdx, mask, boardPos } = this.refFromPos(pos)
    this.bits[boardIdx] = this.setRef(boardIdx, mask, color, boardPos)
  }

  setRef (boardIdx, mask, color, boardPos) {
    return this.clearBoardBits(boardIdx, mask) | this.leftShift(color, boardPos)
  }
  normalize () {
    const data = this.bits
    const width = this.width
    const height = this.height
    this.bits = normalize2Bit(data, width, height)
  }
  setChunkMask (boardIdx, full, mask) {
    return this.clearBoardBits(boardIdx, full) | mask
  }
  //transformMap
  refFromPos (pos) {
    const { boardIdx, boardPos } = this.readRefFromPos(pos)
    const mask = this.bitMask(boardPos)
    return { boardIdx, mask, boardPos }
  }
  refFromIdx (idx) {
    const { boardIdx, boardPos } = this.readRefFromIdx(idx)
    const mask = this.bitMask(boardPos)
    return { boardIdx, mask, boardPos }
  }
  readRefFromIdx (idx) {
    const boardIdx = idx >>> 4 // /16
    const boardPos = (idx & 15) << 1 // *2
    return { boardIdx, boardPos }
  }
  readRefFromPos (pos) {
    const boardIdx = pos >>> 5 // /16
    const boardPos = pos & 30
    return { boardIdx, boardPos }
  }
  leftShift (color, boardPos) {
    return (color & this.CM) << boardPos
  }
  rightShift (color, boardPos) {
    return (color & this.CM) >> boardPos
  }

  setMask (pos, color = 1) {
    return (color & this.CM) << pos
  }

  clearBoardBits (idx, mask) {
    return this.bits[idx] & ~mask
  }

  bitMask (pos) {
    return this.CM << pos
  }
  getPos (pos) {
    const { boardIdx, boardPos } = this.readRefFromPos(pos)
    return this.getRef(boardIdx, boardPos)
  }
  getRef (boardIdx, boardPos) {
    return (this.bits[boardIdx] >>> boardPos) & this.CM
  }

  at (x, y) {
    const ref = this.readRef(x, y)
    return this.getRef(ref.boardIdx, ref.boardPos)
  }

  value (pos) {
    const { boardIdx, boardPos } = this.readRefFromPos(pos)
    return this.getRef(boardIdx, boardPos)
  }

  set (x, y, color = 1) {
    const { boardIdx, mask, boardPos } = this.ref(x, y)
    this.bits[boardIdx] = this.setRef(boardIdx, mask, color, boardPos)
  }

  testFor (x, y, color = 1) {
    return this.at(x, y) === color
  }

  isNonZero (x, y) {
    const { boardIdx, boardPos } = this.readRefFromPos(this.bitPos(x, y))
    return ((this.bits[boardIdx] >> boardPos) & this.CM) !== 0n
  }
}
