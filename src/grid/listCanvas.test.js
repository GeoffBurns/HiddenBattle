/* eslint-env jest */

/* global describe, jest,  test, expect */

import { Shape } from './shape.js'

jest.mock('./maskShape.js', () => ({
  drawSegmentTo: jest.fn(),
  drawPie2: jest.fn(),
  drawRay: jest.fn(),
  drawSegmentFor: jest.fn(),
  drawLineInfinite: jest.fn()
}))

const mockGrid = [
  ['a', '.'],
  ['.', 'b']
]

jest.mock('./maskConvert.js', () => ({
  coordsToGrid: jest.fn(() => mockGrid)
}))

import { ListCanvas } from './listCanvas.js'
import {
  drawSegmentTo,
  drawPie2,
  drawRay,
  drawSegmentFor,
  drawLineInfinite
} from './maskShape.js'
import { coordsToGrid } from './maskConvert.js'

describe('ListCanvas', () => {
  test('set adds entries to list', () => {
    const lc = getLc()
    lc.set(0, 1, 'x')
    lc.set(1, 0)
    expect(lc.list).toEqual([
      [0, 1, 'x'],
      [1, 0]
    ])
  })

  test('grid getter calls coordsToGrid and returns grid', () => {
    const lc = getLc()
    lc.set(0, 0, 'a')
    const grid = lc.grid
    expect(coordsToGrid).toHaveBeenCalledWith(lc.list, 2, 2)
    expect(grid).toBe(mockGrid)
  })

  test('asci returns expected ASCII output', () => {
    const lc = getLc()
    const ascii = lc.asci
    const expected = 'a.\n.b\n'
    expect(ascii).toBe(expected)
  })

  test('draw methods delegate to maskShape functions', () => {
    const lc = getLc(10, 10)
    lc.drawSegmentTo(1, 2, 3, 4, 1)
    expect(drawSegmentTo).toHaveBeenCalledWith(1, 2, 3, 4, lc, 1)

    lc.drawSegmentFor(1, 2, 3, 4, 5, 2)
    expect(drawSegmentFor).toHaveBeenCalledWith(1, 2, 3, 4, 5, lc, 2)

    lc.drawPie(1, 2, 3, 4, 6)
    expect(drawPie2).toHaveBeenCalledWith(1, 2, 3, 4, 6, lc, 22.5)

    lc.drawRay(1, 2, 3, 4)
    expect(drawRay).toHaveBeenCalledWith(1, 2, 3, 4, lc)

    lc.drawLineInfinite(1, 2, 3, 4)
    expect(drawLineInfinite).toHaveBeenCalledWith(1, 2, 3, 4, lc)
  })
})
function getLc (x = 2, y = 2) {
  return new ListCanvas(Shape.rectangle(x, y), [])
}
