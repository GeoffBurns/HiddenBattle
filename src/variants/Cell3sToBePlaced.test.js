/* eslint-env jest */

/* global describe, it, test, expect, beforeEach, afterEach, jest */

import { Cell3sToBePlaced } from './Cell3sToBePlaced.js'

describe('Cell3sToBePlaced behaviors', () => {
  test('isInMatchingZone returns true when subgroup candidate and validator match', () => {
    const cells = [
      [0, 0],
      [0, 1],
      [0, 2]
    ]
    // target.getZone will return 'OK' only for the middle cell
    const target = {
      getZone: (r, c, z) => (c === 11 && z === 2 ? 'OK' : 'NO')
    }

    const placable3 = {
      cells,
      validator: () => false,
      zoneDetail: 2,
      target,
      subGroups: [
        // first subgroup: matches only at column offset 0
        {
          placeAt: (r0, c0) => ({
            isCandidate: (r, c) => r === r0 && c === c0,
            validator: z => z === 'NO'
          })
        },
        // second subgroup: matches only at column offset 1 (the middle cell)
        {
          placeAt: (r0, c0) => ({
            isCandidate: (r, c) => r === r0 && c === c0 + 1,
            validator: z => z === 'OK'
          })
        }
      ]
    }

    const placed = new Cell3sToBePlaced(placable3, 10, 10)

    // absolute middle cell is at (10, 11) — validator returns true there
    expect(placed.isInMatchingZone(10, 11)).toBe(true)
    // both first and middle are candidates that validate true/false depending on subgroup
    expect(placed.isInMatchingZone(10, 10)).toBe(true)
    // a non-candidate cell should be false
    expect(placed.isInMatchingZone(10, 12)).toBe(false)
  })

  test('isWrongZone annotates cells with match flags and returns true when some wrong', () => {
    const cells = [
      [0, 0],
      [0, 1],
      [0, 2]
    ]
    const target = {
      getZone: (r, c, z) => (c === 21 && z === 2 ? 'YES' : 'NO')
    }

    const placable3 = {
      cells,
      validator: () => false,
      zoneDetail: 2,
      target,
      subGroups: [
        {
          placeAt: (r0, c0) => ({
            isCandidate: (r, c) => r === r0 && c === c0,
            validator: z => z === 'X'
          })
        },
        {
          placeAt: (r0, c0) => ({
            isCandidate: (r, c) => r === r0 && c === c0 + 1,
            validator: z => z === 'YES'
          })
        }
      ]
    }

    const placed = new Cell3sToBePlaced(placable3, 20, 20)

    // Before calling isWrongZone, cells have length 2
    expect(placed.cells.every(c => c.length === 2)).toBe(true)

    const result = placed.isWrongZone()
    // one cell (the middle) matches, others don't => should return true
    expect(result).toBe(true)

    // After calling, each cell should have a third element (0 or 1)
    expect(placed.cells.every(c => c.length === 3)).toBe(true)
    // Middle cell (index 1) should have match flag 1
    expect(placed.cells[1][2]).toBe(1)
    // First and last should be 0
    expect(placed.cells[0][2]).toBe(0)
    expect(placed.cells[2][2]).toBe(0)
  })
})
