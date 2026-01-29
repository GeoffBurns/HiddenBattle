import { bh } from './terrain.js'
import { gameStatus } from './StatusUI.js'
import { placedShipsInstance } from './selection.js'
import { fetchNavBar } from './navbar.js'
import { setupGameOptions } from './setupOptions.js'
import {
  dragOverPlacingHandlerSetup,
  onClickRotate,
  onClickFlip,
  onClickRotateLeft,
  onClickTransform,
  tabCursor,
  enterCursor
} from './dragndrop.js'
import { moveCursorBase } from './placementUI.js'
import { enemy } from './enemy.js'
import { setupEnemy, newGame } from './enemySetup.js'
import { makeFriend } from './rules.js'

const friend = makeFriend()
placedShipsInstance.registerUndo(friend.UI.undoBtn)
const friendUI = friend.UI

friendUI.resetBoardSize()

function onClickTest () {
  friend.test.bind(friend)()
}
let removeHideShorcuts = null
let removeSeekShorcuts = null
function onClickReturnToPlacement () {
  const enemyContainer = document.getElementById('enemy-container')
  enemyContainer.classList.add('hidden')

  const tallyTitle = document.getElementById('tally-title')
  const tallyBox = document.getElementById('friend-tally-container')
  tallyBox.prepend(tallyTitle)
  if (removeSeekShorcuts) removeSeekShorcuts()

  removeHideShorcuts = setupHideShortcuts()
  enemy.opponent = null
  friend.opponent = null
  newPlacement()
}

function resetFriendBoard () {
  friend.restartFriendBoard()
  friend.updateUI(friend.ships)
}
function onClickSeek () {
  friendUI.seekMode()
  playBH()
}

function highlightAoE (model, r, c) {
  const map = bh.map
  if (!map.inBounds(r, c)) return
  const viewModel = model.UI
  const coords = model.loadOut?.coords
  const wps = model.loadOut?.selectedWeapon || model.loadOut.weaponSystem()
  const weapon = wps?.weapon
  viewModel.removeHighlightAoE()
  const newCoords = [...coords, [r, c]]
  if (!weapon || weapon.points > newCoords.length) return
  const cells = weapon.aoe(map, newCoords)
  for (const [rr, cc, power] of cells) {
    if (map.inBounds(rr, cc)) {
      const cellClass = bh.spashTags[power]
      const cell = viewModel.gridCellAt(rr, cc)
      cell.classList.add(cellClass)
    }
  }
}
function playBH () {
  const enemyContainer = document.getElementById('enemy-container')
  enemyContainer.classList.remove('hidden')

  gameStatus.line.classList.add('small')

  const tallyTitle = document.getElementById('tally-title')
  const placeControls = document.getElementById('place-controls')
  placeControls.appendChild(tallyTitle)
  if (removeHideShorcuts) removeHideShorcuts()

  enemy.opponent = friend
  friend.opponent = enemy

  removeSeekShorcuts = setupEnemy(onClickReturnToPlacement)
  enemy.UI.resetBoardSize()
  friend.setupUntried()

  newGame('hide', resetFriendBoard, friendUI)
  enemy.UI.buildBoardHover(
    highlightAoE,
    enemy.UI.removeHighlightAoE,
    enemy.UI,
    enemy
  )
}

function onClickAuto () {
  friend.autoPlace2()
  if (!bh.test) {
    playBH()
  }
}
function onClickUndo () {
  if (!friendUI.placingShips) {
    friendUI.placeMode()
  }
  friend.resetShipCells()
  friendUI.clearVisuals()
  friend.score.reset()
  const ship = placedShipsInstance.popAndRefresh(
    friend.shipCellGrid,
    ship => {
      friendUI.markPlaced(ship.cells, ship)
    },
    ship => {
      friendUI.addShipToTrays(friend.ships, ship)
    }
  )
  friendUI.unplacement(friend, ship)
}

function onClickStop () {
  friend.testContinue = false
  friendUI.readyMode()
  friendUI.testBtn.disabled = false
}

function wireupButtons () {
  friendUI.newPlacementBtn.addEventListener('click', newPlacement)
  friendUI.rotateBtn.addEventListener('click', onClickRotate)
  friendUI.rotateLeftBtn.addEventListener('click', onClickRotateLeft)
  friendUI.transformBtn.addEventListener('click', onClickTransform)
  friendUI.flipBtn.addEventListener('click', onClickFlip)
  friendUI.undoBtn.addEventListener('click', onClickUndo)
  friendUI.autoBtn.addEventListener('click', onClickAuto)
  friendUI.testBtn.addEventListener('click', onClickTest)
  friendUI.seekBtn.addEventListener('click', onClickSeek)
  friendUI.stopBtn.addEventListener('click', onClickStop)
}

function moveCursor (event) {
  moveCursorBase(event, friendUI, friend)
}

function setupHideShortcuts () {
  function handleHideShortcuts (event) {
    switch (event.key) {
      case 'c':
      case 'C':
        newPlacement()
        break
      case 'r':
      case 'R':
        onClickRotate()
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
      case 't':
      case 'T':
        onClickTest()
        break
      case 's':
      case 'S':
        onClickStop()
        break
      case 'u':
      case 'U':
        onClickUndo()
        break
      case 'ArrowUp':
      case 'ArrowDown':
      case 'ArrowLeft':
      case 'ArrowRight':
        moveCursor(event)
        break
      case 'Tab':
        tabCursor(event, friendUI, friend)
        break
      case 'Enter':
        enterCursor(event, friendUI, friend)
        break
    }
  }

  document.addEventListener('keydown', handleHideShortcuts)

  return () => document.removeEventListener('keydown', handleHideShortcuts)
}

function newPlacement () {
  friend.testContinue = false
  friendUI.testBtn.disabled = false
  friendUI.seekBtn.disabled = false
  friend.ships = []
  friendUI.clearVisuals()
  friendUI.placeMode()
  friend.resetModel()
  friend.resetUI(friend.ships)

  friendUI.rotateBtn.disabled = true
  friendUI.flipBtn.disabled = true
  friendUI.rotateLeftBtn.disabled = true
  friendUI.transformBtn.disabled = true
  friendUI.undoBtn.disabled = true
  friendUI.showMapTitle()
}
// wire buttons
wireupButtons()

dragOverPlacingHandlerSetup(friend, friendUI)
removeHideShorcuts = setupHideShortcuts()

fetchNavBar('hide', "Geoff's Hidden Battle (Hide & Seek)", function () {
  document.getElementById('choose-map-container').classList.remove('hidden')

  const placedShips = setupGameOptions(
    friendUI.resetBoardSize.bind(friendUI),
    newPlacement
  )
  // initial
  newPlacement()

  if (placedShips) {
    friend.load(null)
    friend.updateUI(friend.ships)
    friendUI.gotoNextStageAfterPlacement()
    if (!bh.test) {
      playBH()
    }
  }
})
