import { Waters } from './Waters.js'
import { seaAndLand } from './seaAndLand.js'
import { gameMap } from './gameMaps.js'
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
        m_zone: s.zones.find(z => z.isMarginal),
        margin: new Set(),
        c_zone: s.zones.find(z => !z.isMarginal),
        core: new Set(),
        footprint: new Set()
      }
    })
  }

  displacedArea () {
    const map = gameMap()
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
