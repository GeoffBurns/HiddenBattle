export function shiftBoardUp (mask, width) {
  let rows = 0
  while (mask !== 0n && (mask & ((1n << BigInt(width)) - 1n)) === 0n) {
    mask >>= BigInt(width)
    rows++
  }
  return { mask, rows }
}
export function shiftBoardLeft (mask, width, height) {
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

export function normalizeBitboard (mask, width, height) {
  const { mask: up } = shiftBoardUp(mask, width)
  return shiftBoardLeft(up, width, height)
}

export function expandToSquare (src, h, w) {
  if (h === w) return src
  const N = Math.max(h, w)
  let dst = 0n

  const rowMask = (1n << BigInt(w)) - 1n

  for (let y = 0; y < h; y++) {
    const row = (src >> BigInt(y * w)) & rowMask
    dst |= row << BigInt(y * N)
  }
  return dst
}

function rectToSquareBitboard (bb, h, w) {
  const N = Math.max(h, w)
  let out = 0n
  const rowMask = (1n << BigInt(w)) - 1n

  for (let r = 0; r < h; r++) {
    const row = (bb >> BigInt(r * w)) & rowMask
    out |= row << BigInt(r * N)
  }

  return out
}

function ctz (x) {
  let n = 0
  while ((x & 1n) === 0n) {
    x >>= 1n
    n++
  }
  return n
}

function msbIndex (x) {
  let n = -1
  while (x > 0n) {
    x >>= 1n
    n++
  }
  return n
}
export function normalizeUpLeft (bb, h, w) {
  if (bb === 0n) return bb

  var { minRow, minCol } = boundingBox(w, h, bb)

  return shiftTo(w, minRow, h, bb, minCol)
}

function shiftTo (w, minRow, h, bb, minCol) {
  let out = 0n
  let dstRow = 0
  const rowMask = (1n << BigInt(w)) - 1n
  for (let r = minRow; r < h; r++) {
    const row = (bb >> BigInt(r * w)) & rowMask
    if (row === 0n) continue

    const shifted = row >> BigInt(minCol)
    out |= shifted << BigInt(dstRow * w)
    dstRow++
  }
  return out
}

function boundingBox (w, h, bb) {
  const rowMask = (1n << BigInt(w)) - 1n

  let minRow = h
  let minCol = w

  // Pass 1: find bounding box
  for (let r = 0; r < h; r++) {
    const row = (bb >> BigInt(r * w)) & rowMask
    if (row === 0n) continue

    minRow = Math.min(minRow, r)

    // find leftmost bit in this row
    const col = ctz(row)
    minCol = Math.min(minCol, col)
  }
  return { minRow, minCol }
}

function extractBoundingBox (bb, h, w) {
  if (bb === 0n) return { bb: 0n, h: 0, w: 0 }

  const rowMask = (1n << BigInt(w)) - 1n

  let minRow = h,
    maxRow = -1
  let minCol = w,
    maxCol = -1

  for (let r = 0; r < h; r++) {
    const row = (bb >> BigInt(r * w)) & rowMask
    if (row === 0n) continue

    minRow = Math.min(minRow, r)
    maxRow = Math.max(maxRow, r)
    minCol = Math.min(minCol, ctz(row))
    maxCol = Math.max(maxCol, msbIndex(row))
  }

  const newH = maxRow - minRow + 1
  const newW = maxCol - minCol + 1

  let out = 0n
  let dstRow = 0

  for (let r = minRow; r <= maxRow; r++) {
    const row = ((bb >> BigInt(r * w)) & rowMask) >> BigInt(minCol)

    out |= row << BigInt(dstRow * newW)
    dstRow++
  }

  return { bb: out, h: newH, w: newW }
}
