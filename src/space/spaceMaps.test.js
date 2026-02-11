/* eslint-env jest */

/* global describe, it, test, expect, beforeEach, jest */

import {
  smugglerSS,
  smugglerMS,
  smugglerM,
  smugglerML,
  smugglerL,
  spaceMapList,
  defaultSpaceMap
} from './spaceMaps'
import { BhMap } from '../terrain/map'
// Jest test suite
describe('spaceMaps exports', () => {
  test('smugglerSS is BhMap with correct title and weapons', () => {
    expect(smugglerSS).toBeInstanceOf(BhMap)
    expect(smugglerSS.title).toBe("Smuggler's Run SS")
    expect(Array.isArray(smugglerSS.weapons)).toBe(true)
    expect(smugglerSS.weapons.length).toBeGreaterThan(0)
  })

  test('smugglerMS, smugglerM, smugglerML, smugglerL are BhMap instances', () => {
    expect(smugglerMS).toBeInstanceOf(BhMap)
    expect(smugglerM).toBeInstanceOf(BhMap)
    expect(smugglerML).toBeInstanceOf(BhMap)
    expect(smugglerL).toBeInstanceOf(BhMap)
  })

  test('all maps have expected titles', () => {
    expect(smugglerMS.title).toBe("Smuggler's Run MS")
    expect(smugglerM.title).toBe("Smuggler's Run M")
    expect(smugglerML.title).toBe("Smuggler's Run ML")
    expect(smugglerL.title).toBe("Smuggler's Run L")
  })

  test('spaceMapList contains all five maps', () => {
    expect(spaceMapList.length).toBe(5)
    expect(spaceMapList).toContain(smugglerSS)
    expect(spaceMapList).toContain(smugglerMS)
    expect(spaceMapList).toContain(smugglerM)
    expect(spaceMapList).toContain(smugglerML)
    expect(spaceMapList).toContain(smugglerL)
  })

  test('defaultSpaceMap is smugglerSS', () => {
    expect(defaultSpaceMap).toBe(smugglerSS)
  })
})
