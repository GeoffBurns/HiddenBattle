import { flipV, rotate, flip3, rotate3 } from './normalize.js'
import { FlippableVariant } from './FlippableVariant.js'
import { makeCell3 } from './makeCell3.js'

export class Dihedral4 extends FlippableVariant {
  constructor (cells, validator, zoneDetail, variants) {
    super(validator, zoneDetail, 'D')
    this.list = variants || Dihedral4.variantsOf(cells)
  }
  static setBehaviour = FlippableVariant.setBehaviour.bind(null, Dihedral4)

  static variantsOf (cells) {
    let flipped = flipV(cells)

    let right = cells
    let left = flipped
    const rightList = [right]
    const leftList = [left]
    for (let i = 0; i < 3; i++) {
      right = rotate(right)
      rightList.push(right)
      left = rotate(left)
      leftList.push(left)
    }

    return rightList.concat(leftList)
  }
  static cell3 (full, subGroups) {
    const unrotated = makeCell3(full, subGroups)
    let flipped = flip3(unrotated)

    let right = unrotated
    let left = flipped
    const rightList = [right]
    const leftList = [left]
    for (let i = 0; i < 3; i++) {
      right = rotate3(right)
      rightList.push(right)
      left = rotate3(left)
      leftList.push(left)
    }

    return rightList.concat(leftList)
  }
  variant () {
    return this.list[this.index]
  }

  static r (idx) {
    return (idx > 3 ? 4 : 0) + (idx % 4 === 3 ? 0 : (idx + 1) % 4)
  }
  static f = idx => (idx > 3 ? 0 : 4) + (idx % 4)
  static rf = idx => (idx > 3 ? 4 : 0) + (idx % 4 === 0 ? 3 : (idx - 1) % 4)
}
