import {
  CellsToBePlaced,
  Placeable,
  Placeable3,
  PlaceableW
} from './CellsToBePlaced.js'
import { parsePair, shuffleArray } from './utilities.js'
import { StandardCells, SpecialCells } from './ships/SubShape.js'
class Variants {
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

function minR (cells) {
  return Math.min(...cells.map(s => s[0]))
}
function minC (cells) {
  return Math.min(...cells.map(s => s[1]))
}

function normalize (cells, mr, mc) {
  const r0 = mr || minR(cells)
  const c0 = mc || minC(cells)
  return cells.map(([r, c]) => [r - r0, c - c0])
}

function normalize3 (cells) {
  const r0 = minR(cells)
  const c0 = minC(cells)
  return cells.map(([r, c, z]) => [r - r0, c - c0, z])
}

export class Invariant extends Variants {
  constructor (cells, validator, zoneDetail) {
    super(validator, zoneDetail, 'S')
    this.list = [cells]
  }

  static cell3 (full, subGroups) {
    return [makeCell3(full, subGroups)]
  }
  static setBehaviour (invariant) {
    invariant.canFlip = false
    invariant.canRotate = false
    invariant.canTransform = false
    invariant.r1 = Invariant.r
    invariant.f1 = Invariant.r
    invariant.rf1 = Invariant.r
  }
  variant (_index) {
    return this.list[0]
  }
  setByIndex (_index) {
    throw new Error('can not change this variant')
  }

  static r = idx => idx
}

class RotatableVariant extends Variants {
  constructor (validator, zoneDetail, symmetry) {
    super(validator, zoneDetail, symmetry)
    if (new.target === RotatableVariant) {
      throw new Error(
        'base class cannot be instantiated directly. Please extend it.'
      )
    }
    this.constructor.setBehaviour(this, symmetry)
    this.canRotate = true
  }

  rotate () {
    this.setByIndex(this.r1(this.index))
  }
  flip () {
    this.setByIndex(this.f1(this.index))
  }
  leftRotate () {
    this.setByIndex(this.rf1(this.index))
  }
}

export class TransformableVariants extends Variants {
  constructor (forms) {
    super(forms[0].validator, forms[0].zoneDetail, forms[0].symmetry)

    this.canRotate = forms[0].canRotate
    this.canFlip = forms[0].canFlip
    this.forms = forms
    this.formsIdx = 0
    this.index = 0
    this.canTransform = true
    this.totalVariants = forms.reduce((acc, f) => acc + f.numVariants(), 0)
    this.currentForm = forms[this.index]
  }
  numVariants () {
    return this.totalVariants
  }

  positionInForms (index) {
    const idx = (index || this.index) % this.totalVariants
    let count = 0
    for (let i = 0; i < this.forms.length; i++) {
      const formVariants = this.forms[i].numVariants()
      if (idx < count + formVariants) {
        return { formIndex: i, variantIndex: idx - count }
      }
      count += formVariants
    }
    throw new Error('Index out of bounds')
  }

  indexFromForms () {
    const form = this.currentForm
    const formIndex = this.forms.indexOf(form)
    let idx = 0
    for (let i = 0; i < formIndex; i++) {
      idx += this.forms[i].numVariants()
    }
    idx += form.index || 0
    return idx
  }

  variant (index) {
    const { formIndex, variantIndex } = this.positionInForms(index)
    return this.forms[formIndex].variants().variant(variantIndex)
  }

  special (index, groupIndex = 1) {
    const idx = index || this.index
    const { formIndex, variantIndex } = this.positionInForms(idx)
    return this.forms[formIndex].variants().special(variantIndex, groupIndex)
  }

  placeable (index) {
    const { formIndex, variantIndex } = this.positionInForms(index)
    return this.forms[formIndex].variants().placeable(variantIndex)
  }

  allVariationsAndForms () {
    return this.forms.flatMap(f => f.variants().list.map(v => [f, v]))
  }
  variationsAndForms () {
    let variants0 = this.allVariationsAndForms()
    return shuffleArray(variants0)
  }
  variations () {
    return this.allVariationsAndForms().map(vf => vf[1])
  }
  allPlaceables () {
    return this.forms.flatMap(f => f.variants().placeables())
  }
  placeables () {
    let p0 = this.allPlaceables()
    return shuffleArray(p0)
  }
  normalize (mr, mc) {
    return this.allVariationsAndForms().map(v => normalize(v[1], mr, mc))
  }

  height () {
    return Math.max(...this.forms.map(f => f.variants().height()))
  }
  width () {
    return Math.max(...this.forms.map(f => f.variants().width()))
  }

  setByIndex (index) {
    const { formIndex, variantIndex } = this.positionInForms(
      index || this.index
    )
    this.currentForm = this.forms[formIndex]
    this.currentForm.setByIndex(variantIndex)
    this.index = index || this.index
    this.onChange()
  }

  placingAt (r, c) {
    return new CellsToBePlaced(this.variant(), r, c, this.currentForm.validator)
  }

  nextForm () {
    const old = this.index
    this.formsIdx = (this.formsIdx + 1) % this.forms.length
    this.currentForm = this.forms[this.formsIdx]

    if (this.currentForm.numVariants() > 1) {
      this.currentForm.setByIndex(0)
    }
    this.index = this.indexFromForms()
    if (old !== this.index) this.onChange()
  }

  rotate () {
    if (!this.canRotate) return
    const old = this.index
    this.currentForm.rotate()
    this.index = this.indexFromForms()
    if (old !== this.index) this.onChange()
  }
  flip () {
    if (!this.canFlip) return
    const old = this.index
    this.currentForm.flip()
    this.index = this.indexFromForms()
    if (old !== this.index) this.onChange()
  }
  leftRotate () {
    if (!this.canRotate) return
    const old = this.index
    this.currentForm.leftRotate()
    this.index = this.indexFromForms()
    if (old !== this.index) this.onChange()
  }
}

class FlippableVariant extends RotatableVariant {
  constructor (validator, zoneDetail, symmetry) {
    super(validator, zoneDetail, symmetry)
    if (new.target === FlippableVariant) {
      throw new Error(
        'base class cannot be instantiated directly. Please extend it.'
      )
    }
    this.canFlip = true
  }
  static setBehaviour (subType, flippable) {
    flippable.canFlip = true
    flippable.canRotate = true
    flippable.r1 = subType.r
    flippable.f1 = subType.f
    flippable.rf1 = subType.rf
  }
}
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
// variant helpers
function rotate (cells, mr, mc) {
  return normalize(
    cells.map(([r, c]) => [c, -r]),
    mr,
    mc
  )
}
const areArraysOrderedAndEqual = (arr1, arr2) => {
  // Check if the arrays are the same length
  if (arr1.length !== arr2.length) {
    return false
  }

  // Check if all items exist and are in the same order
  return arr1.every((element, index) => element === arr2[index])
}

const areArraysUnorderedEqual = (arr1, arr2) => {
  if (arr1.length !== arr2.length) {
    return false
  }

  // Create shallow copies and sort them to avoid modifying original arrays
  const sortedArr1 = [...arr1].sort()
  const sortedArr2 = [...arr2].sort()

  // Compare the sorted arrays element by element
  return sortedArr1.every((element, index) =>
    areArraysOrderedAndEqual(element, sortedArr2[index])
  )
}

function flip (cells, mr, mc) {
  const flipped = flipV(cells, mr, mc)
  return areArraysUnorderedEqual(flipped, cells)
    ? flipH(cells, mr, mc)
    : flipped
}

function flipV (cells, mr, mc) {
  return normalize(
    cells.map(([r, c]) => [-r, c]),
    mr,
    mc
  )
}
function flipH (cells, mr, mc) {
  return normalize(
    cells.map(([r, c]) => [r, -c]),
    mr,
    mc
  )
}
function rotate3 (cells) {
  return normalize3(cells.map(([r, c, z]) => [c, -r, z]))
}
function flip3 (cells) {
  return normalize3(cells.map(([r, c, z]) => [-r, c, z]))
}

function rf3 (cells) {
  return normalize3(cells.map(([r, c, z]) => [c, r, z]))
}

function isIn (r, c, cells) {
  return cells.some(([rr, cc]) => rr === r && cc === c)
}
function subGroupIndex (r, c, subGroups) {
  let idx = 1
  for (const subGroup of subGroups) {
    if (isIn(r, c, subGroup)) return idx
    idx++
  }
  return 0
}

function makeCell3 (cells, subGroups) {
  return cells.map(([r, c]) => [r, c, subGroupIndex(r, c, subGroups)])
}

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

function variantType (symmetry) {
  switch (symmetry) {
    case 'D':
      return Dihedral4
    case 'A':
      return Klein4
    case 'S':
      return Invariant
    case 'H':
      return Cyclic4
    case 'L':
      return Blinker
    case 'G':
      return Diagonal
    default:
      throw new Error(
        'Unknown symmetry type for ' + JSON.stringify(this, null, 2)
      ) // The 'null, 2' adds indentation for readability);
  }
}
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

export class WeaponVariant extends SpecialVariant {
  constructor (full, weapons, symmetry, validator, zoneDetail, subterrain) {
    super(symmetry)
    this.validator = validator
    this.zoneDetail = zoneDetail
    this.subterrain = subterrain
    const weaponObj = Object.keys(weapons)
    const weaponGroup = weaponObj.map(p => parsePair(p))
    this.weapons = weaponObj.map(k => weapons[k])
    this.standardGroup = new StandardCells(validator, zoneDetail, subterrain)
    const specialGroup = new SpecialCells(
      weaponGroup,
      validator,
      zoneDetail,
      subterrain
    )
    this.specialGroups = [specialGroup]
    this.standardGroup.faction = 1
    this.specialGroups.faction = 0
    this.standardGroup.setCells(full, specialGroup)
    this.subGroups = [this.standardGroup, specialGroup]
    this.buildCell3(symmetry, full)
  }

  static setBehaviour = SpecialVariant.setBehaviourTo

  placeable (index) {
    const idx = index || this.index
    const grandparentPrototype = Object.getPrototypeOf(SpecialVariant.prototype)
    const result = new PlaceableW(
      grandparentPrototype.placeable.call(this, idx),
      this.subGroups.map(
        (g, i) => new Placeable(this.special(idx, i), g.validator, g.zoneDetail)
      )
    )
    result.variantIndex = idx
    result.weapons = this.weapons
    return result
  }
  placeables () {
    return this.shuffledPlaceables()
  }
}

export const Armed = Base =>
  class extends Base {
    variants () {
      return new WeaponVariant(
        this.cells,
        this.weaponSystem,
        this.symmetry,
        this.validator,
        this.zoneDetail,
        this.subterrain
      )
    }
  }
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
