const MAX_LINES = 20

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
    this.list = document.getElementById('statusList')
    this.chevronBox = document.getElementById('chevron-box')
    this.chevron = document.getElementById('chevron')
  }
  clear () {
    this.display('', '')
  }

  prependLine (text) {
    if (!text || text === '' || text === 'Single Shot Mode') return
    const line = document.createElement('div')
    line.className = 'status small detail-line'
    line.textContent = text

    // add to beginning
    this.list.prepend(line)

    // remove excess lines from bottom
    while (this.list.children.length > MAX_LINES) {
      this.list.removeChild(this.list.lastChild)
    }
    const length = this.list.children.length
    const willShow = length > 0
    if (willShow) {
      this.chevron.classList.remove('hidden')
      this.list.classList.remove('hidden')
    } else {
      this.chevron.classList.add('hidden')
      this.list.classList.add('hidden')
    }
  }
  display (mode, game) {
    this.prependLine(this.mode.textContent)
    this.mode.textContent = mode
    if (game) {
      this.info(game)
    }
  }
  displayAmmoStatus (wps, maps, idx = -1, numCoords = -1, selectedWps = null) {
    if (
      !wps ||
      (selectedWps && wps.weapon.letter !== selectedWps.weapon.letter)
    )
      return
    const weapon = wps.weapon
    const selected = selectedWps ? 1 : 0
    this.icon1.className = 'mode-icon tally-box'
    this.icon2.className = 'mode-icon tally-box'
    let idxUsed = idx
    if (weapon.isLimited) {
      const ammo = wps.ammoLeft()
      const letter = weapon.letter
      idxUsed = this.displayLimitedAmmoStatus(
        wps,
        ammo,
        weapon,
        numCoords,
        maps,
        letter,
        selected
      )
    } else {
      idxUsed = this.displaySingleShotStatus()
    }
    return this.display('', weapon.stepHint(idxUsed))
  }
  displayLimitedAmmoStatus (wps, ammo, weapon, numCoords, maps, letter, select) {
    this.displayAmmoLeft(wps, ammo)
    if (weapon.numStep >= 2) {
      const idx = weapon.stepIdx(numCoords, select)
      this.diplayWhichLaunchStep(idx)
      this.displayAimStep(maps, letter, weapon)
      this.displayLaunchFirstStep(maps, letter, weapon)
      return idx
    }
    if (weapon.hasExtraSelectCursor) {
      this.icon1.classList.add('hidden')
      this.displayAimStep(maps, letter, weapon)
      return 1
    }
    this.icon2.classList.add('hidden')
    this.displayLaunchFirstStep(maps, letter, weapon)
    return 0
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
    this.prependLine(this.game.textContent)
    this.game.textContent = game
  }
}

export const gameStatus = new StatusUI()
