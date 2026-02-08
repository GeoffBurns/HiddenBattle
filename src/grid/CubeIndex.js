import { bitsSafe } from './bitsHelpers.js'
import { ActionsHex } from './ActionsHex.js'
import { lazy } from '../utilities.js'
import { buildTransformHexMaps } from './buildTransformHexMaps.js'

const cache = new Map()

export class CubeIndex {
  constructor (radius) {
    this.radius = radius
    const { coords, qrsToI, qrToI, iToQrs, size } = this.buildCube(radius)

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

  buildCube (radius) {
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
  isValid (q, r, s) {
    return this.qrsToI.has(`${q},${r},${s}`)
  }

  *entries (bb) {
    for (const [[q, r, s], i] of this.qrsToI) {
      if (this.hasBit(bb, q, r, s)) {
        yield [q, r, s, bb.at(q, r, s), i, bb]
      }
    }
  }

  *values (bb) {
    for (const [q, r, s] of this.qrsToI) {
      yield bb.at(q, r, s)
    }
  }
  *bitsIndices (bb) {
    yield* bitsSafe(bb, this.size)
  }

  *bitKeys (bb) {
    for (const i of this.bitsIndices(bb)) {
      if (this.iToQrs.has(i)) {
        const [q, r, s] = this.iToQrs.get(i)
        yield [q, r, s, i]
      }
    }
  }
  get actions () {
    if (this._actions && this._actions?.original?.bits === this.bits) {
      return this._actions
    }
    this._actions = new ActionsHex(this.radius, this)
    return this._actions
  }
  addCoords (q, r, s) {
    const i = this.index(q, r, s)
    if (i !== undefined) {
      return 1n << BigInt(i)
    }
    return 0n
  }
  addCoordsSafe (q, r, s) {
    const i = this.index(q, r, s)
    if (i !== undefined) {
      return 1n << BigInt(i)
    }
    throw new Error(`Invalid coordinates: ${q},${r},${s}`)
  }

  addBit (bb, q, r, s) {
    const mask = this.bitMask(q, r, s)
    return bb | mask
  }
  bitMask (q, r, s) {
    const i = this.index(q, r, s)

    return this.bitMaskByIdx(i)
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

  applyOffset (bb, dq, dr) {
    let out = this.store.empty
    for (const i of this.bits(bb)) {
      const [q, r] = this.iToQrs.get(i)
      const nq = q + dq
      const nr = r + dr
      const ns = -nq - nr
      const j = this.index(nq, nr, ns)
      if (j !== undefined) {
        this.store.addBit(out, j)
      }
    }
    return out
  }
  applyTransform (bb, map) {
    let out = this.store.empty
    for (const i of this.bits(bb)) {
      this.store.addBit(out, map[i])
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
  bitsFromCoords (coords) {
    let bits = 0n

    for (const [q, r, s] of coords) {
      if (this.isValid(q, r, s)) {
        this.addBit(bits, q, r, s)
      }
    }
    return bits
  }

  bitsToCoords (bb) {
    const coords = []
    for (const [q, r, s] of this.bitKeys(bb)) {
      coords.push([q, r, s])
    }
    return coords
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
