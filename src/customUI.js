import { terrain } from './terrain.js'
import { gameStatus } from './StatusUI.js'
import { PlacementUI } from './placementUI.js'

function landString () {
  return terrain.current?.landSubterrain?.title?.toLowerCase() || 'land'
}
function seaString () {
  return terrain.current?.defaultSubterrain?.title?.toLowerCase() || 'sea'
}
export class CustomUI extends PlacementUI {
  constructor () {
    super('custom', 'Customizing')
    this.reuseBtn = document.getElementById('reuseBtn')
    this.resetBtn = document.getElementById('resetBtn')
    this.acceptBtn = document.getElementById('acceptBtn')
    this.stopBtn = document.getElementById('stopBtn')
    this.undoBtn = document.getElementById('undoBtn')
    this.autoBtn = document.getElementById('autoBtn')
    this.publishBtn = document.getElementById('publishBtn')
    this.saveBtn = document.getElementById('saveBtn')
    this.tips = ['Use shapes create land and sea']
  }
  resetClearBtn () {
    if (this.placingShips) {
      this.newPlacementBtn.disabled = false

      this.newPlacementBtn.innerHTML =
        '<span class="shortcut">C</span>hange ' + terrain.current.mapHeading
    } else {
      this.newPlacementBtn.innerHTML =
        '<span class="shortcut">C</span>lear ' + terrain.current.mapHeading
      this.newPlacementBtn.disabled = !this.score.hasZoneInfo()
    }
  }
  brushMode () {
    for (const cancellable of this.placelistenCancellables) {
      cancellable()
    }

    this.showMapTitle()

    this.placelistenCancellables = []
    this.placingShips = false
    this.resetClearBtn()
    const height = document.getElementById('height-container')
    height.classList.remove('hidden')
    const width = document.getElementById('width-container')
    width.classList.remove('hidden')
    const tallyTitle = document.getElementById('tally-title')
    tallyTitle.classList.add('hidden')
    this.reuseBtn.classList.remove('hidden')
    this.resetBtn.classList.add('hidden')
    this.acceptBtn.classList.remove('hidden')
    this.rotateBtn.classList.add('hidden')
    this.rotateLeftBtn.classList.add('hidden')
    this.transformBtn.classList.add('hidden')
    this.flipBtn.classList.add('hidden')
    this.undoBtn.classList.add('hidden')
    this.autoBtn.classList.add('hidden')
    this.publishBtn.classList.add('hidden')
    this.saveBtn.classList.add('hidden')
    this.testBtn.classList.add('hidden')
    this.seekBtn.classList.add('hidden')
    this.score.placed.textContent = 'None Yet'
    this.score.weaponsPlaced.textContent = 'None Yet'
    this.stopBtn.classList.add('hidden')
    for (const cell of this.board.children) {
      cell.classList.remove('hit', 'placed')
    }

    const panels = document.getElementsByClassName('panel')
    for (const panel of panels) {
      panel.classList.remove('alt')
    }
    gameStatus.clear()
    gameStatus.info(
      `drag blocks across map to create or destroy ${landString()}`
    )
    this.tips = [
      `drag blocks across map to create or destroy ${landString()}`,
      `press accept button when the ${seaString()} and ${landString()} is to your liking`
    ]

    this.showTips()
  }

  addShipMode (ships) {
    for (const cancellable of this.brushlistenCancellables) {
      cancellable()
    }

    this.showFleetTitle()

    this.brushlistenCancellables = []
    this.placingShips = true
    this.resetClearBtn()
    this.showShipTrays()
    const height = document.getElementById('height-container')
    height.classList.add('hidden')
    const width = document.getElementById('width-container')
    width.classList.add('hidden')
    this.reuseBtn.classList.add('hidden')
    this.resetBtn.classList.remove('hidden')
    this.acceptBtn.classList.add('hidden')
    this.newPlacementBtn.disabled = false
    this.score.placedLabel.classList.remove('hidden')
    this.score.weaponsLabel.classList.remove('hidden')
    this.rotateBtn.classList.remove('hidden')
    this.rotateLeftBtn.classList.remove('hidden')
    if (terrain.current.hasTransforms) {
      this.transformBtn.classList.remove('hidden')
    } else {
      this.transformBtn.classList.add('hidden')
    }
    this.transformBtn.classList.remove('hidden')
    this.flipBtn.classList.remove('hidden')
    this.undoBtn.classList.remove('hidden')
    this.autoBtn.classList.add('hidden')
    this.publishBtn.classList.remove('hidden')
    this.saveBtn.classList.remove('hidden')
    this.buildTrays(ships)
    this.buildWeaponTray()
    gameStatus.game.classList.remove('hidden')
    gameStatus.mode.classList.remove('hidden')
    gameStatus.line.classList.remove('hidden', 'small')
    gameStatus.line.classList.add('medium')
    const panels = document.getElementsByClassName('panel')
    for (const panel of panels) {
      panel.classList.remove('alt')
    }

    gameStatus.clear()
    gameStatus.info('drag ships to the map grid to add them to your map')
    this.s = [
      'drag ships to the map grid to add them to your map',
      'drag weapons on to the map to increase the ammunition available',
      'drag weapons tally-boxes back to the tray to remove a weapon'
    ]
    this.showTips()
  }
}

export const customUI = new CustomUI()
