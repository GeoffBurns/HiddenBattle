import { popcountBigInt } from './placeTools.js'
import { ActionsHex } from './actionHex.js'
import { MaskBase } from './MaskBase.js'
import { Shape } from './shape.js'

export class MaskHex extends MaskBase {
  constructor (radius, bits, store) {
    super(Shape.hexagon(radius), 1, bits, store)
  }

  //   get actions () {
  //     return this.indexer?.actions(this)
  //   }

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
    return this.store.bitMaskByPos(this.store.bitPos(i))
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
  at (q, r, s) {
    return this.for(q, r, s).at()
  }
  test (q, r, s, color = 1) {
    return this.for(q, r, s).test(color)
  }
  clear (q, r, s) {
    return this.set(q, r, s, 0)
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
    this.bits = this.indexer.bitsFromCoords(this, coords)
  }

  get toCoords () {
    return this.indexer.bitsToCoords(this.bits)
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

  static fromCoords (radius, coords) {
    const mask = new MaskHex(radius)
    mask.fromCoords(coords)
    return mask
  }
}
