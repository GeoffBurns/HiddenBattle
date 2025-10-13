import { heightUI, mapUI, widthUI, listUI } from './chooseUI.js'
import { gameMaps } from './maps.js'
import { custom } from './custom.js'
import { SavedCustomMap } from './map.js'

export function removeShortcuts () {
  document.removeEventListener('keydown')
}

export function switchToEdit (mapName) {
  const params = new URLSearchParams()
  params.append('edit', mapName)

  const location = `./battlebuild.html?${params.toString()}`
  window.location.href = location
}

export function switchTo (target, huntMode, mapName) {
  const params = new URLSearchParams()
  mapName = mapName || gameMaps.current.title
  params.append('mapName', mapName)

  if (huntMode === 'build' && custom.noOfPlacedShips() > 0) {
    custom.store()
    gameMaps.addCurrentCustomMap(custom.placedShips())
    params.append('placedShips', '')
  }

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
    window.print()
  })

  document.getElementById('tab-about')?.addEventListener('click', function () {
    window.location.href =
      'https://geoffburns.blogspot.com/2015/10/pencil-and-paper-battleships.html'
  })
  document.getElementById('tab-source')?.addEventListener('click', function () {
    window.location.href = 'https://github.com/GeoffBurns/battleship'
  })
}

function setupMapControl (mapName, boardSetup, refresh) {
  mapName = mapName || gameMaps.getLastMapTitle()

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
  setupTabs('list')

  listUI.setup(function (index, text) {
    refresh(index, text)
  }, 0)
}

export function setupGameOptions (boardSetup, refresh, huntMode) {
  // Define urlParams using the current window's search string
  const placedShips = setupMapSelection(boardSetup, refresh)
  boardSetup()
  setupTabs(huntMode)
  return placedShips
}
export function setupPrintOptions (boardSetup, refresh, huntMode) {
  // Define urlParams using the current window's search string
  const targetMap = setupMapSelectionPrint(boardSetup, refresh)
  boardSetup()
  setupTabs(huntMode)
  return targetMap
}
export function setupBuildOptions (boardSetup, refresh, huntMode, editHandler) {
  // Define urlParams using the current window's search string

  setupTabs(huntMode)
  const targetMap = setupMapOptions(boardSetup, refresh, huntMode)
  if (targetMap && editHandler) {
    editHandler(targetMap)
  } else {
    boardSetup()
  }
  return targetMap
}
