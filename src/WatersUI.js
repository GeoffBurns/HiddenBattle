import { gameMap, gameMaps } from './gameMaps.js'
import { gameHost } from './maps.js'
import { ScoreUI } from './ScoreUI.js'
import { terrain } from './terrain.js'
import {
  addKeyToCell,
  coordsFromCell,
  makeKey,
  parsePair,
  setCellCoords
} from './utilities.js'

import { StatusUI } from './StatusUI.js'

export let noticeTimerId = null
export let tipsTimerId = null

export const gameStatus = new StatusUI()
export const startCharCode = 65

export class WatersUI {
  constructor (terroritory, title) {
    this.board = document.getElementById(terroritory + '-board')
    this.score = new ScoreUI(terroritory)
    this.terroritory = terroritory
    this.terroritoryTitle = title
    this.placingShips = false
    this.containerWidth = gameHost.containerWidth
    this.isPrinting = false
  }

  showTitle (name) {
    const titleEl = document.getElementById(this.terroritory + '-title')
    titleEl.textContent = this.terroritoryTitle + ' ' + name
  }
  showMapTitle () {
    this.showTitle(terrain.current.mapHeading)
  }
  showFleetTitle () {
    this.showTitle(terrain.current.fleetHeading)
  }

  cellSizeScreen (map) {
    map = map || gameMap()
    return this.containerWidth / (map?.cols || 18)
  }
  cellSizeList () {
    return this.containerWidth / 22
  }
  cellSizePrint (map) {
    map = map || gameMap()
    return 600 / (map.cols + 1)
  }

  cellUnit () {
    return 'px'
  }
  cellSize (map) {
    return this.isPrinting ? this.cellSizePrint(map) : this.cellSizeScreen()
  }

  cellSizeString () {
    return this.cellSize() + this.cellUnit()
  }

  cellSizeStringList () {
    return this.cellSizeList() + this.cellUnit()
  }
  cellSizeStringPrint () {
    return this.cellSizePrint() + this.cellUnit()
  }
  gridCellRawAt (r, c) {
    return this.board.children[r * gameMap().cols + c]
  }
  gridCellAt (r, c) {
    const result = this.gridCellRawAt(r, c)
    if (result?.classList) return result
    throw new Error(
      'Invalid cell' + JSON.stringify(result) + 'at ' + r + ',' + c
    )
  }

  delayEffects (coords, effect, mindelay = 380, maxdelay = 730) {
    for (const [r, c, power] of coords) {
      this.delayEffect(r, c, effect, mindelay, maxdelay, power)
    }
  }
  delayEffect (r, c, effect, mindelay = 380, maxdelay = 730, power) {
    const range = maxdelay - mindelay
    const delay = Math.floor(Math.random() * range) + mindelay
    const timerId = setTimeout(() => {
      const cell = this.gridCellAt(r, c)
      effect(cell, power)
    }, delay)
  }
  displayShipCellBase (cell, ship) {
    const letter = ship?.letter || '-'
    cell.dataset.id = ship?.id
    cell.dataset.letter = letter
    this.setShipCellColors(cell, letter)
  }

  displayLetterShipCell (ship, cell) {
    const letter = ship?.letter || '-'
    cell.dataset.letter = letter
    cell.textContent = letter
    this.displayShipCellBase(cell, ship)
  }

  visibleShipCell (ship, r, c, cell) {
    const w = ship?.rackAt(r, c)
    if (w) {
      this.displayArmedShipCell(ship, cell, w)
    } else {
      this.displayLetterShipCell(ship, cell)
    }
    this.displaySurroundShipCell(ship, cell)
  }

  surroundShipCellAt (ship, r, c) {
    const cell = this.gridCellAt(r, c)
    this.displaySurroundShipCell(ship, cell)
  }
  displaySurroundShipCell (ship, cell) {
    if (!ship.weapons || Object.values(ship.weapons).length === 0) return
    const letter = ship?.letter || '-'
    cell.dataset.sletter = letter
    const wletter = ship.weapon().letter
    cell.dataset.wletters = wletter
    cell.dataset.variant = ship.variant
    const turn = ship.getTurn()
    if (turn && turn !== '') cell.classList.add(turn)
    cell.dataset.surround = ship.id
    const keyIds = ship.makeKeyIds()
    addKeyToCell(cell, 'keyIds', keyIds)
  }

  displayArmedShipCell (ship, cell, w) {
    const letter = ship?.letter || '-'
    cell.dataset.id = ship?.id
    cell.dataset.letter = letter
    const wletter = w.weapon.letter
    const ammo = w.ammo
    cell.dataset.wletter = wletter
    cell.dataset.ammo = ammo
    cell.dataset.wid = w.id
    cell.dataset.variant = ship.variant
    cell.textContent = ''
    cell.classList.add('weapon')
    this.displayShipCellBase(cell, ship)
  }
  displaySunkCell (cell, letter) {
    this.setShipCellColors(cell, letter)

    cell.textContent = letter
  }
  setShipCellColors (cell, letter) {
    const maps = gameMaps()
    cell.style.color = maps.shipLetterColors[letter] || '#fff'
    cell.style.background = maps.shipColors[letter] || 'rgba(255,255,255,0.2)'
  }

  displayAsRevealed (cell, ship) {
    const letter = ship?.letter || '-'
    if (cell) {
      this.setShipCellColors(cell, letter)

      const [r, c] = coordsFromCell(cell)
      const w = ship?.rackAt(r, c)
      if (w) {
        if ((Number.parseInt(cell.dataset.ammo) || 0) > 0) {
          cell.classList.add('weapon')
        } else {
          cell.classList.add('weapon-empty')
        }
        cell.textContent = ''
      } else {
        cell.textContent = letter
      }
    }
  }
  revealShip (ship) {
    for (const [r, c] of ship.cells) {
      const cell = this.gridCellAt(r, c)
      this.displayAsRevealed(cell, ship)
    }
  }

  clearCellContent (cell) {
    cell.textContent = ''
    this.clearCell(cell)
  }
  clearCellVisuals (cell, details, classClear) {
    const clear = classClear || this.clearCell.bind(this)
    if (details === 'content') {
      cell.textContent = ''
    } else if (details === 'all') {
      cell.textContent = ''
      cell.style.background = ''
      cell.style.color = ''
    }
    clear(cell)
  }

  clearPlaceCellVisuals (cell) {
    cell.textContent = ''
    cell.style.background = ''
    cell.style.color = ''
    this.clearPlaceCell(cell)
  }
  clearCell (cell) {
    cell.classList.remove(
      'hit',
      'frd-hit',
      'frd-sunk',
      'miss',
      'semi',
      'wake',
      'semi-miss',
      'placed'
    )
  }
  clearFriendCell (cell) {
    cell.classList.remove(
      'hit',
      'frd-hit',
      'frd-sunk',
      'miss',
      'semi',
      'wake',
      'semi-miss',
      'placed',
      'weapon-empty'
    )
  }
  clearPlaceCell (cell) {
    cell.classList.remove(
      'miss',
      'placed',
      'weapon',
      'weapon-empty',
      'turn2',
      'turn3',
      'turn4',
      'launch'
    )
    for (const key in cell.dataset) {
      if (key !== 'r' && key !== 'c') delete cell.dataset[key]
    }
  }
  clearClasses () {
    for (const cell of this.board.children) {
      this.clearCell(cell)
    }
  }
  displayAsSunk (cell, _letter) {
    this.clearCell(cell)
    cell.classList.add('frd-sunk')
    this.cellHitBase(cell)
  }

  cellHitBase (cell) {
    cell.classList.remove(
      'semi',
      'semi-miss',
      'wake',
      'weapon',
      'weapon-empty',
      'active'
    )
    cell.classList.add('frd-hit')
    cell.textContent = ''
  }
  cellSunkAt (r, c, letter) {
    const cell = this.gridCellAt(r, c)
    this.displayAsSunk(cell, letter)
  }

  cellHit (r, c) {
    const cell = this.gridCellAt(r, c)

    cell.classList.remove(
      'semi',
      'semi-miss',
      'wake',
      'weapon-empty',
      'weapon',
      'active'
    )
    cell.classList.add('hit')
    cell.textContent = ''
  }
  cellSemiReveal (r, c) {
    const cell = this.gridCellAt(r, c)

    if (
      cell.classList.contains('placed') ||
      cell.classList.contains('miss') ||
      cell.classList.contains('hit')
    )
      return { hit: false, sunk: '', reveal: false }
    cell.classList.add('semi')
    cell.classList.remove('wake')
    cell.textContent = ''
    return { hit: false, sunk: '', reveal: true }
  }

  cellHintReveal (r, c) {
    const cell = this.gridCellAt(r, c)

    if (
      cell.classList.contains('placed') ||
      cell.classList.contains('miss') ||
      cell.classList.contains('hit') ||
      cell.classList.contains('semi')
    )
      return
    cell.classList.add('hint')
    cell.classList.remove('wake')
    cell.textContent = ''
  }
  cellWeaponActive (r, c, turn, extra) {
    const cell = this.gridCellAt(r, c)

    if (extra) {
      cell.classList.add('weapon', 'active', extra)
    } else {
      cell.classList.add('active')
    }
    if (turn && turn !== '') cell.classList.add(turn)
    cell.classList.remove('wake')
    cell.textContent = ''
  }
  cellWeaponDeactivate (r, c, extra) {
    const cell = this.gridCellAt(r, c)
    if (extra) {
      cell.classList.remove('active', 'weapon', extra)
    } else {
      cell.classList.remove('active')
    }
  }
  cellUseAmmo (r, c) {
    const cell = this.gridCellAt(r, c)
    this.useAmmoInCell(cell)
  }
  useAmmoInCell (cell) {
    const dataset = cell.dataset
    cell.classList.remove('weapon', 'active')
    cell.classList.add('weapon-empty')
    dataset.ammo = 0
  }

  cellMiss (r, c) {
    const cell = this.gridCellAt(r, c)

    if (cell.classList.contains('placed')) return
    cell.classList.add('miss')
    cell.classList.remove('wake')
  }
  surrounder (map, r, c, adder) {
    const m = map || gameMap()
    // surrounding water misses
    for (let dr = -1; dr <= 1; dr++)
      for (let dc = -1; dc <= 1; dc++) {
        const rr = r + dr
        const cc = c + dc
        if (m.inBounds(rr, cc)) {
          adder(rr, cc)
        }
      }
  }
  surround (map, r, c, container) {
    this.surrounder(map, r, c, (rr, cc) => {
      container.add(makeKey(rr, cc))
    })
  }
  surroundObj (map, r, c, container, maker) {
    this.surrounder(map, r, c, (rr, cc) => {
      container[makeKey(rr, cc)] = maker(rr, cc)
    })
  }
  surroundList (map, r, c, container, maker) {
    this.surrounder(map, r, c, (rr, cc) => {
      container.push(maker(rr, cc))
    })
  }

  cellSet (cells) {
    let result = new Set()
    for (const [r, c] of cells) {
      // surrounding water misses
      result.add(makeKey(r, c))
    }
    return result
  }
  hollowCells (cells) {
    return this.surroundCells(cells).difference(this.cellSet(cells))
  }
  surroundCells (cells) {
    const map = gameMap()
    let surroundings = new Set()
    for (const [r, c] of cells) {
      // surrounding water misses
      this.surround(map, r, c, surroundings)
    }
    return surroundings
  }
  surroundCellElement (cells, container) {
    const map = gameMap()
    let surroundings = container || {}
    for (const cell of cells) {
      const [r, c] = coordsFromCell(cell)
      this.surroundObj(map, r, c, surroundings, this.gridCellAt.bind(this))
    }
    return Object.values(surroundings)
  }
  displaySurround (cells, ship, cellMiss, display) {
    const surround = this.hollowCells(cells)
    const surroundings = [...surround].map(p => parsePair(p))
    for (const [r, c] of surroundings) {
      cellMiss(r, c)
    }
    if (display) {
      for (const [r, c] of cells) {
        display(r, c, ship)
      }
    }
  }
  resetBoardSize (map, cellSize) {
    if (!map) map = gameMap()
    cellSize = cellSize || this.cellSizeString()
    this.board.style.setProperty('--cols', map?.cols || 18)
    this.board.style.setProperty('--rows', map?.rows || 8)
    this.board.style.setProperty('--boxSize', cellSize)
    this.board.innerHTML = ''
  }
  resetBoardSizePrint (map) {
    if (!map) map = gameMap()
    const cellSize = this.cellSizeStringPrint()
    this.board.style.setProperty('--cols', map.cols + 1)
    this.board.style.setProperty('--rows', map.rows + 1)
    this.board.style.setProperty('--boxSize', cellSize)
    this.board.innerHTML = ''
  }
  colorize (r, c) {
    this.colorizeCell(this.gridCellRawAt(r, c), r, c)
  }

  recolor (r, c) {
    this.recolorCell(this.gridCellRawAt(r, c), r, c)
  }
  refreshAllColor () {
    for (const el of this.board.children) {
      this.refreshColor(el)
    }
  }
  refreshColor (cell) {
    const r = Number.parseInt(cell.dataset.r)
    const c = Number.parseInt(cell.dataset.c)
    this.uncolorCell(cell)
    this.colorizeCell(cell, r, c)
  }
  uncolorCell (cell) {
    cell.classList.remove(
      'land',
      'sea',
      'light',
      'dark',
      'rightEdge',
      'leftEdge',
      'topEdge',
      'bottomEdge'
    )
  }
  recolorCell (cell, r, c) {
    this.uncolorCell(cell)
    this.colorizeCell(cell, r, c)
  }
  colorizeCell (cell, r, c, map) {
    if (!map) map = gameMap()

    map.tagCell(cell.classList, r, c)

    const land = map.isLand(r, c)
    const c1 = c + 1
    const r1 = r + 1
    if (!land && c1 < map.cols && map.isLand(r, c1)) {
      cell.classList.add('rightEdge')
    }

    if (c !== 0 && !land && map.isLand(r, c - 1)) {
      cell.classList.add('leftEdge')
    }
    if (r1 < map.rows && land !== map.isLand(r1, c)) {
      cell.classList.add('bottomEdge')
    }
    if (r !== 0 && !land && map.isLand(r - 1, c)) {
      cell.classList.add('topEdge')
    }
  }

  buildEmptyCell () {
    const cell = document.createElement('div')
    cell.className = 'cell empty'
    this.board.appendChild(cell)
  }

  buildRowLabel (max, r) {
    const cell = document.createElement('div')
    cell.className = 'cell row-label'
    cell.dataset.r = r
    cell.textContent = max - r
    this.board.appendChild(cell)
  }
  buildColLabel (c) {
    const cell = document.createElement('div')
    cell.className = 'cell col-label'
    cell.dataset.c = c
    cell.textContent = String.fromCodePoint(startCharCode + c)
    this.board.appendChild(cell)
  }
  buildCell (r, c, onClickCell, map) {
    const cell = document.createElement('div')
    cell.className = 'cell'
    this.colorizeCell(cell, r, c, map)
    setCellCoords(cell, r, c)

    if (onClickCell) {
      cell.addEventListener('click', onClickCell)
    }
    this.board.appendChild(cell)
  }
  buildBoardPrint (map) {
    map = map || gameMap()
    this.board.innerHTML = ''
    this.buildEmptyCell()

    for (let c = 0; c < map.cols; c++) {
      this.buildColLabel(c)
    }
    for (let r = 0; r < map.rows; r++) {
      this.buildRowLabel(map.rows, r)
      for (let c = 0; c < map.cols; c++) {
        this.buildCell(r, c, null, map)
      }
    }
  }
  buildBoard (onClickCell, thisRef, map) {
    map = map || gameMap()
    this.board.innerHTML = ''
    for (let r = 0; r < map.rows; r++) {
      for (let c = 0; c < map.cols; c++) {
        if (onClickCell)
          this.buildCell(r, c, onClickCell.bind(thisRef, r, c), map)
        else this.buildCell(r, c, null, map)
      }
    }
  }
  clearVisualsBase (details, classClear) {
    const clear = classClear || this.clearCell.bind(this)
    const children = this.board?.children
    if (!children) return
    for (const el of children) {
      this.clearCellVisuals(el, details, clear)
    }
  }
  clearVisuals () {
    this.clearVisualsBase('all')
  }

  clearFriendVisuals () {
    this.clearVisualsBase('all', this.clearFriendCell.bind(this))
  }
  clearFriendClasses () {
    this.clearVisualsBase('none', this.clearFriendCell.bind(this))
  }
  clearPlaceVisuals () {
    this.clearVisualsBase('all', this.clearPlaceCell.bind(this))
  }
  showNotice (notice) {
    clearInterval(noticeTimerId)
    noticeTimerId = null
    gameStatus.info(notice)
    // turn off tips
    noticeTimerId = setInterval(() => {
      // turn on tips
      clearInterval(noticeTimerId)
      noticeTimerId = null
    }, 2000)
  }
  showTips () {
    gameStatus.clear()
    let index = 0

    gameStatus.info(this.tips[0])
    tipsTimerId = setInterval(() => {
      if (tipsTimerId === false) {
        clearInterval(tipsTimerId)
        tipsTimerId = null
      } else {
        if (noticeTimerId) return
        gameStatus.info(this.tips[index])
        index = (index + 1) % this.tips.length
      }
    }, 13000)
  }
  hideTips () {
    if (tipsTimerId) {
      clearInterval(tipsTimerId)
      tipsTimerId = null
    }
  }
}
