export class SubShape {
  constructor (validator, zoneDetail, subterrain) {
    this.validator = validator
    this.zoneDetail = zoneDetail
    this.subterrain = subterrain
    this.faction = 1
  }

  clone () {
    return new SubShape(this.validator, this.zoneDetail, this.subterrain)
  }
}

export class StandardCells extends SubShape {
  constructor (validator, zoneDetail, subterrain) {
    super(validator, zoneDetail, subterrain)
    this.cells = []
  }
  setCells (allCells, secondary) {
    this.cells = allCells.filter(
      ([r0, c0]) => !secondary.cells.some(([r, c]) => r0 === r && c0 === c)
    )
  }
}
export class SpecialCells extends SubShape {
  constructor (cells, validator, zoneDetail, subterrain) {
    super(validator, zoneDetail, subterrain)
    this.cells = cells
  }
}
