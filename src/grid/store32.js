import { StoreBase } from './storeBase.js'

function bitLength32 (n) {
  return 32 - Math.clz32(n)
}

const one = 1 >>> 0
const zero = 0 >>> 0
function toStoreType (value) {
  return value >>> 0
}
export class Store32 extends StoreBase {
  constructor (depth = 1, size = 0) {
    const bitLength = bitLength32(depth)
    const words = Math.ceil(size / (32 / bitLength))

    super(one, new Uint32Array(words), toStoreType, depth, size, bitLength)

    this.words = words
  }
  readRefFromIdx (idx) {
    const boardIdx = idx >>> 4 // /16
    const boardPos = (idx & 15) << 1 // *2
    return { boardIdx, boardPos }
  }
  get2 (bb, i) {
    const { boardIdx, boardPos } = this.readRefFromIdx(i)
    return this.getFromRef(bb, boardIdx, boardPos)
  }

  getFromRef (bb, boardIdx, boardPos) {
    return (bb[boardIdx] >>> boardPos) & this.CM
  }

  boundingBox (h, w, bb) {
    let minRow = h
    let minCol = w
    let found = false

    for (let r = 0; r < h; r++) {
      for (let c = 0; c < w; c++) {
        if (this.get2(bb, r * w + c) !== zero) {
          minRow = Math.min(minRow, r)
          minCol = Math.min(minCol, c)
          found = true
        }
      }
    }
    return { minRow, minCol, found }
  }
}
