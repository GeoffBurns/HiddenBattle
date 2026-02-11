/* eslint-env jest */

/* global describe, jest, it, test, expect, beforeEach, afterEach, jest */

jest.mock('../terrain/terrainUI.js', () => ({ terrainSelect: jest.fn() }))
jest.mock('./chooseUI.js', () => ({
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
jest.mock('../network/SetParams.js', () => ({ setMapParams: jest.fn() }))

import { setupMapControl, setupMapSelection } from './setupMapSelection.js'
import { bh } from '../terrain/terrain.js'
import { terrainSelect } from '../terrain/terrainUI.js'

describe('setupMapSelection and setupMapControl', () => {
  let origLocation
  let origTerrainMaps
  beforeEach(() => {
    origLocation = globalThis.location
    // preserve existing terrainMaps
    origTerrainMaps = { ...bh.terrainMaps }
    // provide a basic maps mock as terrainMaps.current
    bh.terrainMaps.current = {
      mapTitles: () => ['one', 'two'],
      setTo: jest.fn(),
      getMap: name => (name ? { title: name } : null),
      getMapOfSize: (h, w) => ({ title: `map-${h}x${w}` }),
      getLastMapTitle: () => 'last',
      storeLastMap: jest.fn()
    }
    // mock window.location.reload
    globalThis.window = { location: { reload: jest.fn() } }
  })
  afterEach(() => {
    globalThis.location = origLocation
    delete globalThis.window
    bh.terrainMaps = origTerrainMaps
  })

  test('setupMapControl uses terrainSelect and returns targetMap when present', () => {
    const urlParams = new URLSearchParams('?mapName=foo')
    const boardSetup = jest.fn()
    const refresh = jest.fn()

    const target = setupMapControl(urlParams, boardSetup, refresh)

    expect(terrainSelect).toHaveBeenCalled()
    expect(bh.maps.setTo).toHaveBeenCalledWith('foo')
    expect(target).toEqual({ title: 'foo' })
  })

  test('setupMapSelection returns placedShips flag from location.search', () => {
    globalThis.location = new URL('http://example.com/?placedShips=1')
    const result = setupMapSelection(
      () => {},
      () => {}
    )
    expect(result).toBe(true)
  })

  test('setMapFromParams picks map by size when mapName missing', () => {
    const urlParams = new URLSearchParams('?height=5&width=7')
    const target = setupMapControl(
      urlParams,
      () => {},
      () => {}
    )
    // no explicit mapName, maps.getMap would return null, setTo called with computed title
    expect(bh.maps.setTo).toHaveBeenCalled()
    expect(target).toBeNull()
  })
})
