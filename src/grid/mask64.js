/*const BW = 2 // bit width
const CM = 0b11 // color mask
const MxC = 3 // max color
const MnC = 0 // min color
const BS = 2 // bit shift
*/
export function rot90 (i, N) {
  const x = i % N
  const y = Math.floor(i / N)
  return x * N + (N - 1 - y)
}

export function flipH (i, N) {
  const x = i % N
  const y = Math.floor(i / N)
  return y * N + (N - 1 - x)
}

export function flipV (i, N) {
  const x = i % N
  const y = Math.floor(i / N)
  return (N - 1 - y) * N + x
}

export function transformMask (mask, N, fn) {
  let out = 0n
  for (let i = 0; i < N * N; i++) {
    if ((mask >> BigInt(i)) & 1n) {
      out |= 1n << BigInt(fn(i, N))
    }
  }
  return out
}
/*
hiddenbattle@1.0.0 test
> node --experimental-vm-modules node_modules/jest/bin/jest.js --runInBand --watchAll=false

[baseline-browser-mapping] The data in this module is over two months old.  To ensure accurate Baseline data, please update: `npm i baseline-browser-mapping@latest -D`
 FAIL  src/mask64.test.js
  ● Mask64 › bitPos › should calculate bit position for 2-bit encoding

    expect(received).toBe(expected) // Object.is equality

    Expected: 2n
    Received: 1n

      37 |     it('should calculate bit position for 2-bit encoding', () => {
      38 |       expect(mask.bitPos(0, 0)).toBe(0n)
    > 39 |       expect(mask.bitPos(1, 0)).toBe(2n)
         |                                 ^
      40 |       expect(mask.bitPos(0, 1)).toBe(16n)
      41 |     })
      42 |   })

      at Object.toBe (src/mask64.test.js:39:33)

  ● Mask64 › at and set › should set and get color values

    TypeError: Cannot mix BigInt and other types, use explicit conversions

      66 |   at (x, y) {
      67 |     const pos = this.bitPos(x, y)
    > 68 |     return Number((this.bits >> pos) & CM)
         |                             ^
      69 |   }
      70 |
      71 |   check (color) {

      at Mask64.at (src/mask64.js:68:29)
      at Object.at (src/mask64.test.js:57:19)

  ● Mask64 › at and set › should support all valid colors

    TypeError: Cannot mix BigInt and other types, use explicit conversions

      61 |     if (color === 1) this.layers[0] |= bit
      62 |     else if (color === 2) this.layers[1] |= bit
    > 63 |     else if (color === 3) this.layers[3] |= bit
         |                                             ^
      64 |   }
      65 |
      66 |   at (x, y) {

      at Mask64.bit (src/mask64.js:63:45)
      at Object.set (src/mask64.test.js:61:24)

  ● Mask64 › at and set › should isolate colors in different cells

    TypeError: Cannot mix BigInt and other types, use explicit conversions

      53 |     const pos = this.bitPos(x, y)
      54 |
    > 55 |     this.bits = (this.bits & ~(CM << pos)) | (BigInt(color) << pos)
         |                           ^
      56 |
      57 |     this.layers.forEach((value, i, ly) => {
      58 |       ly[i] = value & ~bit

      at Mask64.set (src/mask64.js:55:27)
      at Object.set (src/mask64.test.js:67:24)

  ● Mask64 › at and set › should overwrite previous colors

    TypeError: Cannot mix BigInt and other types, use explicit conversions

      66 |   at (x, y) {
      67 |     const pos = this.bitPos(x, y)
    > 68 |     return Number((this.bits >> pos) & CM)
         |                             ^
      69 |   }
      70 |
      71 |   check (color) {

      at Mask64.at (src/mask64.js:68:29)
      at Object.at (src/mask64.test.js:74:19)

  ● Mask64 › isNonZero › should detect non-zero values

    TypeError: Cannot mix BigInt and other types, use explicit conversions

      77 |   isNonZero (x, y) {
      78 |     const pos = this.bitPos(x, y)
    > 79 |     return ((this.bits >> pos) & CM) !== 0n
         |                       ^
      80 |   }
      81 |
      82 |   testFor (x, y, color) {

      at Mask64.isNonZero (src/mask64.js:79:23)
      at Object.isNonZero (src/mask64.test.js:98:19)

  ● Mask64 › isNonZero › should distinguish zero from non-zero

    TypeError: Cannot mix BigInt and other types, use explicit conversions

      77 |   isNonZero (x, y) {
      78 |     const pos = this.bitPos(x, y)
    > 79 |     return ((this.bits >> pos) & CM) !== 0n
         |                       ^
      80 |   }
      81 |
      82 |   testFor (x, y, color) {

      at Mask64.isNonZero (src/mask64.js:79:23)
      at Object.isNonZero (src/mask64.test.js:103:19)

 PASS  src/maskConvert.test.js
 PASS  src/variants.test.js
 PASS  src/utilities.test.js
 PASS  src/mask4.test.js
 PASS  src/mask.test.js
 PASS  src/listCanvas.test.js
 PASS  src/maskShape.test.js
 PASS  src/hello.test.js

Test Suites: 1 failed, 8 passed, 9 total
Tests:       7 failed, 127 passed, 134 total
Snapshots:   0 total
Time:        1.388 s, estimated 3 s
Ran all test suites.


with the implementation (BigInt type mismatches). Let me check the actual implementation:
*/
/*
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
*/
