import { popcountBigInt } from './placeTools.js'

import { CubeIndex } from './CubeIndex.js'
import { ActionsHex } from './actionHex.js'
import { setBit } from './bitHelpers.js'

function coordToBit (bb, q, r, index) {
  const i = index.get(`${q},${r}`)
  return i === undefined ? bb : setBit(bb, i)
}

export class MaskHex {
  constructor (radius, bits = 0n) {
    this.bits = bits
    this.depth = 1
    this.indexer = CubeIndex.getInstance(radius)
    this.radius = radius

    this.BW = 1
    this.BS = BigInt(this.BW)
    this.CM = (1n << this.BS) - 1n
    this.MxC = (1 << this.BW) - 1
    this.MnC = 0
  }

  index (q, r, s) {
    const i = this.indexer.index(q, r, s)
    if (i === undefined) {
      throw new Error(`Invalid cube coordinates: ${q},${r},${s}`)
    }
    //   return i === undefined ? undefined : BigInt(i);
    return BigInt(i)
  }
  bitPos (q, r, s) {
    return this.index(q, r, s)
  }

  addBit (bb, q, r, s) {
    const i = this.bitMask(q, r, s)
    return bb | i
  }
  bitMask (q, r, s) {
    const i = this.bitPos(q, r, s)

    return this.bitMaskByIdx(i)
  }
  bitMaskByIdx (i) {
    if (i !== undefined) {
      return 1n << i
    }
    return 0n
  }

  set (q, r, s) {
    this.setIndex(this.index(q, r, s))
    return this.bits
  }

  setIndex (i) {
    this.bits |= this.bitMaskByIdx(i)
    return this.bits
  }
  get actions () {
    if (this._actions && this._actions?.original?.bits === this.bits) {
      return this._actions
    }
    this._actions = new ActionsHex(this.radius, this)
    return this._actions
  }
  clear (q, r, s) {
    this.bits &= ~(1n << this.index(q, r, s))
  }
  test (q, r, s) {
    return (this.bits & (1n << this.index(q, r, s))) !== 0n
  }

  get occupacy () {
    return popcountBigInt(this.bits)
  }

  *keys () {
    for (const [[q, r, s], i] of this.indexer.qrsToI) {
      yield [q, r, s, i]
    }
  }
  *entries () {
    for (const [[q, r, s], i] of this.indexer.qrsToI) {
      yield [q, r, s, this.at(q, r, s), i, this]
    }
  }
  *values () {
    for (const [q, r, s] of this.indexer.qrsToI) {
      yield this.at(q, r, s)
    }
  }
  *bitsIndices () {
    yield* this.indexer.bitsIndices(this.bits)
  }

  *bitKeys () {
    yield* this.indexer.bitKeys(this.bits)
  }

  fromCoords (coords) {
    this.bits = this.indexer.bitsFromCoords(coords)
  }

  get toCoords () {
    const coords = []
    for (const [q, r, s] of this.bitKeys()) {
      coords.push([q, r, s])
    }
    return coords
  }

  normalized () {
    const cells = [...this.bitKeys()].map(([q, r, s]) => [q, r, s])
    const minQ = Math.min(...cells.map(c => c[0]))
    const minR = Math.min(...cells.map(c => c[1]))
    const minS = Math.min(...cells.map(c => c[2]))

    let normalizedBits = 0n
    for (const [q, r, s] of cells) {
      const nq = q - minQ
      const nr = r - minR
      const ns = s - minS
      normalizedBits |= 1n << this.index(nq, nr, ns)
    }
    return normalizedBits
  }
  get fullMask () {
    const mask = this.emptyMask
    mask.bits = this.fullBits
    return mask
  }

  get emptyMask () {
    return new MaskHex(this.radius)
  }
  get invertedMask () {
    const mask = this.emptyMask
    mask.bits = this.invertedBits
    return mask
  }
  static fromCoords (radius, coords) {
    const mask = new MaskHex(radius)
    mask.fromCoords(coords)
    return mask
  }
}
