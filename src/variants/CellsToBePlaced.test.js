/* eslint-env jest */

/* global describe, it, test, expect, beforeEach, afterEach, jest */

import { CellsToBePlaced } from './CellsToBePlaced.js'

function makeGrid (rows, cols, fill = null) {
  return Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => fill)
  )
}

describe('CellsToBePlaced core behaviors', () => {
  test('isCandidate, zoneInfo and isInMatchingZone use provided target and validator', () => {
    const variant = [
      [0, 0],
      [0, 1]
    ]
    const validator = z => z === 'Z'
    const target = {
      getZone: (r, c, z) => (r === 2 && c === 3 && z === 0 ? 'Z' : 'NO'),
      boundsChecker: () => true
    }

    const placing = new CellsToBePlaced(variant, 2, 3, validator, 0, target)

    expect(placing.isCandidate(2, 3)).toBe(true)
    expect(placing.isCandidate(2, 4)).toBe(true)
    expect(placing.isCandidate(1, 1)).toBe(false)

    expect(placing.zoneInfo(2, 3)).toBe('Z')
    expect(placing.isInMatchingZone(2, 3)).toBe(true)
    expect(placing.isInMatchingZone(2, 4)).toBe(false)
  })

  test('noTouch returns false when neighbor cells occupied', () => {
    const variant = [[0, 0]]
    const target = { boundsChecker: () => true, getZone: () => {} }
    const placing = new CellsToBePlaced(variant, 2, 2, () => true, 0, target)

    const grid = makeGrid(5, 5, null)
    grid[1][2] = 'X' // neighbor above
    expect(placing.noTouch(2, 2, grid)).toBe(false)

    const grid2 = makeGrid(5, 5, null)
    expect(placing.noTouch(2, 2, grid2)).toBe(true)
  })

  test('isNotInBounds detects cells outside bounds via target', () => {
    const variant = [
      [0, 0],
      [0, 1]
    ]
    const target = {
      boundsChecker: (r, c) => !(r === 5 && c === 5),
      getZone: () => {}
    }
    const placing = new CellsToBePlaced(variant, 5, 5, () => true, 0, target)
    expect(placing.isNotInBounds()).toBe(true)
  })

  test('isOverlapping, isTouching, and canPlace branch correctly', () => {
    const variant = [[0, 0]]
    const target = { boundsChecker: () => true, getZone: () => 'OK' }
    const validator = z => z === 'OK'
    const placing = new CellsToBePlaced(variant, 2, 2, validator, 0, target)

    // overlapping
    const grid = makeGrid(5, 5, null)
    grid[2][2] = 'S'
    expect(placing.isOverlapping(grid)).toBe(true)
    expect(placing.canPlace(grid)).toBe(false)

    // touching (neighbor occupied)
    const grid2 = makeGrid(5, 5, null)
    grid2[1][2] = 'S'
    expect(placing.isTouching(grid2)).toBe(true)
    expect(placing.canPlace(grid2)).toBe(false)

    // out of bounds case
    const targetOOB = { boundsChecker: (r, c) => false, getZone: () => 'OK' }
    const placingOOB = new CellsToBePlaced(
      variant,
      2,
      2,
      validator,
      0,
      targetOOB
    )
    const grid3 = makeGrid(5, 5, null)
    expect(placingOOB.canPlace(grid3)).toBe(false)

    // success case
    const grid4 = makeGrid(5, 5, null)
    const placingOK = new CellsToBePlaced(variant, 2, 2, validator, 0, target)
    expect(placingOK.canPlace(grid4)).toBe(true)
  })
})
