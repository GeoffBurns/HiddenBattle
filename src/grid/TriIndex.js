import { Actions } from './actions.js'
import { Indexer } from './indexer.js'
export class TriIndex extends Indexer {
  constructor (side) {
    const size = (side * (side + 1)) / 2
    super(size)
    this.side = side
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
}
