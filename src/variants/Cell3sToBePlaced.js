import { CellsToBePlaced } from './CellsToBePlaced.js'

export class Cell3sToBePlaced extends CellsToBePlaced {
  constructor (placable3, r, c) {
    super(
      placable3.cells,
      r,
      c,
      placable3.validator,
      placable3.zoneDetail,
      placable3.target
    )
    this.subGroups = placable3.subGroups.map(g => g.placeAt(r, c))
  }

  isInMatchingZone (r, c) {
    const zoneInfo = this.zoneInfo(r, c, 2)
    const result = this.subGroups.some(
      g => g.isCandidate(r, c) && g.validator(zoneInfo)
    )
    return result
  }
  isWrongZone () {
    const result = this.cells.some(([r, c]) => {
      return this.isInMatchingZone(r, c) === false
    })
    for (let cell of this.cells) {
      const [r, c] = cell
      const match = this.isInMatchingZone(r, c) ? 1 : 0
      const l = cell.length
      switch (l) {
        case 2:
          cell.push(match)
          break
        case 3:
          cell[2] = match
          break
      }
    }
    return result
  }
}
