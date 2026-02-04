import { FlippableVariant } from './FlippableVariant.js'
import { Klein4 } from './Klein4.js'

export class Cyclic4 extends FlippableVariant {
  constructor (cells, validator, zoneDetail, variants) {
    super(validator, zoneDetail)
    this.list = variants || Klein4.variantsOf(cells)
  }
  static variantsOf (cells) {
    // same variants as cyclic4, but different transitions  e.g. r,f,rf
    return Klein4.variantsOf(cells)
  }
  static cell3 (full, subGroups) {
    // same variants as cyclic4, but different transitions  e.g. r,f,rf
    return Klein4.cell3(full, subGroups)
  }

  static setBehaviour = FlippableVariant.setBehaviour.bind(null, Cyclic4)

  static r = idx => (idx + 1) % 4
  static f = idx => (idx + 2) % 4
  static rf = idx => (idx === 0 ? 3 : idx - 1)
}
