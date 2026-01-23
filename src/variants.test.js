/* eslint-env jest */

/* global describe, it, expect */
import { Invariant, Dihedral4, Cyclic4 } from './variants.js' //

function allHasLength (received, expectedLength) {
  return received.every(el => Array.isArray(el) && el.length === expectedLength)
}

expect.extend({
  allToHaveLength (received, expectedLength) {
    if (!Array.isArray(received)) {
      return {
        pass: false,
        message: () => `expected an array but got ${typeof received}`
      }
    }

    const pass = allHasLength(received, expectedLength)

    return {
      pass,
      message: () =>
        pass
          ? `expected not all elements to have length ${expectedLength}`
          : `expected all elements to be arrays of length ${expectedLength}, but got ${JSON.stringify(
              received
            )}`
    }
  }
})

function getArrayDepth (arr) {
  if (!Array.isArray(arr)) return 0
  return Math.max(0, ...arr.map(getArrayDepth))
}
expect.extend({
  allToHaveLengthAtDepth (received, expectedLength, depth) {
    if (!Array.isArray(received)) {
      return {
        pass: false,
        message: () => `expected an array but got ${typeof received}`
      }
    }

    const realDepth = getArrayDepth(received)
    if (realDepth >= depth) {
      return {
        pass: false,
        message: () =>
          `expected an array of depth ${depth} got depth ${realDepth}`
      }
    }
    function check (arr, currentDepth) {
      if (currentDepth === depth) {
        return Array.isArray(arr) && arr.length === expectedLength
      }
      return (
        Array.isArray(arr) && arr.every(inner => check(inner, currentDepth + 1))
      )
    }

    const pass = check(received, 1)

    return {
      pass,
      message: () =>
        pass
          ? `expected not all arrays at depth ${depth} to have length ${expectedLength}`
          : `expected all arrays at depth ${depth} to have length ${expectedLength}, but got ${JSON.stringify(
              received
            )}`
    }
  }
})

expect.extend({
  toBeCellEqual (received, expected, dimension = 2) {
    if (!Array.isArray(received)) {
      return {
        pass: false,
        message: () => `expected an array but got ${typeof received}`
      }
    }
    const realDepth = getArrayDepth(received)
    if (realDepth === dimension) {
      return {
        pass: false,
        message: () => `expected an array of depth 2 got depth ${realDepth}`
      }
    }
    if (!allHasLength(received, dimension)) {
      return {
        pass: false,
        message: () =>
          `expected an array of cells but got ${typeof received} - ${JSON.stringify(
            received
          )} `
      }
    }
    const sorter = (a, b) => a[0] - b[0] || a[1] - b[1]
    const receivedSorted = received.toSorted(sorter)
    const expectedSorted = expected.toSorted(sorter)

    const pass =
      received.length === expected.length &&
      JSON.stringify(receivedSorted) === JSON.stringify(expectedSorted)

    if (pass) {
      return {
        message: () =>
          `expected arrays not to be equal:\nReceived: ${received}\nExpected: ${expected}`,
        pass: true
      }
    } else {
      return {
        message: () =>
          `expected arrays to be equal:\nReceived: ${JSON.stringify(
            received
          )}\nExpected: ${JSON.stringify(expected)}`,
        pass: false
      }
    }
  }
})

// Jest test suite
describe(
  'Dihedral4',
  () => {
    const cells = [
      [0, 0],
      [1, 0],
      [2, 0],
      [2, 1]
    ]
    const validator = () => true
    const zoneDetail = 0
    const d4Variants = [
      [
        [0, 0],
        [1, 0]
      ],
      [
        [0, 2],
        [0, 1]
      ],

      [
        [1, 1],
        [2, 1]
      ],
      [
        [1, 0],
        [1, 1]
      ],
      [
        [1, 0],
        [2, 0]
      ],
      [
        [0, 2],
        [1, 2]
      ],
      [
        [0, 1],
        [1, 1]
      ],
      [
        [1, 1],
        [1, 2]
      ]
    ]

    it('should create 8 subvariants for a shape', () => {
      const d4 = new Dihedral4(null, validator, zoneDetail, d4Variants)
      expect(d4.list).toHaveLength(8)

      expect(d4.list[0]).toBeCellEqual([
        [0, 0],
        [1, 0]
      ])
      expect(d4.list[1]).toBeCellEqual([
        [0, 1],
        [0, 2]
      ])
      expect(d4.list[2]).toBeCellEqual([
        [1, 1],
        [2, 1]
      ])
      expect(d4.list[3]).toBeCellEqual([
        [1, 0],
        [1, 1]
      ])
      expect(d4.list[4]).toBeCellEqual([
        [1, 0],
        [2, 0]
      ])
      expect(d4.list[5]).toBeCellEqual([
        [0, 2],
        [1, 2]
      ])
      expect(d4.list[6]).toBeCellEqual([
        [0, 1],
        [1, 1]
      ])
      expect(d4.list[7]).toBeCellEqual([
        [1, 1],
        [1, 2]
      ])
    })

    it('should create 8 variants for a shape', () => {
      const d4 = new Dihedral4(cells, validator, zoneDetail)
      expect(d4.list).toHaveLength(8)

      expect(d4.list[1]).toBeCellEqual([
        [0, 2],
        [0, 1],
        [0, 0],
        [1, 0]
      ])
      expect(d4.list[2]).toBeCellEqual([
        [2, 1],
        [1, 1],
        [0, 1],
        [0, 0]
      ])
      expect(d4.list[3]).toBeCellEqual([
        [1, 0],
        [1, 1],
        [1, 2],
        [0, 2]
      ])
      expect(d4.list[4]).toBeCellEqual([
        [2, 0],
        [1, 0],
        [0, 0],
        [0, 1]
      ])
      expect(d4.list[5]).toBeCellEqual([
        [0, 0],
        [0, 1],
        [0, 2],
        [1, 2]
      ])
      expect(d4.list[6]).toBeCellEqual([
        [0, 1],
        [1, 1],
        [2, 1],
        [2, 0]
      ])
      expect(d4.list[7]).toBeCellEqual([
        [0, 0],
        [1, 0],
        [1, 1],
        [1, 2]
      ])
    })
    it('should create variants with 4 cells', () => {
      const d4 = new Dihedral4(cells, validator, zoneDetail)
      expect(d4.list).toHaveLength(8)
      expect(d4.list).allToHaveLength(4)
      expect(d4.list).allToHaveLengthAtDepth(2, 3)
    })

    it('variant() should return the current variant', () => {
      const d4 = new Dihedral4(cells, validator, zoneDetail)
      expect(d4.variant()).toEqual(d4.list[0])
      d4.index = 3
      expect(d4.variant()).toEqual(d4.list[3])
    })

    it('should rotate index using static r', () => {
      expect(Dihedral4.r(0)).toBe(1)
      expect(Dihedral4.r(4)).toBe(5)
      expect(Dihedral4.r(3)).toBe(0)
      expect(Dihedral4.r(7)).toBe(4)
    })

    it('should flip index using static f', () => {
      expect(Dihedral4.f(0)).toBe(4)
      expect(Dihedral4.f(5)).toBe(1)
    })

    it('should left rotate index using static rf', () => {
      expect(Dihedral4.rf(0)).toBe(3)
      expect(Dihedral4.rf(1)).toBe(0)
      expect(Dihedral4.rf(5)).toBe(4)
      expect(Dihedral4.rf(4)).toBe(7)
    })

    it('should update index and variant on rotate()', () => {
      const d4 = new Dihedral4(cells, validator, zoneDetail)
      d4.index = 0
      d4.rotate()
      expect(d4.index).toBe(Dihedral4.r(0))
      expect(d4.variant()).toEqual(d4.list[d4.index])
    })

    it('should update index and variant on flip()', () => {
      const d4 = new Dihedral4(cells, validator, zoneDetail)
      d4.index = 0
      d4.flip()
      expect(d4.index).toBe(Dihedral4.f(0))
      expect(d4.variant()).toEqual(d4.list[d4.index])
    })

    it('should update index and variant on leftRotate()', () => {
      const d4 = new Dihedral4(cells, validator, zoneDetail)
      d4.index = 0
      d4.leftRotate()
      expect(d4.index).toBe(Dihedral4.rf(0))
      expect(d4.variant()).toEqual(d4.list[d4.index])
    })

    it('cell3() should return arrays of variants with sub group info', () => {
      const full = [
        [0, 0],
        [1, 0],
        [2, 0],
        [2, 1]
      ]
      const secondary = [
        [0, 0],
        [1, 0]
      ]
      const result = Dihedral4.cell3(full, [secondary])
      expect(result).toHaveLength(8)
      expect(result).allToHaveLength(4)
      expect(result).allToHaveLengthAtDepth(3, 3)
      expect(result[0]).toBeCellEqual(
        [
          [0, 0, 1],
          [1, 0, 1],
          [2, 0, 0],
          [2, 1, 0]
        ],
        3
      )
      expect(result[1]).toBeCellEqual(
        [
          [0, 2, 1],
          [0, 1, 1],
          [0, 0, 0],
          [1, 0, 0]
        ],
        3
      )

      expect(result[2]).toBeCellEqual(
        [
          [2, 1, 1],
          [1, 1, 1],
          [0, 1, 0],
          [0, 0, 0]
        ],
        3
      )

      expect(result[3]).toBeCellEqual(
        [
          [1, 0, 1],
          [1, 1, 1],
          [1, 2, 0],
          [0, 2, 0]
        ],
        3
      )

      expect(result[4]).toBeCellEqual(
        [
          [2, 0, 1],
          [1, 0, 1],
          [0, 0, 0],
          [0, 1, 0]
        ],
        3
      )

      expect(result[5]).toBeCellEqual(
        [
          [0, 0, 1],
          [0, 1, 1],
          [0, 2, 0],
          [1, 2, 0]
        ],
        3
      )

      expect(result[6]).toBeCellEqual(
        [
          [0, 1, 1],
          [1, 1, 1],
          [2, 1, 0],
          [2, 0, 0]
        ],
        3
      )
      expect(result[7]).toBeCellEqual(
        [
          [0, 0, 0],
          [1, 0, 0],
          [1, 1, 1],
          [1, 2, 1]
        ],
        3
      )
    })
  },
  describe(
    'Invariant',
    () => {
      const cells = [
        [0, 0],
        [0, 1],
        [1, 0],
        [1, 1]
      ]
      const validator = () => true
      const zoneDetail = 0

      it('should create an Invariant with the given cells', () => {
        const inv = new Invariant(cells, validator, zoneDetail)
        expect(inv.list).toEqual([cells])
      })

      it('variant() should always return the first variant', () => {
        const inv = new Invariant(cells, validator, zoneDetail)
        expect(inv.variant()).toEqual(cells)
        inv.index = 1
        expect(inv.variant()).toEqual(cells)
      })

      it('setByIndex() should throw an error', () => {
        const inv = new Invariant(cells, validator, zoneDetail)
        expect(() => inv.setByIndex(1)).toThrow('can not change this variant')
      })

      it('static r should return the same index', () => {
        expect(Invariant.r(0)).toBe(0)
        expect(Invariant.r(1)).toBe(1)
      })
    },
    describe('Cyclic4', () => {
      const cells = [
        [0, 0],
        [0, 1],
        [1, 0]
      ]
      const validator = () => true
      const zoneDetail = 0

      it('should create 4 cyclic variants for a shape', () => {
        const c4 = new Cyclic4(cells, validator, zoneDetail)
        expect(c4.list).toHaveLength(4)
      })

      it('variant() should return the current variant', () => {
        const c4 = new Cyclic4(cells, validator, zoneDetail)
        expect(c4.variant()).toEqual(c4.list[0])
        c4.index = 2
        expect(c4.variant()).toEqual(c4.list[2])
      })

      it('should rotate index using static r', () => {
        expect(Cyclic4.r(0)).toBe(1)
        expect(Cyclic4.r(3)).toBe(0)
      })

      it('should flip index using static f', () => {
        expect(Cyclic4.f(0)).toBe(2)
        expect(Cyclic4.f(1)).toBe(3)
      })

      it('should left rotate index using static rf', () => {
        expect(Cyclic4.rf(0)).toBe(3)
        expect(Cyclic4.rf(2)).toBe(1)
      })

      it('should update index and variant on rotate()', () => {
        const c4 = new Cyclic4(cells, validator, zoneDetail)
        c4.index = 0
        c4.rotate()
        expect(c4.index).toBe(Cyclic4.r(0))
        expect(c4.variant()).toEqual(c4.list[c4.index])
      })

      it('should update index and variant on flip()', () => {
        const c4 = new Cyclic4(cells, validator, zoneDetail)
        c4.index = 1
        c4.flip()
        expect(c4.index).toBe(Cyclic4.f(1))
        expect(c4.variant()).toEqual(c4.list[c4.index])
      })

      it('should update index and variant on leftRotate()', () => {
        const c4 = new Cyclic4(cells, validator, zoneDetail)
        c4.index = 2
        c4.leftRotate()
        expect(c4.index).toBe(Cyclic4.rf(2))
        expect(c4.variant()).toEqual(c4.list[c4.index])
      })
    })
  )
)
