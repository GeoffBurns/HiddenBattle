import { Actions } from './actions.js'
import { Indexer } from './indexer.js'

export class RectIndex extends Indexer {
  constructor (width, height) {
    super(width * height)
    this.width = width
    this.height = height
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
      yield [...lc, i]
    }
  }
}
