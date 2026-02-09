import { bitsSafe } from './bitHelpers.js'

export class Indexer {
  constructor (size) {
    this.size = size
    this.checkInstantiation()
  }
  index () {
    throw new Error('index method in derived class must be implemented')
  }
  location () {
    throw new Error('location method in derived class must be implemented')
  }
  checkInstantiation () {
    if (new.target === Indexer) {
      throw new Error(
        'base class cannot be instantiated directly. Please extend it.'
      )
    }
  }
  set () {
    throw new Error('set method in derived class must be implemented')
  }

  isValid (x, y) {
    return x >= 0 && x < this.width && y >= 0 && y < this.height
  }
  *list (coords) {
    for (const point of coords) {
      const i = this.index(...point)
      if (i !== undefined) {
        yield i
      }
    }
  }

  bitsFromCoords (bbc, coords) {
    let bits = bbc.store.empty

    for (const i of this.list(coords)) {
      bbc.store.addBit(bits, i)
    }
    return bits
  }

  bitsToCoords (bb) {
    const coords = []
    for (const args of this.bitKeys(bb)) {
      coords.push(args)
    }
    return coords
  }

  *keys () {
    const n = this.size
    for (let i = 0; i < n; i++) {
      const lc = this.location(i)
      yield [...lc, i]
    }
  }
  *entries (bb) {
    for (const key of this.keys()) {
      yield [...key, bb.at(...key), bb]
    }
  }

  *values (bb) {
    for (const key of this.keys()) {
      yield bb.at(...key)
    }
  }
  *bitsIndices (bb) {
    yield* bitsSafe(bb, this.size)
  }

  *bitKeys (bb) {
    for (const i of this.bitsIndices(bb)) {
      const loc = this.location(i)
      yield [...loc, i]
    }
  }
}
