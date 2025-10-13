import { ChooseFromListUI, ChooseNumberUI } from './chooseUI.js'
import { gameMaps } from './maps.js'
import { custom } from './custom.js'
import { SavedCustomMap } from './map.js'

export function removeShortcuts () {
  document.removeEventListener('keydown')
}

export function switchToEdit (mapName, huntMode) {
  const params = new URLSearchParams()
  params.append('edit', mapName)

  storeShips(params, huntMode)
  const location = `./battlebuild.html?${params.toString()}`
  window.location.href = location
}

function storeShips (params, huntMode) {
  if (huntMode === 'build' && custom.noOfPlacedShips() > 0) {
    custom.store()
    gameMaps.addCurrentCustomMap(custom.placedShips())
    params.append('placedShips', '')
  }
}

export function switchTo (target, huntMode, mapName) {
  const params = new URLSearchParams()
  mapName = mapName || gameMaps.current.title
  params.append('mapName', mapName)

  storeShips(params, huntMode)

  const location = `./${target}.html?${params.toString()}`
  window.location.href = location
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

    input.onchange = e => {
      const file = e.target.files[0]
      if (!file) return

      const reader = new FileReader()
      reader.onload = evt => {
        try {
          const map = new SavedCustomMap(JSON.parse(evt.target.result))
          if (gameMaps.getMap(map.title) || gameMaps.getCustomMap(map.title)) {
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
      reader.readAsText(file)
    }

    // Trigger the file dialog
    input.click()
  }
  if (huntMode === 'build') {
    document.getElementById('tab-build').classList.add('you-are-here')
    document.getElementById('tab-add').classList.add('you-are-here')
  } else {
    document
      .getElementById('tab-build')
      ?.addEventListener('click', switchToBuild)

    document.getElementById('tab-add')?.addEventListener('click', function () {
      window.location.href = './battlebuild.html'
    })
  }

  if (huntMode === 'hide') {
    document.getElementById('tab-hide').classList.add('you-are-here')
  } else {
    document.getElementById('tab-hide')?.addEventListener('click', switchToHide)
  }

  if (huntMode === 'seek') {
    document.getElementById('tab-seek').classList.add('you-are-here')
  } else {
    document.getElementById('tab-seek')?.addEventListener('click', switchToSeek)
  }

  if (huntMode === 'list') {
    document.getElementById('tab-build').classList.add('you-are-here')
    document.getElementById('tab-list').classList.add('you-are-here')
  } else {
    document.getElementById('tab-list')?.addEventListener('click', switchToList)
  }

  if (huntMode !== 'import') {
    document
      .getElementById('tab-import')
      ?.addEventListener('click', switchToImport)
  }
  if (huntMode === 'print') {
    document.getElementById('tab-build').classList.add('you-are-here')
    document.getElementById('tab-print').classList.add('you-are-here')
  }
  document.getElementById('tab-print')?.addEventListener('click', function () {
    trackTab('print')
    window.print()
  })

  document.getElementById('tab-about')?.addEventListener('click', function () {
    trackTab('go to blog')
    window.location.href =
      'https://geoffburns.blogspot.com/2015/10/pencil-and-paper-battleships.html'
  })
  document.getElementById('tab-source')?.addEventListener('click', function () {
    trackTab('go to source code')
    window.location.href = 'https://github.com/GeoffBurns/battleship'
  })
}

function setupMapControl (mapName, boardSetup, refresh) {
  mapName = mapName || gameMaps.getLastMapTitle()
  const mapTitles = (() => {
    try {
      return gameMaps.mapTitles()
    } catch (error) {
      console.error('An error occurred:', error.message, gameMaps.mapTitles)
      return []
    }
  })()

  const mapUI = new ChooseFromListUI(mapTitles, 'chooseMap')
  mapUI.setup(
    function (_index, title) {
      gameMaps.setTo(title)
      boardSetup()
      refresh()
      gameMaps.storeLastMap()
    },
    null,
    mapName
  )

  gameMaps.setTo(mapName)
}

function setupMapSelectionPrint (boardSetup, refresh) {
  const urlParams = new URLSearchParams(window.location.search)
  const mapName = urlParams.getAll('mapName')[0]

  const targetMap = gameMaps.getMap(mapName)
  setupMapControl(mapName, boardSetup, refresh)

  return targetMap
}
function setupMapSelection (boardSetup, refresh) {
  const urlParams = new URLSearchParams(window.location.search)
  const mapChoices = urlParams.getAll('mapName')
  const placedShips = urlParams.has('placedShips')

  setupMapControl(mapChoices[0], boardSetup, refresh)

  return placedShips
}
let widthUI = null
let heightUI = null

export function validateWidth () {
  let width = parseInt(widthUI.choose.value, 10)
  if (isNaN(width) || width < gameMaps.minWidth || width > gameMaps.maxWidth) {
    width = widthUI.min
    widthUI.choose.value = width
  }
  return width
}

export function validateHeight () {
  let height = parseInt(heightUI.choose.value, 10)
  if (
    isNaN(height) ||
    height < gameMaps.minHeight ||
    height > gameMaps.maxHeight
  ) {
    height = heightUI.min
    heightUI.choose.value = height
  }
  return height
}

function setupMapOptions (boardSetup, refresh, huntMode) {
  const urlParams = new URLSearchParams(window.location.search)
  huntMode = huntMode || 'build'

  widthUI = new ChooseNumberUI(
    gameMaps.minWidth,
    gameMaps.maxWidth,
    1,
    'chooseWidth'
  )
  heightUI = new ChooseNumberUI(
    gameMaps.minHeight,
    gameMaps.maxHeight,
    1,
    'chooseHeight'
  )
  const targetMap = gameMaps.getEditableMap(urlParams.getAll('edit')[0])

  const templateMap =
    targetMap ||
    gameMaps.getMap(urlParams.getAll('mapName')[0]) ||
    gameMaps.getLastMap()

  let mapWidth = targetMap?.cols || gameMaps.getLastWidth(templateMap?.cols)
  let mapHeight = targetMap?.rows || gameMaps.getLastHeight(templateMap?.rows)

  setupTabs(huntMode)

  widthUI.setup(function (_index) {
    const width = validateWidth()
    const height = validateHeight()
    gameMaps.setToBlank(height, width)

    gameMaps.storeLastWidth(width)

    boardSetup()
    refresh()
  }, mapWidth)

  heightUI.setup(function (_index) {
    const width = validateWidth()
    const height = validateHeight()
    gameMaps.setToBlank(height, width)
    gameMaps.storeLastHeight(height)
    boardSetup()
    refresh()
  }, mapHeight)

  if (targetMap) {
    gameMaps.current = targetMap
    boardSetup()
    refresh()
  } else {
    gameMaps.setToBlank(mapHeight, mapWidth)
  }

  return targetMap
}

export function setupMapListOptions (refresh) {
  const listUI = new ChooseFromListUI(
    ['Custom Maps Only', 'All Maps', 'Pre-Defined Maps Only'],
    'chooseList'
  )

  listUI.setup(function (index, text) {
    refresh(index, text)
  }, 0)
}

export function setupGameOptions (boardSetup, refresh) {
  const placedShips = setupMapSelection(boardSetup, refresh)
  boardSetup()
  return placedShips
}

export function setupPrintOptions (boardSetup, refresh) {
  const targetMap = setupMapSelectionPrint(boardSetup, refresh)
  boardSetup()
  return targetMap
}

export function setupBuildOptions (boardSetup, refresh, huntMode, editHandler) {
  const targetMap = setupMapOptions(boardSetup, refresh, huntMode)
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
  window.dataLayer = window.dataLayer || []

  // define gtag only if not already defined
  if (!window.gtag) {
    window.gtag = function gtag () {
      window.dataLayer.push(arguments)
    }
  }

  // If gtag.js already loaded, don't insert again
  const alreadyLoaded = !!document.querySelector(
    `script[src^="https://www.googletagmanager.com/gtag/js?id=${GA_ID}"]`
  )

  // call basic setup immediately (safe to call before script loads)
  window.gtag('js', new Date())
  window.gtag('config', GA_ID, { debug_mode: true })

  if (!alreadyLoaded) {
    const script = document.createElement('script')
    script.async = true
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`
    document.head.appendChild(script)
  }
}

export function fetchNavBar (tab, title, callback) {
  initGA(GA_ID)
  fetch('./navbars.html')
    .then(res => res.text())
    .then(html => {
      document.getElementById('navbar').innerHTML = html
      document.getElementById('print-title').textContent = title
      setupTabs(tab)
      if (typeof callback === 'function') callback()
    })
    .catch(err => {
      console.error('Failed to load navbars:', err)
      if (typeof callback === 'function') callback(err)
    })
}

export const gtag = window.gtag

export function trackLevelEnd (map, success) {
  if (typeof window.gtag !== 'function') {
    console.warn('GA not initialized')
    return
  }
  map = map || gameMaps.current

  const params = {
    level_name: map.title || 'unknown',
    terrain: map.terrain || 'unknown',
    height: map.rows || 0,
    width: map.cols || 0,
    mode: document.title,
    success: !!success
  }

  window.gtag('event', 'level_end', params)
}

export function trackClick (map, button) {
  if (typeof window.gtag !== 'function') {
    console.warn('GA not initialized')
    return
  }
  map = map || gameMaps.current

  const params = {
    event_category: 'Engagement',
    event_label: button,
    level_name: map.title || 'unknown',
    terrain: map.terrain || 'unknown',
    height: map.rows || 0,
    width: map.cols || 0,
    mode: document.title
  }

  window.gtag('event', 'button_click', params)
}

export function trackTab (tab) {
  if (typeof window.gtag !== 'function') {
    console.warn('GA not initialized')
    return
  }

  const params = {
    event_category: 'Engagement',
    event_label: tab,
    mode: document.title
  }

  window.gtag('event', 'tab_click', params)
}
