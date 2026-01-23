import { seaAndLand } from './seaAndLand.js'
import { defaultMap, seaMapList } from './SeaMaps.js'
import { TerrainMaps } from './TerrainMaps.js'
import { seaShipsCatalogue } from './SeaShips.js'
import { seaWeaponsCatalogue } from './SeaWeapons.js'

seaAndLand.ships = seaShipsCatalogue
seaAndLand.weapons = seaWeaponsCatalogue

// gameMapTypes
class SeaAndLandMaps extends TerrainMaps {
  constructor () {
    super(seaAndLand, seaMapList, defaultMap, [
      ['K', 'DestroyOne'],
      ['F', 'Bomb'],
      ['M', 'Bomb'],
      ['+', 'DestroyOne'],
      ['W', 'Scan']
    ])
  }
}
export const seaAndLandMaps = new SeaAndLandMaps()
