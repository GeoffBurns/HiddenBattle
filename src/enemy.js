import { bh } from './terrain.js'
import { randomPlaceShape } from './utils.js'
import { gameStatus } from './StatusUI.js'
import { enemyUI } from './enemyUI.js'
import { LoadOut } from './LoadOut.js'
import { Waters } from './Waters.js'

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
    this.updateMode()
    if (newCursor === oldCursor) return
    const board = this.UI.board.classList
    if (oldCursor !== '') board.remove(oldCursor)
    if (newCursor !== '') board.add(newCursor)
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

    gameStatus.info2(
      `Having difficulty placing all ships (${(attempt1 + 1) * 25} attempts)`
    )

    if (attempt1 < 10) {
      setTimeout(() => {
        this.placeStep(ships, attempt1 + 1)
      }, 0)
      return
    }

    this.disableBtns(false)

    gameStatus.info2('Failed to place all ships after many attempts')
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

  isTurn () {
    if (this.boardDestroyed || this.isRevealed || this.loadOut.checkNoAmmo())
      return false
    if (this.timeoutId) {
      gameStatus.info('Wait For Enemy To Finish Their Turn')
      return false
    }
    if (this?.opponent?.boardDestroyed) {
      gameStatus.info('Game Over - No More Shots Allowed')
      return false
    }
    return true
  }
  onClickCell (r, c) {
    if (!this.isTurn()) return
    this.UI.removeHighlightAoE()
    this.setWeaponHanders()

    if (this.lauchSelectedWeapon(r, c)) return

    if (this.launchRandomWeapon(r, c)) return
    this.loadOut.launch = LoadOut.launchDefault.bind(this)
    this.loadOut.aim(bh.map, r, c)
  }

  setWeaponHanders () {
    this.loadOut.destroy = this.tryFireAt2.bind(this)
    this.loadOut.destroyOne = this.destroyOne.bind(this)
  }

  onClickOppoCell (hintR, hintC) {
    if (!this.isTurn()) return
    const oppo = this.opponent
    if (!oppo) return
    this.UI.removeHighlightAoE()
    if (this.loadOut.isNotArming()) return

    const cell = oppo.UI.gridCellAt(hintR, hintC)

    this.selectAttachedWeapon(cell, hintR, hintC, oppo)
  }

  destroyOne (weapon, effect) {
    const candidates = this.getHitCandidates(effect, weapon)

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
      }, 1700)
      //
    }
    return true
  }
  fireAt2 (weapon, effect) {
    this.updateMode()
    // Mega Bomb mode: affect 3x3 area centered on (r,c)
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

    this.updateWeaponStatus()
    this.flash()
  }

  dropBomb2 (weapon, effect, hits, sunks, reveals) {
    const map = bh.map
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
