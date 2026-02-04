/* eslint-env jest */

/* global describe, jest, it, expect */

import { Placeable } from './Placeable.js'

jest.mock('./CellsToBePlaced', () => {
  const mockCtor = jest
    .fn()
    .mockImplementation((cells, r, c, validator, zoneDetail) => {
      return {
        cells,
        r,
        c,
        validator,
        zoneDetail,
        canPlace: shipGrid => {
          if (typeof validator === 'function') return validator(shipGrid)
          return !!(shipGrid && shipGrid.valid)
        }
      }
    })
  return {
    placingTarget: {
      allBoundsChecker: jest.fn(
        (r, c, h, w) => r >= 0 && c >= 0 && r + h <= 10 && c + w <= 10
      )
    },
    CellsToBePlaced: mockCtor
  }
})

describe('Placeable', () => {
  const variant = [
    [1, 2],
    [3, 4],
    [2, 5]
  ]

  it('computes height and width as max coordinates', () => {
    const p = new Placeable(variant, null)
    expect(p.height()).toBe(3)
    expect(p.width()).toBe(5)
  })

  it('placeAt returns a CellsToBePlaced-like object with correct params', () => {
    const validator = jest.fn()
    const p = new Placeable(variant, validator, 7)
    const placed = p.placeAt(2, 3)
    expect(placed.cells).toBe(variant)
    expect(placed.r).toBe(2)
    expect(placed.c).toBe(3)
    expect(placed.validator).toBe(validator)
    expect(placed.zoneDetail).toBe(7)
    expect(typeof placed.canPlace).toBe('function')
  })

  it('inAllBounds delegates to target.allBoundsChecker and returns its result', () => {
    const target = {
      allBoundsChecker: jest.fn((r, c, h, w) => r === 0 && c === 0)
    }
    const p = new Placeable(variant, null, 0, target)
    expect(p.inAllBounds(0, 0)).toBe(true)
    expect(target.allBoundsChecker).toHaveBeenCalled()
    expect(p.inAllBounds(1, 0)).toBe(false)
  })

  it('canPlace calls placed.canPlace and returns its boolean', () => {
    const validator = g => !!(g && g.valid)
    const p = new Placeable(variant, validator)
    expect(p.canPlace(0, 0, { valid: true })).toBe(true)
    expect(p.canPlace(0, 0, { valid: false })).toBe(false)
  })
})
