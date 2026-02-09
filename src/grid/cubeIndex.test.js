/* eslint-env jest */
/* global describe, it, expect, beforeEach, afterEach */

import { CubeIndex } from './CubeIndex.js'

// Jest test suite
describe('CubeIndex', () => {
  let cubeIndex

  beforeEach(() => {
    cubeIndex = new CubeIndex(1)
  })

  afterEach(() => {
    // Clear cache between tests if needed
  })

  describe('constructor and buildCube', () => {
    it('creates instance with radius', () => {
      expect(cubeIndex.radius).toBe(1)
    })

    it('builds coords array for radius 1', () => {
      expect(Array.isArray(cubeIndex.coords)).toBe(true)
      expect(cubeIndex.coords.length).toBeGreaterThan(0)
    })

    it('sets correct size for radius 1', () => {
      const cube1 = new CubeIndex(1)
      expect(cube1.size).toBe(7) // center + 6 neighbors
    })

    it('sets correct size for radius 2', () => {
      const cube2 = new CubeIndex(2)
      expect(cube2.size).toBe(19) // center + 6 + 12
    })

    it('all coordinates satisfy q + r + s = 0', () => {
      cubeIndex.coords.forEach(([q, r, s]) => {
        expect(q + r + s).toBe(0)
      })
    })

    it('coordinates within radius bounds', () => {
      cubeIndex.coords.forEach(([q, r, s]) => {
        expect(Math.abs(q)).toBeLessThanOrEqual(cubeIndex.radius)
        expect(Math.abs(r)).toBeLessThanOrEqual(cubeIndex.radius)
        expect(Math.abs(s)).toBeLessThanOrEqual(cubeIndex.radius)
      })
    })
  })

  describe('index()', () => {
    it('returns same index for 3-arg and 2-arg with same q,r', () => {
      const idx3 = cubeIndex.index(0, 0, 0)
      const idx2 = cubeIndex.index(0, 0)
      expect(idx3).toBe(idx2)
    })

    it('returns undefined for invalid coordinates', () => {
      expect(cubeIndex.index(10, 10, -20)).toBeUndefined()
    })

    it('returns different indices for different coordinates', () => {
      const idx1 = cubeIndex.index(0, 0, 0)
      const idx2 = cubeIndex.index(1, 0, -1)
      expect(idx1).not.toBe(idx2)
    })
  })

  describe('location()', () => {
    it('returns coordinates for valid index', () => {
      const coords = cubeIndex.location(0)
      expect(coords).toEqual([-1, 0, 1])
    })

    it('returns undefined for invalid index', () => {
      expect(cubeIndex.location(999)).toBeUndefined()
    })

    it('round-trip: index -> location -> index', () => {
      const [q, r, s] = cubeIndex.coords[3]
      const idx = cubeIndex.index(q, r, s)
      const [q2, r2, s2] = cubeIndex.location(idx)
      const idx2 = cubeIndex.index(q2, r2, s2)
      expect(idx).toBe(idx2)
    })
  })

  describe('isValid()', () => {
    it('returns true for center', () => {
      expect(cubeIndex.isValid(0, 0, 0)).toBe(true)
    })

    it('returns true for valid neighbor', () => {
      expect(cubeIndex.isValid(1, 0, -1)).toBe(true)
    })

    it('returns false for out-of-bounds coordinate', () => {
      expect(cubeIndex.isValid(10, 10, -20)).toBe(false)
    })

    it('returns false for coordinate with invalid sum', () => {
      expect(cubeIndex.isValid(1, 1, 1)).toBe(false)
    })
  })

  describe('getInstance singleton', () => {
    it('returns same instance for same radius', () => {
      const inst1 = CubeIndex.getInstance(1)
      const inst2 = CubeIndex.getInstance(1)
      expect(inst1).toBe(inst2)
    })

    it('returns different instances for different radii', () => {
      const inst1 = CubeIndex.getInstance(1)
      const inst2 = CubeIndex.getInstance(2)
      expect(inst1).not.toBe(inst2)
    })

    it('cached instance has correct radius', () => {
      const inst = CubeIndex.getInstance(3)
      expect(inst.radius).toBe(3)
    })
  })

  describe('transformMaps lazy loading', () => {
    it('transformMaps is created on first access', () => {
      expect(cubeIndex.transformMaps).toBeDefined()
      expect(Array.isArray(cubeIndex.transformMaps)).toBe(true)
    })

    it('transformMaps has 12 elements (6 rotations × 2 for reflection)', () => {
      expect(cubeIndex.transformMaps.length).toBe(12)
    })
  })
})
