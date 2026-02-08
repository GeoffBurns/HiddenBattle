function translateShape (bb, dq, dr, hex) {
  let out = 0n
  forEachBit(bb, i => {
    const [q, r, s] = hex.coords[i]
    const nq = q + dq
    const nr = r + dr
    const ns = -nq - nr
    const j = hex.index.get(`${nq},${nr},${ns}`)
    if (j !== undefined) {
      out |= 1n << BigInt(j)
    }
  })
  return out
}

function applyTransform (bb, map) {
  let out = 0n
  forEachBit(bb, i => {
    out |= 1n << BigInt(map[i])
  })
  return out
}

//Rotation / reflection using D₆ transforms

// transforms[k][i] = index after transform k
// k = 0..5 rotations, 6..11 reflections

function normalized (bb, cube) {
  const cells = [...cube.bitKeys(bb)].map(([q, r, s]) => [q, r, s])
  const minQ = Math.min(...cells.map(c => c[0]))
  const minR = Math.min(...cells.map(c => c[1]))
  const minS = Math.min(...cells.map(c => c[2]))

  let normalizedBits = 0n
  for (const [q, r, s] of cells) {
    const nq = q - minQ
    const nr = r - minR
    const ns = s - minS
    cube.addBit(normalizedBits, nq, nr, ns)
  }
  return normalizedBits
}
function normalizeHexShape (cells) {
  let minQ = Infinity
  let minR = Infinity
  let minS = Infinity

  for (const [q, r, s] of cells) {
    if (
      q < minQ ||
      (q === minQ && r < minR) ||
      (q === minQ && r === minR && s < minS)
    ) {
      minQ = q
      minR = r
      minS = s
    }
  }

  return cells.map(([q, r, s]) => [q - minQ, r - minR, s - minS])
}
