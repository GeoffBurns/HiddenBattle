/* eslint-env jest */

/* global describe, it, test, expect, beforeEach, afterEach, jest */

jest.mock('../waters/saveCustomMap.js', () => ({ storeShips: jest.fn() }))
jest.mock('./gtag.js', () => ({ trackClick: jest.fn(), trackTab: jest.fn() }))

import { switchTo, tabs, setupTabs } from './setupTabs.js'
import { storeShips } from '../waters/saveCustomMap.js'
import { trackTab } from './gtag.js'
import { bh, terrains } from '../terrain/terrain.js'

function makeTabElement () {
  const listeners = {}
  return {
    listeners,
    addEventListener (ev, fn) {
      listeners[ev] = listeners[ev] || []
      listeners[ev].push(fn)
    },
    removeEventListener (ev, fn) {
      listeners[ev] = (listeners[ev] || []).filter(f => f !== fn)
    },
    classList: {
      added: [],
      add (cls) {
        this.added.push(cls)
      }
    },
    // helper to trigger click
    trigger (evName = 'click') {
      ;(listeners[evName] || []).forEach(fn => fn.call(this))
    }
  }
}

describe('setupTabs and switchTo', () => {
  let origDoc
  let elements
  let origLocation

  beforeEach(() => {
    // mock document.getElementById to return tab elements
    origDoc = globalThis.document
    elements = new Map()
    const ids = [
      'build',
      'add',
      'hide',
      'seek',
      'list',
      'rules',
      'import',
      'about',
      'source',
      'print'
    ]
    for (const id of ids) elements.set(`tab-${id}`, makeTabElement())
    globalThis.document = {
      getElementById: id => elements.get(id) || null
    }

    // mock bh and related map/terrain
    origLocation = globalThis.location
    globalThis.location = { href: '' }
    // ensure terrainMaps.current exists to satisfy bh.map getter
    if (!bh.terrainMaps) bh.terrainMaps = { current: {} }
    if (!bh.terrainMaps.current) bh.terrainMaps.current = {}
    bh.terrainMaps.current.current = { rows: 2, cols: 3, title: 'm1' }
    terrains.current = { tag: 'sea' }

    // mock print
    globalThis.print = jest.fn()
  })

  afterEach(() => {
    globalThis.document = origDoc
    globalThis.location = origLocation
    delete globalThis.print
    jest.clearAllMocks()
  })

  test('switchTo sets location when storeShips returns url', () => {
    storeShips.mockReturnValueOnce('http://example.com/go')
    switchTo('target', 'build')
    expect(globalThis.location.href).toBe('http://example.com/go')
  })

  test('setupTabs marks build/add as current in build mode', () => {
    setupTabs('build')
    const buildEl = elements.get('tab-build')
    const addEl = elements.get('tab-add')
    expect(buildEl.classList.added).toContain('you-are-here')
    expect(addEl.classList.added).toContain('you-are-here')
  })

  test('setupTabs attaches handlers and print/about/source behaviors', () => {
    setupTabs('other')
    // simulate clicking print
    const printEl = elements.get('tab-print')
    // find click handler and invoke
    printEl.trigger('click')
    expect(trackTab).toHaveBeenCalledWith('print')
    expect(globalThis.print).toHaveBeenCalled()

    // about click should set location
    const aboutEl = elements.get('tab-about')
    aboutEl.trigger('click')
    expect(trackTab).toHaveBeenCalledWith('go to blog')
    expect(globalThis.location.href).toContain('geoffburns.blogspot.com')

    const sourceEl = elements.get('tab-source')
    sourceEl.trigger('click')
    expect(trackTab).toHaveBeenCalledWith('go to source code')
    expect(globalThis.location.href).toContain('github.com')
  })
})
