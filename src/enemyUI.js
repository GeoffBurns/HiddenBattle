import { gameMap, gameMaps } from './maps.js'
import { gameStatus, WatersUI } from './playerUI.js'

import { trackLevelEnd } from './navbar.js'
class EnemyUI extends WatersUI {
  constructor () {
    super('enemy', 'Enemy')
    this.weaponBtn = document.getElementById('weaponBtn')
    this.revealBtn = document.getElementById('revealBtn')
  }
  displayFleetSunk () {
    gameStatus.display('Fleet Destroyed', 'All  - Well Done!')
    this.board.classList.add('destroyed')
    trackLevelEnd(gameMap(), true)
  }

  revealAll (ships) {
    for (const ship of ships) {
      this.revealShip(ship)
    }

    gameStatus.display('Enemy Fleet Revealed', 'You Gave Up')
    this.board.classList.add('destroyed')
  }

  displayAsSunk (cell, letter) {
    const maps = gameMaps()
    cell.textContent = letter
    cell.style.color = maps.shipLetterColors[letter] || '#fff'
    cell.style.background = maps.shipColors[letter] || 'rgba(255,255,255,0.2)'
    this.clearCell(cell)
  }
  cellSunkAt (r, c, letter) {
    const cell = this.gridCellAt(r, c)
    this.displayAsSunk(cell, letter)
  }
  reset () {
    this.board.innerHTML = ''
    this.board.classList.remove('destroyed')
    gameStatus.display('Single Shot Mode', 'Click On Square To Fire')
  }
}
export const enemyUI = new EnemyUI()
