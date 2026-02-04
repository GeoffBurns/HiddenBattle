import { lazy } from '../utilities.js'
import { buildTransformMaps } from './buildTransformMaps.js'
import { expandToSquare, normalizeUpLeft } from './gridHelpers.js'

export class Actions {
  constructor (width, height, mask = null) {
    this.width = Math.max(width, height)
    this.height = this.width
    this.original = mask
    lazy(this, 'transformMaps', () => {
      return buildTransformMaps(this.width, this.height)
    })
    lazy(this, 'template', () => {
      const square = expandToSquare(
        this.original.bits,
        this.original.height,
        this.original.width
      )
      return this.normalized(square)
    })
  }
  /*
  shiftedFullUp (bits) {
    const b = bits === undefined ? this.bits : bits

    return shiftBoardUp(b, this.width)
  }
  shiftedFullLeft (bits) {
    const b = bits === undefined ? this.bits : bits

    const out = shiftBoardLeft(b, this.width, this.height)
    return out
  }*/
  normalized (bits) {
    const b = bits === undefined ? this.template : bits
    return normalizeUpLeft(b, this.width, this.height)
  }

  applyMap (map = this.transformMaps.id) {
    let out = 0n
    let b = this.template

    while (b !== 0n) {
      const lsb = b & -b
      const i = Number(lsb.toString(2).length - 1)
      out |= 1n << BigInt(map[i])
      b ^= lsb
    }
    return this.normalized(out)
  }

  orbit (maps = this.transformMaps) {
    return [
      this.applyMap(maps.id),
      this.applyMap(maps.r90),
      this.applyMap(maps.r180),
      this.applyMap(maps.r270),
      this.applyMap(maps.fx),
      this.applyMap(maps.fy),
      this.applyMap(maps.fd1),
      this.applyMap(maps.fd2)
    ]
  }
  classifySymmetry () {
    const maps = this.transformMaps
    const b = this.template
    const k = this.order
    if (k === 8) return 'D4'
    if (k === 4) {
      if (this.applyMap(maps.r180) === b) return 'V4' // (diagonal Klein four)'
      return 'C4'
    }
    if (k === 2) {
      if (
        this.applyMap(maps.r90) === this.applyMap(maps.fx) &&
        this.applyMap(maps.r90) === this.applyMap(maps.fy)
      )
        return 'C2F' // (single mirror)'

      return 'C2R' // (half-turn)'
    }
    return 'C1'
  }

  get order () {
    const ss = this.symmetries
    const k = ss.length
    return k
  }

  get symmetries () {
    const maps = this.transformMaps
    const imgs = this.orbit(maps)
    const unique = [...new Set(imgs)]
    return unique
  }
}
