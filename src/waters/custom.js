import { bh } from '../terrain/terrain.js'
import { Waters } from './Waters.js'
import { customUI } from './customUI.js'

export class Custom extends Waters {
  constructor (customUI) {
    super(customUI)
    this.candidateShips = []
    this.ships = []
  }

  displacedArea () {
    const map = bh.map
    return (map.rows + 1) * (map.cols + 1) + 1
  }

  noOfShips () {
    return this.ships.length
  }
  noOfPlacedShips () {
    return this.ships.filter(s => s.cells.length > 0).length
  }
  shipDisplacement () {
    return this.ships.reduce(
      (accumulator, ship) => accumulator + ship.shape().displacement,
      0
    )
  }
  hasPlayableShips () {
    return this.displacementRatio() < 0.35
  }

  hasSomeShips () {
    return this.displacementRatio() < 0.15
  }

  displacementRatio () {
    return this.shipDisplacement() / this.displacedArea()
  }
}

export const custom = new Custom(customUI)
