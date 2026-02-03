import { popcountBigInt } from './placeTools.js'
import { lazy } from './utilities.js'
import { MaskBase } from './MaskBase.js'

function shiftBoardUp (mask, width) {
  let rows = 0
  while (mask !== 0n && (mask & ((1n << BigInt(width)) - 1n)) === 0n) {
    mask >>= BigInt(width)
    rows++
  }
  return { mask, rows }
}

function shiftBoardLeft (mask, width, height) {
  let colShift = width

  for (let y = 0; y < height; y++) {
    const row = (mask >> BigInt(y * width)) & ((1n << BigInt(width)) - 1n)
    if (row !== 0n) {
      const tz =
        row.toString(2).length - row.toString(2).replace(/^0+/, '').length
      colShift = Math.min(colShift, tz)
    }
  }

  if (colShift === 0) return mask

  let out = 0n
  for (let y = 0; y < height; y++) {
    const row = (mask >> BigInt(y * width)) & ((1n << BigInt(width)) - 1n)
    out |= (row >> BigInt(colShift)) << BigInt(y * width)
  }

  return out
}

function normalizeBitboard (mask, width, height) {
  const { mask: up } = shiftBoardUp(mask, width)
  return shiftBoardLeft(up, width, height)
}

function buildTransformMaps (W, H) {
  const size = W * H

  const maps = {
    id: new Array(size),
    r90: new Array(size),
    r180: new Array(size),
    r270: new Array(size),
    fx: new Array(size),
    fy: new Array(size),
    fd1: new Array(size),
    fd2: new Array(size)
  }

  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = y * W + x

      // identity
      maps.id[i] = i

      // rotations
      maps.r90[i] = x * H + (H - 1 - y)
      maps.r180[i] = (H - 1 - y) * W + (W - 1 - x)
      maps.r270[i] = (W - 1 - x) * H + y

      // reflections
      maps.fx[i] = y * W + (W - 1 - x) // vertical
      maps.fy[i] = (H - 1 - y) * W + x // horizontal
      maps.fd1[i] = x * W + y // main diagonal
      maps.fd2[i] = (W - 1 - x) * W + (H - 1 - y) // other diagonal
    }
  }
  return maps
}

export class Mask extends MaskBase {
  constructor (width, height) {
    super(width, height, 1)
    lazy(this, 'transformMaps', () => {
      return buildTransformMaps(this.width, this.height)
    })
  }

  bitPos (x, y) {
    return BigInt(y * this.width + x)
  }
  set (x, y) {
    this.bits |= 1n << this.index(x, y)
  }
  clear (x, y) {
    this.bits &= ~(1n << this.index(x, y))
  }
  test (x, y) {
    return (this.bits & (1n << this.index(x, y))) !== 0n
  }

  get size () {
    return popcountBigInt(this.bits)
  }
  shiftedFullUp (bits) {
    const b = bits === undefined ? this.bits : bits

    return shiftBoardUp(b, this.width)
  }
  shiftedFullLeft (bits) {
    const b = bits === undefined ? this.bits : bits

    const out = shiftBoardLeft(b, this.width, this.height)
    return out
  }
  normalized (bits) {
    const b = bits === undefined ? this.bits : bits
    const { mask: up } = this.shiftedFullUp(b)
    return this.shiftedFullLeft(up)
  }
  normalize (bits) {
    const b = bits === undefined ? this.bits : bits
    this.bits = this.normalized(b)
  }
  applyMap (map) {
    let out = 0n
    let b = this.bits

    while (b !== 0n) {
      const lsb = b & -b
      const i = Number(lsb.toString(2).length - 1)
      out |= 1n << BigInt(map[i])
      b ^= lsb
    }
    return this.normalized(out)
  }

  orbit (maps) {
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
    const b = this.bits
    const k = this.order
    if (k === 8) return 'D4'
    if (k === 4) {
      if (this.applyMap(maps.r90) === this.bits) return 'C4'
      return 'V4 (diagonal Klein four)'
    }
    if (k === 2) {
      if (this.applyMap(maps.r180) === b) return 'C2 (half-turn)'
      return 'C2 (single mirror)'
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

  blit (src, srcX, srcY, width, height, dstX, dstY, mode = 'copy') {
    for (let r = 0; r < height; r++) {
      //      TypeError: src.sliceRow is not a function
      const rowBits = src.sliceRow(srcY + r, srcX, srcX + width - 1)

      const dstStart = BigInt((dstY + r) * this.width + dstX)

      const shifted = rowBits << dstStart
      const mask = ((1n << BigInt(width)) - 1n) << dstStart

      if (mode === 'copy') {
        this.bits = (this.bits & ~mask) | shifted
      } else if (mode === 'or') {
        this.bits |= shifted
      } else if (mode === 'and') {
        this.bits &= shifted
      } else if (mode === 'xor') {
        this.bits ^= shifted
      }
    }
  }
  floodFill (sx, sy) {
    const start = this.index(sx, sy)
    if ((this.bits >> start) & 1n) return

    const stack = [[sx, sy]]

    while (stack.length) {
      const [x, y] = stack.pop()
      if (x < 0 || y < 0 || x >= this.width || y >= this.height) continue
      if (this.at(x, y)) continue

      let left = x
      let right = x
      //TypeError: this.get is not a functionJest
      while (left > 0 && !this.at(left - 1, y)) left--
      while (right + 1 < this.width && !this.at(right + 1, y)) right++

      this.setRange(y, left, right)

      for (let i = left; i <= right; i++) {
        if (y > 0 && !this.at(i, y - 1)) stack.push([i, y - 1])
        if (y + 1 < this.height && !this.at(i, y + 1)) stack.push([i, y + 1])
      }
    }
  }
  get toAscii () {
    let out = ''
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        out += this.at(x, y) ? '#' : '.'
      }
      out += '\n'
    }
    return out
  }
  fromCoords (coords) {
    this.bits = 0n

    for (const [x, y] of coords) {
      if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
        this.bits |= 1n << this.index(x, y)
      }
    }
  }
  get toCoords () {
    const coords = []
    let bits = this.bits

    while (bits !== 0n) {
      // isolate lowest set bit
      const lsb = bits & -bits

      // index of that bit
      const i = lsb.toString(2).length - 1

      const x = i % this.width
      const y = Math.floor(i / this.width)

      coords.push([x, y])

      // clear lowest set bit
      bits ^= lsb
    }

    return coords
  }

  get fullMask () {
    const mask = this.emptyMask
    mask.bits = this.fullBits
    return mask
  }

  get emptyMask () {
    return new Mask(this.width, this.height)
  }
  get invertedMask () {
    const mask = this.emptyMask
    mask.bits = this.invertedBits
    return mask
  }
  edgeMasks = function () {
    let left = 0n,
      right = 0n,
      top = 0n,
      bottom = 0n

    // top & bottom rows
    for (let x = 0; x < this.width; x++) {
      top |= 1n << this.bitPos(x, 0)
      bottom |= 1n << this.bitPos(x, this.height - 1)
    }

    // left & right columns
    for (let y = 0; y < this.height; y++) {
      left |= 1n << this.bitPos(0, y)
      right |= 1n << this.bitPos(this.width - 1, y)
    }
    return { left, right, top, bottom }
  }
  outerBorderMask = function () {
    const { left, right, top, bottom } = this.edgeMasks()
    return left | right | top | bottom
  }
  outerAreaMask () {
    return this.fullBits & ~this.bits & ~this.outerBorderMask()
  }
  innerBorderMask = function () {
    let mask = 0n

    // y = 1 and y = h-2
    for (let x = 1; x < this.width - 1; x++) {
      mask |= 1n << this.bitPos(x, 1)
      mask |= 1n << this.bitPos(x, this.height - 2)
    }

    // x = 1 and x = w-2
    for (let y = 2; y < this.height - 2; y++) {
      mask |= 1n << this.bitPos(1, y)
      mask |= 1n << this.bitPos(this.width - 2, y)
    }
    return mask
  }
  innerAreaMask = function () {
    return this.bits & ~this.innerBorderMask()
  }
}
