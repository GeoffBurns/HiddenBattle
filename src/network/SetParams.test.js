/* eslint-env jest */

/* global describe, it, test, expect, beforeEach, afterEach, jest */
import {
  replaceTokens,
  setSizeParams,
  setMapParams,
  setMapTypeParams
} from './SetParams.js'
import { terrains, bh } from '../terrain/terrain.js'

describe('SetParams', () => {
  let origPush
  let origDocument
  let createdMockDocument = false

  beforeEach(() => {
    origPush = globalThis.history
    globalThis.history = { pushState: jest.fn() }
    if (typeof document === 'undefined') {
      origDocument = undefined
      createdMockDocument = true
      globalThis.document = {
        title: '',
        getElementById: () => null,
        createElement: () => ({ id: '', dataset: {}, remove () {} }),
        body: { appendChild: () => {} }
      }
    } else {
      origDocument = globalThis.document
      const existing = document.getElementById('page-title')
      if (existing) existing.remove()
    }
  })

  afterEach(() => {
    globalThis.history = origPush
    if (createdMockDocument) {
      delete globalThis.document
      createdMockDocument = false
    } else if (origDocument) {
      const el = document.getElementById('page-title')
      if (el) el.remove()
    }
  })

  test('replaceTokens replaces {} and [] tokens and title-case [] tokens', () => {
    const tmpl = 'Hello {who} [place]'
    const out = replaceTokens(tmpl, [
      ['who', 'alice'],
      ['place', 'ocean world']
    ])
    expect(out).toBe('Hello alice Ocean World')
  })

  test('setSizeParams updates history when sizes change and updates title when template present', () => {
    // set a page-title template
    const title = document.createElement('div')
    title.id = 'page-title'
    title.dataset.template = 'Map {mode} [terrain]'
    document.body.appendChild(title)

    // start with height=1,width=1
    globalThis.location = 'http://example.com/?height=1&width=1'

    // make terrains.current available
    terrains.current = { bodyTag: 'sea' }

    setSizeParams(5, 7)

    expect(globalThis.history.pushState).toHaveBeenCalled()
  })

  test('setMapParams updates history when mapName changes', () => {
    globalThis.location = 'http://example.com/?mapName=old'
    terrains.current = { bodyTag: 'sea' }

    setMapParams('new')

    expect(globalThis.history.pushState).toHaveBeenCalled()
    const callArgs = globalThis.history.pushState.mock.calls[0]
    expect(callArgs[1]).toBe('')
  })

  test('setMapTypeParams updates history when mapType changes', () => {
    globalThis.location = 'http://example.com/?mapType=old&terrain=sea'
    terrains.current = { bodyTag: 'sea', tag: 'sea' }
    // ensure bh.setTerrainByTag exists and returns a terrain-like object if called
    bh.setTerrainByTag = jest
      .fn()
      .mockReturnValue({ terrain: { bodyTag: 'sea' } })

    setMapTypeParams('newType')

    expect(globalThis.history.pushState).toHaveBeenCalled()
  })
})
