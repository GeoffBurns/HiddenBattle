import {
  drawSegmentTo,
  drawPie,
  drawRay,
  drawSegmentFor,
  drawLineInfinite
} from './maskShape.js'
import { CanvasGrid } from './canvasGrid.js'

function bitLength32 (n) {
  return 32 - Math.clz32(n)
}

export class MaskBase extends CanvasGrid {
  constructor (width, height, depth = 1, bits = 0n) {
    super(width, height)
    this.bits = bits
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
  rangeSize (x0, x1) {
    return (x1 - x0 + 1) * this.BW
  }
  rangeMask (x0, x1) {
    return (1n << BigInt(this.rangeSize(x0, x1))) - 1n
  }
  rowRangeMask (y, x0, x1) {
    const start = this.bitPos(x0, y)
    return this.rangeMask(x0, x1) << start
  }

  setRange (r, c0, c1) {
    this.bits |= this.rowRangeMask(r, c0, c1)
  }
  setRanges (ranges) {
    for (const [r, c0, c1] of ranges) {
      this.setRange(r, c0, c1)
    }
  }
  clearRange (r, c0, c1) {
    this.bits &= ~this.rowRangeMask(r, c0, c1)
  }
  clearRanges (ranges) {
    for (const [r, c0, c1] of ranges) {
      this.clearRange(r, c0, c1)
    }
  }
  get fullBits () {
    return (1n << BigInt(this.width * this.height)) - 1n
  }
  get invertedBits () {
    return this.fullBits & ~this.bits
  }

  toAscii (symbols = ['.', '1', '2', '3']) {
    let lines = []

    this.forRows(symbols, lines)

    return lines.join('\n')
  }

  forRows (symbols, lines) {
    const H = this.height
    for (let y = 0; y < H; y++) {
      this.asciiRow(y, symbols, lines)
    }
  }

  asciiRow (y, symbols, lines) {
    let row = ''
    row = this.forRow(row, y, this.asciiCell.bind(this, symbols))
    lines.push(row)
  }

  forRow (row, y, accCell) {
    const W = this.width
    for (let x = 0; x < W; x++) {
      row = accCell(y, x, row)
    }
    return row
  }

  asciiCell (symbols, y, x, row) {
    const v = this.at(x, y)
    row += symbols[v]
    return row
  }
}
