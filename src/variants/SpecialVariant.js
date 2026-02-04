import { shuffleArray } from '../utilities.js'
import { Placeable } from './Placeable.js'
import { Placeable3 } from './Placeable3.js'
import { RotatableVariant } from './RotatableVariant.js'
import { variantType } from './variantType.js'

export class SpecialVariant extends RotatableVariant {
  constructor (symmetry) {
    super(Function.prototype, 0, symmetry)
  }
  buildCell3 (symmetry, full) {
    const VariantType = variantType(symmetry)
    const cells = VariantType.cell3(
      full,
      this.specialGroups.map(g => g.cells)
    )
    this.list = cells
    this.specialGroups.forEach(g => {
      g.parent = this
    })
  }

  special (index, groupIndex = 1) {
    const idx = index || this.index
    return this.variant(idx)
      .filter(s => s[2] === groupIndex)
      .map(s => [s[0], s[1]])
  }

  placeable (index) {
    const idx = index || this.index
    return new Placeable3(
      super.placeable(idx),
      this.subGroups.map(
        (g, i) => new Placeable(this.special(idx, i), g.validator, g.zoneDetail)
      )
    )
  }
  static setBehaviourTo (v3, symmetry) {
    const VariantType = variantType(symmetry || this.symmetry)
    VariantType.setBehaviour(v3)
  }
  placeables () {
    return this.shuffledPlaceables()
  }

  shuffledPlaceables () {
    let shuffled
    switch (this.list.length) {
      case 8:
        shuffled = shuffleArray([0, 1, 2, 3, 4, 5, 6, 7])
        break
      case 4:
        shuffled = shuffleArray([0, 1, 2, 3])
        break
      case 2:
        shuffled = shuffleArray([0, 1])
        break
      case 1:
        shuffled = [0]
        break
      default:
        throw new Error('Unknown no of variants')
    }

    return shuffled.map(i => this.placeable(i))
  }
}
