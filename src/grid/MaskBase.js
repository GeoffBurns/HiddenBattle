import { CanvasGrid } from './canvasGrid.js'
import { StoreBig } from './storeBig.js'

class ForLocation {
  constructor (pos, bits, store) {
    this.pos = pos
    this.bits = bits
    this.store = store
  }
  set (color = 1) {
    this.store.check(color)

    const pos = this.pos
    const mask = this.store.bitMaskByPos(pos)
    this.bits =
      this.store.clearBits(this.bits, mask) | this.store.setMask(pos, color)
    return this.bits
  }
  at () {
    const pos = this.pos
    return this.store.numValue(this.bits, pos)
  }
  clearBits (mask) {
    return this.store.clearBits(this.bits, mask)
  }

  test (color = 1) {
    return this.at() === color
  }

  isNonZero () {
    const pos = this.pos
    return ((this.bits >> pos) & this.store.CM) !== 0n
  }
}

export class MaskBase extends CanvasGrid {
  constructor (width, height, depth = 1, bits, store) {
    super(width, height)
    this.store = store || new StoreBig(depth, width * height)
    this.bits = bits || this.store.empty
    this.depth = depth
  }

  index (...args) {
    return this.indexer.index(...args)
  }
  bitPos (...args) {
    return this.store.bitPos(this.index(...args))
  }

  set (...args) {
    this.bits = this.store.addBit(this.bits, ...args)
    return this.bits
  }

  at (...args) {
    const pos = this.bitPos(...args)
    return this.store.numValue(this.bits, pos)
  }

  for (...args) {
    const pos = this.bitPos(...args)
    return new ForLocation(pos, this.bits, this.store)
  }

  setRange (r, c0, c1) {
    this.bits = this.store.setRange(this.bits, this.index(0, r), c0, c1)
  }
  setRanges (ranges) {
    for (const [r, c0, c1] of ranges) {
      this.setRange(r, c0, c1)
    }
  }
  clearRange (r, c0, c1) {
    this.bits = this.store.clearRange(this.bits, this.index(0, r), c0, c1)
  }
  clearRanges (ranges) {
    for (const [r, c0, c1] of ranges) {
      this.clearRange(r, c0, c1)
    }
  }
  get fullBits () {
    return (1n << this.store.size) - 1n
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
