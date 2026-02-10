import { lazy } from '../utilities.js'
import { CubeIndex } from './CubeIndex.js'
import { normalizeHexShape } from './gridHexHelpers.js'
///import { pop } from './bitHelpers.js'

export class ActionsHex {
  constructor (radius, mask = null) {
    this.radius = radius
    this.width = 2 * this.radius + 1
    this.height = this.width
    this.original = mask
    this.size = this.original?.cube?.size || 0
    this.transformMaps = lazy(this, 'cube', () => {
      return CubeIndex.getInstance(this.radius)
    })

    lazy(this, 'template', () => {
      return this.normalized(this.original.bits)
    })
  }

  get store () {
    return this.original?.store
  }
  get indexer () {
    return this.original?.indexer
  }
  get transformMaps () {
    return this.original?.indexer?.transformMaps
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
  } */
  normalized (bits) {
    const b = bits === undefined ? this.template : bits
    return normalizeHexShape(b, this.width, this.height)
  }

  applyMap (map = this.transformMaps.id) {
    let out = 0n
    let b = this.template
    for (const i of this.cube.bits(b)) {
      this.store.addBit(out, map[i])
    }
    return this.normalized(out)
  }
  /*
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
    */
  static D6_NAMES = [
    'E',
    'R60',
    'R120',
    'R180',
    'R240',
    'R300',
    'F0',
    'F60',
    'F120',
    'F180',
    'F240',
    'F300'
  ]
  static D6_LABELS = [
    'identity',
    'rotate 60°',
    'rotate 120°',
    'rotate 180°',
    'rotate 240°',
    'rotate 300°',
    'reflect (axis 0°)',
    'reflect (axis 60°)',
    'reflect (axis 120°)',
    'reflect (axis 180°)',
    'reflect (axis 240°)',
    'reflect (axis 300°)'
  ]
  static SUBGROUPS = [
    { name: 'trivial', size: 1, test: m => m === 1 },
    { name: 'C2', size: 2, test: m => m === ((1 << 0) | (1 << 3)) },
    { name: 'C3', size: 3, test: m => m === ((1 << 0) | (1 << 2) | (1 << 4)) },
    { name: 'C6', size: 6, test: m => m === 0b00111111 },
    {
      name: 'D1',
      size: 2
      // test: m => pop(m) === 2 && has(m, 0) && hasReflection(m)
    },
    {
      name: 'D2',
      size: 4
      //,test: m => has(m, 3) && pop(m) === 4
    },
    {
      name: 'D3',
      size: 6
      //  test: m => has(m, 2) && has(m, 4) && hasReflection(m)
    },
    {
      name: 'D6',
      size: 12
      //, test: m => pop(m) === 12
    }
  ]
  classifyStabilizer (mask) {
    for (const g of ActionsHex.SUBGROUPS) {
      if (g.test(mask)) return g.name
    }
    return 'unknown'
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
