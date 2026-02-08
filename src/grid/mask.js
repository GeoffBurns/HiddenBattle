import { MaskBase } from './MaskBase.js'

export class Mask extends MaskBase {
  constructor (width, height, bits = 0n) {
    super(width, height, 1)
    this.bits = bits
  }

  get actions () {
    return this.indexer?.actions(this)
  }

  get occupacy () {
    return this.store.occupacy(this.bits)
  }
  set (x, y, color = 1) {
    const forloc = this.for(x, y)
    this.bits = forloc.set(color)
    return this.bits
  }
  at (x, y) {
    return this.for(x, y).at()
  }
  test (x, y, color = 1) {
    return this.for(x, y).test(color)
  }
  clear (x, y) {
    return this.set(x, y, 0)
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
    if (this.store.value(this.bits, this.store.bitPos(start))) return

    const stack = [[sx, sy]]

    while (stack.length) {
      const [x, y] = stack.pop()
      if (!this.indexer.isValid(x, y)) continue
      if (this.at(x, y)) continue

      let left = x
      let right = x

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
    this.bits = this.bitsFromCoords(coords)
  }

  bitsFromCoords (coords) {
    let bits = this.store.empty
    for (const [x, y] of coords) {
      if (this.indexer.isValid(x, y)) {
        bits = this.store.addBit(bits, this.index(x, y))
      }
    }
    return bits
  }

  *bitsIndices () {
    yield* this.indexer.bitsIndices(this.bits)
  }

  *bitKeys () {
    yield* this.indexer.bitKeys(this.bits)
  }
  get toCoords () {
    const coords = []
    for (const [x, y] of this.bitKeys()) {
      coords.push([x, y])
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
