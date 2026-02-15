import { bh } from '../terrain/terrain.js'
import { randomPlaceShape } from '../utils.js'
import { gameStatus } from './StatusUI.js'
import { enemyUI } from './enemyUI.js'
import { LoadOut } from './LoadOut.js'
import { Waters } from './Waters.js'
import { Player } from './steps.js'

class Enemy extends Waters {
  constructor (enemyUI) {
    super(enemyUI)
    this.preamble0 = 'Enemy'
    this.preamble = 'The enemy was '
    this.isRevealed = false
    this.timeoutId = null
    this.weaponHander = null
    this.revealHander = null
    this.enemyWaters = true
    this.steps.player = Player.enemy
    this.steps.onEndTurn = this.onEndTurn.bind(this)
    this.steps.onBeginTurn = this.onBeginTurn.bind(this)
    this.steps.onDeactivate = this.deactivateWeapon.bind(this)
    this.steps.onActivate = this.onActivate.bind(this)
    this.steps.onSelect = this.onSelect.bind(this)
    this.steps.onChangeWeapon = this.onChangeWeapon.bind(this)
  }

  onSelect () {
    this.UI.board.classList.add('targetting')
    this.UI.board.classList.remove('not-step')
  }
  onActivate (rack, weapon, _wletter, _weaponId, r, c, _cell) {
    const oppo = this.opponent
    oppo?.UI?.cellWeaponActive?.(r, c)
    if (weapon.postSelectCursor > 0) {
      this.UI.cellWeaponActive(r, c, '', weapon.tag)
    }
    this.updateWeaponStatus(rack)
  }
  onChangeWeapon (wletter) {
    this.loadOut.switchTo(wletter)
  }
  onHint (r, c) {
    this.opponent?.UI?.score?.hintReveal?.(r, c)
  }
  onEndTurn () {
    if (
      this.opponent === null ||
      this.opponent === undefined ||
      this.opponent?.boardDestroyed ||
      this.opponent?.isRevealed
    )
      return
    this.waitForOpponent()
    this.timeoutId = setTimeout(() => {
      this.timeoutId = null
      this.opponent.seekStep()
      this.timeoutId = setTimeout(() => {
        this.timeoutId = null
        //     this.steps.beginTurn()
      }, 500)
    }, 1700)
  }

  waitForOpponent () {
    const spinner = document.getElementById('spinner')
    if (spinner) {
      //
      spinner.classList.add('waiting')
      spinner.classList.remove('hidden')
      spinner.src = ''
      spinner.src = './images/loading.gif'
    }

    gameStatus.showMode("Enemy's Turn")
    this.UI.board.classList.remove('targetting')
    this.UI.board.classList.add('not-step')
    this.steps.clearSource()
  }

  onBeginTurn () {
    this.stopWaiting()
    if (this.boardDestroyed || this.isRevealed) {
      this.steps.select()
    } else {
      gameStatus.showMode('Your Turn')
      if (!bh.terrain.hasAttachedWeapons) {
        this.steps.select()
      }
    }
  }
  stopWaiting () {
    const spinner = document.getElementById('spinner')
    if (spinner) {
      //
      spinner.classList.remove('waiting')
      spinner.classList.add('hidden')
    }
    gameStatus.showMode('')
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
    this.stopWaiting?.()
    this.opponent?.stopWaiting?.()
    this.boardDestroyed = true
    this.isRevealed = true
  }

  updateUI (ships) {
    ships = ships || this.ships
    // stats
    this.UI.score.display(ships, ...this.score.counts())
    // mode
    this.stopWaiting()
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

    if (this.launchSelectedWeapon(r, c)) return

    if (this.launchRandomWeapon(r, c, bh.seekingMode)) return
    this.loadOut.launch = LoadOut.launchDefault.bind(this, this.UI)
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
    this.steps.addHint(oppo.UI, hintR, hintC, cell)
    this.shadowSource(hintR, hintC, this)
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
    this.steps.endTurn()
    return true
  }
  fireAt2 (weapon, effect) {
    this.updateMode()
    // Mega Bomb mode: affect 3x3 area centered on (r,c)
    this.processCarpetBomb(weapon, effect)
  }

  processCarpetBomb (weapon, effect) {
    let hits = 0
    let reveals = 0
    let sunks = ''
    let info = ''
    let shots = 0
    ;({ hits, sunks, reveals, info, shots } = this.dropBomb(
      weapon,
      effect,
      hits,
      sunks,
      reveals,
      info,
      shots
    ))
    // update status
    this.updateResultsOfBomb(weapon, hits, sunks, reveals, info, shots)
    this.updateWeaponStatus()
    this.flash()
  }
  deactivateWeapon (ro, co) {
    if (ro === undefined || co === undefined) return
    this.opponent?.UI?.cellWeaponDeactivate?.(ro, co, true)
    this.UI.cellWeaponDeactivate(ro, co)
  }

  updateWeaponStatus (rack) {
    gameStatus.displayAmmoStatus(
      this.loadOut.weaponSystem(),
      bh.maps,
      // this.loadOut.cursorIndex(),
      null,
      this.loadOut.coords.length,
      rack
    )
  }
  dropBomb (weapon, effect, hits, sunks, reveals, info, shots) {
    const map = bh.map

    for (const position of effect) {
      const [r, c, power] = position

      if (map.inBounds(r, c)) {
        const result = this.processShot(weapon, r, c, power)
        if (result?.hits) hits += result.hits
        if (result?.sunk) sunks += result.sunk
        if (result?.reveals) reveals += result.reveals
        if (result?.shots) shots += result.shots
        if (result?.info) info += result.info + ' '
      }
    }
    return { hits, sunks, reveals, info, shots }
  }

  onClickWeaponMode () {
    this.switchMode()
    this.updateMode(this.loadOut.weaponSystem())
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
