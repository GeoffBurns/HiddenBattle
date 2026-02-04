import { bh } from '../terrain/terrain.js'
import { terrainSelect } from '../terrain/terrainUI.js'
import { ChooseFromListUI } from './chooseUI.js'
import { getParamMap, getParamSize } from '../getParam.js'
import { setMapParams } from '../SetParams.js'

export function setupMapControl (
  urlParams,
  boardSetup = Function.prototype,
  refresh = Function.prototype
) {
  terrainSelect()
  var { mapName, targetMap } = setMapFromParams(urlParams)

  setMapSelector(boardSetup, refresh, mapName)

  bh.maps.setTo(mapName)
  return targetMap
}
function setMapSelector (
  // boardSetup = Function.prototype,
  // refresh = Function.prototype,
  mapName
) {
  const maps = bh.maps
  const mapTitles = (() => {
    try {
      return maps.mapTitles()
    } catch (error) {
      console.error('An error occurred:', error.message, maps.mapTitles)
      return []
    }
  })()

  const mapSelectUI = new ChooseFromListUI(mapTitles, 'chooseMap')
  mapSelectUI.setup(
    function (_index, title) {
      maps.setTo(title)
      setMapParams(title)
      //  boardSetup()
      //  refresh()
      maps.storeLastMap()
      window.location.reload()
    },
    null,
    mapName
  )
}
function setMapFromParams (urlParams) {
  let mapName = getParamMap(urlParams)
  const [height, width] = getParamSize(urlParams)
  const maps = bh.maps
  let targetMap = null
  try {
    targetMap = maps.getMap(mapName)
    mapName = targetMap?.title
  } catch (error) {
    console.log(error)
  }

  if (!mapName && height && width) {
    const map = maps.getMapOfSize(height, width)
    mapName = map?.title
    setMapParams(mapName)
  }
  if (!mapName) {
    try {
      mapName = maps.getLastMapTitle()
    } catch (error) {
      console.log(error)
      mapName = null
    }
  }
  return { mapName, targetMap }
}
export function setupMapSelection (boardSetup, refresh) {
  const urlParams = new URLSearchParams(globalThis.location.search)

  const placedShips = urlParams.has('placedShips')

  setupMapControl(urlParams, boardSetup, refresh)

  return placedShips
}
