import { bh, addCellToFootPrint } from '../terrain.js'
import {
  Dihedral4,
  Klein4,
  Blinker,
  Cyclic4,
  Invariant,
  Diagonal
} from '../variants.js'
import { makeKey } from '../utilities.js'
import { WeaponSystem } from '../WeaponSystem.js'

export const token = 'geoffs-hidden-battle'

export class Shape {
  constructor (letter, symmetry, cells, tallyGroup, tip, racks) {
    this.letter = letter
    this.symmetry = symmetry
    this.cells = cells
    this.racks =
      racks instanceof Array
        ? new Set(racks.map(([r, c]) => makeKey(r, c)))
        : null
    this.canAttachWeapons = racks && racks.length > 0
    this.isAttachedToRack = false
    this.terrain = bh.terrain
    this.subterrain = null
    this.validator = Function.prototype
    this.zoneDetail = 0
    this.tip = tip
    this.tallyGroup = tallyGroup
    const area = cells.length
    let footPrint = new Set()
    for (const cell of cells) {
      addCellToFootPrint(cell[0], cell[1], footPrint)
    }
    this.displacement = (area + footPrint.size) / 2
    this.vulnerable = []
    this.hardened = []
    this.immune = []
    this.attachedWeapons = {}
  }
  canBeOn (subterrain) {
    return this.subterrain === subterrain
  }
  protectionAgainst (weapon) {
    if (this.immune.includes(weapon)) return 3
    if (this.hardened.includes(weapon)) return 2
    if (this.vulnerable.includes(weapon)) return 0
    return 1
  }

  attachWeapon (ammoBuilder) {
    if (!this.canAttachWeapons) {
      throw new Error('Cannot attach weapon to shape ' + this.letter)
    }
    if (this.isAttachedToRack) {
      throw new Error('Weapon already attached to shape ' + this.letter)
    }
    this.isAttachedToRack = true
    const newObject = {}
    for (const key of [...this.racks]) {
      newObject[key] = ammoBuilder()
    }
    this.attachedWeapons = newObject
    return this.attachedWeapons
  }
  get weaponSystem () {
    const mapValues = w => new WeaponSystem(w)

    return Object.keys(this.attachedWeapons || {}).reduce((acc, key) => {
      acc[key] = mapValues(this.attachedWeapons[key])
      return acc
    }, {})
  }

  variants () {
    switch (this.symmetry) {
      case 'D':
        return new Dihedral4(this.cells, this.validator, this.zoneDetail)
      case 'A':
        return new Klein4(this.cells, this.validator, this.zoneDetail)
      case 'S':
        return new Invariant(this.cells, this.validator, this.zoneDetail)
      case 'H':
        return new Cyclic4(this.cells, this.validator, this.zoneDetail)
      case 'L':
        return new Blinker(this.cells, this.validator, this.zoneDetail)
      case 'G':
        return new Diagonal(this.cells, this.validator, this.zoneDetail)
      default:
        throw new Error(
          'Unknown symmetry type for ' + JSON.stringify(this, null, 2)
        ) // The 'null, 2' adds indentation for readability);
    }
  }
  numVariants () {
    return this.variants().numVariants()
  }
  placeables () {
    return this.variants().placeables()
  }
  type () {
    return this.terrain.ships.types[this.letter]
  }
  color () {
    return this.terrain.ships.colors[this.letter]
  }
  sunkDescription (middle = ' ') {
    return this.description() + middle + this.shipSunkDescriptions()
  }
  letterColors () {
    return this.terrain.ships.letterColors[this.letter]
  }
  description () {
    return this.terrain.ships.description[this.letter]
  }
  shipSunkDescriptions () {
    return this.terrain.ships.shipSunkDescriptions[this.type()]
  }
}
