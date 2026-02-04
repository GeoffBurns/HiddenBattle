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
