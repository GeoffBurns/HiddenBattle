const BIT_INDEX = (() => {
  const index = new Map()
  for (let i = 0; i < 256; i++) index.set(1n << BigInt(i), i)
  return index
})()

function lsbIndex (b) {
  return BIT_INDEX.get(b)
}
function lsbIndexBig (b) {
  return Math.log2(Number(b))
}

export function* bits (bb) {
  while (bb) {
    const lsb = bb & -bb
    const i = lsbIndex(lsb)
    yield i
    bb ^= lsb
  }
}
export function* bitsBig (bb) {
  while (bb) {
    const lsb = bb & -bb
    const i = lsbIndexBig(lsb)
    yield i
    bb ^= lsb
  }
}

export function* bitsSafe (bb, size) {
  const lsbIdx = size > 256 ? lsbIndexBig : lsbIndex
  while (bb) {
    const lsb = bb & -bb
    const i = lsbIdx(lsb)
    yield i
    bb ^= lsb
  }
}

function emptyBB () {
  return 0n
}
const ONE = 1n

function setBit (bb, i) {
  return bb | (ONE << BigInt(i))
}
function hasBit (bb, i) {
  return (bb >> BigInt(i)) & 1n
}
