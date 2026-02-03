import { MaskBase } from './MaskBase'
import { lazy } from './utilities.js'

function buildTransformMaps32 (W, H) {
  const m = {
    id: [],
    r90: [],
    r180: [],
    r270: [],
    fx: [],
    fy: [],
    fd1: [],
    fd2: []
  }

  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = y * W + x
      m.id[i] = i
      m.r90[i] = x * H + (H - 1 - y)
      m.r180[i] = (H - 1 - y) * W + (W - 1 - x)
      m.r270[i] = (W - 1 - x) * H + y
      m.fx[i] = y * W + (W - 1 - x)
      m.fy[i] = (H - 1 - y) * W + x
      m.fd1[i] = x * W + y
      m.fd2[i] = (W - 1 - x) * W + (H - 1 - y)
    }
  }
  return m
}

export class Packed extends MaskBase {
  constructor (width, height) {
    const words = Math.ceil((width * height) / 16)
    super(width, height, 2, new Uint32Array(words))
    this.words = words
    this.BW = 2
    this.BS = 2
    this.CM = (1 << this.BS) - 1
    this.MxC = (1 << this.BW) - 1
    this.MnC = 0
    lazy(this, 'transformMaps', () => {
      return buildTransformMaps32(this.width, this.height)
    })
  }
  index (x, y) {
    return y * this.width + x
  }

  // wordIndex = floor(cellIndex / 16)
  // bitOffset = (cellIndex % 16) * 2
  bitPos (x, y) {
    return y * this.BW * this.width + x
  }
  ref (x, y) {
    const pos = this.bitPos(x, y)
    return this.refFromPos(pos)
  }
  readRef (x, y) {
    const pos = this.bitPos(x, y)
    return this.readRefFromPos(pos)
  }

  setPos (pos, color) {
    const { boardIdx, mask, boardPos } = this.refFromPos(pos)
    this.bits[boardIdx] = this.setRef(boardIdx, mask, color, boardPos)
  }

  setRef (boardIdx, mask, color, boardPos) {
    return this.clearBoardBits(boardIdx, mask) | this.leftShift(color, boardPos)
  }
  //transformMap
  refFromPos (pos) {
    const { boardIdx, boardPos } = this.readRefFromPos(pos)
    const mask = this.bitMask(boardPos)
    return { boardIdx, mask, boardPos }
  }

  readRefFromPos (pos) {
    const boardIdx = pos >>> 4 // /16
    const boardPos = (pos & 15) << 1 // *2
    return { boardIdx, boardPos }
  }
  leftShift (color, boardPos) {
    return (color & this.CM) << boardPos
  }
  rightShift (color, boardPos) {
    return (color & this.CM) << boardPos
  }

  setMask (pos, color = 1) {
    return BigInt(color) << pos
  }

  clearBoardBits (idx, mask) {
    return this.bits[idx] & ~mask
  }

  bitMask (pos) {
    return this.CM << pos
  }
  getPos (pos) {
    const { boardIdx, boardPos } = this.readRefFromPos(pos)
    return this.getRef(boardIdx, boardPos)
  }
  getRef (boardIdx, boardPos) {
    return (this.bits[boardIdx] >>> boardPos) & this.CM
  }

  at (x, y) {
    const ref = this.readRef(x, y)
    return this.getRef(ref.boardIdx, ref.boardPos)
  }

  value (pos) {
    const { boardIdx, boardPos } = this.readRefFromPos(pos)
    return this.getRef(boardIdx, boardPos)
  }

  set (x, y, color = 1) {
    const { boardIdx, mask, boardPos } = this.ref(x, y)
    this.bits[boardIdx] = this.setRef(boardIdx, mask, color, boardPos)
  }

  testFor (x, y, color = 1) {
    return this.at(x, y) === color
  }

  isNonZero (x, y) {
    const { boardIdx, boardPos } = this.readRefFromPos(this.bitPos(x, y))
    return ((this.bits[boardIdx] >> boardPos) & this.CM) !== 0n
  }
}
/*


> hiddenbattle@1.0.0 test
> node --experimental-vm-modules node_modules/jest/bin/jest.js --runInBand --watchAll=false

 FAIL  src/selection.test.js
  ● Test suite failed to run

    ● Validation Error:
    
      Test environment jest-environment-jsdom cannot be found. Make sure the testEnvironment configuration option points to an existing node module.
    
      Configuration Documentation:
      https://jestjs.io/docs/configuration
    

    As of Jest 28 "jest-environment-jsdom" is no longer shipped by default, make sure to install it separately.

      
        Test environment jest-environment-jsdom cannot be found. Make sure the testEnvironment configuration option points to an existing node module.
      
        Configuration Documentation:
        https://jestjs.io/docs/configuration
      
      As of Jest 28 "jest-environment-jsdom" is no longer shipped by default, make sure to install it separately.

[baseline-browser-mapping] The data in this module is over two months old.  To ensure accurate Baseline data, please update: `npm i baseline-browser-mapping@latest -D`
 FAIL  src/packed.test.js
  ● Packed › ascii

    TypeError: Cannot mix BigInt and other types, use explicit conversions

      167 |     const board = this.bits
      168 |     const pos = BigInt((y * W + x) * 2)
    > 169 |     const v = Number((board >> pos) & this.CM)
          |                            ^
      170 |     row += symbols[v]
      171 |     return row
      172 |   }

      at Packed.asciiCell (src/MaskBase.js:169:28)
      at Packed.accCell [as forRow] (src/MaskBase.js:159:13)
      at Packed.forRow [as asciiRow] (src/MaskBase.js:152:16)
      at Packed.asciiRow [as forRows] (src/MaskBase.js:146:12)
      at Packed.forRows (src/MaskBase.js:138:10)
      at Object.toAscii (src/packed.test.js:94:14)

 PASS  src/variants.test.js
 PASS  src/utilities.test.js
 PASS  src/mask.test.js
 PASS  src/mask4.test.js
 PASS  src/maskShape.test.js
 PASS  src/maskConvert.test.js
 PASS  src/listCanvas.test.js
 PASS  src/hello.test.js

Test Suites: 2 failed, 8 passed, 10 total
Tests:       1 failed, 128 passed, 129 total
Snapshots:   0 total
Time:        1.62 s, estimated 2 s
Ran all test suites.

*/
