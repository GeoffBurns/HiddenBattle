import { bh } from '../terrain.js'
import { gameStatus } from './StatusUI.js'
import { PlacementUI } from './placementUI.js'
import { trackLevelEnd } from '../gtag.js'

export class FriendUI extends PlacementUI {
  constructor () {
    super('friend', 'Friendly')
    this.showShips = true
    this.tips = [
      'Drag ships from the trays onto the board.',
      'Click a ship in the tray to select it, then click on the buttons to rotate and flip',
      'While a ship is selected, use the rotate, rotate left and flip buttons to change its orientation.',
      'You can also use modifier keys while dragging: Control (or Command on Mac) to rotate left, Option (or Alt) to flip, Shift to rotate right.',
      'Use the undo button to remove the last placed ship.',
      'Once all ships are placed, you can test your placement or start a game against the computer.'
    ]

    this.addText = ' placed'
    this.removeText = ' unplaced'
  }

  displayFleetSunk () {
    gameStatus.display('Your Fleet is Destroyed', '')
    this.board.classList.add('destroyed')
    trackLevelEnd(bh.map, false)
  }

  cellHit (r, c) {
    const cell = this.gridCellAt(r, c)
    this.cellHitBase(cell)
    gameStatus.info('You where hit!')
  }
  placeMode () {
    this.placingShips = true
    this.readyingShips = false
    const chooseControls = document.getElementById('choose-controls')
    chooseControls.classList.remove('hidden')
    this.newPlacementBtn.classList.remove('hidden')
    this.testBtn.classList.add('hidden')
    this.seekBtn.classList.add('hidden')
    this.score.shotsLabel.classList.add('hidden')
    this.score.hitsLabel.classList.add('hidden')
    this.score.sunkLabel.classList.add('hidden')
    this.score.placedLabel.classList.remove('hidden')
    this.rotateBtn.classList.remove('hidden')
    this.rotateLeftBtn.classList.remove('hidden')
    if (bh.terrain.hasTransforms) {
      this.transformBtn.classList.remove('hidden')
    } else {
      this.transformBtn.classList.add('hidden')
    }
    this.flipBtn.classList.remove('hidden')
    this.undoBtn.classList.remove('hidden')
    this.autoBtn.classList.remove('hidden')
    this.stopBtn.classList.add('hidden')
    this.showShipTrays()
    gameStatus.game.classList.remove('hidden')
    gameStatus.mode.classList.remove('hidden')
    gameStatus.line.classList.remove('hidden', 'small')
    gameStatus.line.classList.add('medium')
    const panels = document.getElementsByClassName('panel')
    for (const panel of panels) {
      panel.classList.remove('alt')
    }

    this.showTips()
  }
  readyMode () {
    this.placingShips = false
    this.readyingShips = true
    const chooseControls = document.getElementById('choose-controls')
    chooseControls.classList.add('hidden')
    this.testBtn.classList.remove('hidden')
    this.seekBtn.classList.remove('hidden')
    this.rotateBtn.classList.add('hidden')
    this.rotateLeftBtn.classList.add('hidden')
    this.transformBtn.classList.add('hidden')
    this.flipBtn.classList.add('hidden')
    this.undoBtn.classList.add('hidden')
    //this.undoBtn.classList.remove('hidden')
    // this.undoBtn.disabled = false
    this.autoBtn.classList.add('hidden')
    this.stopBtn.classList.add('hidden')
    this.hideShipTrays()
    for (const cell of this.board.children) {
      cell.classList.remove('hit', 'placed')
    }

    gameStatus.game.classList.remove('hidden')
    gameStatus.mode.classList.remove('hidden')
    gameStatus.line.classList.remove('hidden', 'small')
    gameStatus.line.classList.add('medium')
    const panels = document.getElementsByClassName('panel')
    for (const panel of panels) {
      panel.classList.remove('alt')
    }
    this.hideTips()
    gameStatus.clear()
    gameStatus.info('test your placement or play a game against the computer')
  }
  testMode () {
    this.placingShips = false
    this.readyingShips = false
    this.testBtn.classList.remove('hidden')
    this.seekBtn.classList.remove('hidden')
    this.unreadyMode()
    gameStatus.line.classList.add('medium')
  }

  unreadyMode () {
    this.stopBtn.classList.remove('hidden')
    this.score.shotsLabel.classList.remove('hidden')
    this.score.hitsLabel.classList.remove('hidden')
    this.score.sunkLabel.classList.remove('hidden')
    this.score.placedLabel.classList.add('hidden')
    this.rotateBtn.classList.add('hidden')
    this.rotateLeftBtn.classList.add('hidden')
    this.transformBtn.classList.add('hidden')
    this.flipBtn.classList.add('hidden')
    this.undoBtn.classList.add('hidden')
    this.autoBtn.classList.add('hidden')
    this.hideShipTrays()
    this.hideTips()
    gameStatus.game.classList.remove('hidden')
    gameStatus.mode.classList.remove('hidden')
    gameStatus.line.classList.remove('hidden')
  }

  seekMode () {
    this.placingShips = false
    this.testBtn.classList.add('hidden')
    this.newPlacementBtn.classList.add('hidden')
    this.seekBtn.classList.add('hidden')
    this.unreadyMode()

    gameStatus.line.classList.remove('medium')
    gameStatus.line2.classList.remove('medium')
    gameStatus.line2.classList.add('small')
    const panels = document.getElementsByClassName('panel')
    for (const panel of panels) {
      panel.classList.add('alt')
    }
  }
  gotoNextStageAfterPlacement () {
    if (bh.test) {
      this.readyMode()
    } else {
      this.readyMode()
      this.seekMode()
    }
  }
}
