import { seaAndLandMaps } from './seaAndLandMaps.js'
import { TerrainMaps } from './TerrainMaps.js'
import { spaceAndAsteroidsMaps } from './SpaceAndAsteroidsMaps.js'

TerrainMaps.currentTerrainMaps(seaAndLandMaps)
TerrainMaps.currentTerrainMaps(spaceAndAsteroidsMaps)

export function gameMaps (maps) {
  if (maps) {
    TerrainMaps.currentTerrainMaps(maps)
  }
  if (TerrainMaps.currentTerrainMaps() === null) {
    TerrainMaps.currentTerrainMaps(seaAndLandMaps)
  }
  return TerrainMaps.currentTerrainMaps()
}

export function gameMap (map) {
  if (map) {
    gameMaps().setToMap(map)
  }
  return gameMaps().current
}
