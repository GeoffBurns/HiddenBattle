import { randomPlaceShape } from './utils.js'
import { gameMap } from './maps.js'
import { enemyUI } from './enemyUI.js'
import { Waters } from './player.js'
import { gameStatus } from './playerUI.js'

class Enemy extends Waters {
  constructor (enemyUI) {
    super(enemyUI)
    this.preamble0 = 'Enemy'
    this.preamble = 'The enemy was '
    this.isRevealed = false
    this.timeoutId = null
    this.weaponHander = null
    this.revealHander = null
  }

  cursorChange (oldCursor, newCursor) {
    if (newCursor === oldCursor) return
    if (oldCursor !== '') this.UI.board.classList.remove(oldCursor)
    if (newCursor !== '') this.UI.board.classList.add(newCursor)
  }
  hasAmmo () {
    return !this.hasNoAmmo()
  }

  hasNoAmmo () {
    return this.loadOut.isOutOfAmmo()
  }
  switchMode () {
    if (this.isRevealed || this.hasNoAmmo()) return

    this.loadOut.switch()

    this.updateUI(enemy.ships)
  }
  disableBtn (tag, disabled) {
    const btn = document.getElementById(tag)
    if (btn) btn.disabled = disabled
  }
  disableBtns (disabled) {
    this.disableBtn('newPlace2', disabled)
    this.disableBtn('newGame', disabled)
    this.disableBtn('weaponBtn', disabled)
    this.disableBtn('weaponBtn', disabled)
  }
  placeStep (ships, attempt1) {
    this.disableBtns(true)
    for (let attempt2 = 0; attempt2 < 25; attempt2++) {
      this.resetShipCells()
      let ok = true
      for (const ship of ships) {
        const placed = randomPlaceShape(ship, this.shipCellGrid)
        if (!placed) {
          ok = false
          break
        }
      }
      if (ok) {
        gameStatus.info('Click On Square To Fire')
        this.disableBtns(false)
        return
      }
    }

    gameStatus.info(
      `Having difficulty placing all ships (${(attempt1 + 1) * 25} attempts)`
    )

    if (attempt1 < 10) {
      setTimeout(() => {
        this.placeStep(ships, attempt1 + 1)
      }, 0)
      return
    }

    this.disableBtns(false)

    gameStatus.info('Failed to place all ships after many attempts')
    this.boardDestroyed = true
    throw new Error('Failed to place all ships after many attempts')
  }
  placeAll (ships) {
    ships = ships || this.ships

    this.disableBtns(true)

    setTimeout(() => {
      this.placeStep(ships, 0, true)
    }, 0)
  }
  revealAll () {
    this.UI.clearClasses()
    this.UI.revealAll(this.ships)

    this.boardDestroyed = true
    this.isRevealed = true
  }
  updateMode () {
    if (this.isRevealed || this.boardDestroyed) {
      return
    }

    const wps = this.loadOut.weaponSystem()
    const next = this.loadOut.nextWeapon()
    this.UI.weaponBtn.innerHTML = next.buttonHtml
    gameStatus.displayAmmoStatus(wps, this.loadOut.cursorIndex())
  }
  updateUI (ships) {
    ships = ships || this.ships
    // stats
    this.UI.score.display(ships, this.score.noOfShots())
    // mode

    // buttons
    this.UI.weaponBtn.disabled =
      this.boardDestroyed || this.isRevealed || this.hasNoAmmo()
    this.UI.revealBtn.disabled = this.boardDestroyed || this.isRevealed
    super.updateUI(this.ships)
  }
  onClickCell (r, c) {
    if (this.boardDestroyed || this.isRevealed) return
    if (this.loadOut.hasNoCurrentAmmo()) {
      gameStatus.info(
        `No ${this.loadOut.weapon().plural} Left - Switching To   ${
          this.loadOut.nextWeapon().name
        }`
      )

      this.switchMode()
      return
    }
    if (this.timeoutId) {
      gameStatus.info('Wait For Enemy To Finish Their Turn')
      return
    }
    if (this?.opponent?.boardDestroyed) {
      gameStatus.info('Game Over - No More Shots Allowed')
      return
    }

    this.loadOut.destroy = this.tryFireAt2.bind(this)
    this.loadOut.destroyOne = this.destroyOne.bind(this)
    this.loadOut.aim(gameMap(), r, c)
  }

  destroyOne (weapon, effect) {
    const candidates = this.getHitCandidates(effect)

    if (candidates.length < 1) {
      this.tryFireAt2(weapon, effect)
      return
    }
    const newEffect = this.getStrikeSplash(weapon, candidates)
    this.tryFireAt2(weapon, newEffect)
  }
  tryFireAt2 (weapon, effect) {
    if (
      effect.length === 1 &&
      !this.score.newShotKey(effect[0][0], effect[0][1])
    ) {
      gameStatus.info('Already Shot Here - Try Again')
      return false
    }
    if (effect.length === 0) {
      gameStatus.info('Has no effect - Try Again')
      return false
    }
    this.fireAt2(weapon, effect)
    this.updateUI()
    if (this?.opponent && !this.opponent.boardDestroyed) {
      this.timeoutId = setTimeout(() => {
        this.timeoutId = null
        this.opponent.seekStep()
      }, 1000)
      //
    }
    return true
  }
  fireAt2 (weapon, effect) {
    // Mega Bomb mode: affect 3x3 area centered on (r,c)
    this.updateMode()
    this.processCarpetBomb2(weapon, effect)
  }

  processCarpetBomb2 (weapon, effect) {
    let hits = 0
    let reveals = 0
    let sunks = ''
    ;({ hits, sunks, reveals } = this.dropBomb2(
      weapon,
      effect,
      hits,
      sunks,
      reveals
    ))
    // update status
    this.updateResultsOfBomb(hits, sunks, reveals)

    this.updateBombStatus()
    this.flash()
  }

  dropBomb2 (weapon, effect, hits, sunks, reveals) {
    const map = gameMap()
    for (const position of effect) {
      const [r, c, power] = position

      if (map.inBounds(r, c)) {
        const result = this.processShot2(weapon, r, c, power)
        if (result?.hit) hits++
        if (result?.sunkLetter) sunks += result.sunkLetter
        if (result?.reveal) reveals++
      }
    }
    return { hits, sunks, reveals }
  }

  updateBombStatus () {
    gameStatus.displayAmmoStatus(
      this.loadOut.weaponSystem(),
      this.loadOut.cursorIndex()
    )
    if (this.loadOut.hasNoCurrentAmmo()) {
      this.switchMode()
      gameStatus.display('Single Shot Mode')
    }
  }

  onClickWeaponMode () {
    this.switchMode()
    this.updateMode()
  }
  onClickReveal () {
    if (!this.isRevealed) {
      this.revealAll()
      this.updateUI(enemy.ships)
    }
  }

  wireupButtons () {
    if (!this.weaponHander)
      this.weaponHander = enemy.onClickWeaponMode.bind(enemy)
    if (!this.revealHander) this.revealHander = enemy.onClickReveal.bind(enemy)
    this.UI.weaponBtn.addEventListener('click', this.weaponHander)
    this.UI.revealBtn.addEventListener('click', this.revealHander)
  }
  resetModel () {
    this.score.reset()
    this.resetMap()

    this.loadOut.OutOfAllAmmo = () => {
      this.UI.weaponBtn.disabled = true
      this.UI.weaponBtn.textcontent = 'single shot'
      this.UI.board.classList.remove('bomb')
    }
    this.loadOut.OutOfAmmo = this.updateMode.bind(this)
    this.updateUI(enemy.ships)
  }

  buildBoard () {
    this.UI.buildBoard(this.onClickCell, this)

    // update destroyed state class
    this.UI.board.classList.toggle('destroyed', this.boardDestroyed)
  }
  resetUI (ships) {
    this.UI.reset()
    this.buildBoard()
    this.placeAll(ships)
    this.updateUI(ships)
  }
}

export const enemy = new Enemy(enemyUI)
