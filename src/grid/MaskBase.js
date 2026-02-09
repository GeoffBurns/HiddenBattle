import { CanvasGrid } from './canvasGrid.js'
import { ForLocation } from './ForLocation.js'
import { StoreBig } from './storeBig.js'

export class MaskBase extends CanvasGrid {
  constructor (shape, depth = 1, bits, store) {
    super(shape)
    this.store = store || new StoreBig(depth, this.indexer.size)
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
  get occupacy () {
    return this.store.occupacy(this.bits)
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
    return this.store.fullBits
  }
  get invertedBits () {
    return this.store.invertedBits(this.bits)
  }

  applyTransform (bbc, map) {
    let out = bbc.store.empty
    for (const i of this.bitsIndices(bbc.bits)) {
      bbc.store.addBit(out, map[i])
    }
    return out
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
