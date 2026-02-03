import { MaskBase } from './MaskBase'
import { lazy } from './utilities.js'

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

function buildTransformMaps32 (W, H) {
  const m = {
    id: [],
    r90: [],
    r180: [],
    r270: [],
    fx: [],
    fy: [],
    fd1: [],
    fd2: []
  }

  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = y * W + x
      m.id[i] = i
      m.r90[i] = x * H + (H - 1 - y)
      m.r180[i] = (H - 1 - y) * W + (W - 1 - x)
      m.r270[i] = (W - 1 - x) * H + y
      m.fx[i] = y * W + (W - 1 - x)
      m.fy[i] = (H - 1 - y) * W + x
      m.fd1[i] = x * W + y
      m.fd2[i] = (W - 1 - x) * W + (H - 1 - y)
    }
  }
  return m
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
      return buildTransformMaps32(this.width, this.height)
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
    return (color & this.CM) << boardPos
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
