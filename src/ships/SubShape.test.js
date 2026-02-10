/* eslint-env jest */

/* global describe, jest, it, expect, beforeEach */

import { SubShape, StandardCells, SpecialCells } from './SubShape.js'

describe('SubShape', () => {
  let mockValidator
  let mockZoneDetail
  let mockSubterrain

  beforeEach(() => {
    mockValidator = { validate: jest.fn() }
    mockZoneDetail = { zoneId: 1, name: 'Zone A' }
    mockSubterrain = { title: 'Water', type: 'sea' }
  })

  describe('constructor', () => {
    it('should initialize with provided parameters', () => {
      const subShape = new SubShape(
        mockValidator,
        mockZoneDetail,
        mockSubterrain
      )
      expect(subShape.validator).toBe(mockValidator)
      expect(subShape.zoneDetail).toBe(mockZoneDetail)
      expect(subShape.subterrain).toBe(mockSubterrain)
    })

    it('should set faction to 1 by default', () => {
      const subShape = new SubShape(
        mockValidator,
        mockZoneDetail,
        mockSubterrain
      )
      expect(subShape.faction).toBe(1)
    })

    it('should handle different validator types', () => {
      const validator1 = {}
      const validator2 = { validate: jest.fn(), check: jest.fn() }
      const subShape1 = new SubShape(validator1, mockZoneDetail, mockSubterrain)
      const subShape2 = new SubShape(validator2, mockZoneDetail, mockSubterrain)
      expect(subShape1.validator).toBe(validator1)
      expect(subShape2.validator).toBe(validator2)
    })

    it('should handle different zoneDetail types', () => {
      const zone1 = { id: 1 }
      const zone2 = { id: 2, name: 'zone', data: {} }
      const subShape1 = new SubShape(mockValidator, zone1, mockSubterrain)
      const subShape2 = new SubShape(mockValidator, zone2, mockSubterrain)
      expect(subShape1.zoneDetail).toBe(zone1)
      expect(subShape2.zoneDetail).toBe(zone2)
    })

    it('should handle different subterrain types', () => {
      const terrain1 = { title: 'Water' }
      const terrain2 = { title: 'Land' }
      const subShape1 = new SubShape(mockValidator, mockZoneDetail, terrain1)
      const subShape2 = new SubShape(mockValidator, mockZoneDetail, terrain2)
      expect(subShape1.subterrain).toBe(terrain1)
      expect(subShape2.subterrain).toBe(terrain2)
    })
  })

  describe('clone', () => {
    it('should create a new instance', () => {
      const original = new SubShape(
        mockValidator,
        mockZoneDetail,
        mockSubterrain
      )
      const cloned = original.clone()
      expect(cloned).not.toBe(original)
      expect(cloned).toBeInstanceOf(SubShape)
    })

    it('should copy validator reference', () => {
      const original = new SubShape(
        mockValidator,
        mockZoneDetail,
        mockSubterrain
      )
      const cloned = original.clone()
      expect(cloned.validator).toBe(original.validator)
    })

    it('should copy zoneDetail reference', () => {
      const original = new SubShape(
        mockValidator,
        mockZoneDetail,
        mockSubterrain
      )
      const cloned = original.clone()
      expect(cloned.zoneDetail).toBe(original.zoneDetail)
    })

    it('should copy subterrain reference', () => {
      const original = new SubShape(
        mockValidator,
        mockZoneDetail,
        mockSubterrain
      )
      const cloned = original.clone()
      expect(cloned.subterrain).toBe(original.subterrain)
    })

    it('should reset faction to 1 in clone', () => {
      const original = new SubShape(
        mockValidator,
        mockZoneDetail,
        mockSubterrain
      )
      original.faction = 3
      const cloned = original.clone()
      expect(cloned.faction).toBe(1)
    })

    it('should maintain independence of properties', () => {
      const original = new SubShape(
        mockValidator,
        mockZoneDetail,
        mockSubterrain
      )
      const cloned = original.clone()
      original.faction = 5
      expect(cloned.faction).toBe(1)
    })

    it('should handle cloning multiple times', () => {
      const original = new SubShape(
        mockValidator,
        mockZoneDetail,
        mockSubterrain
      )
      const clone1 = original.clone()
      const clone2 = original.clone()
      const clone3 = clone1.clone()
      expect(clone1).not.toBe(clone2)
      expect(clone1).not.toBe(clone3)
      expect(clone1.validator).toBe(clone3.validator)
    })
  })

  describe('StandardCells', () => {
    describe('constructor', () => {
      it('should initialize with parent properties', () => {
        const standardCells = new StandardCells(
          mockValidator,
          mockZoneDetail,
          mockSubterrain
        )
        expect(standardCells.validator).toBe(mockValidator)
        expect(standardCells.zoneDetail).toBe(mockZoneDetail)
        expect(standardCells.subterrain).toBe(mockSubterrain)
        expect(standardCells.faction).toBe(1)
      })

      it('should initialize with empty cells array', () => {
        const standardCells = new StandardCells(
          mockValidator,
          mockZoneDetail,
          mockSubterrain
        )
        expect(standardCells.cells).toEqual([])
        expect(Array.isArray(standardCells.cells)).toBe(true)
      })

      it('should be instance of StandardCells and SubShape', () => {
        const standardCells = new StandardCells(
          mockValidator,
          mockZoneDetail,
          mockSubterrain
        )
        expect(standardCells).toBeInstanceOf(StandardCells)
        expect(standardCells).toBeInstanceOf(SubShape)
      })
    })

    describe('setCells', () => {
      let standardCells
      let mockSecondary

      beforeEach(() => {
        standardCells = new StandardCells(
          mockValidator,
          mockZoneDetail,
          mockSubterrain
        )
        mockSecondary = {
          cells: []
        }
      })

      it('should set cells to allCells when secondary has no cells', () => {
        const allCells = [
          [0, 0],
          [1, 1],
          [2, 2]
        ]
        standardCells.setCells(allCells, mockSecondary)
        expect(standardCells.cells).toEqual(allCells)
      })

      it('should filter out cells that exist in secondary', () => {
        const allCells = [
          [0, 0],
          [1, 1],
          [2, 2],
          [3, 3]
        ]
        mockSecondary.cells = [
          [1, 1],
          [3, 3]
        ]
        standardCells.setCells(allCells, mockSecondary)
        expect(standardCells.cells).toEqual([
          [0, 0],
          [2, 2]
        ])
      })

      it('should handle empty allCells', () => {
        mockSecondary.cells = [[1, 1]]
        standardCells.setCells([], mockSecondary)
        expect(standardCells.cells).toEqual([])
      })

      it('should handle all cells filtered out', () => {
        const allCells = [
          [0, 0],
          [1, 1],
          [2, 2]
        ]
        mockSecondary.cells = [
          [0, 0],
          [1, 1],
          [2, 2]
        ]
        standardCells.setCells(allCells, mockSecondary)
        expect(standardCells.cells).toEqual([])
      })

      it('should preserve order of cells', () => {
        const allCells = [
          [5, 5],
          [2, 2],
          [8, 8],
          [1, 1]
        ]
        mockSecondary.cells = [[8, 8]]
        standardCells.setCells(allCells, mockSecondary)
        expect(standardCells.cells).toEqual([
          [5, 5],
          [2, 2],
          [1, 1]
        ])
      })

      it('should match cells by both row and column', () => {
        const allCells = [
          [0, 0],
          [0, 1],
          [1, 0],
          [1, 1]
        ]
        mockSecondary.cells = [
          [0, 0],
          [1, 1]
        ]
        standardCells.setCells(allCells, mockSecondary)
        expect(standardCells.cells).toEqual([
          [0, 1],
          [1, 0]
        ])
      })

      it('should not filter cells with duplicate coordinates in allCells', () => {
        const allCells = [
          [1, 1],
          [1, 1],
          [2, 2]
        ]
        mockSecondary.cells = [[1, 1]]
        standardCells.setCells(allCells, mockSecondary)
        expect(standardCells.cells).toHaveLength(1)
        expect(standardCells.cells[0]).toEqual([2, 2])
      })

      it('should handle large cell arrays', () => {
        const allCells = Array.from({ length: 1000 }, (_, i) => [i, i])
        const secondaryCells = Array.from({ length: 500 }, (_, i) => [
          i * 2,
          i * 2
        ])
        mockSecondary.cells = secondaryCells
        standardCells.setCells(allCells, mockSecondary)
        expect(standardCells.cells.length).toBe(500)
      })

      it('should replace existing cells', () => {
        standardCells.cells = [[99, 99]]
        const allCells = [
          [0, 0],
          [1, 1]
        ]
        standardCells.setCells(allCells, mockSecondary)
        expect(standardCells.cells).toEqual([
          [0, 0],
          [1, 1]
        ])
        expect(standardCells.cells).not.toContain([99, 99])
      })

      it('should handle negative coordinates', () => {
        const allCells = [
          [-1, -1],
          [0, 0],
          [1, 1]
        ]
        mockSecondary.cells = [[-1, -1]]
        standardCells.setCells(allCells, mockSecondary)
        expect(standardCells.cells).toEqual([
          [0, 0],
          [1, 1]
        ])
      })
    })

    describe('inheritance and clone', () => {
      it('should inherit clone method from SubShape', () => {
        const standardCells = new StandardCells(
          mockValidator,
          mockZoneDetail,
          mockSubterrain
        )
        const cloned = standardCells.clone()
        expect(cloned).toBeInstanceOf(SubShape)
      })

      it('should clone as SubShape not StandardCells', () => {
        const standardCells = new StandardCells(
          mockValidator,
          mockZoneDetail,
          mockSubterrain
        )
        const cloned = standardCells.clone()
        expect(cloned).not.toBeInstanceOf(StandardCells)
      })
    })
  })

  describe('SpecialCells', () => {
    describe('constructor', () => {
      it('should initialize with cells in constructor', () => {
        const cells = [
          [0, 0],
          [1, 1],
          [2, 2]
        ]
        const specialCells = new SpecialCells(
          cells,
          mockValidator,
          mockZoneDetail,
          mockSubterrain
        )
        expect(specialCells.cells).toBe(cells)
      })

      it('should initialize with parent properties', () => {
        const cells = [[0, 0]]
        const specialCells = new SpecialCells(
          cells,
          mockValidator,
          mockZoneDetail,
          mockSubterrain
        )
        expect(specialCells.validator).toBe(mockValidator)
        expect(specialCells.zoneDetail).toBe(mockZoneDetail)
        expect(specialCells.subterrain).toBe(mockSubterrain)
        expect(specialCells.faction).toBe(1)
      })

      it('should accept empty cells array', () => {
        const specialCells = new SpecialCells(
          [],
          mockValidator,
          mockZoneDetail,
          mockSubterrain
        )
        expect(specialCells.cells).toEqual([])
      })

      it('should be instance of SpecialCells and SubShape', () => {
        const specialCells = new SpecialCells(
          [],
          mockValidator,
          mockZoneDetail,
          mockSubterrain
        )
        expect(specialCells).toBeInstanceOf(SpecialCells)
        expect(specialCells).toBeInstanceOf(SubShape)
      })

      it('should store different cell arrays', () => {
        const cells1 = [
          [0, 0],
          [1, 1]
        ]
        const cells2 = [
          [5, 5],
          [6, 6],
          [7, 7]
        ]
        const special1 = new SpecialCells(
          cells1,
          mockValidator,
          mockZoneDetail,
          mockSubterrain
        )
        const special2 = new SpecialCells(
          cells2,
          mockValidator,
          mockZoneDetail,
          mockSubterrain
        )
        expect(special1.cells).toBe(cells1)
        expect(special2.cells).toBe(cells2)
      })

      it('should handle large cells arrays', () => {
        const largeCells = Array.from({ length: 10000 }, (_, i) => [i, i])
        const specialCells = new SpecialCells(
          largeCells,
          mockValidator,
          mockZoneDetail,
          mockSubterrain
        )
        expect(specialCells.cells.length).toBe(10000)
      })

      it('should maintain cell array reference', () => {
        const cells = [
          [0, 0],
          [1, 1]
        ]
        const specialCells = new SpecialCells(
          cells,
          mockValidator,
          mockZoneDetail,
          mockSubterrain
        )
        cells.push([2, 2])
        expect(specialCells.cells).toContainEqual([2, 2])
      })

      it('should handle cells with various coordinate values', () => {
        const cells = [
          [-100, 200],
          [0, 0],
          [999, 999],
          [-1, -1]
        ]
        const specialCells = new SpecialCells(
          cells,
          mockValidator,
          mockZoneDetail,
          mockSubterrain
        )
        expect(specialCells.cells).toEqual(cells)
      })
    })

    describe('inheritance and clone', () => {
      it('should inherit clone method from SubShape', () => {
        const cells = [
          [0, 0],
          [1, 1]
        ]
        const specialCells = new SpecialCells(
          cells,
          mockValidator,
          mockZoneDetail,
          mockSubterrain
        )
        const cloned = specialCells.clone()
        expect(cloned).toBeInstanceOf(SubShape)
      })

      it('should clone as SubShape not SpecialCells', () => {
        const cells = [[0, 0]]
        const specialCells = new SpecialCells(
          cells,
          mockValidator,
          mockZoneDetail,
          mockSubterrain
        )
        const cloned = specialCells.clone()
        expect(cloned).not.toBeInstanceOf(SpecialCells)
      })
    })
  })

  describe('integration scenarios', () => {
    it('should allow mixing StandardCells and SpecialCells', () => {
      const standard = new StandardCells(
        mockValidator,
        mockZoneDetail,
        mockSubterrain
      )
      const special = new SpecialCells(
        [[5, 5]],
        mockValidator,
        mockZoneDetail,
        mockSubterrain
      )
      expect(standard).toBeInstanceOf(SubShape)
      expect(special).toBeInstanceOf(SubShape)
    })

    it('should allow using StandardCells with SpecialCells as secondary', () => {
      const secondary = new SpecialCells(
        [
          [1, 1],
          [2, 2]
        ],
        mockValidator,
        mockZoneDetail,
        mockSubterrain
      )
      const standard = new StandardCells(
        mockValidator,
        mockZoneDetail,
        mockSubterrain
      )
      const allCells = [
        [0, 0],
        [1, 1],
        [2, 2],
        [3, 3]
      ]
      standard.setCells(allCells, secondary)
      expect(standard.cells).toEqual([
        [0, 0],
        [3, 3]
      ])
    })

    it('should maintain faction property across inheritance', () => {
      const standard = new StandardCells(
        mockValidator,
        mockZoneDetail,
        mockSubterrain
      )
      const special = new SpecialCells(
        [],
        mockValidator,
        mockZoneDetail,
        mockSubterrain
      )
      standard.faction = 2
      special.faction = 3
      expect(standard.faction).toBe(2)
      expect(special.faction).toBe(3)
    })

    it('should handle multiple subterrains', () => {
      const terrain1 = { title: 'Water' }
      const terrain2 = { title: 'Land' }
      const subShape1 = new SubShape(mockValidator, mockZoneDetail, terrain1)
      const standard = new StandardCells(
        mockValidator,
        mockZoneDetail,
        terrain2
      )
      expect(subShape1.subterrain).not.toBe(standard.subterrain)
    })
  })
})
