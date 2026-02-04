import { StandardCells, SpecialCells } from '../ships/SubShape.js'
import { parsePair } from '../utilities.js'
import { Placeable } from './Placeable.js'
import { PlaceableW } from './PlaceableW.js'
import { SpecialVariant } from './SpecialVariant.js'

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
