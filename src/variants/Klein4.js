import { flip, rotate, rotate3, flip3, rf3 } from './normalize.js'
import { FlippableVariant } from './FlippableVariant.js'
import { makeCell3 } from './makeCell3.js'

export class Klein4 extends FlippableVariant {
  constructor (cells, validator, zoneDetail, variants) {
    super(validator, zoneDetail, 'A')
    this.list = variants || Klein4.variantsOf(cells)
  }

  static variantsOf (cells) {
    let flipped = flip(cells)
    return [cells, rotate(cells), flipped, rotate(flipped)]
  }

  static setBehaviour = FlippableVariant.setBehaviour.bind(null, Klein4)

  static cell3 (full, subGroups) {
    const unrotated = makeCell3(full, subGroups)
    return [unrotated, rotate3(unrotated), flip3(unrotated), rf3(unrotated)]
  }

  variant () {
    return this.list[this.index]
  }

  static r = idx => (idx > 1 ? 2 : 0) + (idx % 2 === 0 ? 1 : 0)
  static f = idx => (idx > 1 ? 0 : 2) + (idx % 2)
  static rf = idx => (idx > 1 ? 2 : 0) + (idx % 2 === 0 ? 1 : 0)
}
