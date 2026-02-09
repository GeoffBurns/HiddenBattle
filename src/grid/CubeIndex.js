import { ActionsHex } from './actionHex.js'
import { lazy } from '../utilities.js'
import { buildTransformHexMaps } from './buildTransformHexMaps.js'
import { Indexer } from './indexer.js'

const cache = new Map()

function buildCube (radius) {
  const coords = []
  const qrsToI = new Map()
  const qrToI = new Map()
  const iToQrs = new Map()
  let i = 0

  for (let q = -radius; q <= radius; q++) {
    for (let r = -radius; r <= radius; r++) {
      const s = -q - r
      if (Math.abs(s) <= radius) {
        coords.push([q, r, s])
        qrsToI.set(`${q},${r},${s}`, i)
        qrToI.set(`${q},${r}`, i)
        iToQrs.set(i, [q, r, s])
        i++
      }
    }
  }
  return { coords, qrsToI, qrToI, iToQrs, size: i }
}
export class CubeIndex extends Indexer {
  constructor (radius) {
    const { coords, qrsToI, qrToI, iToQrs, size } = buildCube(radius)
    super(size)
    this.radius = radius

    this.coords = coords
    this.qrsToI = qrsToI
    this.qrToI = qrToI
    this.iToQrs = iToQrs
    this.size = size
    lazy(this, 'transformMaps', () => {
      return buildTransformHexMaps(
        this.coords,
        this.index.bind(this),
        this.size
      )
    })
  }
  index (q, r, s) {
    if (s === undefined) {
      return this.qrToI.get(`${q},${r}`)
    } else {
      return this.qrsToI.get(`${q},${r},${s}`)
    }
  }
  location (i) {
    return this.iToQrs.get(i)
  }

  isValid (q, r, s) {
    return this.qrsToI.has(`${q},${r},${s}`)
  }

  *entries (bb) {
    for (const [loc, i] of this.qrsToI) {
      yield [...loc, bb.at(...loc), i, bb]
    }
  }

  *values (bb) {
    for (const loc of this.qrsToI) {
      yield bb.at(...loc)
    }
  }

  get actions () {
    if (this._actions && this._actions?.original?.bits === this.bits) {
      return this._actions
    }
    this._actions = new ActionsHex(this.radius, this)
    return this._actions
  }
  /*
  addBit (bb, q, r, s) {
    const mask = this.bitMask(bb, q, r, s)
    return bb | mask
  }
  bitMask (bb, q, r, s) {
    const i = this.index(q, r, s)

    return bb.bitMaskByIdx(i)
  }
  bitMaskByIdx (i) {
    if (i !== undefined) {
      return 1n << i
    }
    return 0n
  }
  addBitSafe (bb, q, r, s) {
    const bm = this.bitMask(q, r, s)
    if (bm !== 0n) {
      return bb | bm
    }
    throw new Error(`Invalid coordinates: ${q},${r},${s}`)
  }
  hasBit (bb, q, r, s) {
    const i = this.index(q, r, s)
    if (i !== undefined) {
      return (bb >> BigInt(i)) & 1n
    }
    return 0n
  }
  hasBitSafe (bb, q, r, s) {
    const i = this.index(q, r, s)
    if (i !== undefined) {
      return (bb >> BigInt(i)) & 1n
    }
    throw new Error(`Invalid coordinates: ${q},${r},${s}`)
  }
*/
  applyOffset (bbc, dq, dr) {
    let out = bbc.store.empty
    for (const i of this.bitsIndices(bbc.bits)) {
      const [q, r] = this.iToQrs.get(i)
      const nq = q + dq
      const nr = r + dr
      const ns = -nq - nr
      const j = this.index(nq, nr, ns)
      if (j !== undefined) {
        bbc.store.addBit(out, j)
      }
    }
    return out
  }

  setRange (bb, y, left, right, mode = 'or') {
    for (let x = left; x <= right; x++) {
      const shifted = this.bitMask(x, y)
      if (mode === 'or') {
        bb |= shifted
      } else if (mode === 'and') {
        bb &= shifted
      } else if (mode === 'xor') {
        bb ^= shifted
      } else if (mode === 'copy') {
        bb = (bb & ~shifted) | shifted
      }
    }
    return bb
  }

  static getInstance (radius) {
    if (cache.has(radius)) {
      return cache.get(radius)
    }

    const cube = new CubeIndex(radius)
    cache.set(radius, cube)
    return cube
  }
}
