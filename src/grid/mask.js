import { popcountBigInt } from './placeTools.js'
import { lazy } from '../utilities.js'
import { MaskBase } from './MaskBase.js'
import { Actions } from './actions.js'

export class Mask extends MaskBase {
  constructor (width, height, bits = 0n) {
    super(width, height, 1)
    this.bits = bits
  }

  bitPos (x, y) {
    return BigInt(y * this.width + x)
  }
  set (x, y) {
    this.bits |= 1n << this.index(x, y)
    return this.bits
  }
  get actions () {
    if (this._actions && this._actions?.original?.bits === this.bits) {
      return this._actions
    }
    this._actions = new Actions(this.width, this.height, this)
    return this._actions
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
