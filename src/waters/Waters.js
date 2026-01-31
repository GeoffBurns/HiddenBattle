import { bh } from '../terrain.js'
import {
  randomElement,
  parsePair,
  keyListFromCell,
  parseTriple,
  findClosestCoord,
  cellListContains,
  coordsFromCell
} from '../utilities.js'
import { placedShipsInstance } from '../selection.js'
import { Score } from './Score.js'
import { gameStatus } from './StatusUI.js'
import { assembleTerrains } from '../gameMaps.js'
import { randomPlaceShape } from '../utils.js'
import { LoadOut } from './LoadOut.js'
import { Ship } from '../ships/Ship.js'
import { WeaponSystem } from '../WeaponSystem.js'

function popFirst (arr, predicate, obj) {
  // find index of first match
  const idx = arr.findIndex(predicate)

  let found = null
  if (idx !== -1) {
    // remove and store the object
    ;[found] = arr.splice(idx, 1)
  }
  if (found === null && obj) {
    console.log('not found : ', JSON.stringify(obj))
  }

  return found
}

export class Waters {
  constructor (ui) {
    assembleTerrains()
    this.ships = []
    this.score = new Score()
    this.opponent = null
    this.UI = ui
    this.shipCellGrid = []
    this.boardDestroyed = false
    this.preamble0 = 'Your'
    this.preamble = 'You were '
    this.resetShipCells()
    this.displayInfo = gameStatus.info2.bind(gameStatus)
  }
  clipboardKey () {
    return 'geoffs-battleship.placed-ships'
  }

  placedShips () {
    return {
      ships: this.ships,
      shipCellGrid: this.shipCellGrid,
      map: bh.map.title
    }
  }

  store () {
    localStorage.setItem(
      this.clipboardKey(),
      JSON.stringify(this.placedShips())
    )
  }

  autoPlace2 () {
    const ships = this.ships
    for (let attempt = 0; attempt < 100; attempt++) {
      let ok = true
      for (const ship of ships) {
        const placed = randomPlaceShape(ship, this.shipCellGrid)
        if (!placed) {
          this.resetShipCells()
          this.UI.clearPlaceVisuals()
          this.UI.placeTally(ships)
          this.UI.displayShipInfo(ships)
          ok = false
          break
        }
        this.UI.placement(placed, this, ship)
      }
      if (ok) return true
    }
  }
  autoPlace () {
    const ships = this.ships
    for (let attempt = 0; attempt < 100; attempt++) {
      let ok = true
      for (const ship of ships) {
        const placed = randomPlaceShape(ship, this.shipCellGrid)
        if (!placed) {
          this.resetShipCells()
          this.UI.clearVisuals()
          placedShipsInstance.reset()
          this.UI.placeTally(ships)
          this.UI.displayShipInfo(ships)
          ok = false
          break
        }
        placedShipsInstance.push(ship, ship.cells)
        ship.addToGrid(this.shipCellGrid)
        this.UI.placement(placed, this, ship)
      }
      if (ok) return true
    }
  }
  loadForEdit (map) {
    map = map || bh.map
    const placedShips = map.example
    if (!placedShips) {
      this.autoPlace()
      return
    }

    const matchableShips = this.placeMatchingShips(
      placedShips,
      this.placeMatchingShipForEdit.bind(this)
    )
    if (matchableShips.length !== 0) {
      console.log(`${matchableShips.length} ships not matched`)
    }
  }

  placeMatchingShips (placedShips, placer) {
    const matchableShips = [...this.ships]
    for (const ship of placedShips.ships) {
      const matchingShip = popFirst(
        matchableShips,
        s => s.letter === ship.letter,
        ship
      )
      if (matchingShip) {
        this.applyExtraInfoToMatchingShip(matchingShip, ship)
        placer(matchingShip, ship)
      }
    }
    return matchableShips
  }

  placeMatchingShipForEdit (matchingShip, ship) {
    placedShipsInstance.push(matchingShip, ship.cells)
    matchingShip.addToGrid(this.shipCellGrid)
    this.UI.placement(ship.cells, this, matchingShip)
  }

  placeMatchingShip (matchingShip, ship) {
    matchingShip.place(ship.cells)
    matchingShip.addToGrid(this.shipCellGrid)
    this.UI.placement(ship.cells, this, matchingShip)
    const dragship = this.UI.getTrayItem(ship.id)
    if (dragship) {
      this.UI.removeDragShip(dragship)
    } else {
      //    console.log('drag ship not found : ', JSON.stringify(ship))
    }
  }

  applyExtraInfoToMatchingShip (matchingShip, ship) {
    matchingShip.variant = ship.variant
    const values = Object.values(matchingShip.weapons)
    if (values.length > 0) {
      this.applyWeaponsToMatchingShip(ship, values, matchingShip)
    }
  }

  applyWeaponsToMatchingShip (ship, values, matchingShip) {
    const keys = Object.keys(ship.weapons)
    if (values.length === keys.length) {
      matchingShip.weapons = {}
      for (const [index, key] of keys.entries()) {
        matchingShip.weapons[key] = values[index]
      }
    }
  }

  load (placedShips) {
    const map = bh.map
    placedShips =
      placedShips || JSON.parse(localStorage.getItem(this.clipboardKey()))

    const { shipId, weaponId } = placedShips.ships.reduce(
      (a, s) => {
        a.shipId = Math.max(s.id, a.shipId)
        a.weaponId = Object.values(s.weapons).reduce(
          (aw, w) => Math.max(w.id, aw),
          a.weaponId
        )
        return a
      },
      { shipId: 1, weaponId: 1 }
    )

    Ship.id = shipId + 1
    WeaponSystem.id = weaponId + 1
    if (!placedShips || map.title !== placedShips.map) {
      placedShips = map.example
      if (!placedShips) {
        this.autoPlace()
        return
      }
    }

    const matchableShips = this.placeMatchingShips(
      placedShips,
      this.placeMatchingShip.bind(this)
    )
    if (matchableShips.length === 0) {
      this.UI.resetTrays()
    } else {
      console.log(`${matchableShips.length} ships not matched`)
    }
  }

  resetMap (map) {
    this.boardDestroyed = false
    this.isRevealed = false
    this.setMap(map)
  }
  armWeapons (map) {
    map = map || bh.map
    const oppo = this.opponent
    this.weaponShips = this.ships.filter(s => s.hasWeapon())

    this.hasAttachedWeapons = this.weaponShips.length > 0
    if (bh.seekingMode && this.hasAttachedWeapons) {
      this.weaponShips = map.extraArmedFleetForMap
      this.loadOut = this.makeLoadOut(map)
    } else if (oppo) {
      const weaponShips = oppo.ships.filter(s => s.hasWeapon())
      this.loadOut = this.makeLoadOut(map, weaponShips)
    } else {
      this.loadOut = this.makeLoadOut(map)
    }

    if (this.cursorChange)
      this.loadOut.onCursorChange = this.cursorChange.bind(this)
    // const oppo = this.opponent
    //this.setupAttachedAim()
  }
  makeLoadOut (map, ships) {
    ships = ships || this.weaponShips
    return new LoadOut(map.weapons, ships, this.UI)
  }
  autoSelectWarning (weaponName, currentShip) {
    this.displayInfo(
      `Auto-selected ${weaponName}, Click near ${
        currentShip.shape().descriptionText
      } to select a different ${weaponName}`
    )
  }
  randomWeaponId () {
    const randomShip = randomElement(this.loadOut.weaponSystem().armedShips())
    if (!randomShip) {
      return {
        launchR: null,
        launchC: null,
        weaponId: null,
        hintR: null,
        hintC: null
      }
    }
    const cells = randomShip.cells
    const surround = [...this.UI.surroundCells(cells)]
    if (surround.length === 0) {
      this.UI.gridCellAt(0, 0)
      return this.selectWeaponId(null, 0, 0, 'random', randomShip)
    }
    const hintKey = randomElement(surround)
    const [r, c] = parsePair(hintKey)
    const opponent = this.opponent
    const cell = opponent
      ? opponent.UI.gridCellAt(r, c)
      : this.UI.gridCellAt(0, 0)
    return this.selectWeaponId(cell, r, c, 'random', randomShip)
  }

  selectAndArmWps (rack, oppo, launchR, launchC, hintR, hintC) {
    const weapon = rack?.weapon
    const letter = weapon?.letter
    if (letter) {
      const old = this.loadOut.selectedWeapon
      if (old) {
        const [ro, co] = old.launchCoord
        this.deactivateWeapon(ro, co)
      }
      this.loadOut.switchTo(letter)
      if (weapon.postSelectCursor === 0) {
        this.loadOut.clearCoords()
      } else {
        this.loadOut.addCoords(launchR, launchC)
      }

      rack.launchCoord = [launchR, launchC]
      rack.hintCoord = [hintR, hintC]
      this.loadOut.launch = (coords, onEnd) => {
        oppo.UI.cellUseAmmo(launchR, launchC)
        this.deactivateWeapon(launchR, launchC)
        if (weapon.givesHint) {
          oppo.UI.cellHintReveal(hintR, hintC)
        }
        this.launchTo(coords, hintR, hintC, rack, onEnd)
      }
      this.loadOut.selectedWeapon = rack
      oppo?.UI?.cellWeaponActive?.(launchR, launchC)
      if (weapon.postSelectCursor > 0) {
        this.UI.cellWeaponActive(launchR, launchC, '', weapon.tag)
      }
      this.updateWeaponStatus()
    }
  }

  deactivateWeapon (ro, co) {
    this.opponent?.UI?.cellWeaponDeactivate?.(ro, co)
    this.UI.cellWeaponDeactivate(ro, co)
  }

  selectAttachedWeapon (cell, r, c, oppo) {
    const { launchR, launchC, weaponId, hintR, hintC } = this.selectWeaponId(
      cell,
      r,
      c
    )

    this.selectAndArmWeaponId(weaponId, oppo, launchR, launchC, hintR, hintC)
  }
  updateWeaponStatus () {
    gameStatus.displayAmmoStatus(
      this.loadOut.weaponSystem(),
      bh.maps,
      // this.loadOut.cursorIndex(),
      null,
      this.loadOut.coords.length,
      this.loadOut.selectedWeapon
    )
  }
  randomAttachedWeapon (oppo) {
    const { launchR, launchC, weaponId, hintR, hintC } = this.randomWeaponId()

    this.selectAndArmWeaponId(weaponId, oppo, launchR, launchC, hintR, hintC)
  }

  selectAndArmWeaponId (weaponId, oppo, launchR, launchC, hintR, hintC) {
    if (weaponId < 1) {
      return
    }
    const rack = this.loadOut.getRackById(weaponId)
    this.selectAndArmWps(rack, oppo, launchR, launchC, hintR, hintC)
  }
  launchRandomWeapon (r, c, autoSelectWarning = true) {
    if (this.lauchedUnattachedWeapon(r, c)) return true
    return this.launchRandomWeaponBase(autoSelectWarning)
  }

  launchRandomWeaponBase (autoSelectWarning = true) {
    const current = this.loadOut.weaponSystem()
    const attached = current.hasAmmo()
    if (attached) {
      return this.launchRandomWeaponForWps(autoSelectWarning)
    }
    return false
  }

  selectWeaponId (cell, hintR, hintC, random, ship) {
    if (ship) {
      const [key, weapon] = randomElement(ship.weaponEntries())
      const [launchR, launchC] = parsePair(key)
      return { launchR, launchC, weaponId: weapon.id, hintR, hintC }
    }
    const keyIds = keyListFromCell(cell, 'keyIds')
    if (!keyIds) {
      return { launchR: 0, launchC: 0, weaponId: -1, hintR, hintC }
    }
    const loaded = this.loadOut.getLoadedWeapons().map(w => w.id)
    const filteredKeyIds = keyIds.filter(k => {
      const [, , weaponId] = parseTriple(k)
      return loaded.includes(weaponId)
    })
    const wkey = findClosestCoord(filteredKeyIds, hintR, hintC, k =>
      parseTriple(k)
    )
    if (!random && !wkey) {
      return this.randomWeaponId()
    }
    const [launchR, launchC, weaponId] = parseTriple(wkey)

    return { launchR, launchC, weaponId, hintR, hintC }
  }

  launchRandomWeaponForWps (autoSelectWarning = true) {
    this.randomAttachedWeapon(this.opponent)
    const currentWeapon = this.loadOut.selectedWeapon

    if (!currentWeapon) return false
    const currentShip = this.loadOut.getShipByWeaponId(currentWeapon.id)
    const weaponName = currentWeapon.weapon?.name || 'weapon'
    if (autoSelectWarning) this.autoSelectWarning(weaponName, currentShip)
    this.loadOut.launch = (coords, onEnd, weapon, wps) => {
      this.launchWeapon(wps, coords, onEnd, weapon)
    }
    return true
  }

  lauchSelectedWeapon (r, c) {
    if (this.loadOut.isArmed()) {
      this.loadOut.aim(bh.map, r, c, this.loadOut.selectedWeapon)
      return true
    }
    return false
  }

  lauchedUnattachedWeapon (r, c) {
    const unAttached = this.loadOut.getUnattachedWeapon()
    if (unAttached) {
      this.loadOut.launch = (coords, onEnd) => {
        this.launchTo(coords, bh.map.rows - 1, 0, unAttached, onEnd)
      }
      this.loadOut.aim(bh.map, r, c, unAttached)
      return true
    }
    return false
  }
  launchTo (coords, rr, cc, currentWeapon, onEnd) {
    currentWeapon.weapon.launchTo(
      coords,
      rr,
      cc,
      onEnd,
      bh.map,
      this.UI,
      this.opponent?.UI
    )
  }
  launchWeapon (wps, coords, onEnd, weapon) {
    const [hintR, hintC] = wps.hintCoord
    const [launchR, launchC] = wps.launchCoord
    const oppo = this.opponent
    if (!oppo) return
    oppo.UI.cellUseAmmo(launchR, launchC)

    if (weapon.givesHint) {
      oppo.UI.cellHintReveal(hintR, hintC)
    }
    this.launchTo(coords, hintR, hintC, wps, onEnd)
  }

  setupAttachedAim () {
    const oppo = this.opponent
    if (bh.seekingMode || !this.loadOut || !oppo) return
    const armedShips = this.loadOut.armedShips()
    for (const ship of armedShips) {
      const cells = oppo.shipCells(ship.id)
      const surround = oppo.UI.surroundCellElement(cells)
      for (const cell of surround) {
        if (!cell.dataset.listen && !cellListContains(cell, ship.id)) {
          const [r, c] = coordsFromCell(cell)
          cell.addEventListener(
            'click',
            this.onClickOppoCell.bind(this, r, c, ship.id)
          )
          cell.dataset.listen = true
          const w = ship.weapon()
          const cursor = w?.launchCursor
          if (cursor) cell.classList.add(cursor)
        }
      }
    }
  }
  resetBase () {
    this.boardDestroyed = false
    this.UI.board.classList.remove('destroyed')
    this.score.reset()
  }
  setMap (map) {
    map = map || bh.map
    if (!this.ships || this.ships.length === 0) {
      this.ships = map.newFleetForMap
      this.armWeapons(map)
    }
    for (const ship of this.ships) {
      ship.reset()
    }
  }
  getHitCandidates (effect, weapon) {
    const candidates = []
    const map = bh.map
    const maps = bh.maps
    for (const [r, c, power] of effect) {
      if (map.inBounds(r, c) && this.score.newShotKey(r, c) !== null) {
        const cell = this.UI.gridCellAt(r, c)
        if (
          !cell.classList.contains('frd-hit') &&
          !cell.classList.contains('miss') &&
          !cell.classList.contains('hit')
        ) {
          cell.classList.add('wake')
        }
        const shipCell = this.shipCellAt(r, c)
        if (shipCell !== null) {
          const shape = maps.shapesByLetter[shipCell.letter]
          const protection = shape.protectionAgainst(weapon.letter)

          if (power >= protection || (power === 1 && protection === 2)) {
            candidates.push([r, c, power])
          }
        }
      }
    }
    return candidates
  }
  getStrikeSplash (weapon, candidates) {
    const pick = Math.floor(Math.random() * candidates.length)
    const cellSize = this.UI.cellSizeScreen()
    const target = this.UI.gridCellAt(candidates[pick][0], candidates[pick][1])
    weapon.animateSplashExplode(target, cellSize)
    return weapon.splash(bh.map, candidates[pick])
  }
  shipsSunk () {
    return this.ships.filter(s => s.sunk)
  }
  shipsUnsunk () {
    return this.ships.filter(s => !s.sunk)
  }
  shapesUnsunk () {
    return [...new Set(this.shipsUnsunk().map(s => s.shape()))]
  }
  shapesCanBeOn (subterrain, zone) {
    return this.shapesUnsunk().filter(s => s.canBeOn(subterrain, zone))
  }

  createCandidateWeapons () {
    const candidates = bh.map.terrain.weapons.weapons

    return candidates
  }
  createCandidateShips () {
    const maps = bh.maps

    const baseShapes = maps.baseShapes
    const ships = Ship.createShipsFromShapes(baseShapes)
    return ships
  }
  resetShipCells () {
    const map = bh.map
    this.shipCellGrid = Array.from({ length: map.rows }, () =>
      new Array(map.cols).fill(null)
    )
  }
  armedCells () {
    return this.cellList().filter(c => c.dataset.ammo > 0)
  }
  armedCellsWithWeapon (letter) {
    return this.cellList().filter(
      c => c.dataset.ammo > 0 && c.dataset.wletter === letter
    )
  }
  shipCells (id) {
    let list = []
    for (const cell of this.cellsOnBoard()) {
      if (Number.parseInt(cell.dataset.id) === id) {
        list.push(cell)
      }
    }
    return list
  }
  cellList () {
    return [...this.cellsOnBoard()]
  }
  cellsOnBoard () {
    return this.UI.board.children
  }

  recordAutoMiss (r, c) {
    const key = this.score.addAutoMiss(r, c)
    if (!key) return // already shot here
    this.UI.cellMiss(r, c)
  }
  recordFleetSunk () {
    this.displayInfo('All ' + this.preamble0 + ' Ships Destroyed!')
    this.UI.displayFleetSunk()
    this.boardDestroyed = true
  }
  checkFleetSunk () {
    if (this.ships.every(s => s.sunk)) {
      this.recordFleetSunk()
    }
  }
  shipCellAt (r, c) {
    return this.shipCellGrid[r]?.[c]
  }
  markSunk (ship, info) {
    this.sunkWarning(ship, info)
    this.UI.displaySurround(
      ship.cells,
      ship.letter,
      (r, c) => this.recordAutoMiss(r, c),
      (r, c, letter) => this.UI.cellSunkAt(r, c, letter)
    )
    this.checkFleetSunk()
  }
  get onSunk () {
    return this.markSunk.bind(this)
  }

  markHit (key, r, c) {
    this.score.semi.delete(key)
    this.UI.cellHit(r, c)
  }

  getShipFromCell (shipCell) {
    return this.ships.find(s => s.id === shipCell.id)
  }
  sunkDescription (ship) {
    if (this.opponent) {
      return this.preamble0 + ' ' + ship.sunkDescription(' was ')
    }
    return ship.sunkDescription()
  }
  sunkLetterDescription (letter) {
    if (this.opponent) {
      return this.preamble0 + ' ' + bh.terrain.sunkDescription(letter, ' was ')
    }
    return bh.shipSunkText(letter)
  }
  sunkWarning (ship, info = '') {
    if (!info) {
      info = ''
    }
    this.displayInfo(info + this.sunkDescription(ship))
  }

  checkForHit (r, c, key, shipCell) {
    if (!shipCell) {
      return
    }

    const hitShip = this.getShipFromCell(shipCell)
    if (!hitShip) {
      this.UI.cellMiss(r, c)
      return { hit: false, sunk: '' }
    }
    const sunkLetter = this.showHit(key, r, c, hitShip)

    return { hit: true, sunkLetter: sunkLetter }
  }

  showHit (key, r, c, hitShip) {
    this.markHit(key, r, c)
    const sunk = hitShip.hitAt(key, this.onSunk, this)
    const sunkLetter = sunk ? hitShip.letter : ''
    return sunkLetter
  }

  checkForHit2 (weapon, r, c, power, key, shipCell) {
    if (!shipCell) {
      return
    }

    const hitShip = this.getShipFromCell(shipCell)

    if (!hitShip) {
      this.UI.cellMiss(r, c)
      return { hit: false, sunk: '', reveal: false }
    }

    const shape = bh.shapesByLetter(shipCell.letter)
    const protection = shape.protectionAgainst(weapon.letter)
    if (power === 1 && protection === 2 && hitShip) {
      this.score.shotReveal(key)
      return this.UI.cellSemiReveal(r, c)
    }

    if (protection > power) {
      return { hit: false, sunk: '', reveal: false }
    }

    if (power < 1) {
      this.score.shot.add(key)
    }

    const sunkLetter = this.showHit(key, r, c, hitShip)

    return { hit: true, sunkLetter: sunkLetter }
  }

  updateMode (wps1) {
    if (this.isRevealed || this.boardDestroyed) {
      return
    }
    const { wps, cursorIdx } = this.updateWeapon(wps1)
    gameStatus.displayAmmoStatus(
      wps,
      bh.maps,
      null,
      // cursorIdx,
      this.loadOut.coords.length,
      this.loadOut.selectedWeapon
    )
  }
  updateWeapon (wps1) {
    const wps = wps1 || this.loadOut.weaponSystem()
    const letter = wps1?.weapon?.letter
    const next = this.loadOut.nextWeapon(letter)
    if (this.UI.weaponBtn) this.UI.weaponBtn.innerHTML = next.buttonHtml
    const cursorIdx = this.loadOut.cursorIndex()
    return { wps, cursorIdx }
  }

  fireShot2 (weapon, r, c, power, key) {
    const shipCell = this.shipCellAt(r, c)
    if (!shipCell) {
      if (power > 0) {
        this.UI.cellMiss(r, c)
      }
      return { hit: false, sunk: '' }
    }
    return this.checkForHit2(weapon, r, c, power, key, shipCell)
  }

  fireShot (r, c, key) {
    const shipCell = this.shipCellAt(r, c)
    if (!shipCell) {
      this.UI.cellMiss(r, c)
      return { hit: false, sunk: '' }
    }
    return this.checkForHit(r, c, key, shipCell)
  }

  hitDescription (hits) {
    if (this.opponent) {
      return this.preamble + ' Hit (x' + hits.toString() + ')'
    } else {
      return hits.toString() + ' Hits'
    }
  }
  revealDescription (reveals) {
    if (this.opponent) {
      return this.preamble + ' positions revealed (x' + reveals.toString() + ')'
    } else {
      return reveals.toString() + ' positions revealed'
    }
  }

  updateResultsOfBomb (hits, sunks, reveals = 0) {
    if (this.boardDestroyed) {
      // already handled  in updateUI
    } else if (hits === 0 && reveals > 0) {
      this.displayInfo(this.revealDescription(reveals))
    } else if (hits === 0) {
      if (this.opponent) {
        this.displayInfo('The Mega Bomb missed ' + this.preamble0 + ' ships')
      } else {
        this.displayInfo('The Mega Bomb missed everything!')
      }
    } else if (sunks.length === 0) {
      let message = this.hitDescription(hits)
      if (reveals > 0) {
        message += ` and ${this.revealDescription(reveals)}`
      }
      this.displayInfo(message)
    } else if (sunks.length === 1) {
      this.displayInfo(
        this.hitDescription(hits) + ' and ' + this.sunkLetterDescription(sunks)
      )
    } else {
      let message = this.hitDescription(hits) + ','
      for (let sunk of sunks) {
        message += ' and ' + this.sunkLetterDescription(sunk)
      }
      message += ' Destroyed'
      this.displayInfo(message)
    }
  }
  effectById (id, tempEffect) {
    const element = document.getElementById(id)
    this.effect(element, tempEffect)
  }
  effect (element, tempEffect, long) {
    element.classList.add(tempEffect)
    element.addEventListener(
      'animationend',
      () => {
        element.classList.remove(tempEffect, long)
      },
      { once: true }
    )
  }
  flash (long) {
    this.effectById('battleship-game', 'flash')
    this.effect(this.UI.board, 'burst', long)
  }
  flame (r, c, bomb) {
    if (bomb) {
      this.UI.delayEffect(r, c, cell => {
        this.effect(cell, 'flames', 'short')
      })
    } else {
      const cell = this.UI.gridCellAt(r, c)
      this.effect(cell, 'flames', 'long')
    }
  }

  processShot2 (weapon, r, c, power) {
    if (power > 0) this.flame(r, c, weapon.hasFlash)

    const key =
      power > 0 ? this.score.createShotKey(r, c) : this.score.newShotKey(r, c)
    if (key === null) {
      // if we are here, it is because of carpet bomb, so we can just
      return { hit: false, sunk: '' }
    }

    const result = this.fireShot2(weapon, r, c, power, key)

    this.updateUI(this.ships)
    return result
  }

  updateUI (ships) {
    this.updateTally(
      ships,
      this.loadOut.limitedAllSystems(),
      this.score.noOfShots()
    )
  }
  updateTally (ships, weaponSystems, noOfShots) {
    ships = ships || this.ships
    if (this.UI.placing && this.UI.placeTally) {
      this.UI.placeTally(ships)
    } else {
      this.UI.score.display(ships, noOfShots)
      this.UI.score.buildTally(ships, weaponSystems, this.UI)
    }
  }
}
