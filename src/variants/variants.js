import { CellsToBePlaced } from './CellsToBePlaced.js'
import { Placeable } from './Placeable.js'
import { shuffleArray } from '../utilities.js'
import { normalize } from './normalize.js'

export class Variants {
  constructor (validator, zoneDetail, symmetry) {
    if (new.target === Variants) {
      throw new Error(
        'base class cannot be instantiated directly. Please extend it.'
      )
    }
    this.list = []
    this.index = 0
    this.canFlip = false
    this.canRotate = false
    this.validator = validator
    this.onChange = Function.prototype
    this.zoneDetail = zoneDetail
    this.symmetry = symmetry
  }
  numVariants () {
    return this.list.length
  }
  variant (index) {
    return this.list[index || this.index]
  }
  special (_index) {
    return []
  }
  placeable (index) {
    return new Placeable(this.variant(index), this.validator, this.zoneDetail)
  }
  variations () {
    let variants0 = this.list
    return shuffleArray(variants0)
  }
  placeables () {
    let variants0 = this.variations()

    return variants0.map(v => new Placeable(v, this.validator, this.zoneDetail))
  }
  normalize (mr, mc) {
    return this.list.map(v => normalize(v, mr, mc))
  }

  height () {
    return Math.max(...this.cells.map(s => s[0]))
  }
  width () {
    return Math.max(...this.cells.map(s => s[1]))
  }
  setByIndex (index) {
    this.index = index
    this.onChange()
  }
  placingAt (r, c) {
    return new CellsToBePlaced(this.variant(), r, c, this.validator)
  }
}
