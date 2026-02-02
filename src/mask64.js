const BW = 2 // bit width
const CM = 0b11n // color mask
const MxC = 3 // max color
const MnC = 0 // min color
const BS = 2n // bit shift

function rot90 (i, N) {
  const x = i % N
  const y = Math.floor(i / N)
  return x * N + (N - 1 - y)
}

function flipH (i, N) {
  const x = i % N
  const y = Math.floor(i / N)
  return y * N + (N - 1 - x)
}

function flipV (i, N) {
  const x = i % N
  const y = Math.floor(i / N)
  return (N - 1 - y) * N + x
}

function transformMask (mask, N, fn) {
  let out = 0n
  for (let i = 0; i < N * N; i++) {
    if ((mask >> BigInt(i)) & 1n) {
      out |= 1n << BigInt(fn(i, N))
    }
  }
  return out
}
export class Mask64 {
  constructor (width, height) {
    this.width = width
    this.height = height
    this.bits = 0n
    this.layers = new BigUint64Array(MxC).fill(0n)
  }

  index (x, y) {
    return BigInt(y * this.width + x)
  }
  bitPos (x, y) {
    return BigInt(y * BW * this.width + x)
  }
  layerBit (x, y) {
    return 1n << this.index(x, y)
  }
  set (x, y, color) {
    const bit = this.layerBit(x, y)
    const pos = this.bitPos(x, y)

    this.bits = (this.bits & ~(CM << pos)) | (BigInt(color) << pos)

    this.layers.forEach((value, i, ly) => {
      ly[i] = value & ~bit
    })

    if (color === 1) this.layers[0] |= bit
    else if (color === 2) this.layers[1] |= bit
    else if (color === 3) this.layers[3] |= bit
  }

  at (x, y) {
    const pos = this.bitPos(x, y)
    return Number((this.bits >> pos) & CM)
  }

  check (color) {
    if (color < MnC || color > MxC) {
      throw new Error(`color must be ${MnC}..${MxC}`)
    }
  }

  isNonZero (x, y) {
    const pos = this.bitPos(x, y)
    return ((this.bits >> pos) & CM) !== 0n
  }

  testFor (x, y, color) {
    const bit = this.layerBit(x, y)
    if (color === 1) return (this.layers[0] & bit) !== 0n
    if (color === 2) return (this.layers[1] & bit) !== 0n
    if (color === 3) return (this.layers[2] & bit) !== 0n
    return false
  }

  get fullRowMask () {
    const W = this.width
    return (1n << BigInt(W)) - 1n
  }
  fullRowMaskAt (y) {
    const W = this.width
    return this.fullRowMask << BigInt(y * W)
  }

  rowMask (colorMask, y) {
    // const board = this.bits
    const W = this.width
    //  const H = this.height
    const rowBits = this.fullRowMaskAt(y)
    return (colorMask & rowBits) >> BigInt(y * W)
  }
  rowMask64 (colorMask, rowMasks, y) {
    // const board = this.bits
    const W = this.width
    return (colorMask & rowMasks[y]) >> BigInt(y * W)
  }

  colMask64 (colorMask, colMasks, x) {
    return colorMask & colMasks[x]
  }
  buildRowMasks () {
    const H = this.height
    const rows = []
    for (let y = 0; y < H; y++) {
      rows[y] = this.fullRowMaskAt(y)
    }
    return rows
  }
  buildColMasks () {
    const W = this.width
    const H = this.height
    const cols = []
    for (let x = 0; x < W; x++) {
      let m = 0n
      for (let y = 0; y < H; y++) {
        m |= this.layerBit(x, y)
      }
      cols[x] = m
    }
    return cols
  }

  canonical64 (N) {
    const transforms = [
      i => i,
      i => rot90(i, N),
      i => rot90(rot90(i, N), N),
      i => rot90(rot90(rot90(i, N), N), N),
      i => flipH(i, N),
      i => flipV(i, N),
      i => flipH(rot90(i, N), N),
      i => flipV(rot90(i, N), N)
    ]

    let best = null

    for (const f of transforms) {
      const a = transformMask(this.layers[0], N, f)
      const b = transformMask(this.layers[1], N, f)
      const c = transformMask(this.layers[2], N, f)

      const key = (a << 128n) | (b << 64n) | c
      if (best === null || key < best.key) {
        best = { key, m1: a, m2: b, m3: c }
      }
    }

    return best
  }
}
