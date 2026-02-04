import { bh } from '../terrain/terrain.js'
import { trackLevelEnd } from '../navbar/gtag.js'
import { custom } from './custom.js'

export function saveCustomMap (map) {
  trackLevelEnd(map, false)
  if (custom.noOfPlacedShips() > 0) {
    map.weapons = map.weapons.filter(w => w.ammo > 0 || w.unlimited)
    custom.store()
    bh.maps.addCurrentCustomMap(custom.placedShips())
  }
}
export function storeShips (params, huntMode, target, map) {
  if (huntMode === 'build') {
    if (custom.noOfPlacedShips() > 0) {
      saveCustomMap(map)
      params.append('placedShips', '')
    } else {
      params.delete('mapName')
    }
  }
  return `./${target}.html?${params.toString()}`
}
