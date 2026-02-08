import { StoreBase } from './storeBase.js'
import { popcountBigInt } from './placeTools.js'

const one = 1n
const zero = 0n

export class StoreBig extends StoreBase {
  constructor (depth = 1, size = 0) {
    super(one, zero, BigInt, depth, size)
  }
  occupacy (bb) {
    return popcountBigInt(bb)
  }

  msbIndex (x) {
    let n = -1
    while (x > this.empty) {
      x >>= this.one
      n++
    }
    return n
  }

  boundingBox (w, h, bb) {
    const rowMask = this.rowMask(w)

    let minRow = h
    let minCol = w

    // Pass 1: find bounding box
    for (let r = 0; r < h; r++) {
      const row = this.setRow(bb, r, w, rowMask)
      if (row === this.empty) continue

      minRow = Math.min(minRow, r)

      // find leftmost bit in this row
      const col = this.ctz(row)
      minCol = Math.min(minCol, col)
    }
    return { minRow, minCol }
  }
  normalizeUpLeft (bb, h, w) {
    if (bb === zero) return bb

    var { minRow, minCol } = this.boundingBox(w, h, bb)

    return this.shiftTo(w, minRow, h, bb, minCol)
  }
  rangeSize (x0, x1) {
    return this.bitPos(x1 - x0 + 1)
  }
  rangeMask (x0, x1) {
    return (this.one << this.rangeSize(x0, x1)) - this.one
  }
  rowRangeMask (rowIdx, x0, x1) {
    const start = this.bitPos(rowIdx + x0)
    return this.rangeMask(x0, x1) << start
  }

  setRange (bb, rowIdx, c0, c1) {
    return bb | this.rowRangeMask(rowIdx, c0, c1)
  }

  clearRange (bb, rowIdx, c0, c1) {
    return bb & ~this.rowRangeMask(rowIdx, c0, c1)
  }

  rowMask (w) {
    return (this.one << this.bitPos(w)) - this.one
  }
  setRow (bb, r, w, rowMask) {
    return (bb >> this.storeType(r * w)) & rowMask
  }

  ctz (x) {
    let n = 0
    while ((x & this.one) === this.empty) {
      x >>= this.one
      n++
    }
    return n
  }
  shiftTo (w, minRow, h, bb, minCol) {
    let out = zero
    let dstRow = 0
    const rowMask = this.rowMask(w)
    for (let r = minRow; r < h; r++) {
      const row = this.setRow(bb, r, w, rowMask)
      if (row === zero) continue

      const shifted = row >> this.bitPos(minCol)
      out |= shifted << this.bitPos(dstRow * w)
      dstRow++
    }
    return out
  }
}
