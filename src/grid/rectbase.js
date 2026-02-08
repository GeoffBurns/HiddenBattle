import { RectIndex } from './RectIndex.js'

export class RectBase {
  constructor (width, height) {
    this.width = width
    this.height = height
    this.size = width * height
    this.indexer = new RectIndex(width, height)
    if (new.target === RectBase) {
      throw new Error(
        'base class cannot be instantiated directly. Please extend it.'
      )
    }
  }

  index (x, y) {
    return this.indexer.index(x, y)
  }

  get rowMax () {
    return this.width
  }
  location (index) {
    return this.indexer.location(index)
  }
  isValid (x, y) {
    return this.indexer.isValid(x, y)
  }

  *keys () {
    const n = this.size
    for (let i = 0; i < n; i++) {
      const lc = this.loc(i)
      yield [lc[0], lc[1], i]
    }
  }
}
