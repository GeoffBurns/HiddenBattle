import { makeKey } from './utilities.js'
import { gameStatus } from './StatusUI.js'
import { gameMap } from './gameMaps.js'
import { setupDragHandlers } from './dragndrop.js'
import { Waters } from './Waters.js'
export class Friend extends Waters {
  constructor (friendUI) {
    super(friendUI)
    this.testContinue = true
    this.showShips = true
  }

  randomHit (hits) {
    const len = hits.length
    if (len < 1) return null
    if (len === 1) return hits[0]
    const pick = Math.floor(Math.random() * len)
    return hits[pick]
  }
  chase (hits, seeking) {
    for (let i = 0; i < 30; i++) {
      const [r, c] = this.randomHit(hits)
      for (let j = 0; j < 15; j++) {
        if (seeking && (!this.testContinue || this.boardDestroyed)) {
          clearInterval(seeking)
          return
        }
        if (this.walkShot(r, c)) return
      }
    }
  }
  seekHit (r, c) {
    if (!gameMap().inBounds(r, c)) return false

    this.flame(r, c, false)
    const key = this.score.createShotKey(r, c)
    if (key === null) {
      // if we are here, it is because of carpet bomb, so we can just
      return false
    }

    this.fireShot(r, c, key)
    this.updateUI(this.ships)
    return true
  }

  seekHit2 (weapon, r, c, power) {
    if (!gameMap().inBounds(r, c)) return false

    if (power > 0) this.flame(r, c, weapon.hasFlash)
    const key =
      power > 0 ? this.score.createShotKey(r, c) : this.score.newShotKey(r, c)
    if (key === null) {
      // if we are here, it is because of carpet bomb, so we can just
      return false
    }

    const { hit } = this.fireShot2(weapon, r, c, power, key)
    this.updateUI(this.ships)
    return hit
  }

  walkShot (r, c) {
    const dir = gameMap().isLand(r, c) ? 5 : 4
    const p = Math.floor(Math.random() * dir)
    switch (p) {
      case 0:
        return this.seekHit(r, c + 1, false)
      case 1:
        return this.seekHit(r, c - 1, false)
      case 2:
        return this.seekHit(r + 1, c, false)
      case 3:
        return this.seekHit(r - 1, c, false)
      case 4:
        switch (Math.floor(Math.random() * 4)) {
          case 0:
            return this.seekHit(r + 1, c + 1, false)
          case 1:
            return this.seekHit(r - 1, c - 1, false)
          case 2:
            return this.seekHit(r + 1, c - 1, false)
          case 3:
            return this.seekHit(r - 1, c + 1, false)
        }
    }
  }
  seekBomb (weapon, effect) {
    const map = gameMap()
    this.updateUI()
    let hit = false
    for (const position of effect) {
      const [r, c, power] = position

      if (map.inBounds(r, c)) {
        if (this.seekHit2(weapon, r, c, power)) hit = true
      }
    }
    if (hit) this.flash('long')
  }

  randomBomb (seeking) {
    const map = gameMap()
    this.loadOut.destroy = this.seekBomb.bind(this)

    for (let impact = 9; impact > 1; impact--)
      for (let attempt = 0; attempt < 12; attempt++) {
        if (seeking && (!this.testContinue || this.boardDestroyed)) {
          clearInterval(seeking)
          return
        }
        const r = Math.floor(Math.random() * (map.rows - 2)) + 1
        const c = Math.floor(Math.random() * (map.cols - 2)) + 1
        if (this.score.newShotKey(r, c)) {
          this.launchRandomWeapon(r, c)
          this.loadOut.aim(gameMap(), r, c, this.loadOut.selectedWeapon)
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
    const map = gameMap()
    this.loadOut.destroyOne = this.destroyOne.bind(this)

    if (seeking && (!this.testContinue || this.boardDestroyed)) {
      clearInterval(seeking)
      return
    }

    const r = this.randomLine()
    this.launchRandomWeapon(r, 0)
    this.loadOut.aim(map, r, map.cols - 1, this.loadOut.selectedWeapon)
    // this.loadOut.aim(map, r, 0)
    /// this.loadOut.aim(map, r, map.cols - 1)
  }

  randomSeekOld (seeking) {
    const maxAttempts = 130
    const map = gameMap()

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      if (seeking && (!this.testContinue || this.boardDestroyed)) {
        clearInterval(seeking)
        return
      }
      const r = Math.floor(Math.random() * map.rows)
      const c = Math.floor(Math.random() * map.cols)

      if (this.seekHit(r, c, false)) {
        return
      }
    }
  }
  randomSeek (seeking) {
    const maxAttempts = 13

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      if (seeking && (!this.testContinue || this.boardDestroyed)) {
        clearInterval(seeking)
        return
      }
      const loc = this.randomLoc()

      if (!loc) {
        this.UI.showNotice('something went wrong!')
        clearInterval(seeking)
        this.boardDestroyed = true
        this.testContinue = false
        return
      }
      if (this.seekHit(loc[0], loc[1], false)) {
        return
      }
    }
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
    const map = gameMap()
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

    let line = Object.entries(tally)
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
      if (seeking && (!this.testContinue || this.boardDestroyed)) {
        clearInterval(seeking)

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
    const map = gameMap()
    for (const position of effect) {
      const [r, c] = position

      if (map.inBounds(r, c)) {
        /// reveal  what is in this position
      }
    }
    /// reveal
  }
  randomScan (seeking) {
    const map = gameMap()
    this.loadOut.reveal = this.scan.bind(this)
    if (seeking && (!this.testContinue || this.boardDestroyed)) {
      clearInterval(seeking)
      return
    }
    const r = Math.floor(Math.random() * (map.rows - 2)) + 1
    const c = Math.floor(Math.random() * (map.cols - 2)) + 1
    const r1 = Math.floor(Math.random() * (map.rows - 2)) + 1
    const c1 = Math.floor(Math.random() * (map.cols - 2)) + 1

    this.loadOut.aim(map, r, c)
    this.loadOut.aim(map, r1, c1)
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

  selectShot (semis, hits, seeking) {
    if (semis.length > 0) {
      this.loadOut.switchToSShot()
      const [r, c] = semis[0].split(',').map(x => parseInt(x))
      this.seekHit(r, c, false)
    } else if (hits.length > 0) {
      this.loadOut.switchToSShot()
      this.chase(hits, seeking)
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
  seekStep (seeking) {
    const hits = this.getHits()

    this.selectShot([...this.score.semi], hits, seeking)
  }
  updateMode (wps) {
    if (this.isRevealed || this.boardDestroyed) {
      return
    }
    this.updateWeapon(wps)
  }
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
