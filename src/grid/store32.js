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
  constructor (depth = 2, size = 0, bitLength, width, height) {
    const bitsPerCell = bitLength || bitLength32(depth)
    const cellsPerWord = 32 / bitsPerCell
    const cellMask = (1 << bitsPerCell) - 1
    const cpwShift = Math.log2(cellsPerWord)
    const bShift = Math.log2(bitsPerCell)

    const words = Math.ceil(size / (32 / bitsPerCell))

    super(one, empty(words), toStoreType, depth, size, bitsPerCell)
    this.bitsPerCell = bitsPerCell
    this.width = width
    this.height = height
    this.wordsPerRow = Math.ceil(width / cellsPerWord)
    this.cellsPerWord = cellsPerWord
    this.maxCellInWord = cellsPerWord - 1
    this.cellMask = cellMask
    this.size = size

    this.words = words

    this.cpwShift = cpwShift
    this.bShift = bShift
  }

  newWords (numWords) {
    numWords = numWords || this.words
    return empty(numWords)
  }

  findRowBounds (bb, height) {
    height = height || this.height || Number.POSITIVE_INFINITY
    let minY = height
    let maxY = -1

    let wi = 0
    for (let y = 0; y < height; y++) {
      let rowOr = 0
      for (let i = 0; i < this.wordsPerRow; i++) {
        rowOr |= bb[wi + i]
      }
      if (rowOr !== 0) {
        minY = Math.min(minY, y)
        maxY = Math.max(maxY, y)
      }
      wi += this.wordsPerRow
    }

    return minY <= maxY ? { minY, maxY } : null
  }

  findColBounds (bb, minY, maxY, width) {
    width = width || this.width || Number.POSITIVE_INFINITY
    let minX = width
    let maxX = -1

    for (let y = minY; y <= maxY; y++) {
      const rowBase = y * this.wordsPerRow

      for (let w = 0; w < this.wordsPerRow; w++) {
        let word = bb[rowBase + w]
        if (!word) continue

        // scan set cells inside this word
        while (word) {
          const bit = word & -word // lowest set bit
          const cell = (w << this.cpwShift) + (Math.ctz32(bit) >> this.bShift)

          minX = Math.min(minX, cell)
          maxX = Math.max(maxX, cell)

          word ^= bit
        }
      }
    }

    return minX <= maxX ? { minX, maxX } : null
  }

  normalize (bb, width, height) {
    const rows = this.findRowBounds(bb, height)
    if (!rows) return this.newWords()

    const cols = this.findColBounds(bb, rows.minY, rows.maxY, width)

    const nw = cols.maxX - cols.minX + 1
    const nh = rows.maxY - rows.minY + 1

    const out = this.newWords()

    for (let y = 0; y < nh; y++) {
      for (let x = 0; x < nw; x++) {
        out.set(x, y, this.get(cols.minX + x, rows.minY + y))
      }
    }

    return out
  }

  getRef (bb, word, shift) {
    return this.rightShift(bb?.[word], shift)
  }

  getIdx (bb, i) {
    const ref = this.readRef(i)
    return this.getRef(bb, ref.word, ref.shift)
  }

  setIdx (bb, i, color) {
    const ref = this.ref(i)
    bb[ref.word] = this.setWordBits(bb[ref.word], ref.mask, ref.shift, color)
    return bb
  }

  isNonZero (bb, i) {
    const { word, shift } = this.readRef(i)
    return this.rightShift(bb?.[word], shift) !== 0
  }

  gettingMask (shift) {
    return this.cellMask << shift
  }
  ref (idx) {
    const { word, shift } = this.readRef(idx)
    const mask = this.gettingMask(shift)
    return { word, mask, shift }
  }

  readRef (idx) {
    const word = idx >>> this.cpwShift
    const shift = (idx & this.maxCellInWord) << this.bShift

    return { word, shift }
  }

  leftShift (color, shift) {
    return (color & this.cellMask) << shift
  }
  rightShift (color, shift) {
    return (color >>> shift) & this.cellMask
  }

  setWordBits (bw, mask, shift, color) {
    return this.clearBits(bw, mask) | this.leftShift(color, shift)
  }
  partialRowMask (numBits) {
    return (1 << numBits) - 1
  }
  rowCellMask (numCells) {
    // mask for `cells` contiguous cells starting at bit 0
    const bits = numCells * this.bitsPerCell
    return bits === 32 ? 0xffffffff : this.partialRowMask(bits)
  }

  setRangeRow (bb, y, x0, x1, value) {
    if (x0 >= x1) return bb
    value &= this.cellMask

    const rowBase = y * this.wordsPerRow

    const startWord = x0 >> this.cpwShift
    const endWord = (x1 - 1) >> this.cpwShift

    const startCell = x0 & this.maxCellInWord
    const endCell = (x1 - 1) & this.maxCellInWord

    // ---- single word case ----
    if (startWord === endWord) {
      const cells = endCell - startCell + 1
      const shift = startCell << this.bShift
      const m = this.rowCellMask(cells) << shift

      const fill = value === 0 ? 0 : (m / this.cellMask) * value // replicate value

      const wi = rowBase + startWord
      bb[wi] = (bb & ~m) | (fill & m)
      return
    }

    // ---- first partial word ----
    {
      const cells = this.cellsPerWord - startCell
      const shift = startCell << this.bShift
      const m = this.rowCellMask(cells) << shift

      const fill = value === 0 ? 0 : (m / this.mask) * value

      const wi = rowBase + startWord
      bb[wi] = (bb[wi] & ~m) | (fill & m)
    }

    // ---- full words ----
    if (value === 0) {
      for (let w = startWord + 1; w < endWord; w++) {
        bb[rowBase + w] = 0
      }
    } else {
      // replicate value across a full word
      let full = 0
      for (let i = 0; i < this.cellsPerWord; i++) {
        full |= value << (i << this.bShift)
      }

      for (let w = startWord + 1; w < endWord; w++) {
        bb[rowBase + w] = full
      }
    }

    // ---- last partial word ----
    {
      const cells = endCell + 1
      const m = this.cellMask(cells)

      const fill = value === 0 ? 0 : (m / this.mask) * value

      const wi = rowBase + endWord
      bb[wi] = (bb[wi] & ~m) | (fill & m)
    }
    return bb
  }

  clearBoardBits (bb, word, mask) {
    return bb[word] & ~mask
  }
  /*
  boundingBox (h, w, bb) {
    let minRow = h
    let minCol = w
    let found = false

    for (let r = 0; r < h; r++) {
      for (let c = 0; c < w; c++) {
        if (this.getIdx(bb, r * w + c) !== zero) {
          minRow = Math.min(minRow, r)
          minCol = Math.min(minCol, c)
          found = true
        }
      }
    }
    return { minRow, minCol, found }
  }
    */
}

function empty (numWords) {
  return new Uint32Array(numWords)
}
