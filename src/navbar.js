import { bh, terrains } from './terrain.js'
import { ChooseFromListUI, ChooseNumberUI } from './chooseUI.js'
import { TerrainMaps } from './TerrainMaps.js'
import { gameMaps, gameMap } from './gameMaps.js'
import { custom } from './custom.js'
import { SavedCustomMap } from './map.js'
import { toTitleCase } from './utils.js'

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

function resetCustomMap () {
  const map = gameMap()
  saveCustomMap(map)

  gameMaps().setToBlank(map.rows, map.cols)
}
function saveCustomMap (map) {
  trackLevelEnd(map, false)
  if (custom.noOfPlacedShips() > 0) {
    map.weapons = map.weapons.filter(w => w.ammo > 0 || w.unlimited)
    custom.store()
    gameMaps().addCurrentCustomMap(custom.placedShips())
  }
}

function storeShips (params, huntMode, target, map) {
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

export function switchTo (target, huntMode, mapName) {
  if (target) {
    const params = new URLSearchParams()
    const map = gameMap()
    if (!mapName) {
      params.append('height', map.rows)
      params.append('width', map.cols)
    }
    mapName = mapName || map.title
    params.append('mapName', mapName)
    params.append('terrain', bh.terrain.tag)
    const result = storeShips(params, huntMode, target, map)

    if (result) {
      // alert('going to ' + result)
      globalThis.location.href = result
    }
  }
}

class Tab {
  constructor (name) {
    this.name = name
    this.element = document.getElementById(`tab-${this.name}`)
    this.handers = new Set()
  }
  addClickListener (hander) {
    this.element?.addEventListener('click', hander)
    this.handers.add(hander)
  }
  overrideClickListener (hander) {
    for (const h of this.handers) {
      this.element?.removeEventListener('click', h)
    }
    this.handers.clear()
    this.addClickListener(hander)
  }
  youAreHere () {
    this.element?.classList.add('you-are-here')
  }
}

export const tabs = {
  build: null,
  add: null,
  hide: null,
  seek: null,
  list: null,
  import: null,
  about: null,
  print: null,
  source: null
}

export function setupTabs (huntMode) {
  function switchToSeek () {
    switchTo('battleseek', huntMode)
  }
  function switchToHide () {
    switchTo('index', huntMode)
  }
  function switchToBuild () {
    switchTo('battlebuild', huntMode)
  }

  function switchToList () {
    switchTo('maplist', huntMode)
  }

  function switchToImport () {
    // Create a hidden file input
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'application/json'

    input.onchange = async e => {
      const file = e.target.files[0]
      if (!file) return

      try {
        const text = await file.text()
        const map = new SavedCustomMap(JSON.parse(text))
        const maps = gameMaps()
        if (maps.getMap(map.title) || maps.getCustomMap(map.title)) {
          if (
            !confirm(
              'A map with this title already exists. Do you want to overwrite it?'
            )
          ) {
            return
          }
        }
        map.saveToLocalStorage()

        trackClick(map, 'import map')
        alert('Map imported successfully.')
      } catch (err) {
        alert('Invalid JSON: ' + err.message)
      }
    }

    // Trigger the file dialog
    input.click()
  }

  tabs.build = new Tab('build')
  tabs.add = new Tab('add')
  tabs.hide = new Tab('hide')
  tabs.seek = new Tab('seek')
  tabs.list = new Tab('list')
  tabs.import = new Tab('import')
  tabs.about = new Tab('about')
  tabs.source = new Tab('source')
  tabs.print = new Tab('print')
  if (huntMode === 'build') {
    tabs.build.youAreHere()
    tabs.add.youAreHere()
  } else {
    tabs.build?.addClickListener(switchToBuild)

    tabs.add?.addClickListener(switchToBuild)
  }

  if (huntMode === 'hide') {
    tabs.hide?.youAreHere()
  } else {
    tabs.hide?.addClickListener(switchToHide)
  }

  if (huntMode === 'seek') {
    tabs.seek?.youAreHere()
  } else {
    tabs.seek?.addClickListener(switchToSeek)
  }

  if (huntMode === 'list') {
    tabs.build?.youAreHere()
    tabs.list?.youAreHere()
  } else {
    tabs.list?.addClickListener(switchToList)
  }

  if (huntMode !== 'import') {
    tabs.import?.addClickListener(switchToImport)
  }
  if (huntMode === 'print') {
    tabs.build?.youAreHere()
    tabs.print?.youAreHere()
  }
  tabs.print?.addClickListener(function () {
    trackTab('print')
    globalThis.print()
  })

  tabs.about?.addClickListener(function () {
    trackTab('go to blog')
    globalThis.location.href =
      'https://geoffburns.blogspot.com/2015/10/pencil-and-paper-battleships.html'
  })
  tabs.source?.addClickListener(function () {
    trackTab('go to source code')
    globalThis.location.href = 'https://github.com/GeoffBurns/battleship'
  })
}

function getParamMap (params) {
  return params.getAll('mapName')[0]
}
function getParamEditMap (params) {
  return params.getAll('edit')[0]
}

function isEditMode (params) {
  const edit = getParamEditMap(params)
  return !!edit
}
function setMapParams (title) {
  const url = new URL(globalThis.location)
  const urlParams = url.searchParams

  const mapName = getParamMap(urlParams)
  if (title && title !== mapName) {
    urlParams.delete('width')
    urlParams.delete('height')
    urlParams.set('mapName', title)
    urlParams.set('terrain', bh.terrain?.tag)

    updateState(
      [
        ['mapName', mapName || ''],
        ['mode', ''],
        ['height', ''],
        ['width', ''],
        ['x', ''],
        ['mapType', ''],
        ['terrain', bh.terrain?.bodyTag || '']
      ],
      url
    )
  }
}
function setupMapControl (
  urlParams,
  boardSetup = Function.prototype,
  refresh = Function.prototype
) {
  var { mapName, targetMap } = setMapFromParams(urlParams)

  setMapSelector(boardSetup, refresh, mapName)

  terrainSelect(boardSetup, refresh)
  gameMaps().setTo(mapName)
  return targetMap
}

function setMapSelector (
  // boardSetup = Function.prototype,
  // refresh = Function.prototype,
  mapName
) {
  const maps = gameMaps()
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
  const maps = gameMaps()
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

function terrainSelect () {
  // boardSetup = Function.prototype,
  // refresh = Function.prototype
  const terrainTitles = (() => {
    try {
      return TerrainMaps.titleList()
    } catch (error) {
      console.error('An error occurred:', error.message, terrains)
      return []
    }
  })()
  const terrainUI = new ChooseFromListUI(terrainTitles, 'chooseTerrain')
  terrainUI.setup(
    function (_index, title) {
      const old = gameMap()
      const height = old?.rows
      const width = old?.cols
      TerrainMaps.setByTitle(title)
      if (height && width) {
        setSizeParams(height, width)
      }
      setTerrainParams(gameMaps())
      window.location.reload()

      /*
      var { mapName } = setMapFromParams(
        new URLSearchParams(globalThis.location.search)
      )
      setMapSelector(boardSetup, refresh, mapName)
      gameMaps().setTo(mapName)
      boardSetup()
      refresh()
      */
    },
    null,
    terrains?.current?.title
  )
}

function setupMapSelectionPrint (boardSetup, refresh) {
  const urlParams = new URLSearchParams(globalThis.location.search)

  setupTerrain(urlParams)

  return setupMapControl(urlParams, boardSetup, refresh)
}
function setupMapSelection (boardSetup, refresh) {
  const urlParams = new URLSearchParams(globalThis.location.search)

  setupTerrain(urlParams)

  const placedShips = urlParams.has('placedShips')

  setupMapControl(urlParams, boardSetup, refresh)

  return placedShips
}
let widthUI = null
let heightUI = null

export function validateWidth () {
  let width = Number.parseInt(widthUI.choose.value, 10)
  if (
    Number.isNaN(width) ||
    width < terrains.minWidth ||
    width > terrains.maxWidth
  ) {
    width = widthUI.min
    widthUI.choose.value = width
  }
  return width
}

export function validateHeight () {
  let height = Number.parseInt(heightUI.choose.value, 10)
  if (
    Number.isNaN(height) ||
    height < terrains.minHeight ||
    height > terrains.maxHeight
  ) {
    height = heightUI.min
    heightUI.choose.value = height
  }
  return height
}

function setSizeParams (height, width) {
  const url = new URL(globalThis.location)
  const urlParams = url.searchParams
  const [h, w] = getParamSize(urlParams)

  const mode = isEditMode(urlParams) ? 'edit' : 'create'
  let mapName = getParamMap(urlParams)

  if (
    height &&
    width &&
    !Number.isNaN(height) &&
    !Number.isNaN(width) &&
    (height !== h || width !== w || mapName)
  ) {
    urlParams.delete('mapName')
    urlParams.set('height', height)
    urlParams.set('width', width)
    urlParams.set('terrain', terrains?.current?.tag)
    updateState(
      [
        ['mode', mode],
        ['mapName', mapName],
        ['height', height],
        ['width', width],
        ['x', 'x'],
        ['mapType', ''],
        ['terrain', terrains?.current?.bodyTag]
      ],
      url
    )
  }
}

function replaceToken (template, key, value) {
  const temp = template.replaceAll('{' + key + '}', value)
  return temp.replaceAll('[' + key + ']', toTitleCase(value))
}

function replaceTokens (template, pairs) {
  for (const [key, value] of pairs) {
    template = replaceToken(template, key, value)
  }
  return template
}

function updateState (tokens, url) {
  const pageTitle = document.getElementById('page-title')
  let template = pageTitle?.dataset?.template
  if (template) {
    document.title = replaceTokens(template, tokens)
  }

  history.pushState({}, '', url)
}
function setupTerrain (urlParams) {
  const terrainTag = urlParams.getAll('terrain')[0]
  const newTerrainMap = TerrainMaps.setByTag(terrainTag)
  const newTerrainTag = newTerrainMap?.terrain?.tag
  if (newTerrainTag && terrainTag !== newTerrainTag) {
    setTerrainParams(newTerrainTag, newTerrainMap)
  }
}

function setTerrainParams (newTerrainMap) {
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
    const map = gameMap()
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
  const body = document.getElementsByTagName('body')[0]
  if (body) {
    body.classList.remove(...terrains.allBodyTags())
    body.classList.add(bh.terrain.bodyTag)
  }
}

function getParamSize (urlParams) {
  const height = Number.parseInt(urlParams.getAll('height')[0], 10)
  const width = Number.parseInt(urlParams.getAll('width')[0], 10)
  return [height, width]
}
function setupMapOptions (boardSetup, refresh, huntMode = 'build') {
  const urlParams = new URLSearchParams(globalThis.location.search)
  const [height, width] = getParamSize(urlParams)

  const refreshSizeParams =
    huntMode === 'build' ? setSizeParams : Function.prototype

  setupTerrain(urlParams)

  terrainSelect(boardSetup, refresh)

  widthUI = new ChooseNumberUI(
    terrains.minWidth,
    terrains.maxWidth,
    1,
    'chooseWidth'
  )
  heightUI = new ChooseNumberUI(
    terrains.minHeight,
    terrains.maxHeight,
    1,
    'chooseHeight'
  )
  const maps = gameMaps()
  const targetMap = maps.getEditableMap(getParamEditMap(urlParams))

  const templateMap =
    targetMap || maps.getMap(getParamMap(urlParams)) || maps.getLastMap()

  let mapWidth =
    width || targetMap?.cols || maps.getLastWidth(templateMap?.cols)
  let mapHeight =
    height || targetMap?.rows || maps.getLastHeight(templateMap?.rows)

  setupTabs(huntMode)
  widthUI.setup(function (_index) {
    const width = validateWidth()
    const height = validateHeight()
    const maps = gameMaps()
    maps.setToBlank(height, width)
    maps.storeLastWidth(width)

    boardSetup()
    refresh()
    refreshSizeParams(height, width)
  }, mapWidth)

  heightUI.setup(function (_index) {
    const width = validateWidth()
    const height = validateHeight()
    const maps = gameMaps()
    maps.setToBlank(height, width)
    maps.storeLastHeight(height)
    boardSetup()
    refresh()
    refreshSizeParams(height, width)
  }, mapHeight)

  if (targetMap) {
    gameMap(targetMap)
    boardSetup()
    refresh()
  } else {
    maps.setToBlank(mapHeight, mapWidth)
  }

  refreshSizeParams(mapHeight, mapWidth)
  return targetMap
}
const mapTypes = ['Custom Maps Only', 'All Maps', 'Pre-Defined Maps Only']

function getParamMapType (params) {
  return params.getAll('mapType')[0]
}
function mapTypeIndex (mapType) {
  const mapTypeIdx = mapTypes.findIndex(m => m.split(' ', 1)[0] === mapType)
  return mapTypeIdx >= 0 ? mapTypeIdx : 0
}

function setMapTypeParams (mapType) {
  mapType = mapType?.split(' ', 1)[0]
  const url = new URL(globalThis.location)
  const urlParams = url.searchParams
  const m = getParamMapType(urlParams)
  const terrainTag = urlParams.getAll('terrain')[0]
  const t = terrains?.current
  let bodyTag = t?.bodyTag

  if (t?.tag !== terrainTag) {
    const newTerrainMap = TerrainMaps.setByTag(terrainTag)
    bodyTag = newTerrainMap?.terrain?.bodyTag
  }

  if (mapType && m !== mapType) {
    urlParams.delete('mapName')
    urlParams.delete('height')
    urlParams.delete('width')
    urlParams.set('terrain', t?.tag)
    urlParams.set('mapType', mapType)
    updateState(
      [
        ['mode', ''],
        ['mapName', ''],
        ['height', ''],
        ['width', ''],
        ['x', ''],
        ['mapType', mapType],
        ['terrain', bodyTag]
      ],
      url
    )
  }
}

let mapTypeIncludes = '0'

export function setupMapListOptions (refresh) {
  const urlParams = new URLSearchParams(globalThis.location.search)
  const mapType = getParamMapType(urlParams)
  const mapTypeIdx = mapTypeIndex(mapType)

  setupTerrain(urlParams)
  const listUI = new ChooseFromListUI(mapTypes, 'chooseList')

  listUI.setup(function (index, text) {
    mapTypeIncludes = index
    refresh(index, text)
    setMapTypeParams(text)
  }, mapTypeIdx)

  mapTypeIncludes = mapTypeIdx.toString()
  terrainSelect(Function.prototype, () => {
    refresh(mapTypeIncludes)
  })

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
  setTerrainParams(gameMaps())
  return targetMap
}

export function setupBuildOptions (boardSetup, refresh, huntMode, editHandler) {
  const targetMap = setupMapOptions(boardSetup, refresh, huntMode)
  const maps = gameMaps()
  maps.onChange = resetCustomMap
  if (targetMap && editHandler) {
    editHandler(targetMap)
  } else {
    boardSetup()
  }
  return targetMap
}

export const GA_ID = 'G-J2METC1TPT'

export function initGA (GA_ID) {
  if (!GA_ID) throw new Error('initGA: missing GA_ID (G-XXXXXX)')

  // ensure dataLayer exists
  globalThis.dataLayer = globalThis.dataLayer || []

  // define gtag only if not already defined
  if (!globalThis.gtag) {
    globalThis.gtag = function gtag () {
      globalThis.dataLayer.push(arguments)
    }
  }

  // If gtag.js already loaded, don't insert again
  const alreadyLoaded = !!document.querySelector(
    `script[src^="https://www.googletagmanager.com/gtag/js?id=${GA_ID}"]`
  )

  // call basic setup immediately (safe to call before script loads)
  globalThis.gtag('js', new Date())
  globalThis.gtag('config', GA_ID, { debug_mode: true })

  if (!alreadyLoaded) {
    const script = document.createElement('script')
    script.async = true
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`
    document.head.appendChild(script)
  }
}

export async function fetchNavBar (tab, title, callback) {
  initGA(GA_ID)

  try {
    // The await keyword pauses the execution until the fetch() promise settles (resolves or rejects)
    const res = await fetch('./navbars.html')

    // Check if the request was successful
    if (!res.ok) {
      // Create a specific error for non-successful HTTP status codes
      throw new Error(`HTTP error! status: ${res.status}`)
    }

    // Await the promise returned by the .text() method (or .json() if applicable)
    const html = await res.text()
    // Do something with the html
    document.getElementById('navbar').innerHTML = html
    document.getElementById('print-title').textContent = title
    setupTabs(tab)
    if (typeof callback === 'function') {
      try {
        callback()
      } catch (error) {
        console.log(error)
      }
    }
  } catch (err) {
    // The catch block handles any errors from the fetch call itself or from the processing (e.g., .text())
    console.error('Failed to load navbars:', err)
    if (typeof callback === 'function') callback(err)
  }
}
export const gtag = globalThis.gtag

export function trackLevelEnd (map, success) {
  if (typeof globalThis.gtag !== 'function') {
    console.warn('GA not initialized')
    return
  }
  map = map || gameMap()

  const params = {
    level_name: map.title || 'unknown',
    terrain: map.terrain || 'unknown',
    height: map.rows || 0,
    width: map.cols || 0,
    mode: document.title,
    success: !!success
  }

  globalThis.gtag('event', 'level_end', params)
}

export function trackClick (map, button) {
  if (typeof globalThis.gtag !== 'function') {
    console.warn('GA not initialized')
    return
  }
  map = map || gameMap()

  const params = {
    event_category: 'Engagement',
    event_label: button,
    level_name: map.title || 'unknown',
    terrain: map.terrain || 'unknown',
    height: map.rows || 0,
    width: map.cols || 0,
    mode: document.title
  }

  globalThis.gtag('event', 'button_click', params)
}

export function trackTab (tab) {
  if (typeof globalThis.gtag !== 'function') {
    console.warn('GA not initialized')
    return
  }

  const params = {
    event_category: 'Engagement',
    event_label: tab,
    mode: document.title
  }

  globalThis.gtag('event', 'tab_click', params)
}
