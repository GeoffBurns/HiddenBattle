import {
  drawSegmentTo,
  drawPie,
  drawRay,
  drawSegmentFor,
  drawLineInfinite
} from './maskShape.js'
import { RectBase } from './rectbase.js'

export class CanvasGrid extends RectBase {
  constructor (width, height) {
    super(width, height)
    if (new.target === CanvasGrid) {
      throw new Error(
        'base class cannot be instantiated directly. Please extend it.'
      )
    }
  }
  set (x, y, color) {
    throw new Error('set method in derived class must be implemented')
  }

  drawSegmentTo (x0, y0, x1, y1, color) {
    drawSegmentTo(x0, y0, x1, y1, this, color)
  }

  drawSegmentFor (x0, y0, x1, y1, distance, color) {
    drawSegmentFor(x0, y0, x1, y1, distance, this, color)
  }
  drawPie (x0, y0, x1, y1, radius, color) {
    drawPie(x0, y0, x1, y1, radius, this, 22.5, color)
  }
  drawRay (x0, y0, x1, y1) {
    drawRay(x0, y0, x1, y1, this)
  }
  drawLineInfinite (x0, y0, x1, y1) {
    drawLineInfinite(x0, y0, x1, y1, this)
  }
}
