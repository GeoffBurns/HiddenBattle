import { bh } from './terrain.js'
import { assembleTerrains } from './gameMaps.js'
import { fetchComponent } from './network.js'
import { setupTrack } from './gtag.js'
import { setupTerrain } from './terrainUI.js'
import { setupTabs } from './setupTabs.js'
import { storeShips } from './saveCustomMap.js'

export function removeShortcuts () {
  document.removeEventListener('keydown')
}

export function switchToEdit (map, huntMode) {
  const mapName = map?.title
  const params = new URLSearchParams()
  params.append('edit', mapName)
  params.append('terrain', bh.terrain.tag)
  storeShips(params, huntMode, 'battlebuild', map)
  const location = `./battlebuild.html?${params.toString()}`
  globalThis.location.href = location
}

export async function fetchNavBar (tab, title, callback) {
  setupTrack()
  const urlParams = new URLSearchParams(globalThis.location.search)
  assembleTerrains()
  setupTerrain(urlParams)
  bh.setTheme()
  bh.setTest(urlParams)

  const component = './navbars.html'
  await fetchComponent('navbar', component)

  document.getElementById('print-title').textContent = title
  setupTabs(tab)
  if (typeof callback === 'function') {
    try {
      callback()
    } catch (error) {
      console.log(error)
    }
  }
}
