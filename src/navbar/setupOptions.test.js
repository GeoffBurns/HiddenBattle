/* eslint-env jest */

/* global describe, require, it, test, expect, beforeEach, afterEach, jest */

jest.mock('./chooseUI.js', () => ({
  ChooseFromListUI: class {
    constructor (list, id) {
      this.list = list
      this.id = id
    }
    setup (cb, _sel, _text) {
      this._cb = cb
    }
  },
  ChooseNumberUI: class {
    constructor () {}
    setup (cb, _default) {
      this._cb = cb
    }
  }
}))
jest.mock('../waters/saveCustomMap.js', () => ({ saveCustomMap: jest.fn() }))
jest.mock('./setupTabs.js', () => ({ setupTabs: jest.fn() }))
jest.mock('../terrain/terrainUI.js', () => ({
  terrainSelect: jest.fn(),
  setTerrainParams: jest.fn()
}))
jest.mock('../network/SetParams.js', () => ({
  setMapTypeParams: jest.fn(),
  setSizeParams: jest.fn()
}))

import {
  setupMapListOptions,
  setupGameOptions,
  resetCustomMap,
  setupBuildOptions
} from './setupOptions.js'
import { bh, terrains } from '../terrain/terrain.js'
import { saveCustomMap } from '../waters/saveCustomMap.js'
import { terrainSelect } from '../terrain/terrainUI.js'

describe('setupOptions', () => {
  let origLocation
  let origTerrainMapsCurrent
  beforeEach(() => {
    origLocation = globalThis.location
    globalThis.location = new URL('http://example.com/')
    origTerrainMapsCurrent = bh.terrainMaps.current
    // prepare terrains bounds
    terrains.minWidth = 1
    terrains.maxWidth = 3
    terrains.minHeight = 1
    terrains.maxHeight = 3

    // provide bh.maps shape used by functions
    bh.terrainMaps.current = {
      getEditableMap: jest.fn().mockReturnValue(null),
      getMap: jest.fn().mockReturnValue(null),
      getLastMap: jest.fn().mockReturnValue({ cols: 2, rows: 2 }),
      getLastWidth: jest.fn().mockReturnValue(2),
      getLastHeight: jest.fn().mockReturnValue(2),
      setToBlank: jest.fn(),
      storeLastWidth: jest.fn(),
      storeLastHeight: jest.fn(),
      onChange: null,
      setTo: jest.fn(),
      storeLastMap: jest.fn()
    }
    // ensure bh.map exists
    bh.map = { rows: 2, cols: 2 }
  })
  afterEach(() => {
    globalThis.location = origLocation
    bh.terrainMaps.current = origTerrainMapsCurrent
  })

  test('setupMapListOptions returns correct default index and calls terrainSelect', () => {
    globalThis.location = new URL('http://example.com/?mapType=All')
    const out = setupMapListOptions(() => {})
    expect(out).toBe('1')
    expect(terrainSelect).toHaveBeenCalled()
  })

  test('setupGameOptions returns placedShips value from location', () => {
    // mock setupMapSelection used inside setupGameOptions
    jest.doMock('./setupMapSelection.js', () => ({
      setupMapSelection: () => true
    }))
    const { setupGameOptions: sg } = require('./setupOptions.js')
    globalThis.location = new URL('http://example.com/?placedShips=1')
    const called = sg(
      () => {},
      () => {}
    )
    expect(called).toBe(true)
    jest.dontMock('./setupMapSelection.js')
  })

  test('resetCustomMap calls saveCustomMap and resets maps', () => {
    // set the current map on terrainMaps so bh.map getter returns it
    bh.terrainMaps.current.current = { rows: 5, cols: 6 }
    bh.terrainMaps.current.setToBlank = jest.fn()
    resetCustomMap()
    expect(saveCustomMap).toHaveBeenCalledWith(bh.terrainMaps.current.current)
    expect(bh.terrainMaps.current.setToBlank).toHaveBeenCalledWith(5, 6)
  })

  test('setupBuildOptions calls editHandler when targetMap present', () => {
    // make setupMapOptions return a target map by making getEditableMap truthy
    bh.terrainMaps.current.getEditableMap = jest
      .fn()
      .mockReturnValue({ title: 'editable' })
    const editHandler = jest.fn()
    const boardSetup = jest.fn()
    const result = setupBuildOptions(boardSetup, () => {}, 'build', editHandler)
    expect(result).toEqual({ title: 'editable' })
    expect(editHandler).toHaveBeenCalledWith({ title: 'editable' })
  })

  test('setupBuildOptions calls boardSetup when no targetMap', () => {
    bh.terrainMaps.current.getEditableMap = jest.fn().mockReturnValue(null)
    const boardSetup = jest.fn()
    const result = setupBuildOptions(boardSetup, () => {}, 'build')
    expect(boardSetup).toHaveBeenCalled()
    expect(result).toBeNull()
  })
})
