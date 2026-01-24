import { gameMaps } from './gameMaps.js'

export class StatusUI {
  constructor () {
    this.mode = document.getElementById('modeStatus')
    this.game = document.getElementById('gameStatus')
    this.right = document.getElementById('statusRight')
    this.counter = document.getElementById('ammoCounter')
    this.total = document.getElementById('ammoCounterTotal')
    this.left = document.getElementById('ammoCounterLeft')
    this.icons = document.getElementById('modeIcons')
    this.line = document.getElementById('statusLine')
    this.line2 = document.getElementById('statusLine2')
  }
  clear () {
    this.display('', '')
  }
  display (mode, game) {
    this.mode.textContent = mode
    if (game) {
      this.info(game)
    }
  }
  displayAmmoStatus (wps, idx = 0) {
    const weapon = wps.weapon
    const ammo = wps.ammoLeft()
    const maps = gameMaps()
    const letter = weapon.letter
    this.counter.classList.remove('hidden')
    this.icons.classList.remove('hidden')
    if (weapon.isLimited) {
      const total = wps.ammoTotal()
      this.total.textContent = total
      this.left.textContent = ammo
      this.icons.textContent = '' //weaponSystem.weapon.letter
      this.icons.style.background = maps.shipColors[letter]
      this.icons.className = 'tally-box ' + weapon.classname
    } else {
      this.total.textContent = '∞'
      this.left.textContent = '∞'
      this.icons.style.background = 'white' // 'transparent'
      this.icons.className = 'tally-box single'
    }

    //return this.display(weapon.ammoStatus(ammo), weapon.hints[idx])
    return this.display('', weapon.hints[idx])
  }
  info (game) {
    this.game.textContent = game
  }
}
