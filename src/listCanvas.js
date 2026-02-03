import {
  drawSegmentTo,
  drawPie2,
  drawRay,
  drawSegmentFor,
  drawLineInfinite
} from './maskShape.js'
import { GridBase } from './gridBase.js'
import { coordsToGrid } from './maskConvert.js'

export class ListCanvas extends GridBase {
  constructor (width, height) {
    super(width, height)
    this.list = []
  }
  set (x, y, value) {
    if (value !== undefined && value !== null) {
      this.list.push([x, y, value])
    } else {
      this.list.push([x, y])
    }
  }

  drawSegmentTo (x0, y0, x1, y1, color) {
    drawSegmentTo(x0, y0, x1, y1, this, color)
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
