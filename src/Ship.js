import { bh } from './terrain.js'
import {
  makeKey,
  findClosestCoord,
  parsePair,
  makeKeyAndId
} from './utilities.js'

import { gameMap, gameMaps } from './gameMaps.js'
import { WeaponSystem } from './WeaponSystem.js'

function fst (arr) {
  if (!arr || arr.length === 0) return null
  return arr[0]
}
export class Ship {
  constructor (id, symmetry, letter, weapons) {
    this.id = id
    this.symmetry = symmetry
    this.letter = letter
    this.cells = []
    this.hits = new Set()
    this.sunk = false
    this.variant = 0
    this.weapons = weapons || {}
  }

  static id = 1

  static next () {
    Ship.id++
  }
  getTurn () {
    return this.weapon().getTurn(this.variant) || ''
  }
  reset () {
    this.hits = new Set()
    this.sunk = false
    if (this.weapons) {
      for (const weapon of this.weaponList()) {
        weapon.reset()
      }
    }
  }
  static createShipsFromShapes (shapes) {
    const ships = []
    Ship.id = 1
    WeaponSystem.id = 1
    for (const shape of shapes) {
      ships.push(Ship.createFromShape(shape))
      Ship.next()
    }
    return ships
  }
  makeKeyIds () {
    return this.weaponEntries()
      .map(([k, v]) => makeKeyAndId(k, v.id))
      .join('|')
  }
  hasWeapon () {
    const weapon = this.weapons
    return (
      weapon !== undefined && weapon !== null && Object.keys(weapon).length > 0
    )
  }
  rackAt (r, c) {
    const key = makeKey(r, c)
    return this.weapons[key]
  }
  weaponSystem () {
    return fst(this.weaponList())
  }
  weapon () {
    const first = this.weaponSystem()
    return first?.weapon
  }
  closestRack (r, c) {
    const entries = this.loadedEntries()
    const [k, v] = findClosestCoord(entries, r, c, ([k]) => parsePair(k))
    return [k, v]
  }
  getRackById (id) {
    const wps = this.weaponList()?.find(w => w.id === id)
    return wps
  }
  getShipById (id) {
    return this.id === id ? this : null
  }

  loadedEntries () {
    const enties = this.weaponEntries()
    return enties.filter(([, v]) => v.hasAmmo())
  }
  weaponEntries () {
    return Object.entries(this.weapons)
  }
  weaponList () {
    return Object.values(this.weapons)
  }

  loadedWeapon () {
    return fst(this.loadedWeapons())
  }
  loadedWeapons () {
    return this.weaponList().filter(w => w.hasAmmo())
  }
  hasAmmoLeft () {
    return this.ammoLeft() > 0
  }
  ammoLeft () {
    return this.sunk
      ? 0
      : this.weaponList().reduce((sum, w) => sum + w.ammoLeft(), 0)
  }

  ammoTotal () {
    return this.sunk
      ? 0
      : this.weaponList().reduce((sum, w) => sum + w.ammoTotal(), 0)
  }
  static createFromShape (shape) {
    return new Ship(Ship.id, shape.symmetry, shape.letter, shape.weaponSystem)
  }

  destroy (model) {
    for (const cell of this.cells) {
      const key = `${cell[0]},${cell[1]}`
      if (!this.hits.has(key)) {
        this.hitAt(key, Function.prototype, model)
      }
    }
  }
  l

  hitAt (key, onSink = Function.prototype, model) {
    this.hits.add(key)
    const wps = this.weapons[key]
    let info = null
    if (wps) {
      const filled = wps.ammo > 0
      const weapon = wps.weapon
      wps.ammo = 0
      if (filled) {
        wps.hit = true
        model.loadOut.useAmmo(wps)
        const cell = model.UI.gridCellAt(...parsePair(key))
        if (model.showShips) model.UI.useAmmoInCell(cell)
        if (weapon.volatile) {
          info = 'Magazine Detonated '
          weapon.animateDetonation(cell, model.UI.cellSizeScreen())
          if (!this.sunk) {
            this.sunk = true
            this.destroy(model)
            onSink(this, 'Magazine Detonated ')
            return true
          } else {
            //       model.updateMode(wps)
          }
        } else {
          //       model.updateMode(wps)
        }
      }
    }
    if (this.hits.size === this.cells.length) {
      this.sunk = true
      onSink(this, info)
      return true
    }
    return false
  }

  place (placed) {
    this.cells = placed
    this.hits = new Set()
    this.sunk = false
    return placed
  }
  unplace () {
    this.cells = []
    this.hits = new Set()
    this.sunk = false
  }
  placePlaceable (placeable, r, c) {
    const placing = placeable.placeAt(r, c)
    this.cells = placing.cells
    const w = placing.weapons
    if (w) {
      this.variant = placing.variant
      this.weapons = w
    }
  }
  placeables () {
    return this.shape.placeables()
  }
  isRightZone (r, c) {
    const shipType = this.type()
    const isLand = gameMap().isLand(r, c)
    // area rules
    if (shipType === 'G' && !isLand) return false
    if (shipType === 'S' && isLand) return false

    return true
  }
  noTouchCheck (r, c, shipCellGrid) {
    const map = gameMap()
    for (let nr = r - 1; nr <= r + 1; nr++)
      for (let nc = c - 1; nc <= c + 1; nc++) {
        if (map.inBounds(nr, nc) && shipCellGrid[nr][nc]) return false
      }
    return true
  }
  isAllRightZone (placing) {
    placing.some(([r, c]) => {
      return this.isRightZone(r, c) === false
    })
  }
  canPlace (variant, r0, c0, shipCellGrid) {
    const placing = this.placeCells(variant, r0, c0)
    const map = gameMap()
    if (
      placing.some(([r, c]) => {
        return !map.inBounds(r, c)
      })
    ) {
      // console.log('out of bounds')
      return false
    }
    if (this.isAllRightZone(placing)) {
      //console.log('wrong Zone')
      return false
    }

    if (
      placing.some(([r, c]) => {
        return (map.inBounds(r, c) && shipCellGrid[r][c]) === true
      })
    ) {
      //   console.log('overlapping')
      return false
    }
    if (
      placing.some(([r, c]) => {
        return this.noTouchCheck(r, c, shipCellGrid) === false
      })
    ) {
      //   console.log('touching')
      return false
    }
    // console.log('good')
    return true
  }
  addToGrid (shipCellGrid) {
    const letter = this.letter
    const id = this.id
    for (const [r, c] of this.cells) {
      shipCellGrid[r][c] = { id, letter }
    }
  }
  shape () {
    return gameMaps().shapesByLetter[this.letter]
  }
  isInTallyGroup (tallyGroup) {
    const shape = this.shape()
    if (!shape) {
      console.log('shape not found for', this)
      return false
    }
    return shape.tallyGroup === tallyGroup
  }
  sunkDescription (middle = ' ') {
    return bh.shipSunkText(this.letter, middle)
  }

  description () {
    return bh.shipDescription(this.letter)
  }

  type () {
    return bh.shipType(this.letter)
  }
}
