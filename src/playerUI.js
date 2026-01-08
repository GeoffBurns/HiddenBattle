import { gameMap, gameMaps, gameHost } from './maps.js'
import { StatusUI } from './StatusUI.js'

let noticeTimerId = null
let tipsTimerId = null

export const gameStatus = new StatusUI()
const startCharCode = 65
export class WatersUI {
  constructor () {
    this.board = {}
    this.placingShips = false
    this.containerWidth = gameHost.containerWidth
    this.isPrinting = false
  }

  cellSizeScreen (map) {
    map = map || gameMap()
    return this.containerWidth / map.cols
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

  displayAsRevealed (cell, letter) {
    if (cell) {
      const maps = gameMaps()
      cell.style.background =
        maps.shipColors[letter] || 'rgba(255, 209, 102, 0.3)'
      cell.style.color = maps.shipLetterColors[letter] || '#ffd166'
      cell.textContent = letter
    }
  }
  revealShip (ship) {
    for (const [r, c] of ship.cells) {
      const cell = this.gridCellAt(r, c)
      this.displayAsRevealed(cell, ship.letter)
    }
  }

  clearCellContent (cell) {
    cell.textContent = ''
    this.clearCell(cell)
  }
  clearCellVisuals (cell) {
    cell.textContent = ''
    cell.style.background = ''
    cell.style.color = ''
    this.clearCell(cell)
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
  clearClasses () {
    for (const cell of this.board.children) {
      this.clearCell(cell)
    }
  }
  displayAsSunk (cell, _letter) {
    this.clearCell(cell)
    cell.classList.add('frd-sunk', 'frd-hit')
  }
  cellSunkAt (r, c, letter) {
    const cell = this.gridCellAt(r, c)
    this.displayAsSunk(cell, letter)
  }

  cellHit (r, c) {
    const cell = this.gridCellAt(r, c)

    cell.classList.remove('semi', 'semi-miss', 'wake')
    cell.classList.add('hit')
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
  cellMiss (r, c) {
    const cell = this.gridCellAt(r, c)

    if (cell.classList.contains('placed')) return
    cell.classList.add('miss')
    cell.classList.remove('wake')
  }
  surroundMiss (r, c, cellMiss) {
    if (!cellMiss) return
    const map = gameMap()
    // surrounding water misses
    for (let dr = -1; dr <= 1; dr++)
      for (let dc = -1; dc <= 1; dc++) {
        const rr = r + dr
        const cc = c + dc
        if (map.inBounds(rr, cc)) {
          cellMiss(rr, cc)
        }
      }
  }
  displaySurround (cells, letter, cellMiss, display) {
    for (const [r, c] of cells) {
      // surrounding water misses
      this.surroundMiss(r, c, cellMiss)
      if (display) {
        display(r, c, letter)
      }
    }
  }
  resetBoardSize (map, cellSize) {
    if (!map) map = gameMap()
    cellSize = cellSize || this.cellSizeString()
    this.board.style.setProperty('--cols', map.cols)
    this.board.style.setProperty('--rows', map.rows)
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
    cell.dataset.r = r
    cell.dataset.c = c

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
  clearVisuals () {
    for (const el of this.board.children) {
      this.clearCellVisuals(el)
    }
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
