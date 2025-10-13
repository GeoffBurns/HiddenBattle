import { CellsToBePlaced, Placeable, Placeable3 } from './CellsToBePlaced.js'

export function shuffleArray (array) {
  for (let i = array.length - 1; i > 0; i--) {
    let j = Math.floor(Math.random() * (i + 1))
    let temp = array[i]
    array[i] = array[j]
    array[j] = temp
  }
  return array
}

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
    this.canTransform = false
    this.validator = validator
    this.onChange = Function.prototype
    this.zoneDetail = zoneDetail
    this.symmetry = symmetry
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
    flippable.canTransform = false
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
function flipV (cells, mr, mc) {
  return normalize(
    cells.map(([r, c]) => [-r, c]),
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
    let flipped = flipV(cells)
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
    default:
      throw new Error(
        'Unknown symmetry type for ' + JSON.stringify(this, null, 2)
      ) // The 'null, 2' adds indentation for readability);
  }
}

export class Variant3 extends RotatableVariant {
  constructor (full, subGroups, symmetry) {
    super(Function.prototype, 0, symmetry)

    this.subGroups = subGroups || []

    const [head, ...tail] = subGroups
    this.standardGroup = head
    this.specialGroups = tail
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

  static setBehaviour (v3, symmetry) {
    const VariantType = variantType(symmetry || this.symmetry)
    VariantType.setBehaviour(v3)
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
  placeables () {
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
      default:
        throw new Error('Unknown no of variants')
    }

    return shuffled.map(i => this.placeable(i))
  }
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
