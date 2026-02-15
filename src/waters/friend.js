import { bh } from '../terrain/terrain.js'
import { makeKey, shuffleArray } from '../utilities.js'
import { gameStatus } from './StatusUI.js'
import { setupDragHandlers } from '../selection/dragndrop.js'
import { Waters } from './Waters.js'
import { Player } from './steps.js'

export class Friend extends Waters {
  constructor (friendUI) {
    super(friendUI)
    this.testContinue = true
    this.friendlyWaters = true
    this.steps.player = Player.friend
    this.steps.onEndTurn = this.onEndTurn.bind(this)
  }

  onEndTurn () {
    if (this?.opponent && !this.opponent.boardDestroyed) {
      this.opponent.onBeginTurn()
    }
  }

  randomHit (hits) {
    const len = hits.length
    if (len < 1) return null
    if (len === 1) return hits[0]
    const pick = Math.floor(Math.random() * len)
    return hits[pick]
  }
  chase (allReadyHit, seeking, hint) {
    let result = null
    for (let i = 0; i < 30; i++) {
      const [r, c] = this.randomHit(allReadyHit)
      for (let j = 0; j < 15; j++) {
        if (this.isCancelled(seeking)) return
        result = this.walkShot(r, c, hint)
        if (result?.shots && result.shots > 0) return
      }
    }
    const { hits, sunks, reveals, info, shots } = result
    this.updateResultsOfBomb(
      this.loadOut.SShot(),
      hits,
      sunks,
      reveals,
      info,
      shots
    )
  }
  isCancelled (seeking) {
    if (seeking && (!this.testContinue || this.boardDestroyed)) {
      clearInterval(seeking)
      return true
    }
    return false
  }

  sShot (r, c) {
    const sShot = this.loadOut.SShot()
    return this.seekHit(sShot, r, c, 4)
  }

  seekHit (weapon, r, c, power) {
    if (!bh.inBounds(r, c))
      return { hits: 0, shots: 0, reveals: 0, sunk: '', info: '' }

    if (power > 0) this.flame(r, c, weapon.hasFlash)
    const key =
      power > 0 ? this.score.createShotKey(r, c) : this.score.newShotKey(r, c)
    if (key === null) {
      // if we are here, it is because of carpet bomb, so we can just
      return { hits: 0, shots: 0, reveals: 0, sunk: '', info: '' }
    }

    const result = this.fireShot(weapon, r, c, power, key)
    this.updateUI(this.ships)
    return result
  }

  walkShot (r, c, hint) {
    const diagonal = bh.terrain.bodyTag === 'space' || bh.isLand(r, c)
    const dir = hint ? 6 : diagonal ? 5 : 4
    const p = Math.floor(Math.random() * dir)
    switch (p) {
      case 0:
        return this.sShot(r, c + 1, false)
      case 1:
        return this.sShot(r, c - 1, false)
      case 2:
        return this.sShot(r + 1, c, false)
      case 3:
        return this.sShot(r - 1, c, false)
      case 4:
        switch (Math.floor(Math.random() * 4)) {
          case 0:
            return this.sShot(r + 1, c + 1, false)
          case 1:
            return this.sShot(r - 1, c - 1, false)
          case 2:
            return this.sShot(r + 1, c - 1, false)
          case 3:
            return this.sShot(r - 1, c + 1, false)
        }
        break
      case 5:
        return this.sShot(r, c, false)
    }
  }
  seekBomb (weapon, effect) {
    const { hits, sunks, reveals, info, shots } = this.seekBombRaw(
      weapon,
      effect
    )
    this.updateResultsOfBomb(weapon, hits, sunks, reveals, info, shots)
  }
  seekBombRaw (weapon, effect) {
    const map = bh.map
    this.updateUI()
    let hits = 0
    let reveals = 0
    let sunks = ''
    let info = ''
    let shots = 0
    for (const position of effect) {
      const [r, c, power] = position

      if (map.inBounds(r, c)) {
        const result = this.seekHit(weapon, r, c, power)
        if (result?.hits) hits += result.hits
        if (result?.sunk) sunks += result.sunk
        if (result?.reveals) reveals += result.reveals
        if (result?.shots) shots += result.shots
        if (result?.info) info += result.info + ' '
      }
    }
    if (hits > 0) this.flash('long')
    return { hits, sunks, reveals, info, shots }
  }

  randomBomb (seeking) {
    const map = bh.map
    this.loadOut.destroy = this.seekBomb.bind(this)

    for (let impact = 9; impact > 1; impact--)
      for (let attempt = 0; attempt < 12; attempt++) {
        if (this.isCancelled(seeking)) return
        const { r, c } = this.randomLocation(map)
        if (this.score.newShotKey(r, c)) {
          this.launchRandomWeapon(r, c, false)
          this.loadOut.aim(bh.map, r, c, this.loadOut.selectedWeapon)
          return
        }
      }
  }

  destroyOne (weapon, effect) {
    const candidates = this.getHitCandidates(effect, weapon)
    if (candidates.length < 1) {
      this.seekBomb(weapon, effect)
      return
    }
    const newEffect = this.getStrikeSplash(weapon, candidates)
    this.seekBomb(weapon, newEffect)
  }

  randomDestroyOne (seeking) {
    const map = bh.map
    this.loadOut.destroyOne = this.destroyOne.bind(this)

    if (this.isCancelled(seeking)) return

    const r = this.randomLine()
    this.launchRandomWeapon(r, 0, false)
    this.loadOut.aim(map, r, map.cols - 1, this.loadOut.selectedWeapon)
    // this.loadOut.aim(map, r, 0)
    /// this.loadOut.aim(map, r, map.cols - 1)
  }

  randomSeek (seeking) {
    const maxAttempts = 13
    let result = null
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      if (this.isCancelled(seeking)) return
      const loc = this.randomLoc()

      if (!loc) {
        this.UI.showNotice('something went wrong!')
        clearInterval(seeking)
        this.boardDestroyed = true
        this.testContinue = false
        return
      }
      result = this.sShot(loc[0], loc[1], false)
      if (result?.shots && result.shots > 0) return
    }
    const { hits, sunks, reveals, info, shots } = result
    this.updateResultsOfBomb(
      this.loadOut.SShot(),
      hits,
      sunks,
      reveals,
      info,
      shots
    )
  }

  restartBoard () {
    this.resetBase()
    this.UI.clearVisuals()
    for (const ship of this.ships) {
      ship.reset()
      this.UI.revealShip(ship)
    }
    this.armWeapons()
  }
  restartFriendBoard () {
    this.resetBase()
    this.UI.clearFriendVisuals()
    for (const ship of this.ships) {
      ship.reset()
      this.UI.revealShip(ship)
    }
    this.armWeapons()
  }

  test () {
    gameStatus.display('', '')
    this.UI.testMode()
    this.UI.testBtn.disabled = true
    this.UI.seekBtn.disabled = true
    this.UI.stopBtn.disabled = false

    this.restartBoard()

    this.seek()
  }
  setupUntried () {
    const map = bh.map
    this.untried = new Set()
    for (let r = 0; map.rows > r; r++) {
      for (let c = 0; map.cols > c; c++) {
        const key = makeKey(r, c)

        this.untried.add(key)
      }
    }
  }
  syncUntried () {
    this.untried = new Set(
      [...this.untried].filter(x => !this.score.shot.has(x))
    )
  }

  randomLoc () {
    this.syncUntried()
    const locs = [...this.untried]
    const noOfLocs = locs.length

    if (noOfLocs === 0) return null
    if (noOfLocs === 1) return locs[0].split(',').map(x => parseInt(x))

    const idx = Math.floor(Math.random() * locs.length)

    return locs[idx].split(',').map(x => Number.parseInt(x))
  }

  randomLine () {
    this.syncUntried()
    const locs = [...this.untried]

    const tally = locs.reduce((acc, el) => {
      const [r] = el.split(',').map(x => Number.parseInt(x))
      acc[r] = 1 + (acc[r] || 0)
      return acc
    }, {})

    const ordered = Object.entries(tally)
    let line = shuffleArray(ordered)
    line.sort((a, b) => b[1] - a[1])

    const idx = line.findIndex(i => i[1] < line[0][1])

    if (idx < 3) {
      return Number.parseInt(line[0])
    }
    return Number.parseInt(line[Math.floor(Math.random() * (idx - 1))])
  }

  seek () {
    this.testContinue = true
    this.boardDestroyed = false
    this.armWeapons()
    this.score.shot = new Set()
    this.setupUntried()

    let seeking = setInterval(() => {
      if (this.isCancelled(seeking)) {
        this.UI.testBtn.disabled = false
        this.UI.seekBtn.disabled = false
        this.UI.stopBtn.classList.add('hidden')
        seeking = null
      } else {
        this.seekStep(seeking)
      }
    }, 270)
  }
  scan (weapon, effect) {
    this.updateUI()
    const map = bh.map
    for (const position of effect) {
      const [r, c] = position

      if (map.inBounds(r, c)) {
        /// reveal  what is in this position
      }
    }
    /// reveal
  }
  randomScan (seeking) {
    const map = bh.map
    this.loadOut.reveal = this.scan.bind(this)
    if (this.isCancelled(seeking)) return
    const { r, c } = this.randomLocation(map)
    const { r1, c1 } = this.randomLocation(map)

    this.loadOut.aim(map, r, c)
    this.loadOut.aim(map, r1, c1)
  }
  randomLocation (map) {
    const r = Math.floor(Math.random() * (map.rows - 2)) + 1
    const c = Math.floor(Math.random() * (map.cols - 2)) + 1
    return { r, c }
  }

  randomEffect (effect, seeking) {
    switch (effect) {
      case 'DestroyOne':
        this.randomDestroyOne(seeking)
        break
      case 'Bomb':
        this.randomBomb(seeking)
        break
      case 'Scan':
        this.randomScan(seeking)
        break
      case 'Seek':
        this.randomSeek(seeking)
        break
    }
  }

  selectShot (semis, hits, hints, seeking) {
    if (semis.length > 0) {
      this.loadOut.switchToSShot()
      const [r, c] = semis[0].split(',').map(x => parseInt(x))
      const result = this.sShot(r, c, false)
      const { hits, sunks, reveals, info, shots } = result
      this.updateResultsOfBomb(
        this.loadOut.SShot(),
        hits,
        sunks,
        reveals,
        info,
        shots
      )
    } else if (hits.length > 0) {
      this.loadOut.switchToSShot()
      this.chase(hits, seeking, false)
    } else if (hints.length > 0) {
      this.loadOut.switchToSShot()
      this.chase(hints, seeking, true)
    } else {
      const op = this.loadOut.switchToPrefered()
      if (op) {
        this.randomEffect(op)
      } else {
        this.loadOut.switchToSShot()
        this.randomSeek(seeking)
      }
    }
  }

  getHits () {
    const hitss = this.shipsUnsunk().flatMap(s => [...s.hits])
    return hitss.map(h => {
      const [r, c] = h.split(',').map(n => Number.parseInt(n))
      return [r, c]
    })
  }

  getHints () {
    const hints = this.score.hint
    return [...hints].map(h => {
      const [r, c] = h.split(',').map(n => Number.parseInt(n))
      return [r, c]
    })
  }
  seekStep (seeking) {
    const hits = this.getHits()
    const hints = this.getHints()

    this.selectShot([...this.score.semi], hits, hints, seeking)
    this.steps.endTurn()
  }
  updateWeaponStatus () {}
  updateMode (wps) {
    if (this.isRevealed || this.boardDestroyed) {
      return
    }
    this.updateWeapon(wps)
  }

  deactivateWeapon () {}
  resetModel () {
    this.score.reset()
    this.resetMap()
  }
  buildBoard () {
    this.UI.buildBoard()
    this.resetShipCells()
    this.UI.makeDroppable(this)
    setupDragHandlers(this.UI)
  }

  resetUI (ships) {
    this.resetBase()
    ships = ships || this.ships
    this.UI.reset(ships)
    this.buildBoard()
    this.UI.buildTrays(ships, this.shipCellGrid)
    this.updateUI(ships)
  }
}
