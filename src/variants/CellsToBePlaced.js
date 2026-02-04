import { placingTarget } from './makeCell3.js'

export class CellsToBePlaced {
  constructor (variant, r0, c0, validator, zoneDetail, target) {
    let placingTheCells = []
    for (const [dr, dc] of variant) {
      const rr = r0 + dr,
        cc = c0 + dc
      placingTheCells.push([rr, cc])
    }
    this.cells = placingTheCells
    this.validator = validator
    this.zoneDetail = zoneDetail || 0
    this.target = target || placingTarget
  }

  isCandidate (r, c) {
    return this.cells.some(([r0, c0]) => r0 === r && c0 === c)
  }
  zoneInfo (r, c, zoneDetail) {
    return this.target.getZone(r, c, zoneDetail || this.zoneDetail)
  }
  isInMatchingZone (r, c) {
    const zoneInfo = this.zoneInfo(r, c)
    return this.validator(zoneInfo)
  }

  noTouch (r, c, shipCellGrid) {
    for (let nr = r - 1; nr <= r + 1; nr++)
      for (let nc = c - 1; nc <= c + 1; nc++) {
        if (this.target.boundsChecker(nr, nc) && shipCellGrid[nr][nc] !== null)
          return false
      }
    return true
  }
  isWrongZone () {
    const result = this.cells.some(([r, c]) => {
      return this.isInMatchingZone(r, c) === false
    })
    return result
  }

  isNotInBounds () {
    return this.cells.some(([r, c]) => {
      return !this.target.boundsChecker(r, c)
    })
  }
  isOverlapping (shipCellGrid) {
    return this.cells.some(([r, c]) => {
      return shipCellGrid[r][c] !== null
    })
  }
  isTouching (shipCellGrid) {
    return this.cells.some(([r, c]) => {
      return this.noTouch(r, c, shipCellGrid) === false
    })
  }
  canPlace (shipCellGrid) {
    if (this.isNotInBounds()) {
      // console.log('out of bounds')
      return false
    }
    if (this.isWrongZone()) {
      //  console.log('wrong Zone')
      return false
    }

    if (this.isOverlapping(shipCellGrid)) {
      //  console.log('overlapping')
      return false
    }
    if (this.isTouching(shipCellGrid)) {
      //  console.log('touching')
      return false
    }
    // console.log('good')
    return true
  }
}
