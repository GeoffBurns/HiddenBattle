import { customUI } from './customUI.js'
import { moveCursorBase } from './placementUI.js'
import {
  dragOverAddingHandlerSetup,
  onClickRotate,
  onClickFlip,
  onClickRotateLeft,
  onClickTransform,
  tabCursor,
  enterCursor,
  setupDragHandlers,
  setupDragBrushHandlers,
  dragNDrop
} from './dragndrop.js'
import { placedShipsInstance } from './selection.js'
import { custom } from './custom.js'
import { gameMap, gameMaps } from './maps.js'
import {
  setupBuildOptions,
  validateHeight,
  validateWidth,
  switchTo,
  switchToEdit,
  fetchNavBar,
  trackLevelEnd,
  tabs
} from './navbar.js'
import { terrain } from './Shape.js'
customUI.resetBoardSize()

placedShipsInstance.registerUndo(customUI.undoBtn, customUI.resetBtn)
function onClickUndo () {
  custom.resetShipCells()
  customUI.clearVisuals()
  custom.score.reset()
  placedShipsInstance.popAndRefresh(
    custom.shipCellGrid,
    ship => {
      customUI.markPlaced(ship.cells, ship.letter)
    },
    ship => {
      customUI.subtraction(custom, ship)
    }
  )
}

function onClickAccept (editingMap) {
  const ships = custom.createCandidateShips()
  custom.candidateShips = ships
  if (editingMap) {
    custom.setMap()
  }
  custom.resetShipCells()
  customUI.buildBoard()
  customUI.addShipMode(ships)
  customUI.displayShipTrackingInfo(custom)

  customUI.makeAddDroppable(custom)
  setupDragHandlers(customUI)
  customUI.placelistenCancellables.push(
    dragOverAddingHandlerSetup(custom, customUI)
  )
}
function onClickDefault () {
  gameMaps().setToDefaultBlank(validateHeight(), validateWidth())
  customUI.refreshAllColor()

  customUI.score.displayZoneInfo()
  customUI.resetClearBtn()
}
function clearShips () {
  customUI.showNotice('ships removed')
  custom.resetShipCells()
  customUI.clearVisuals()
  custom.score.reset()
  placedShipsInstance.popAll(ship => {
    customUI.subtraction(custom, ship)
  })
  custom.ships = []
}
function onClickClear () {
  if (customUI.placingShips) {
    clearShips()
    customUI.setTrays()
    newPlacement()
    customUI.displayShipTrackingInfo(custom)
    return
  }

  gameMaps().clearBlank()
  customUI.refreshAllColor()
  customUI.score.displayZoneInfo()
  customUI.resetClearBtn()
}
function seekMap () {
  trackLevelEnd(gameMap(), true)
  switchTo('battleseek', 'build')
}
function playMap () {
  trackLevelEnd(gameMap(), true)
  switchTo('index', 'build')
}

function saveMap () {
  const saveMap = gameMap()
  trackLevelEnd(saveMap, false)
  switchToEdit(saveMap, 'build')
}

function wireupButtons () {
  customUI.newPlacementBtn.addEventListener('click', onClickClear)
  customUI.acceptBtn.addEventListener('click', onClickAccept.bind(null, false))
  customUI.reuseBtn.addEventListener('click', onClickDefault)
  customUI.resetBtn.addEventListener('click', clearShips)
  customUI.publishBtn.addEventListener('click', playMap)
  customUI.saveBtn.addEventListener('click', saveMap)
  customUI.rotateBtn.addEventListener('click', onClickRotate)
  customUI.rotateLeftBtn.addEventListener('click', onClickRotateLeft)
  customUI.flipBtn.addEventListener('click', onClickFlip)
  customUI.transformBtn.addEventListener('click', onClickTransform)
  customUI.undoBtn.addEventListener('click', onClickUndo)

  dragNDrop.takeDrop(customUI, custom)
}

function moveCursor (event) {
  moveCursorBase(event, customUI, custom)
}

function setupBuildShortcuts () {
  function handleBuildShortcuts (event) {
    switch (event.key) {
      case 'a':
      case 'A':
        onClickAccept.bind(null, false)
        break
      case 'c':
      case 'C':
        onClickClear()
        break
      case 'd':
      case 'D':
        onClickDefault()
        break
      case 'r':
      case 'R':
        onClickRotate()
        break
      case 's':
      case 'S':
        clearShips()
        break
      case 'l':
      case 'L':
        onClickRotateLeft()
        break
      case 'f':
      case 'F':
        onClickFlip()
        break
      case 'x':
      case 'X':
        onClickTransform()
        break
      case 'u':
      case 'U':
        onClickUndo()
        break
      case 'p':
      case 'P':
        playMap()
        break
      case 'v':
      case 'V':
        saveMap()
        break
      case 'ArrowUp':
      case 'ArrowDown':
      case 'ArrowLeft':
      case 'ArrowRight':
        moveCursor(event)
        break
      case 'Tab':
        tabCursor(event, customUI, custom)
        break
      case 'Enter':
        enterCursor(event, customUI, custom)
        break
    }
  }

  document.addEventListener('keydown', handleBuildShortcuts)

  return () => document.removeEventListener('keydown', handleBuildShortcuts)
}

function setReuseBtn () {
  customUI.reuseBtn.disabled = !gameMaps().hasMapSize(
    validateHeight(),
    validateWidth()
  )
}

function newPlacement () {
  customUI.resetAdd(custom)
  customUI.buildBoard((_r, _c) => {})
  customUI.showBrushTrays()
  customUI.makeBrushable()
  customUI.buildBrushTray(terrain.current)
  customUI.brushMode()
  customUI.acceptBtn.disabled = false
  setReuseBtn()
  customUI.score.setupZoneInfo(custom, customUI)
  customUI.rotateBtn.disabled = true
  customUI.flipBtn.disabled = true
  customUI.rotateLeftBtn.disabled = true
  customUI.undoBtn.disabled = true
  customUI.resetBtn.disabled = true
}
// wire buttons
wireupButtons()

setupBuildShortcuts()

fetchNavBar('build', 'Create Your Own Game', function () {
  document.getElementById('second-tab-bar').classList.remove('hidden')
  document.getElementById('height-container').classList.remove('hidden')
  document.getElementById('width-container').classList.remove('hidden')

  const editing = setupBuildOptions(
    customUI.resetBoardSize.bind(customUI),
    newPlacement,
    'build',
    onClickAccept.bind(null, true)
  )

  if (editing) {
    custom.loadForEdit(editing)
  } else {
    setupDragBrushHandlers(customUI)
    // initial
    newPlacement()
  }

  tabs.hide?.overrideClickListener(playMap)
  tabs.seek?.overrideClickListener(seekMap)
})
