function bitLength32 (n) {
  return 32 - Math.clz32(n)
}

//rowMask (1n << w) - 1n
//. bitmask  (1n << i)
// addBit
//const setBit = (bb, i) => bb | (1n << i)
// clearBit
//const clearBit = (bb, i) => bb & ~(1n << i)
//const testBit = (bb, i) => (bb >> i) & 1n
export class StoreBase {
  constructor (
    one,
    empty,
    storeType,
    depth = 1,
    size = 0,
    bitLength,
    width,
    height
  ) {
    this.depth = depth
    this.empty = empty
    this.one = one
    const bitsPerCell = bitLength || bitLength32(depth)
    const cellMask = (1 << bitsPerCell) - 1
    const bShift = Math.log2(bitsPerCell)

    this.bitsPerCell = bitsPerCell
    this.width = width
    this.height = height

    this.cellMask = storeType(cellMask)

    this.bShift = storeType(bShift)
    this.bitWidth = storeType(bitsPerCell)
    this.maxBitInCell = storeType(bitsPerCell - 1)
    this.MxC = (1 << bitsPerCell) - 1
    this.MnC = 0
    this.size = storeType(size)
    this.storeType = storeType
  }

  index (pos) {
    return Number(pos >> this.maxBitInCell)
  }
  bitPos (i) {
    return this.storeType(i) << this.maxBitInCell
  }

  bitMask (i) {
    return this.bitMaskByPos(this.bitPos(i))
  }
  bitMaskByPos (pos) {
    return this.cellMask << pos
  }

  numValue (bb, pos) {
    return Number(this.rightShift(bb, pos))
  }
  value (bb, pos) {
    return this.rightShift(bb, pos)
  }
  setMask (pos, color = 1) {
    return this.leftShift(color, pos)
  }
  leftShift (color, shift) {
    return (this.storeType(color) & this.cellMask) << shift
  }
  rightShift (color, shift) {
    return (color >> shift) & this.cellMask
  }
  addBit (bb, i) {
    const mask = this.bitMask(i)
    const result = bb | mask
    return result
  }

  check (color = 1) {
    if (this.depth > 1 && (color < this.MnC || color > this.MxC)) {
      throw new Error(`color must be ${this.MnC}..${this.MxC}`)
    }
  }

  clearBits (bb, mask) {
    return bb & ~mask
  }
  hasBit (bb, pos) {
    if (pos !== undefined) {
      return this.value(bb, pos) !== this.empty
    }
    return false
  }

  rowMask (w) {
    return this.rangeMaskRaw(this.bitPos(w))
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

  msbIndex (x) {
    let n = -1
    while (x > this.empty) {
      x >>= this.one
      n++
    }
    return n
  }
  get fullBits () {
    return this.rangeMaskRaw(this.size)
  }
  rangeMaskRaw (n) {
    return (this.one << n) - this.one
  }
  rangeMask (n) {
    return this.rangeMaskRaw(this.storeType(n))
  }

  invertedBits (bb) {
    return this.fullBits & ~bb
  }
}
