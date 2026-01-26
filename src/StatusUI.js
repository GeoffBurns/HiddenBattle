export class StatusUI {
  constructor () {
    this.mode = document.getElementById('modeStatus')
    this.game = document.getElementById('gameStatus')
    this.right = document.getElementById('statusRight')
    this.counter = document.getElementById('ammoCounter')
    this.total = document.getElementById('ammoCounterTotal')
    this.left = document.getElementById('ammoCounterLeft')
    this.icon1 = document.getElementById('modeIcon1')
    this.icon2 = document.getElementById('modeIcon2')
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
  displayAmmoStatus (wps, maps, idx = 0) {
    const weapon = wps.weapon
    const ammo = wps.ammoLeft()
    const letter = weapon.letter
    this.counter.classList.remove('hidden')
    this.icon1.classList.remove('hidden')
    if (weapon.isLimited) {
      const total = wps.ammoTotal()

      this.total.textContent = total
      this.left.textContent = ammo
      if (weapon.totalCursors >= 2) {
        this.icon2.textContent = ''
        this.icon2.style.background = maps.shipColors[letter + `2`]
        this.icon2.className = 'mode-icon tally-box ' + weapon.classname
        this.icon2.classList.remove('hidden')
      } else {
        this.icon2.classList.add('hidden')
      }
      this.icon1.textContent = ''
      this.icon1.style.background = maps.shipColors[letter + `1`]
      this.icon1.className = 'mode-icon tally-box ' + weapon.classname
    } else {
      this.total.textContent = '∞'
      this.left.textContent = '∞'
      this.icon1.style.background = 'white'
      this.icon1.className = 'mode-icon tally-box single'
      this.icon2.classList.add('hidden')
    }

    //return this.display(weapon.ammoStatus(ammo), weapon.hints[idx])
    return this.display('', weapon.hints[idx])
  }
  info (game) {
    this.game.textContent = game
  }
}

export const gameStatus = new StatusUI()
