import { Actions } from './actions.js'
import { bitsSafe } from './bitHelpers.js'

export class TriIndex {
  constructor (side) {
    this.side = side
    this.size = (side * (side + 1)) / 2
  }
  index (r, c) {
    return (r * (r + 1)) / 2 + c
  }

  location (i) {
    const r = Math.floor((Math.sqrt(8 * i + 1) - 1) / 2)
    const c = i - (r * (r + 1)) / 2
    return [r, c]
  }

  isValid (r, c) {
    return r >= 0 && r < this.side && c >= 0 && c <= r
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
