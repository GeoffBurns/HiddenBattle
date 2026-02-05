import {
  drawSegmentTo,
  drawSegmentUpTo,
  drawPie2,
  drawRay,
  drawSegmentFor,
  drawLineInfinite,
  intercepts
} from './maskShape.js'
import { GridBase } from './gridBase.js'
import { coordsToGrid, coordsToOccBig } from './maskConvert.js'
import { Actions } from './actions.js'

export class ListCanvas extends GridBase {
  constructor (width, height, list) {
    super(width, height)
    this.list = list || []
  }
  at (x, y) {
    if (!this.inBounds(x, y)) return undefined
    const item = this.list.find(([x1, y1]) => {
      x === x1 && y === y1
    })
    if (!item) return 0
    return item[2] || 1
  }
  set (x, y, value) {
    const isIn = this.list.some(([x1, y1]) => x === x1 && y === y1)
    if (isIn) return
    if (value !== undefined && value !== null) {
      this.list.push([x, y, value])
      this._actions = null
    } else {
      this.list.push([x, y])
      this._actions = null
    }
  }
  reverse () {
    this.list.reverse()
  }
  *entries () {
    for (let i = 0; i < this.list.length; i++) {
      yield [this.list[i][0], this.list[i][1], this.list[i][2] || 1, i, this]
    }
  }

  *values () {
    for (let i = 0; i < this.list.length; i++) {
      yield this.list[i][2] || 1
    }
  }
  *keys () {
    for (let i = 0; i < this.list.length; i++) {
      yield [this.list[i][0], this.list[i][1], i]
    }
  }
  get actions () {
    if (this._actions) {
      return this._actions
    }
    const mask = coordsToOccBig(this.list, this.width)
    this._actions = new Actions(this.width, this.height, mask)
    return this._actions
  }
  intercepts (x0, y0, x1, y1) {
    return intercepts(x0, y0, x1, y1, this)
  }
  drawSegmentTo (x0, y0, x1, y1, color) {
    drawSegmentTo(x0, y0, x1, y1, this, color)
  }
  drawSegmentUpTo (x0, y0, x1, y1, color) {
    drawSegmentUpTo(x0, y0, x1, y1, this, color)
  }

  drawSegmentFor (x0, y0, x1, y1, distance, color) {
    drawSegmentFor(x0, y0, x1, y1, distance, this, color)
  }
  drawPie (x0, y0, x1, y1, radius) {
    drawPie2(x0, y0, x1, y1, radius, this, 22.5)
  }
  drawRay (x0, y0, x1, y1) {
    drawRay(x0, y0, x1, y1, this)
  }
  drawLineInfinite (x0, y0, x1, y1) {
    drawLineInfinite(x0, y0, x1, y1, this)
  }
  get grid () {
    this._grid = coordsToGrid(this.list, this.width, this.height)
    return this._grid
  }
  get asci () {
    const grid = this.grid
    let out = ''
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        out += grid[y][x] || '.'
      }
      out += '\n'
    }
    return out
  }
}
