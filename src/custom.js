import { Waters } from './player.js'
import { seaAndLand } from './Shape.js'
import { gameMaps } from './maps.js'
import { customUI } from './customUI.js'

export class Custom extends Waters {
  constructor (customUI, terrain) {
    super(customUI)
    this.candidateShips = []
    this.ships = []
    this.terrain = terrain || seaAndLand
    this.subterrains = this.terrain.subterrains.map(s => {
      return {
        subterrain: s,
        total: new Set(),
        m_zone: s.zones.filter(z => z.isMarginal)[0],
        margin: new Set(),
        c_zone: s.zones.filter(z => !z.isMarginal)[0],
        core: new Set(),
        footprint: new Set()
      }
    })
  }

  displacedArea () {
    return (gameMaps.current.rows + 1) * (gameMaps.current.cols + 1) + 1
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
  displacementRatio () {
    return this.shipDisplacement() / this.displacedArea()
  }
}

export const custom = new Custom(customUI)
