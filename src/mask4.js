const BW = 2 // bit width
const CM = 0b11n // color mask
const MxC = 3 // max color
const MnC = 0 // min color
const BS = 2n // bit shift
const MB = BS - 1n //  max bit

export class Mask4 {
  constructor (width, height) {
    this.width = width
    this.height = height
    this.bits = 0n
    //    lazy(this, 'transformMaps', () => {
    //     return buildTransformMaps(this.width, this.height)
    //    })
  }

  index (x, y) {
    return BigInt(y * this.width + x)
  }
  bitPos (x, y) {
    return this.index(x, y) << MB
  }

  at (x, y) {
    const pos = this.bitPos(x, y)
    return Number((this.bits >> pos) & CM)
  }

  set (x, y, color) {
    this.check(color)

    const pos = this.bitPos(x, y)
    const mask = CM << pos

    return (this.bits & ~mask) | (BigInt(color) << pos)
  }

  check (color) {
    if (color < MnC || color > MxC) {
      throw new Error(`color must be ${MnC}..${MxC}`)
    }
  }
  testFor (x, y, color) {
    return this.at(x, y) === color
  }

  isNonZero (x, y) {
    const pos = this.bitPos(x, y)
    return ((this.bits >> pos) & CM) !== 0n
  }
  setRowRange (y, x0, x1, color) {
    this.check(color)

    let pos = this.bitPos(x0, y)
    let mask = 0n
    let value = 0n

    for (let x = x0; x <= x1; x++) {
      mask |= CM << pos
      value |= BigInt(color) << pos
      pos += BS
    }

    return (this.bits & ~mask) | value
  }

  clearRowRange (y, x0, x1) {
    let pos = this.bitPos(x0, y)
    let mask = 0n

    for (let x = x0; x <= x1; x++) {
      mask |= CM << pos
      pos += BS
    }

    return this.bits & ~mask
  }
  get size () {
    return 2 // popcountBigInt(this.bits)
  }

  flipH () {
    let out = 0n
    const W = this.width
    const H = this.height
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        out = this.flipRow(y, W, x, out)
      }
    }
    return out
  }
  flipRow (y, x, out) {
    const W = this.width
    const src = BigInt((y * W + x) * 2)
    const dst = BigInt((y * W + (W - 1 - x)) * 2)
    out |= ((this.bits >> src) & CM) << dst
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
    const W = this.width

    const board = this.bits
    const pos = BigInt((y * W + x) * 2)
    const v = Number((board >> pos) & CM)
    row += symbols[v]
    return row
  }
  inBounds (x, y) {
    const W = this.width
    const H = this.height
    return x >= 0 && y >= 0 && x < W && y < H
  }
}
