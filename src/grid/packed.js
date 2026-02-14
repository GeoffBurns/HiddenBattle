import { MaskBase } from './MaskBase'
import { lazy } from '../utilities.js'
import { buildTransformMaps } from './buildTransformMaps.js'
import { ShapeEnum } from './shapeEnum.js'
import { Store32 } from './store32.js'

function bitLength32 (n) {
  return 32 - Math.clz32(n - 1)
}

export class Packed extends MaskBase {
  constructor (width, height, bits, store, depth = 4) {
    const bitlength = bitLength32(depth)
    store =
      store || new Store32(depth, width * height, bitlength, width, height)
    bits = bits || store.newWords()
    super(ShapeEnum.rectangle(width, height), depth, bits, store)
    this.words = store.words
    lazy(this, 'transformMaps', () => {
      return buildTransformMaps(this.width, this.height)
    })
  }

  get actions () {
    return this.indexer?.actions(this)
  }
  index (x, y) {
    return y * this.width + x
  }
  bitPos (x, y) {
    return this.store.bitPos(this.index(x, y))
  }

  readRef (x, y) {
    const i = this.index(x, y)
    return this.store.readRef(i)
  }

  setRange (r, c0, c1, color = 1) {
    const i0 = this.index(c0, r)
    const i1 = this.index(c1, r)

    this.bits = this.store.setRange(this.bits, i0, i1, color)
  }
  clearRange (r, c0, c1) {
    this.setRange(r, c0, c1, 0)
  }

  normalize () {
    const data = this.bits
    const width = this.width
    const height = this.height
    this.bits = this.store.normalize(data, width, height)
  }

  at (x, y) {
    const idx = this.index(x, y)
    return this.store.getIdx(this.bits, idx)
  }

  set (x, y, color = 1) {
    this.bits = this.store.setIdx(this.bits, this.index(x, y), color)
  }

  testFor (x, y, color = 1) {
    return this.at(x, y) === color
  }

  isNonZero (x, y) {
    const idx = this.index(x, y)
    return this.store.isNonZero(this.bits, idx)
  }
  occupancyMask (bitsPerCell) {
    return occupancy1Bit(this.bits, this.width, this.height, bitsPerCell)
  }
}
function occupancy1Bit (src, W, H, bitsPerCell) {
  const cellsPerWord = 32 / bitsPerCell
  const cellMask = (1 << bitsPerCell) - 1

  const nCells = W * H
  const outWords = Math.ceil(nCells / 32)
  const out = new Uint32Array(outWords)

  let outBit = 0

  for (let i = 0; i < src.length; i++) {
    let w = src[i]
    for (let c = 0; c < cellsPerWord && outBit < nCells; c++) {
      if ((w & cellMask) !== 0) {
        out[outBit >>> 5] |= 1 << (outBit & 31)
      }
      w >>>= bitsPerCell
      outBit++
    }
  }
  return out
}
function getBit (bb, i) {
  return (bb[i >>> 5] >>> (i & 31)) & 1
}

function setBit (bb, i) {
  bb[i >>> 5] |= 1 << (i & 31)
}

function makeRowMasks (W, H) {
  const n = W * H
  const words = Math.ceil(n / 32)

  const notLeft = new Uint32Array(words)
  const notRight = new Uint32Array(words)

  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = y * W + x
      const w = i >>> 5
      const b = i & 31
      if (x !== 0) notLeft[w] |= 1 << b
      if (x !== W - 1) notRight[w] |= 1 << b
    }
  }
  return { notLeft, notRight }
}
function shiftRows (bb, rowBits) {
  const wordShift = rowBits >>> 5
  const bitShift = rowBits & 31

  const out = new Uint32Array(bb.length)

  for (let i = 0; i < bb.length; i++) {
    let v = 0
    if (i - wordShift >= 0) {
      v = bb[i - wordShift] << bitShift
      if (bitShift && i - wordShift - 1 >= 0) {
        v |= bb[i - wordShift - 1] >>> (32 - bitShift)
      }
    }
    out[i] = v
  }
  return out
}
function shiftEast (bb, notRight) {
  const out = new Uint32Array(bb.length)
  for (let i = 0; i < bb.length; i++) {
    out[i] = (bb[i] << 1) & notRight[i]
  }
  return out
}

function shiftWest (bb, notLeft) {
  const out = new Uint32Array(bb.length)
  for (let i = 0; i < bb.length; i++) {
    out[i] = (bb[i] >>> 1) & notLeft[i]
  }
  return out
}
function dilate8 (bb, W, H, masks) {
  const { notLeft, notRight } = masks

  const north = shiftRows(bb, -W)
  const south = shiftRows(bb, +W)

  const east = shiftEast(bb, notRight)
  const west = shiftWest(bb, notLeft)

  const ne = shiftEast(north, notRight)
  const nw = shiftWest(north, notLeft)
  const se = shiftEast(south, notRight)
  const sw = shiftWest(south, notLeft)

  const out = new Uint32Array(bb.length)
  for (let i = 0; i < bb.length; i++) {
    out[i] =
      bb[i] |
      north[i] |
      south[i] |
      east[i] |
      west[i] |
      ne[i] |
      nw[i] |
      se[i] |
      sw[i]
  }
  return out
}
function shiftBits (src, shift) {
  if (shift === 0) return src.slice()

  const words = src.length
  const out = new Uint32Array(words)

  const wordShift = shift >> 5
  const bitShift = shift & 31

  if (shift > 0) {
    for (let i = words - 1; i >= 0; i--) {
      let v = 0
      const s = i - wordShift
      if (s >= 0) {
        v = src[s] << bitShift
        if (bitShift && s - 1 >= 0) v |= src[s - 1] >>> (32 - bitShift)
      }
      out[i] = v
    }
  } else {
    const wShift = -wordShift
    const bShift = -shift & 31
    for (let i = 0; i < words; i++) {
      let v = 0
      const s = i + wShift
      if (s < words) {
        v = src[s] >>> bShift
        if (bShift && s + 1 < words) v |= src[s + 1] << (32 - bShift)
      }
      out[i] = v
    }
  }
  return out
}
