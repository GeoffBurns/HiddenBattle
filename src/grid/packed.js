import { MaskBase } from './MaskBase'
import { lazy } from '../utilities.js'
import { buildTransformMaps } from './buildTransformMaps.js'
import { Shape } from './Shape.js'
import { Store32 } from './store32.js'

export class Packed extends MaskBase {
  constructor (width, height, bits, store) {
    store = store || new Store32(4, width * height, 2, width, height)
    bits = bits || store.newWords()
    super(Shape.rectangle(width, height), 2, bits, store)
    this.words = store.words
    lazy(this, 'transformMaps', () => {
      return buildTransformMaps(this.width, this.height)
    })
  }

  get actions () {
    return this.indexer?.actions(this)
  }
  index (x, y) {
    return y * this.width + x
  }
  bitPos (x, y) {
    return this.store.bitPos(this.index(x, y))
  }

  readRef (x, y) {
    const i = this.index(x, y)
    return this.store.readRef(i)
  }

  setRange (r, c0, c1, color = 1) {
    this.bits = this.store.setRangeRow(this.bits, r, c0, c1, color)
  }
  clearRange (r, c0, c1) {
    this.setRange(r, c0, c1, 0)
  }

  normalize () {
    const data = this.bits
    const width = this.width
    const height = this.height
    this.bits = this.store.normalize(data, width, height)
  }

  at (x, y) {
    const idx = this.index(x, y)
    return this.store.getIdx(this.bits, idx)
  }

  set (x, y, color = 1) {
    this.bits = this.store.setIdx(this.bits, this.index(x, y), color)
  }

  testFor (x, y, color = 1) {
    return this.at(x, y) === color
  }

  isNonZero (x, y) {
    const idx = this.index(x, y)
    return this.store.isNonZero(this.bits, idx)
  }
}
