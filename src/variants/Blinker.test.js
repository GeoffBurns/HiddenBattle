/* eslint-env jest */

/* global describe, jest, beforeEach, it, expect */

jest.mock('./normalize.js', () => {
  return {
    rotate: jest.fn(cells => cells.map(row => row.reverse())),
    rotate3: jest.fn(cells => cells.map(row => row.reverse()))
  }
})

jest.mock('./makeCell3.js', () => {
  return {
    makeCell3: jest.fn((full, _subGroups) => full[0])
  }
})

jest.mock('./Invariant.js', () => {
  return {
    Invariant: {
      r: jest.fn(idx => idx)
    }
  }
})

jest.mock('./RotatableVariant.js', () => {
  class RotatableVariant {
    constructor (validator, zoneDetail, symmetry) {
      this.validator = validator
      this.zoneDetail = zoneDetail
      this.symmetry = symmetry
      this.index = 0
      // Call setBehaviour to set up r1, f1, rf1
      if (this.constructor.setBehaviour) {
        this.constructor.setBehaviour(this, symmetry)
      }
    }
    setByIndex (idx) {
      this.index = idx
    }
  }
  return { RotatableVariant }
})

import { Blinker } from './Blinker.js'
import { rotate, rotate3 } from './normalize.js'
import { makeCell3 } from './makeCell3.js'
import { Invariant } from './Invariant.js'

describe('Blinker', () => {
  const validator = jest.fn()
  const zoneDetail = 5
  const cells = [
    ['a', 'b'],
    ['c', 'd']
  ]
  const rotatedCells = [
    ['b', 'a'],
    ['d', 'c']
  ]

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('constructs with cells and generates default variants using variantsOf', () => {
    rotate.mockReturnValue(rotatedCells)
    const blinker = new Blinker(cells, validator, zoneDetail)

    expect(blinker.validator).toBe(validator)
    expect(blinker.zoneDetail).toBe(zoneDetail)
    expect(blinker.index).toBe(0)
    expect(blinker.list).toEqual([cells, rotatedCells])
  })

  it('constructs with custom variants', () => {
    const customVariants = [cells, rotatedCells]
    const blinker = new Blinker(cells, validator, zoneDetail, customVariants)

    expect(blinker.list).toEqual(customVariants)
  })

  it('variantsOf returns cells and rotated cells', () => {
    rotate.mockReturnValue(rotatedCells)
    const variants = Blinker.variantsOf(cells)

    expect(rotate).toHaveBeenCalledWith(cells)
    expect(variants).toEqual([cells, rotatedCells])
  })

  it('cell3 creates unrotated and rotated 3D cells', () => {
    const full = [[1, 2]]
    const subGroups = [['x']]
    const unrotated = [1, 2]
    rotate3.mockReturnValue([2, 1])
    makeCell3.mockReturnValue(unrotated)

    const result = Blinker.cell3(full, subGroups)

    expect(makeCell3).toHaveBeenCalledWith(full, subGroups)
    expect(rotate3).toHaveBeenCalledWith(unrotated)
    expect(result).toEqual([unrotated, [2, 1]])
  })

  it('setBehaviour configures rotation settings', () => {
    const rotatable = {}
    Blinker.setBehaviour(rotatable)

    expect(rotatable.canFlip).toBe(false)
    expect(rotatable.canRotate).toBe(true)
    expect(rotatable.r1).toBe(Blinker.r)
    expect(rotatable.f1).toBe(Invariant.r)
    expect(rotatable.rf1).toBe(Blinker.r)
  })

  it('variant returns the current variant based on index', () => {
    const blinker = new Blinker(cells, validator, zoneDetail, [
      cells,
      rotatedCells
    ])

    expect(blinker.variant()).toEqual(cells)

    blinker.index = 1
    expect(blinker.variant()).toEqual(rotatedCells)
  })

  it('r toggles between index 0 and 1', () => {
    expect(Blinker.r(0)).toBe(1)
    expect(Blinker.r(1)).toBe(0)
  })

  it('rotate toggles the index', () => {
    const blinker = new Blinker(cells, validator, zoneDetail, [
      cells,
      rotatedCells
    ])
    expect(blinker.index).toBe(0)

    blinker.rotate()
    expect(blinker.index).toBe(1)

    blinker.rotate()
    expect(blinker.index).toBe(0)
  })

  it('leftRotate delegates to rotate', () => {
    const blinker = new Blinker(cells, validator, zoneDetail, [
      cells,
      rotatedCells
    ])
    expect(blinker.index).toBe(0)

    blinker.leftRotate()
    expect(blinker.index).toBe(1)
  })
})
