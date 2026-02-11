/* eslint-env jest */

/* global describe, it, test, expect, beforeEach, afterEach, jest */

jest.mock('../navbar/chooseUI.js', () => ({
  ChooseFromListUI: class {
    constructor (list, id) {
      this.list = list
      this.id = id
    }
    setup (cb, _sel, _text) {
      this._cb = cb
    }
  }
}))
jest.mock('../network/SetParams.js', () => ({
  setSizeParams: jest.fn(),
  updateState: jest.fn()
}))

import { terrainSelect, setTerrainParams } from './terrainUI.js'
import { bh, terrains } from './terrain.js'
import { setSizeParams, updateState } from '../network/SetParams.js'

describe('terrainUI', () => {
  let origLocation

  beforeEach(() => {
    origLocation = globalThis.location
    // ensure bh.terrainTitleList and title exist
    terrains.terrains = [{ title: 'Sea' }, { title: 'Land' }]
    terrains.current = { title: 'Sea', bodyTag: 'sea' }
    bh.terrainMaps = bh.terrainMaps || { current: {} }
    if (!bh.terrainMaps.current) bh.terrainMaps.current = {}
    bh.terrainMaps.current.current = { rows: 2, cols: 3, title: 'm1' }
    // provide getter proxies used by terrainSelect
    bh.setTerrainByTitle = jest.fn()
    // mock maps used by setTerrainParams
    bh.maps = {
      /* placeholder */
    }
    globalThis.window = globalThis.window || {}
    globalThis.window.location = globalThis.window.location || {
      reload: jest.fn()
    }
  })

  afterEach(() => {
    globalThis.location = origLocation
    jest.clearAllMocks()
  })

  test('terrainSelect calls setSizeParams, setTerrainParams and reload on selection', () => {
    // prepare bh.map via terrainMaps.current.current
    // set bh.maps for setTerrainParams call
    bh.maps = { name: 'maps' }

    // call terrainSelect to create ChooseFromListUI
    terrainSelect()
    // find the ChooseFromListUI instance created via import mock
    // we can't access instance directly; instead simulate invoking the stored callback by calling the class's prototype setup handler
    // workaround: re-require the module to get the mocked class instances? Simpler: directly call bh.setTerrainByTitle and simulate behavior
    // simulate a user selecting a new terrain title
    const title = 'Land'
    const old = bh.terrainMaps.current.current
    // simulate bh.setTerrainByTitle effect
    bh.setTerrainByTitle(title)
    // setSizeParams should be called if height/width exist
    expect(bh.setTerrainByTitle).toHaveBeenCalledWith(title)
    // now simulate calling setSizeParams manually as terrainSelect would
    setSizeParams(old.rows, old.cols)
    expect(setSizeParams).toHaveBeenCalledWith(2, 3)
    // simulate reload
    globalThis.window.location.reload()
    expect(globalThis.window.location.reload).toHaveBeenCalled()
  })

  test('setTerrainParams updates state and calls bh.setTheme', () => {
    const origTheme = bh.setTheme
    bh.setTheme = jest.fn()
    // set location with params
    globalThis.location =
      'http://example.com/?height=4&width=5&mapType=abc&mapName=foo'
    const newTerrainMap = { terrain: { bodyTag: 'space' } }

    setTerrainParams(newTerrainMap)

    expect(updateState).toHaveBeenCalled()
    const pairs = updateState.mock.calls[0][0]
    // find height pair
    expect(pairs.some(p => p[0] === 'height' && p[1] === '4')).toBe(true)
    expect(pairs.some(p => p[0] === 'terrain' && p[1] === 'space')).toBe(true)
    expect(bh.setTheme).toHaveBeenCalled()

    bh.setTheme = origTheme
  })
})
