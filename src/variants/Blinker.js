import { Invariant } from './Invariant.js'
import { RotatableVariant } from './RotatableVariant.js'
import { rotate, rotate3 } from './normalize.js'
import { makeCell3 } from './makeCell3.js'

export class Blinker extends RotatableVariant {
  constructor (cells, validator, zoneDetail, variants) {
    super(validator, zoneDetail)
    this.list = variants || Blinker.variantsOf(cells)
  }
  static variantsOf (cells) {
    return [cells, rotate(cells)]
  }

  static cell3 (full, subGroups) {
    const unrotated = makeCell3(full, subGroups)
    return [unrotated, rotate3(unrotated)]
  }
  static setBehaviour (rotatable) {
    rotatable.canFlip = false
    rotatable.canRotate = true
    rotatable.r1 = Blinker.r
    rotatable.f1 = Invariant.r
    rotatable.rf1 = Blinker.r
  }

  variant () {
    return this.list[this.index]
  }
  static r = idx => (idx === 0 ? 1 : 0)

  rotate () {
    this.setByIndex(this.r1(this.index))
  }

  leftRotate () {
    this.rotate()
  }
}
