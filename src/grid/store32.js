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
    const cpwShift = Math.log2(cellsPerWord)
    const words = Math.ceil(size / (32 / bitsPerCell))

    super(
      one,
      empty(words),
      toStoreType,
      depth,
      size,
      bitsPerCell,
      width,
      height
    )

    this.wordsPerRow = Math.ceil(width / cellsPerWord)
    this.cellsPerWord = cellsPerWord
    this.maxCellInWord = cellsPerWord - 1
    this.words = words
    this.cpwShift = cpwShift
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

  setRange (bb, i0, i1, color) {
    if (i0 >= i1) return bb
    color &= this.cellMask

    const { word: startWord, shift: startPos } = this.readRef(i0) // bounds check
    const startCell = startPos >> this.bShift

    const { word: endWord, shift: endPos } = this.readRef(i1)
    const endCell = endPos >> this.bShift

    // ---- single word case ----
    if (startWord === endWord) {
      return this.setRangeToWord(bb, startWord, startCell, endCell, color)
    }

    // ---- first partial word ----
    {
      bb = this.setRangeToWord(
        bb,
        startWord,
        startCell,
        this.maxCellInWord,
        color
      )
    }

    // ---- full words ----
    if (color === 0) {
      for (let w = startWord + 1; w < endWord; w++) {
        bb[w] = 0
      }
    } else {
      // replicate value across a full word
      let full = 0
      for (let i = 0; i < this.cellsPerWord; i++) {
        full |= color << this.cellShiftLeft(i)
      }

      for (let w = startWord + 1; w < endWord; w++) {
        bb[w] = full
      }
    }

    // ---- last partial word ----
    {
      bb = this.setRangeToWord(bb, endWord, 0, endCell + 1, color)
    }
    return bb
  }
  setRangeToWord (bb, word, startCell, endCell, color) {
    bb[word] = this.setRangeInWord(startCell, endCell, color, bb[word])
    return bb
  }

  setRangeInWord (startCell, endCell, color, word) {
    const numCells = endCell - startCell + 1
    const cellsSelectBMask = this.cellsSelectMask(startCell, numCells)
    const setMask = this.cellsSetMask(cellsSelectBMask, color)
    return (word & ~cellsSelectBMask) | setMask
  }
  cellsSetMask (cellsSelectBMask, color) {
    if (color === 0) return 0
    const unsigned = cellsSelectBMask >>> 0

    const oneRepeatMask = unsigned / this.cellMask
    const colorRepeatMask = oneRepeatMask * color
    // replicate value
    const setMask = colorRepeatMask & cellsSelectBMask
    return setMask
  }

  cellsSelectMask (startCell, numCells) {
    const shift = this.cellShiftLeft(startCell)
    const cellsSelectBMask = this.rowCellMask(numCells) << shift
    return cellsSelectBMask
  }

  cellShiftLeft (startCell) {
    return startCell << this.bShift
  }

  wordMasked (x0) {
    return x0 & this.maxCellInWord
  }

  wordShift (x0) {
    return x0 >>> this.cpwShift
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

function occupancy1Bit (src, W, H, bitsPerCell) {
  const cellsPerWord = 32 / bitsPerCell
  const cellMask = (1 << bitsPerCell) - 1

  const nCells = W * H
  const outWords = Math.ceil(nCells / 32)
  const out = new Uint32Array(outWords)

  let outBit = 0

  for (let i = 0; i < src.length; i++) {
    let w = src[i]
    for (let c = 0; c < cellsPerWord && outBit < nCells; c++) {
      if ((w & cellMask) !== 0) {
        out[outBit >>> 5] |= 1 << (outBit & 31)
      }
      w >>>= bitsPerCell
      outBit++
    }
  }
  return out
}
function empty (numWords) {
  return new Uint32Array(numWords)
}
function shiftBits (src, shift) {
  if (shift === 0) return src.slice()

  const words = src.length
  const out = new Uint32Array(words)

  const wordShift = shift >> 5
  const bitShift = shift & 31

  if (shift > 0) {
    for (let i = words - 1; i >= 0; i--) {
      let v = 0
      const s = i - wordShift
      if (s >= 0) {
        v = src[s] << bitShift
        if (bitShift && s - 1 >= 0) v |= src[s - 1] >>> (32 - bitShift)
      }
      out[i] = v
    }
  } else {
    const wShift = -wordShift
    const bShift = -shift & 31
    for (let i = 0; i < words; i++) {
      let v = 0
      const s = i + wShift
      if (s < words) {
        v = src[s] >>> bShift
        if (bShift && s + 1 < words) v |= src[s + 1] << (32 - bShift)
      }
      out[i] = v
    }
  }
  return out
}

function dilate1D_horizontal (bb, W, H, radius, masks) {
  const { notLeft, notRight } = masks

  let out = bb.slice()

  for (let r = 1; r <= radius; r++) {
    const left = shiftBits(out, -1)
    const right = shiftBits(out, +1)

    for (let i = 0; i < out.length; i++) {
      out[i] |= left[i] & notLeft[i]
      out[i] |= right[i] & notRight[i]
    }
  }
  return out
}

function dilate1D_vertical (bb, W, H, radius) {
  let out = bb.slice()

  for (let r = 1; r <= radius; r++) {
    const up = shiftBits(out, -W)
    const down = shiftBits(out, +W)

    for (let i = 0; i < out.length; i++) {
      out[i] |= up[i] | down[i]
    }
  }
  return out
}

function dilateSeparable (bb, W, H, radius, masks) {
  const h = dilate1D_horizontal(bb, W, H, radius, masks)
  const v = dilate1D_vertical(h, W, H, radius)
  return v
}
function rotateRowBits (src, W, H, shift) {
  const out = new Uint32Array(src.length)

  for (let y = 0; y < H; y++) {
    const rowStart = y * W
    for (let x = 0; x < W; x++) {
      const fromX = (x - (shift % W) + W) % W
      const from = rowStart + fromX
      const to = rowStart + x

      if ((src[from >>> 5] >>> (from & 31)) & 1) {
        out[to >>> 5] |= 1 << (to & 31)
      }
    }
  }
  return out
}

function dilate1D_horizontal_wrap (bb, W, H, radius) {
  let out = bb.slice()
  for (let r = 1; r <= radius; r++) {
    const left = rotateRowBits(out, W, H, -1)
    const right = rotateRowBits(out, W, H, +1)
    for (let i = 0; i < out.length; i++) {
      out[i] |= left[i] | right[i]
    }
  }
  return out
}
