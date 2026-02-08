import { Actions } from './actions.js'
import { bitsSafe } from './bitHelpers.js'

export class RectIndex {
  constructor (width, height) {
    this.width = width
    this.height = height
    this.size = width * height
  }
  index (x, y) {
    return y * this.width + x
  }
  location (i) {
    const x = i % this.width
    const y = Math.floor(i / this.width)
    return [x, y]
  }

  isValid (x, y) {
    return x >= 0 && x < this.width && y >= 0 && y < this.height
  }
  actions (bb) {
    if (this._actions && this._actions?.original?.bits === bb.bits) {
      return this._actions
    }
    this._actions = new Actions(this.width, this.height, bb)
    return this._actions
  }
  *keys () {
    const n = this.size
    for (let i = 0; i < n; i++) {
      const lc = this.location(i)
      yield [lc[0], lc[1], i]
    }
  }
  *entries (bb) {
    for (const [x, y, i] of this.keys()) {
      yield [x, y, i, bb.at(x, y), i, bb]
    }
  }

  *values (bb) {
    for (const [x, y] of this.keys()) {
      yield bb.at(x, y)
    }
  }
  *bitsIndices (bb) {
    yield* bitsSafe(bb, this.size)
  }

  *bitKeys (bb) {
    for (const i of this.bitsIndices(bb)) {
      const [x, y] = this.location(i)
      yield [x, y, i]
    }
  }
}
