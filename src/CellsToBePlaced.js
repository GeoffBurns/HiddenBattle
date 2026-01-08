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
export const placingTarget = {
  boundsChecker: Function.prototype,
  allBoundsChecker: Function.prototype,
  getZone: () => []
}

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

function dispatchCell3 (cell, subGroupCells) {
  const [r, c, z] = cell
  subGroupCells[z].push([r, c])
}

export class Placeable3 extends Placeable {
  constructor (full, subGroups) {
    super(full.cells, full.validator, full.zoneDetail, full.target)
    this.subGroups = subGroups || []
    const [head, ...tail] = subGroups
    this.standardGroup = head
    this.specialGroups = tail

    this.subCells = this.subGroups.map(_g => [])
    this.cells.forEach(cell => {
      dispatchCell3(cell, this.subCells)
    })
    let idx = 0
    for (const subCell of this.subCells) {
      this.subGroups[idx].cells = subCell
      idx++
    }
  }

  placeAt (r, c) {
    return new Cell3sToBePlaced(this, r, c)
  }
}
