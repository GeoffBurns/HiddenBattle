import { SpecialVariant } from './SpecialVariant.js'

export class Variant3 extends SpecialVariant {
  constructor (full, subGroups, symmetry) {
    super(symmetry)

    this.subGroups = subGroups || []

    const [head, ...tail] = subGroups
    this.standardGroup = head
    this.specialGroups = tail
    this.buildCell3(symmetry, full)
  }

  static setBehaviour = SpecialVariant.setBehaviourTo
}
