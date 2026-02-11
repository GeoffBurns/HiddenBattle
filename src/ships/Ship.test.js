/* eslint-env jest */

/* global describe, it, test, expect, beforeEach, jest */

import { Ship } from './Ship'

// Jest test suite
describe('Ship basic behaviors', () => {
  test('constructor sets defaults', () => {
    const s = new Ship(5, 'sym', 'X')
    expect(s.id).toBe(5)
    expect(s.symmetry).toBe('sym')
    expect(s.letter).toBe('X')
    expect(Array.isArray(s.cells)).toBe(true)
    expect(s.hits instanceof Set).toBe(true)
    expect(s.sunk).toBe(false)
    expect(s.variant).toBe(0)
  })

  test('static id next and createFromShape', () => {
    const saved = Ship.id
    Ship.id = 100
    const shape = { symmetry: 'S', letter: 'L', weaponSystem: { a: 1 } }
    const s = Ship.createFromShape(shape)
    expect(s.id).toBe(100)
    expect(s.symmetry).toBe('S')
    expect(s.letter).toBe('L')
    Ship.id = saved
  })

  test('weaponList, weaponEntries, hasWeapon, weaponSystem, weapon, makeKeyIds', () => {
    const s = new Ship(1, 'x', 'A')
    s.weapons = {
      '1,2': {
        id: 10,
        weapon: { name: 'w1' },
        ammo: 1,
        hasAmmo: () => true,
        ammoLeft: () => 1,
        ammoTotal: () => 2
      },
      '2,3': {
        id: 11,
        weapon: { name: 'w2' },
        ammo: 0,
        hasAmmo: () => false,
        ammoLeft: () => 0,
        ammoTotal: () => 3
      }
    }

    expect(s.weaponList().length).toBe(2)
    expect(s.weaponEntries().length).toBe(2)
    expect(s.hasWeapon()).toBe(true)
    expect(s.weaponSystem()).toBe(s.weaponList()[0])
    expect(s.weapon()).toBe(s.weaponList()[0].weapon)
    expect(s.makeKeyIds()).toBe('1,2:10|2,3:11')
  })

  test('ammoLeft and ammoTotal reflect sunk state', () => {
    const s = new Ship(2, 'y', 'B')
    s.weapons = {
      '0,0': { id: 1, ammoLeft: () => 3, ammoTotal: () => 5 },
      '0,1': { id: 2, ammoLeft: () => 2, ammoTotal: () => 4 }
    }
    expect(s.ammoLeft()).toBe(5)
    expect(s.ammoTotal()).toBe(9)
    s.sunk = true
    expect(s.ammoLeft()).toBe(0)
    expect(s.ammoTotal()).toBe(0)
  })

  test('place, unplace and addToGrid', () => {
    const s = new Ship(3, 'z', 'C')
    const cells = [
      [1, 1],
      [1, 2]
    ]
    s.place(cells)
    expect(s.cells).toBe(cells)
    expect(s.hits.size).toBe(0)
    expect(s.sunk).toBe(false)

    const grid = Array.from({ length: 4 }, () =>
      Array.from({ length: 4 }, () => null)
    )
    s.addToGrid(grid)
    expect(grid[1][1]).toEqual({ id: 3, letter: 'C' })
    expect(grid[1][2]).toEqual({ id: 3, letter: 'C' })

    s.unplace()
    expect(s.cells.length).toBe(0)
    expect(s.hits.size).toBe(0)
    expect(s.sunk).toBe(false)
  })

  test('hitAt without weapons sinks when all cells hit and calls onSink', () => {
    const s = new Ship(4, 'q', 'D')
    s.cells = [
      [2, 2],
      [3, 3]
    ]
    const onSink = jest.fn()

    const res1 = s.hitAt('2,2', onSink)
    expect(res1).toBe(false)
    expect(s.sunk).toBe(false)
    expect(onSink).not.toHaveBeenCalled()

    const res2 = s.hitAt('3,3', onSink)
    expect(res2).toBe(true)
    expect(s.sunk).toBe(true)
    expect(onSink).toHaveBeenCalledTimes(1)
    const args = onSink.mock.calls[0]
    expect(args[0]).toBe(s)
  })
})
