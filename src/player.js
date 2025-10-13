import { gameMaps } from './maps.js'
import { gameStatus } from './playerUI.js'
import { Score } from './Score.js'
import { LoadOut, terrain } from './Shape.js'
import { Ship } from './Ship.js'
import { placedShipsInstance } from './selection.js'
import { randomPlaceShape } from './utils.js'

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
    this.ships = []
    this.score = new Score()
    this.opponent = null
    this.UI = ui
    this.shipCellGrid = []
    this.boardDestroyed = false
    this.nextId = 1
    this.preamble0 = 'Your'
    this.preamble = 'You were '
    this.resetShipCells()
    this.displayInfo = gameStatus.info.bind(gameStatus)
  }
  clipboardKey () {
    return 'geoffs-battleship.placed-ships'
  }

  placedShips () {
    return {
      ships: this.ships,
      shipCellGrid: this.shipCellGrid,
      map: gameMaps.current.title
    }
  }

  store () {
    localStorage.setItem(
      this.clipboardKey(),
      JSON.stringify(this.placedShips())
    )
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
    map = map || gameMaps.current
    const placedShips = map.example
    if (!placedShips) {
      this.autoPlace()
      return
    }

    const matchableShips = [...this.ships]
    for (const ship of placedShips.ships) {
      const matchingShip = popFirst(
        matchableShips,
        s => s.letter === ship.letter,
        ship
      )
      if (matchingShip) {
        placedShipsInstance.push(matchingShip, ship.cells)
        matchingShip.addToGrid(this.shipCellGrid)
        this.UI.placement(ship.cells, this, matchingShip)
      }
    }
    if (matchableShips.length !== 0) {
      console.log(`${matchableShips.length} ships not matched`)
    }
  }

  load (placedShips) {
    placedShips =
      placedShips || JSON.parse(localStorage.getItem(this.clipboardKey()))
    if (!placedShips || gameMaps.current.title !== placedShips.map) return

    const matchableShips = [...this.ships]
    for (const ship of placedShips.ships) {
      const matchingShip = popFirst(
        matchableShips,
        s => s.letter === ship.letter,
        ship
      )

      if (matchingShip) {
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
    }
    if (matchableShips.length !== 0) {
      console.log(`${matchableShips.length} ships not matched`)
    } else {
      this.UI.resetTrays()
    }
  }
  resetMap (map) {
    this.boardDestroyed = false
    this.isRevealed = false
    this.setMap(map)
  }
  armWeapons (map) {
    map = map || gameMaps.current
    this.loadOut = new LoadOut(map.weapons)
    if (this.cursorChange)
      this.loadOut.onCursorChange = this.cursorChange.bind(this)
  }
  setMap (map) {
    map = map || gameMaps.current
    this.ships = this.createShips(map)
    this.armWeapons(map)
  }
  getHitCandidates (effect) {
    const candidates = []
    for (const [r, c, power] of effect) {
      if (gameMaps.inBounds(r, c) && this.score.newShotKey(r, c) !== null) {
        const cell = this.UI.gridCellAt(r, c)
        if (
          !cell.classList.contains('frd-hit') &&
          !cell.classList.contains('miss') &&
          !cell.classList.contains('hit')
        ) {
          cell.classList.add('wake')
        }
        if (this.shipCellAt(r, c) !== null) {
          candidates.push([r, c, power])
        }
      }
    }
    return candidates
  }
  getStrikeSplash (weapon, candidates) {
    const pick = Math.floor(Math.random() * candidates.length)

    return weapon.splash(gameMaps.current, candidates[pick])
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
  createShips (map) {
    map = map || gameMaps.current
    const ships = []
    let id = 1
    for (const base of map.terrain.ships.baseShapes) {
      const num = map.shipNum[base.letter]
      for (let i = 0; i < num; i++) {
        ships.push(Ship.createFromShape(base, id))
        id++
      }
    }
    return ships
  }
  createCandidateWeapons () {
    const candidates = gameMaps.terrain.weapons.weapons

    return candidates
  }
  createCandidateShips () {
    const candidates = []
    let id = 1
    for (const base of gameMaps.baseShapes) {
      candidates.push(Ship.createFromShape(base, id))
      id++
    }

    this.nextId = id
    return candidates
  }
  resetShipCells () {
    this.shipCellGrid = Array.from({ length: gameMaps.current.rows }, () =>
      Array(gameMaps.current.cols).fill(null)
    )
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
  markSunk (ship) {
    ship.sunk = true
    this.sunkWarning(ship)
    this.UI.displaySurround(
      ship.cells,
      ship.letter,
      (r, c) => this.recordAutoMiss(r, c),
      (r, c, letter) => this.UI.cellSunkAt(r, c, letter)
    )
    this.checkFleetSunk()
  }
  sunkDescription (ship) {
    if (this.opponent) {
      return this.preamble0 + ' ' + ship.sunkDescription(' was ')
    }
    return ship.sunkDescription()
  }
  sunkLetterDescription (letter) {
    if (this.opponent) {
      return (
        this.preamble0 + ' ' + terrain.current.sunkDescription(letter, ' was ')
      )
    }
    return terrain.current.sunkDescription(letter)
  }
  sunkWarning (ship) {
    this.displayInfo(this.sunkDescription(ship))
  }

  checkForHit (r, c, key, shipCell) {
    if (!shipCell) {
      return
    }

    const hitShip = this.ships.find(s => s.id === shipCell.id)
    if (!hitShip) {
      this.UI.cellMiss(r, c)
      return { hit: false, sunk: '' }
    }
    hitShip.hits.add(key)
    this.score.semi.delete(key)
    this.UI.cellHit(r, c)

    if (hitShip.hits.size === hitShip.cells.length) {
      // ship sunk
      this.markSunk(hitShip)
      return { hit: true, sunkLetter: hitShip.letter }
    }
    return { hit: true, sunkLetter: '' }
  }

  checkForHit2 (weapon, r, c, power, key, shipCell) {
    if (!shipCell) {
      return
    }

    const hitShip = this.ships.find(s => s.id === shipCell.id)

    if (!hitShip) {
      this.UI.cellMiss(r, c)
      return { hit: false, sunk: '', reveal: false }
    }

    const shape = gameMaps.shapesByLetter[shipCell.letter]
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
    hitShip.hits.add(key)
    this.score.semi.delete(key)
    this.UI.cellHit(r, c)

    if (hitShip.hits.size === hitShip.cells.length) {
      // ship sunk
      this.markSunk(hitShip)
      return { hit: true, sunkLetter: hitShip.letter }
    }
    return { hit: true, sunkLetter: '' }
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

  updateResultsOfBomb (hits, sunks, reveals) {
    reveals = reveals || 0
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
  effect (element, tempEffect) {
    element.classList.add(tempEffect)
    element.addEventListener(
      'animationend',
      () => {
        element.classList.remove(tempEffect)
      },
      { once: true }
    )
  }
  flash () {
    this.effectById('battleship-game', 'flash')
    this.effect(this.UI.board, 'burst')
  }
  flame (r, c, bomb) {
    if (bomb) {
      const delay = Math.floor(Math.random() * 150) + 80
      setTimeout(() => {
        const cell = this.UI.gridCellAt(r, c)
        this.effect(cell, 'flames')
      }, delay)
    } else {
      const cell = this.UI.gridCellAt(r, c)
      this.effect(cell, 'flames')
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
