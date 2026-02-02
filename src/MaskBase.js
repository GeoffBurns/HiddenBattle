import {
  drawSegmentTo,
  drawPie,
  drawRay,
  drawSegmentFor,
  drawLineInfinite
} from './maskShape.js'
import { GridBase } from './gridBase.js'

function bitLength32 (n) {
  return 32 - Math.clz32(n)
}

export class MaskBase extends GridBase {
  constructor (width, height, depth = 1) {
    super(width, height)
    this.bits = 0n
    this.depth = depth

    this.BW = bitLength32(depth)
    this.BS = BigInt(this.BW)
    this.CM = (1n << this.BS) - 1n
    this.MxC = (1 << this.BW) - 1
    this.MnC = 0

    //    lazy(this, 'transformMaps', () => {
    //     return buildTransformMaps(this.width, this.height)
    //    })
  }

  index (x, y) {
    return BigInt(y * this.width + x)
  }
  bitPos (x, y) {
    return BigInt(y * this.BW * this.width + x)
  }

  at (x, y) {
    const pos = this.bitPos(x, y)
    return this.numValue(pos)
  }

  numValue (pos) {
    return Number((this.bits >> pos) & this.CM)
  }
  value (pos) {
    return (this.bits >> pos) & this.CM
  }

  set (x, y, color = 1) {
    this.check(color)

    const pos = this.bitPos(x, y)
    const mask = this.bitMask(pos)

    return this.clearBits(mask) | this.setMask(pos, color)
  }

  setMask (pos, color = 1) {
    return BigInt(color) << pos
  }

  clearBits (mask) {
    return this.bits & ~mask
  }

  bitMask (pos) {
    return this.CM << pos
  }

  check (color = 1) {
    if (this.depth > 1 && (color < this.MnC || color > this.MxC)) {
      throw new Error(`color must be ${this.MnC}..${this.MxC}`)
    }
  }
  testFor (x, y, color = 1) {
    return this.at(x, y) === color
  }

  isNonZero (x, y) {
    const pos = this.bitPos(x, y)
    return ((this.bits >> pos) & this.CM) !== 0n
  }

  get fullBits () {
    return (1n << BigInt(this.width * this.height)) - 1n
  }
  get invertedBits () {
    return this.fullBits & ~this.bits
  }
  drawSegmentTo (x0, y0, x1, y1, color) {
    drawSegmentTo(x0, y0, x1, y1, this, color)
  }

  drawSegmentFor (x0, y0, x1, y1, distance, color) {
    drawSegmentFor(x0, y0, x1, y1, distance, this, color)
  }
  drawPie (x0, y0, x1, y1, radius, color) {
    drawPie(x0, y0, x1, y1, radius, this, 22.5, color)
  }
  drawRay (x0, y0, x1, y1) {
    drawRay(x0, y0, x1, y1, this)
  }
  drawLineInfinite (x0, y0, x1, y1) {
    drawLineInfinite(x0, y0, x1, y1, this)
  }
}
