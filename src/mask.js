import { popcountBigInt } from './placeTools.js'
import { lazy } from './utilities.js'

function* bresenhamSteps (x0, y0, dx, dy, sx, sy, width, height) {
  let err = dx - dy

  while (x0 >= 0 && x0 < width && y0 >= 0 && y0 < height) {
    yield [x0, y0]

    const e2 = 2 * err

    if (e2 > -dy) {
      err -= dy
      x0 += sx
    }
    if (e2 < dx) {
      err += dx
      y0 += sy
    }
  }
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

export function coordsToZMasks (coords, width, height) {
  const masks = new Map()

  for (const [x, y, z] of coords) {
    if (x < 0 || x >= width || y < 0 || y >= height) continue

    const bit = 1n << BigInt(y * width + x)

    if (!masks.has(z)) {
      masks.set(z, 0n)
    }

    masks.set(z, masks.get(z) | bit)
  }

  return masks
}

export class Mask {
  constructor (width, height) {
    this.width = width
    this.height = height
    this.bits = 0n
    lazy(this, 'transformMaps', () => {
      return buildTransformMaps(this.width, this.height)
    })
  }

  index (x, y) {
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

  applyMap (map) {
    let out = 0n
    let b = this.bits

    while (b !== 0n) {
      const lsb = b & -b
      const i = Number(lsb.toString(2).length - 1)
      out |= 1n << BigInt(map[i])
      b ^= lsb
    }
    return out
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
    const imgs = this.orbit(maps)
    const set = new Set(imgs.map(b => b.toString()))
    const k = set.size

    if (k === 1) return 'D4'

    if (k === 2) {
      if (this.applyMap(maps.r90) === this.bits) return 'C4'
      return 'V4 (diagonal Klein four)'
    }

    if (k === 4) {
      if (this.applyMap(maps.r180) === b) return 'C2 (half-turn)'
      return 'C2 (single mirror)'
    }

    return 'C1'
  }

  rowMask (y, x0, x1) {
    const start = BigInt(y * this.width + x0)
    const size = BigInt(x1 - x0 + 1)
    return ((1n << size) - 1n) << start
  }

  setRange (r, c0, c1) {
    this.bits |= this.rowMask(r, c0, c1)
  }
  setRanges (ranges) {
    for (const [r, c0, c1] of ranges) {
      this.setRange(r, c0, c1)
    }
  }
  clearRange (r, c0, c1) {
    this.bits &= ~this.rowMask(r, c0, c1)
  }
  clearRanges (ranges) {
    for (const [r, c0, c1] of ranges) {
      this.clearRange(r, c0, c1)
    }
  }

  blit (src, srcX, srcY, width, height, dstX, dstY, mode = 'copy') {
    for (let r = 0; r < height; r++) {
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
      if (this.get(x, y)) continue

      let left = x
      let right = x

      while (left > 0 && !this.get(left - 1, y)) left--
      while (right + 1 < this.width && !this.get(right + 1, y)) right++

      this.setRange(y, left, right)

      for (let i = left; i <= right; i++) {
        if (y > 0 && !this.get(i, y - 1)) stack.push([i, y - 1])
        if (y + 1 < this.height && !this.get(i, y + 1)) stack.push([i, y + 1])
      }
    }
  }
  get toAscii () {
    let out = ''
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        out += this.get(x, y) ? '#' : '.'
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

  drawSegment = function (x0, y0, x1, y1) {
    let dx = Math.abs(x1 - x0)
    let dy = Math.abs(y1 - y0)

    let sx = x0 < x1 ? 1 : -1
    let sy = y0 < y1 ? 1 : -1

    let err = dx - dy

    while (true) {
      this.set(x0, y0)
      if (x0 === x1 && y0 === y1) break
      const e2 = 2 * err
      if (e2 > -dy) {
        err -= dy
        x0 += sx
      }
      if (e2 < dx) {
        err += dx
        y0 += sy
      }
    }
  }
  drawRay = function (x0, y0, dxDir, dyDir) {
    const dx = Math.abs(dxDir)
    const dy = Math.abs(dyDir)
    const sx = Math.sign(dxDir)
    const sy = Math.sign(dyDir)

    for (const [x, y] of bresenhamSteps(
      x0,
      y0,
      dx,
      dy,
      sx,
      sy,
      this.width,
      this.height
    )) {
      this.set(x, y)
    }
  }
  get fullBits () {
    return (1n << BigInt(this.width * this.height)) - 1n
  }
  get invertedBits () {
    return this.fullBits & ~this.bits
  }
  get fullMask () {
    const mask = this.newBlank
    mask.bits = this.fullBits
    return mask
  }

  get emptyMask () {
    return new Mask(this.width, this.height)
  }
  get invertedMask () {
    const mask = this.newBlank
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
      top |= 1n << this.idx(x, 0)
      bottom |= 1n << this.idx(x, this.height - 1)
    }

    // left & right columns
    for (let y = 0; y < this.height; y++) {
      left |= 1n << this.idx(0, y)
      right |= 1n << this.idx(this.width - 1, y)
    }
    return { left, right, top, bottom }
  }

  drawLineInfinite = function (x0, y0, dxDir, dyDir) {
    this.drawRay(x0, y0, dxDir, dyDir)
    this.drawRay(x0, y0, -dxDir, -dyDir)
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
      mask |= 1n << this.idx(x, 1)
      mask |= 1n << this.idx(x, this.height - 2)
    }

    // x = 1 and x = w-2
    for (let y = 2; y < this.height - 2; y++) {
      mask |= 1n << this.idx(1, y)
      mask |= 1n << this.idx(this.width - 2, y)
    }
    return mask
  }
  innerAreaMask = function () {
    return this.bits & ~this.innerBorderMask()
  }
  createPieSegment (
    sourceX,
    sourceY,
    directionX,
    directionY,
    radius,
    spreadDeg
  ) {
    let mask = 0n

    // Normalize direction
    const dLen = Math.hypot(directionX, directionY)
    if (dLen === 0) return 0n

    const dxDir = directionX / dLen
    const dyDir = directionY / dLen

    const cosLimit = Math.cos((spreadDeg * Math.PI) / 180)
    const r2 = radius * radius

    // Bounding box (tight)
    const minX = Math.max(0, sourceX - radius)
    const maxX = Math.min(this.width - 1, sourceX + radius)
    const minY = Math.max(0, sourceY - radius)
    const maxY = Math.min(this.height - 1, sourceY + radius)

    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        const dx = x - sourceX
        const dy = y - sourceY

        const dist2 = dx * dx + dy * dy
        if (dist2 === 0 || dist2 > r2) continue

        const invLen = 1 / Math.sqrt(dist2)
        const nx = dx * invLen
        const ny = dy * invLen

        const dot = nx * dxDir + ny * dyDir
        if (dot < cosLimit) continue

        mask |= 1n << BigInt(y * this.width + x)
      }
    }

    return mask
  }
}
