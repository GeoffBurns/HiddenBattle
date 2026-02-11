/* eslint-env jest */

/* global describe, require, it, test, expect, beforeEach, afterEach, jest */

// Delay module loading until after localStorage is mocked to avoid
// side-effects during import (some map modules save to localStorage).

describe('gameMaps helpers', () => {
  afterEach(() => {
    jest.restoreAllMocks()
    if (globalThis.__origLocalStorage) {
      globalThis.localStorage = globalThis.__origLocalStorage
      delete globalThis.__origLocalStorage
    }
  })

  test('assembleTerrains calls currentTerrainMaps for initial setup when none', () => {
    const store = new Map()
    globalThis.__origLocalStorage = globalThis.localStorage
    globalThis.localStorage = {
      getItem: key => (store.has(key) ? store.get(key) : null),
      setItem: (k, v) => store.set(k, String(v)),
      removeItem: k => store.delete(k)
    }
    jest.resetModules()

    const { assembleTerrains } = require('./gameMaps.js')
    const { TerrainMaps } = require('./TerrainMaps.js')
    const { seaAndLandMaps } = require('../sea/seaAndLandMaps.js')
    const {
      spaceAndAsteroidsMaps
    } = require('../space/spaceAndAsteroidsMaps.js')

    const spyNum = jest
      .spyOn(TerrainMaps, 'numTerrains', 'get')
      .mockReturnValue(0)
    const spyCur = jest
      .spyOn(TerrainMaps, 'currentTerrainMaps')
      .mockImplementation(() => {})

    assembleTerrains()

    expect(spyCur).toHaveBeenCalledWith(seaAndLandMaps)
    expect(spyCur).toHaveBeenCalledWith(spaceAndAsteroidsMaps)
    spyNum.mockRestore()
  })

  test('gameMaps sets provided maps and returns current', () => {
    const store = new Map()
    globalThis.__origLocalStorage = globalThis.localStorage
    globalThis.localStorage = {
      getItem: key => (store.has(key) ? store.get(key) : null),
      setItem: (k, v) => store.set(k, String(v)),
      removeItem: k => store.delete(k)
    }
    jest.resetModules()

    const { gameMaps } = require('./gameMaps.js')
    const { TerrainMaps } = require('./TerrainMaps.js')

    let last = null
    const spy = jest
      .spyOn(TerrainMaps, 'currentTerrainMaps')
      .mockImplementation(arg => {
        if (arg) last = arg
        return last
      })

    const custom = { name: 'custom' }
    const res = gameMaps(custom)
    expect(spy).toHaveBeenCalledWith(custom)
    expect(res).toBe(custom)
  })

  test('gameMap sets map on current terrain maps and returns current map', () => {
    const store = new Map()
    globalThis.__origLocalStorage = globalThis.localStorage
    globalThis.localStorage = {
      getItem: key => (store.has(key) ? store.get(key) : null),
      setItem: (k, v) => store.set(k, String(v)),
      removeItem: k => store.delete(k)
    }
    jest.resetModules()

    const { gameMap } = require('./gameMaps.js')
    const { TerrainMaps } = require('./TerrainMaps.js')

    const fakeTM = { setToMap: jest.fn(), current: 'CURRENT_MAP' }
    jest.spyOn(TerrainMaps, 'currentTerrainMaps').mockImplementation(arg => {
      if (arg) return arg
      return fakeTM
    })

    const res = gameMap('mymap')
    expect(fakeTM.setToMap).toHaveBeenCalledWith('mymap')
    expect(res).toBe('CURRENT_MAP')
  })
})
