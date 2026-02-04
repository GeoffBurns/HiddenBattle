import { Blinker } from './Blinker.js'
import { rotate, rotate3 } from './normalize.js'
import { FlippableVariant } from './FlippableVariant.js'
import { makeCell3 } from './makeCell3.js'

export class Diagonal extends FlippableVariant {
  constructor (cells, validator, zoneDetail, variants) {
    super(validator, zoneDetail, 'A')
    this.list = variants || Diagonal.variantsOf(cells)
  }

  static variantsOf (cells) {
    return [cells, rotate(cells)]
  }

  static setBehaviour (rotatable) {
    rotatable.canFlip = true
    rotatable.canRotate = true
    rotatable.r1 = Blinker.r
    rotatable.f1 = Blinker.r
    rotatable.rf1 = Blinker.r
  }

  static cell3 (full, subGroups) {
    const unrotated = makeCell3(full, subGroups)
    return [unrotated, rotate3(unrotated)]
  }

  variant () {
    return this.list[this.index]
  }
}
