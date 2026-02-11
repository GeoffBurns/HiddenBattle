/* eslint-env jest */

/* global describe, it, test, expect, beforeEach, jest */
import { spaceFleet } from './spaceFleet'
import { Transformer, Hybrid } from '../ships/SpecialShapes'
import { SpaceVessel, Shuttle, Installation } from './spaceShapes'

// Jest test suite
describe('spaceFleet exports', () => {
  test('spaceFleet is an array with expected items', () => {
    expect(Array.isArray(spaceFleet)).toBe(true)
    expect(spaceFleet.length).toBeGreaterThan(20)
  })

  test('spaceFleet contains various vessel types', () => {
    const hasVessels = spaceFleet.some(item => item instanceof SpaceVessel)
    const hasShuttles = spaceFleet.some(item => item instanceof Shuttle)
    const hasInstallations = spaceFleet.some(
      item => item instanceof Installation
    )
    expect(hasVessels).toBe(true)
    expect(hasShuttles).toBe(true)
    expect(hasInstallations).toBe(true)
  })

  test('spaceFleet includes railgun Transformer', () => {
    const railgun = spaceFleet.find(item => item.description?.() === 'Railgun')
    expect(railgun).toBeDefined()
    expect(railgun).toBeInstanceOf(Transformer)
  })

  test('spaceFleet includes habitat and spacePort Hybrids', () => {
    const habitat = spaceFleet.find(item => item.description?.() === 'Habitat')
    const spacePort = spaceFleet.find(
      item => item.description?.() === 'Space Port'
    )
    expect(habitat).toBeDefined()
    expect(spacePort).toBeDefined()
    expect(habitat).toBeInstanceOf(Hybrid)
    expect(spacePort).toBeInstanceOf(Hybrid)
  })

  test('spaceFleet includes observationPost Hybrid with notes', () => {
    const obsPost = spaceFleet.find(
      item => item.description?.() === 'Observation Post'
    )
    expect(obsPost).toBeDefined()
    expect(obsPost).toBeInstanceOf(Hybrid)
    expect(Array.isArray(obsPost.notes)).toBe(true)
  })
})
