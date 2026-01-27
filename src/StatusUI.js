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
  displayAmmoStatus (wps, maps, idx = 0, numCoords = -1) {
    const weapon = wps.weapon

    this.icon1.className = 'mode-icon tally-box'
    this.icon2.className = 'mode-icon tally-box'
    if (weapon.isLimited) {
      const ammo = wps.ammoLeft()
      const letter = weapon.letter
      this.displayLimitedAmmoStatus(wps, ammo, weapon, numCoords, maps, letter)
    } else {
      this.displaySingleShotStatus()
    }

    //return this.display(weapon.ammoStatus(ammo), weapon.hints[idx])
    return this.display('', weapon.hints[idx])
  }
  displayLimitedAmmoStatus (wps, ammo, weapon, numCoords, maps, letter) {
    this.displayAmmoLeft(wps, ammo)
    if (weapon.totalCursors >= 2) {
      this.diplayWhichLaunchStep(numCoords)
      this.displayAimStep(maps, letter, weapon)
    } else {
      this.icon2.classList.add('hidden')
    }
    this.displayLaunchFirstStep(maps, letter, weapon)
  }

  displayLaunchFirstStep (maps, letter, weapon) {
    this.icon1.textContent = ''
    this.icon1.style.background = maps.shipColors[letter + `1`]
    this.icon1.classList.add('mode-icon', 'tally-box', weapon.classname)
  }

  displayAimStep (maps, letter, weapon) {
    this.icon2.textContent = ''
    this.icon2.style.background = maps.shipColors[letter + `2`]
    this.icon2.classList.add('mode-icon', 'tally-box', weapon.classname)
  }
  noLaunchSteps () {
    this.icon1.classList.remove('off')
    this.icon2.classList.remove('off')
    this.icon1.classList.remove('on')
    this.icon2.classList.remove('on')
  }
  diplayWhichLaunchStep (numCoords) {
    switch (numCoords) {
      case 0:
        this.icon1.classList.remove('off')
        this.icon2.classList.add('off')
        this.icon1.classList.add('on')
        this.icon2.classList.remove('on')
        break
      case 1:
        this.icon1.classList.add('off')
        this.icon2.classList.remove('off')
        this.icon1.classList.remove('on')
        this.icon2.classList.add('on')
        break
      default:
        this.noLaunchSteps()
        break
    }
  }

  displayAmmoLeft (wps, ammo) {
    this.counter.classList.remove('hidden')
    const total = wps.ammoTotal()
    this.total.textContent = total
    this.left.textContent = ammo
  }

  displaySingleShotStatus () {
    this.displayInfiniteAmmo()
    this.displaySShotIcon()
  }

  displaySShotIcon () {
    this.icon1.style.background = 'white'
    this.icon1.classList.add('single')
    this.icon2.classList.add('hidden')
  }

  displayInfiniteAmmo () {
    this.counter.classList.remove('hidden')
    this.total.textContent = '∞'
    this.left.textContent = '∞'
  }

  info (game) {
    this.game.textContent = game
  }
}

export const gameStatus = new StatusUI()
