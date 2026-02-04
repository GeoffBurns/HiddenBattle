import { bh, terrains } from '../terrain/terrain.js'
import { ChooseFromListUI, ChooseNumberUI } from './chooseUI.js'
import { saveCustomMap } from '../waters/saveCustomMap.js'
import { setupTabs } from './setupTabs.js'
import { setMapTypeParams, setSizeParams } from '../network/SetParams.js'
import {
  getParamMap,
  getParamSize,
  getParamEditMap,
  getParamMapType
} from '../network/getParam.js'
import { terrainSelect, setTerrainParams } from '../terrain/terrainUI.js'
import { setupMapSelection, setupMapControl } from './setupMapSelection.js'
import { validateWidth, validateHeight } from '../validSize.js'

function setupMapOptions (boardSetup, refresh, huntMode = 'build') {
  const urlParams = new URLSearchParams(globalThis.location.search)
  const [height, width] = getParamSize(urlParams)

  const refreshSizeParams =
    huntMode === 'build' ? setSizeParams : Function.prototype

  terrainSelect()

  bh.widthUI = new ChooseNumberUI(
    terrains.minWidth,
    terrains.maxWidth,
    1,
    'chooseWidth'
  )
  bh.heightUI = new ChooseNumberUI(
    terrains.minHeight,
    terrains.maxHeight,
    1,
    'chooseHeight'
  )
  const maps = bh.maps
  const targetMap = maps.getEditableMap(getParamEditMap(urlParams))

  const templateMap =
    targetMap || maps.getMap(getParamMap(urlParams)) || maps.getLastMap()

  let mapWidth =
    width || targetMap?.cols || maps.getLastWidth(templateMap?.cols)
  let mapHeight =
    height || targetMap?.rows || maps.getLastHeight(templateMap?.rows)

  setupTabs(huntMode)
  bh.widthUI.setup(function (_index) {
    const width = validateWidth()
    const height = validateHeight()
    const maps = bh.maps
    maps.setToBlank(height, width)
    maps.storeLastWidth(width)

    boardSetup()
    refresh()
    refreshSizeParams(height, width)
  }, mapWidth)

  bh.heightUI.setup(function (_index) {
    const width = validateWidth()
    const height = validateHeight()
    const maps = bh.maps
    maps.setToBlank(height, width)
    maps.storeLastHeight(height)
    boardSetup()
    refresh()
    refreshSizeParams(height, width)
  }, mapHeight)

  if (targetMap) {
    bh.map = targetMap
    boardSetup()
    refresh()
  } else {
    maps.setToBlank(mapHeight, mapWidth)
  }

  refreshSizeParams(mapHeight, mapWidth)
  return targetMap
}
const mapTypes = ['Custom Maps Only', 'All Maps', 'Pre-Defined Maps Only']
function mapTypeIndex (mapType) {
  const mapTypeIdx = mapTypes.findIndex(m => m.split(' ', 1)[0] === mapType)
  return mapTypeIdx >= 0 ? mapTypeIdx : 0
}
let mapTypeIncludes = '0'

export function setupMapListOptions (refresh) {
  const urlParams = new URLSearchParams(globalThis.location.search)
  const mapType = getParamMapType(urlParams)
  const mapTypeIdx = mapTypeIndex(mapType)

  const listUI = new ChooseFromListUI(mapTypes, 'chooseList')

  listUI.setup(function (index, text) {
    mapTypeIncludes = index
    refresh(index, text)
    setMapTypeParams(text)
  }, mapTypeIdx)

  mapTypeIncludes = mapTypeIdx.toString()
  terrainSelect()

  return mapTypeIncludes
}

export function setupGameOptions (boardSetup, refresh) {
  const placedShips = setupMapSelection(boardSetup, refresh)
  boardSetup()
  return placedShips
}

export function setupPrintOptions (boardSetup, refresh) {
  const targetMap = setupMapSelectionPrint(boardSetup, refresh)
  boardSetup()
  setTerrainParams(bh.maps)
  return targetMap
}
function setupMapSelectionPrint (boardSetup, refresh) {
  const urlParams = new URLSearchParams(globalThis.location.search)

  return setupMapControl(urlParams, boardSetup, refresh)
}

export function setupBuildOptions (boardSetup, refresh, huntMode, editHandler) {
  const targetMap = setupMapOptions(boardSetup, refresh, huntMode)
  const maps = bh.maps
  maps.onChange = resetCustomMap
  if (targetMap && editHandler) {
    editHandler(targetMap)
  } else {
    boardSetup()
  }
  return targetMap
}
export function resetCustomMap () {
  const map = bh.map
  saveCustomMap(map)

  bh.maps.setToBlank(map.rows, map.cols)
}
