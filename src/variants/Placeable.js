import { CellsToBePlaced } from './CellsToBePlaced.js'
import { placingTarget } from './makeCell3.js'

export class Placeable {
  constructor (variant, validator, zoneDetail, target) {
    this.cells = variant
    this.validator = validator
    this.zoneDetail = zoneDetail || 0
    this.target = target || placingTarget
  }

  height () {
    return Math.max(...this.cells.map(s => s[0]))
  }
  width () {
    return Math.max(...this.cells.map(s => s[1]))
  }

  placeAt (r, c) {
    return new CellsToBePlaced(
      this.cells,
      r,
      c,
      this.validator,
      this.zoneDetail
    )
  }

  inAllBounds (r, c) {
    try {
      const h = this.height()
      const w = this.width()
      return this.target.allBoundsChecker(r, c, h, w)
    } catch (error) {
      console.error(
        'An error occurred checking : ',
        JSON.stringify(this.cells),
        error.message
      )
      return false
    }
  }

  canPlace (r, c, shipCellGrid) {
    const placing = this.placeAt(r, c)
    return placing.canPlace(shipCellGrid)
  }
}
