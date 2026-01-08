import { gameMap, gameMaps } from './maps.js'
import { terrain } from './Shape.js'

export class Ship {
  constructor (id, symmetry, letter) {
    this.id = id
    this.symmetry = symmetry
    this.letter = letter
    this.cells = []
    this.hits = new Set()
    this.sunk = false
  }

  static createFromShape (shape, id) {
    return new Ship(id, shape.symmetry, shape.letter)
  }

  place (placed) {
    this.cells = placed
    this.hits = new Set()
    this.sunk = false
    return placed
  }
  unplace () {
    this.cells = []
    this.hits = new Set()
    this.sunk = false
  }
  placePlaceable (placeable, r, c) {
    this.cells = placeable.placeAt(r, c).cells
  }
  placeables () {
    return this.shape.placeables()
  }
  isRightZone (r, c) {
    const shipType = this.type()
    const isLand = gameMap().isLand(r, c)
    // area rules
    if (shipType === 'G' && !isLand) return false
    if (shipType === 'S' && isLand) return false

    return true
  }
  noTouchCheck (r, c, shipCellGrid) {
    const map = gameMap()
    for (let nr = r - 1; nr <= r + 1; nr++)
      for (let nc = c - 1; nc <= c + 1; nc++) {
        if (map.inBounds(nr, nc) && shipCellGrid[nr][nc]) return false
      }
    return true
  }
  isAllRightZone (placing) {
    placing.some(([r, c]) => {
      return this.isRightZone(r, c) === false
    })
  }
  canPlace (variant, r0, c0, shipCellGrid) {
    const placing = this.placeCells(variant, r0, c0)
    const map = gameMap()
    if (
      placing.some(([r, c]) => {
        return !map.inBounds(r, c)
      })
    ) {
      // console.log('out of bounds')
      return false
    }
    if (this.isAllRightZone(placing)) {
      //console.log('wrong Zone')
      return false
    }

    if (
      placing.some(([r, c]) => {
        return (map.inBounds(r, c) && shipCellGrid[r][c]) === true
      })
    ) {
      //   console.log('overlapping')
      return false
    }
    if (
      placing.some(([r, c]) => {
        return this.noTouchCheck(r, c, shipCellGrid) === false
      })
    ) {
      //   console.log('touching')
      return false
    }
    // console.log('good')
    return true
  }
  addToGrid (shipCellGrid) {
    const letter = this.letter
    const id = this.id
    for (const [r, c] of this.cells) {
      shipCellGrid[r][c] = { id, letter }
    }
  }
  shape () {
    return gameMaps().shapesByLetter[this.letter]
  }
  sunkDescription (middle = ' ') {
    return terrain.current.sunkDescription(this.letter, middle)
  }

  description () {
    return terrain.current.ships.descriptions[this.letter]
  }

  type () {
    return terrain.current.ships.types[this.letter]
  }
}
