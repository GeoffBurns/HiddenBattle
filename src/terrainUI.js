import { bh, terrains } from './terrain.js'
import { ChooseFromListUI } from './chooseUI.js'
import { setSizeParams, updateState } from './SetParams.js'
import { isEditMode, getParamMap, getParamSize } from './getParam.js'

export function terrainSelect () {
  const terrainTitles = (() => {
    try {
      return bh.terrainTitleList
    } catch (error) {
      console.error('An error occurred:', error.message, terrains)
      return []
    }
  })()

  const terrainUI = new ChooseFromListUI(terrainTitles, 'chooseTerrain')
  terrainUI.setup(
    function (_index, title) {
      const old = bh.map
      const height = old?.rows
      const width = old?.cols
      bh.setTerrainByTitle(title)
      if (height && width) {
        setSizeParams(height, width)
      }
      setTerrainParams(bh.maps)
      window.location.reload()
    },
    null,
    bh.terrainTitle
  )
}
export function setupTerrain (urlParams) {
  const terrainTag = urlParams.getAll('terrain')[0]
  const newTerrainMap = bh.setTerrainByTag(terrainTag)
  const newTerrainTag = newTerrainMap?.terrain?.tag
  if (newTerrainTag && terrainTag !== newTerrainTag) {
    setTerrainParams(newTerrainTag, newTerrainMap)
  }
}
export function setTerrainParams (newTerrainMap) {
  const url = new URL(globalThis.location)
  const urlParams = url.searchParams

  const bodyTag = newTerrainMap?.terrain?.bodyTag
  const newTerrainTag = newTerrainMap?.terrain?.tag

  urlParams.set('terrain', newTerrainTag)
  const mode = isEditMode(urlParams) ? 'edit' : 'create'
  let mapName = getParamMap(urlParams)
  let [height, width] = getParamSize(urlParams)
  const mapType = urlParams.getAll('mapType')[0]
  let h = ''
  let w = ''
  let x = ''
  if (mapName && (Number.isNaN(height) || Number.isNaN(width))) {
    const map = bh.map
    height = map?.rows
    width = map?.cols
  }
  if (height && width && !Number.isNaN(height) && !Number.isNaN(width)) {
    h = height.toString(10)
    w = width.toString(10)
    x = 'x'
  }
  updateState(
    [
      ['mode', mode],
      ['mapName', mapName || ''],
      ['height', h],
      ['width', w],
      ['x', x],
      ['terrain', bodyTag],
      ['mapType', mapType || '']
    ],
    url
  )
  bh.setTheme()
}
