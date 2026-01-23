import { TerrainMaps } from './TerrainMaps.js'
import { spaceAndAsteroids } from './space.js'
import { spaceMapList, defaultSpaceMap } from './SpaceMaps.js'
import { spaceShipsCatalogue } from './SpaceShips.js'
import { spaceWeaponsCatalogue } from './spaceWeapons.js'

spaceAndAsteroids.ships = spaceShipsCatalogue
spaceAndAsteroids.weapons = spaceWeaponsCatalogue

class SpaceAndAsteroidsMaps extends TerrainMaps {
  constructor () {
    super(spaceAndAsteroids, spaceMapList, defaultSpaceMap, [
      ['|', 'DestroyOne'],
      ['+', 'Bomb']
    ])
  }
}

export const spaceAndAsteroidsMaps = new SpaceAndAsteroidsMaps()
