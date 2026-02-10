/* eslint-env jest */

/* global describe, it, expect, beforeEach, jest */

import { Shape, token } from './Shape.js'

// Mock dependencies
jest.mock('../terrain/terrain.js', () => ({
  bh: {
    terrain: {
      ships: {
        types: { B: 'Battleship', D: 'Destroyer', S: 'Submarine' },
        colors: { B: '#0066cc', D: '#0099ff', S: '#66ccff' },
        letterColors: { B: 'blue', D: 'light-blue', S: 'cyan' },
        description: {
          B: 'A powerful battleship',
          D: 'A quick destroyer',
          S: 'A stealthy submarine'
        },
        shipSunkDescriptions: {
          Battleship: 'The battleship has sunk',
          Destroyer: 'The destroyer has sunk',
          Submarine: 'The submarine has sunk'
        }
      }
    }
  },
  addCellToFootPrint: jest.fn((r, c, set) => {
    set.add(`${r},${c}`)
  })
}))

jest.mock('../utilities.js', () => ({
  makeKey: jest.fn((r, c) => `${r},${c}`)
}))

jest.mock('../variants/Invariant.js', () => ({
  Invariant: jest.fn().mockImplementation(() => ({
    numVariants: jest.fn().mockReturnValue(1),
    placeables: jest.fn().mockReturnValue([])
  }))
}))

jest.mock('../variants/Cyclic4.js', () => ({
  Cyclic4: jest.fn().mockImplementation(() => ({
    numVariants: jest.fn().mockReturnValue(4),
    placeables: jest.fn().mockReturnValue([])
  }))
}))

jest.mock('../variants/Dihedral4.js', () => ({
  Dihedral4: jest.fn().mockImplementation(() => ({
    numVariants: jest.fn().mockReturnValue(4),
    placeables: jest.fn().mockReturnValue([])
  }))
}))

jest.mock('../variants/Diagonal.js', () => ({
  Diagonal: jest.fn().mockImplementation(() => ({
    numVariants: jest.fn().mockReturnValue(2),
    placeables: jest.fn().mockReturnValue([])
  }))
}))

jest.mock('../variants/Klein4.js', () => ({
  Klein4: jest.fn().mockImplementation(() => ({
    numVariants: jest.fn().mockReturnValue(4),
    placeables: jest.fn().mockReturnValue([])
  }))
}))

jest.mock('../variants/Blinker.js', () => ({
  Blinker: jest.fn().mockImplementation(() => ({
    numVariants: jest.fn().mockReturnValue(2),
    placeables: jest.fn().mockReturnValue([])
  }))
}))

jest.mock('../weapon/WeaponSystem.js', () => ({
  WeaponSystem: jest.fn().mockImplementation(weapon => ({ weapon }))
}))

describe('Shape', () => {
  let mockCells
  let shape

  beforeEach(() => {
    jest.clearAllMocks()

    mockCells = [
      [0, 0],
      [0, 1],
      [0, 2]
    ]

    shape = new Shape(
      'B',
      'D',
      mockCells,
      'battleship',
      'A powerful battleship',
      null
    )
  })

  describe('token', () => {
    it('should export correct token', () => {
      expect(token).toBe('geoffs-hidden-battle')
    })
  })

  describe('constructor', () => {
    it('should initialize with basic properties', () => {
      expect(shape.letter).toBe('B')
      expect(shape.symmetry).toBe('D')
      expect(shape.cells).toEqual(mockCells)
      expect(shape.tip).toBe('A powerful battleship')
      expect(shape.tallyGroup).toBe('battleship')
    })

    it('should initialize with null racks when racks is null', () => {
      expect(shape.racks).toBeNull()
      expect(shape.canAttachWeapons).toBeFalsy()
    })

    it('should initialize with Set of racks when racks is array', () => {
      const racks = [
        [1, 2],
        [1, 3]
      ]
      const shapeWithRacks = new Shape(
        'G',
        'S',
        mockCells,
        'gunboat',
        'tip',
        racks
      )
      expect(shapeWithRacks.racks instanceof Set).toBe(true)
      expect(shapeWithRacks.racks.size).toBe(2)
      expect(shapeWithRacks.canAttachWeapons).toBe(true)
    })

    it('should initialize with empty racks when racks is empty array', () => {
      const shapeNoRacks = new Shape('A', 'H', mockCells, 'group', 'tip', [])
      expect(shapeNoRacks.racks instanceof Set).toBe(true)
      expect(shapeNoRacks.racks.size).toBe(0)
      expect(shapeNoRacks.canAttachWeapons).toBe(false)
    })

    it('should set default values for other properties', () => {
      expect(shape.isAttachedToRack).toBe(false)
      expect(shape.subterrain).toBeNull()
      expect(shape.validator).toBe(Function.prototype)
      expect(shape.zoneDetail).toBe(0)
      expect(shape.vulnerable).toEqual([])
      expect(shape.hardened).toEqual([])
      expect(shape.immune).toEqual([])
      expect(shape.attachedWeapons).toEqual({})
    })

    it('should calculate displacement from cells and footprint', () => {
      // area = 3, footprint will be created by addCellToFootPrint
      // The mock function adds to set, so footprint.size should be 3
      expect(shape.displacement).toBe((3 + 3) / 2)
    })

    it('should get terrain from bh', () => {
      const { bh } = require('../terrain/terrain.js')
      expect(shape.terrain).toBe(bh.terrain)
    })
  })

  describe('canBeOn', () => {
    it('should return true if subterrain matches', () => {
      shape.subterrain = 'water'
      expect(shape.canBeOn('water')).toBe(true)
    })

    it('should return false if subterrain does not match', () => {
      shape.subterrain = 'water'
      expect(shape.canBeOn('land')).toBe(false)
    })

    it('should handle null subterrain', () => {
      shape.subterrain = null
      expect(shape.canBeOn('water')).toBe(false)
    })
  })

  describe('protectionAgainst', () => {
    it('should return 3 for immune weapons', () => {
      const weapon = { id: 'gun' }
      shape.immune = [weapon]
      expect(shape.protectionAgainst(weapon)).toBe(3)
    })

    it('should return 2 for hardened weapons', () => {
      const weapon = { id: 'missile' }
      shape.hardened = [weapon]
      expect(shape.protectionAgainst(weapon)).toBe(2)
    })

    it('should return 0 for vulnerable weapons', () => {
      const weapon = { id: 'torpedo' }
      shape.vulnerable = [weapon]
      expect(shape.protectionAgainst(weapon)).toBe(0)
    })

    it('should return 1 for neutral weapons', () => {
      const weapon = { id: 'laser' }
      expect(shape.protectionAgainst(weapon)).toBe(1)
    })

    it('should prioritize immune over other categories', () => {
      const weapon = { id: 'weapon' }
      shape.immune = [weapon]
      shape.hardened = [weapon]
      shape.vulnerable = [weapon]
      expect(shape.protectionAgainst(weapon)).toBe(3)
    })

    it('should prioritize hardened over vulnerable', () => {
      const weapon = { id: 'weapon' }
      shape.hardened = [weapon]
      shape.vulnerable = [weapon]
      expect(shape.protectionAgainst(weapon)).toBe(2)
    })
  })

  describe('attachWeapon', () => {
    it('should attach weapon when conditions are met', () => {
      const racks = [
        [1, 2],
        [1, 3]
      ]
      const shapeWithRacks = new Shape(
        'G',
        'S',
        mockCells,
        'gunboat',
        'tip',
        racks
      )

      const ammoBuilder = jest.fn().mockReturnValue({ ammo: 10 })
      const result = shapeWithRacks.attachWeapon(ammoBuilder)

      expect(shapeWithRacks.isAttachedToRack).toBe(true)
      expect(ammoBuilder).toHaveBeenCalledTimes(2) // Called for each rack
      expect(result['1,2']).toEqual({ ammo: 10 })
      expect(result['1,3']).toEqual({ ammo: 10 })
    })

    it('should throw error when cannot attach weapons', () => {
      const ammoBuilder = jest.fn()
      expect(() => {
        shape.attachWeapon(ammoBuilder)
      }).toThrow('Cannot attach weapon to shape B')
    })

    it('should throw error when weapon already attached', () => {
      const racks = [[1, 2]]
      const shapeWithRacks = new Shape(
        'G',
        'S',
        mockCells,
        'gunboat',
        'tip',
        racks
      )
      const ammoBuilder = jest.fn().mockReturnValue({ ammo: 10 })

      shapeWithRacks.attachWeapon(ammoBuilder)
      expect(() => {
        shapeWithRacks.attachWeapon(ammoBuilder)
      }).toThrow('Weapon already attached to shape G')
    })
  })

  describe('weaponSystem', () => {
    it('should return empty object when no weapons attached', () => {
      expect(shape.weaponSystem).toEqual({})
    })

    it('should convert attached weapons to WeaponSystem objects', () => {
      const racks = [
        [1, 2],
        [1, 3]
      ]
      const shapeWithRacks = new Shape(
        'G',
        'S',
        mockCells,
        'gunboat',
        'tip',
        racks
      )
      const ammoBuilder = jest.fn().mockReturnValue({ ammo: 10 })

      shapeWithRacks.attachWeapon(ammoBuilder)
      const weaponSystem = shapeWithRacks.weaponSystem

      expect(Object.keys(weaponSystem)).toHaveLength(2)
      expect(weaponSystem['1,2'].weapon).toEqual({ ammo: 10 })
      expect(weaponSystem['1,3'].weapon).toEqual({ ammo: 10 })
    })

    it('should return empty object when attachedWeapons is null', () => {
      shape.attachedWeapons = null
      expect(shape.weaponSystem).toEqual({})
    })
  })

  describe('variants', () => {
    it('should create Dihedral4 for D symmetry', () => {
      const { Dihedral4 } = require('../variants/Dihedral4.js')
      shape.variants()
      expect(Dihedral4).toHaveBeenCalledWith(mockCells, Function.prototype, 0)
    })

    it('should create Klein4 for A symmetry', () => {
      const { Klein4 } = require('../variants/Klein4.js')
      const shapeA = new Shape('B', 'A', mockCells, 'battleship', 'tip', null)
      shapeA.variants()
      expect(Klein4).toHaveBeenCalledWith(mockCells, Function.prototype, 0)
    })

    it('should create Invariant for S symmetry', () => {
      const { Invariant } = require('../variants/Invariant.js')
      const shapeS = new Shape('B', 'S', mockCells, 'battleship', 'tip', null)
      shapeS.variants()
      expect(Invariant).toHaveBeenCalledWith(mockCells, Function.prototype, 0)
    })

    it('should create Cyclic4 for H symmetry', () => {
      const { Cyclic4 } = require('../variants/Cyclic4.js')
      const shapeH = new Shape('B', 'H', mockCells, 'battleship', 'tip', null)
      shapeH.variants()
      expect(Cyclic4).toHaveBeenCalledWith(mockCells, Function.prototype, 0)
    })

    it('should create Blinker for L symmetry', () => {
      const { Blinker } = require('../variants/Blinker.js')
      const shapeL = new Shape('B', 'L', mockCells, 'battleship', 'tip', null)
      shapeL.variants()
      expect(Blinker).toHaveBeenCalledWith(mockCells, Function.prototype, 0)
    })

    it('should create Diagonal for G symmetry', () => {
      const { Diagonal } = require('../variants/Diagonal.js')
      const shapeG = new Shape('B', 'G', mockCells, 'battleship', 'tip', null)
      shapeG.variants()
      expect(Diagonal).toHaveBeenCalledWith(mockCells, Function.prototype, 0)
    })

    it('should throw error for unknown symmetry', () => {
      const shapeUnknown = new Shape(
        'B',
        'X',
        mockCells,
        'battleship',
        'tip',
        null
      )
      expect(() => {
        shapeUnknown.variants()
      }).toThrow('Unknown symmetry type')
    })

    it('should pass validator and zoneDetail to variant constructor', () => {
      const { Dihedral4 } = require('../variants/Dihedral4.js')
      shape.validator = jest.fn()
      shape.zoneDetail = 5
      shape.variants()
      expect(Dihedral4).toHaveBeenCalledWith(mockCells, shape.validator, 5)
    })
  })

  describe('numVariants', () => {
    it('should return number of variants from variant class', () => {
      shape.symmetry = 'D' // Dihedral4 returns 4
      expect(shape.numVariants()).toBe(4)
    })

    it('should return 4 for Klein4 (A symmetry)', () => {
      const shapeA = new Shape('B', 'A', mockCells, 'battleship', 'tip', null)
      expect(shapeA.numVariants()).toBe(4)
    })

    it('should return 1 for Invariant (S symmetry)', () => {
      const shapeS = new Shape('B', 'S', mockCells, 'battleship', 'tip', null)
      expect(shapeS.numVariants()).toBe(1)
    })
  })

  describe('placeables', () => {
    it('should return placeables from variant class', () => {
      const result = shape.placeables()
      expect(result).toEqual([])
    })
  })

  describe('type', () => {
    it('should return type for ship letter', () => {
      expect(shape.type()).toBe('Battleship')
    })

    it('should handle different letters', () => {
      const shapeD = new Shape('D', 'D', mockCells, 'destroyer', 'tip', null)
      expect(shapeD.type()).toBe('Destroyer')
    })

    it('should return undefined for unknown letter', () => {
      const shapeX = new Shape('X', 'D', mockCells, 'unknown', 'tip', null)
      expect(shapeX.type()).toBeUndefined()
    })
  })

  describe('color', () => {
    it('should return color for ship letter', () => {
      expect(shape.color()).toBe('#0066cc')
    })

    it('should handle different letters', () => {
      const shapeD = new Shape('D', 'D', mockCells, 'destroyer', 'tip', null)
      expect(shapeD.color()).toBe('#0099ff')
    })
  })

  describe('letterColors', () => {
    it('should return letter colors for ship letter', () => {
      expect(shape.letterColors()).toBe('blue')
    })

    it('should handle different letters', () => {
      const shapeS = new Shape('S', 'D', mockCells, 'submarine', 'tip', null)
      expect(shapeS.letterColors()).toBe('cyan')
    })
  })

  describe('description', () => {
    it('should return description for ship letter', () => {
      expect(shape.description()).toBe('A powerful battleship')
    })

    it('should handle different letters', () => {
      const shapeD = new Shape('D', 'D', mockCells, 'destroyer', 'tip', null)
      expect(shapeD.description()).toBe('A quick destroyer')
    })
  })

  describe('shipSunkDescriptions', () => {
    it('should return sunk description for ship type', () => {
      expect(shape.shipSunkDescriptions()).toBe('The battleship has sunk')
    })

    it('should use type to get sunk description', () => {
      const shapeD = new Shape('D', 'D', mockCells, 'destroyer', 'tip', null)
      expect(shapeD.shipSunkDescriptions()).toBe('The destroyer has sunk')
    })
  })

  describe('sunkDescription', () => {
    it('should combine description and sunk description with default separator', () => {
      const result = shape.sunkDescription()
      expect(result).toBe('A powerful battleship The battleship has sunk')
    })

    it('should combine descriptions with custom separator', () => {
      const result = shape.sunkDescription(' - ')
      expect(result).toBe('A powerful battleship - The battleship has sunk')
    })

    it('should use empty separator when specified', () => {
      const result = shape.sunkDescription('')
      expect(result).toBe('A powerful battleshipThe battleship has sunk')
    })
  })

  describe('integration', () => {
    it('should handle shape with multiple properties', () => {
      const racks = [
        [2, 0],
        [2, 2]
      ]
      const complexShape = new Shape(
        'C',
        'H',
        [
          [0, 0],
          [0, 1],
          [1, 0],
          [1, 1]
        ],
        'cruiser',
        'A fast cruiser',
        racks
      )

      expect(complexShape.letter).toBe('C')
      expect(complexShape.canAttachWeapons).toBe(true)
      expect(complexShape.racks.size).toBe(2)
      expect(complexShape.numVariants()).toBe(4)
    })

    it('should track weapon attachment state', () => {
      const racks = [[0, 0]]
      const weaponShape = new Shape(
        'G',
        'S',
        mockCells,
        'gunboat',
        'tip',
        racks
      )

      expect(weaponShape.isAttachedToRack).toBe(false)
      const ammoBuilder = jest.fn().mockReturnValue({ caliber: 76 })
      weaponShape.attachWeapon(ammoBuilder)
      expect(weaponShape.isAttachedToRack).toBe(true)
    })

    it('should allow modification of protection lists', () => {
      const weapon = { id: 'gun' }
      shape.vulnerable.push(weapon)
      expect(shape.protectionAgainst(weapon)).toBe(0)

      shape.vulnerable = []
      shape.hardened.push(weapon)
      expect(shape.protectionAgainst(weapon)).toBe(2)
    })
  })
})
