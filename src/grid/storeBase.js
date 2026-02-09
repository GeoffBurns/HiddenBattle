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
  constructor (one, empty, storeType, depth = 1, size = 0, bitLength) {
    this.depth = depth
    this.empty = empty
    this.one = one
    this.BW = bitLength || bitLength32(depth)
    this.BS = storeType(this.BW)
    this.CM = (one << this.BS) - one
    this.MB = this.BS - one
    this.MxC = (1 << this.BW) - 1
    this.MnC = 0
    this.size = storeType(size)
    this.storeType = storeType
  }

  index (pos) {
    return Number(pos >> this.MB)
  }
  bitPos (i) {
    return this.storeType(i) << this.MB
  }

  bitMask (i) {
    return this.bitMaskByPos(this.bitPos(i))
  }
  bitMaskByPos (pos) {
    return this.CM << pos
  }

  numValue (bb, pos) {
    return Number(this.value(bb, pos))
  }
  value (bb, pos) {
    return (bb >> pos) & this.CM
  }
  addBit (bb, i) {
    const mask = this.bitMask(i)
    return bb | mask
  }

  check (color = 1) {
    if (this.depth > 1 && (color < this.MnC || color > this.MxC)) {
      throw new Error(`color must be ${this.MnC}..${this.MxC}`)
    }
  }
  setMask (pos, color = 1) {
    return (this.storeType(color) & this.CM) << pos
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

  msbIndex (x) {
    let n = -1
    while (x > this.empty) {
      x >>= this.one
      n++
    }
    return n
  }
  get fullBits () {
    return (this.one << this.size) - this.one
  }
  invertedBits (bb) {
    return this.fullBits & ~bb
  }
}
