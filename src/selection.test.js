/* eslint-env jest */

/* global describe, beforeAll, jest, it, expect, beforeEach, afterEach, global */
import { Ghost, Brush } from './selection.js'

// Minimal DOM mock for environments without jsdom
beforeAll(() => {
  if (typeof global.document === 'undefined') global.document = {}
  if (!global.document.body) {
    global.document.body = {
      __children: [],
      innerHTML: '',
      appendChild (el) {
        this.__children.push(el)
      },
      contains (el) {
        return this.__children.includes(el)
      },
      removeChild (el) {
        this.__children = this.__children.filter(e => e !== el)
      }
    }
  }

  if (!global.document.createElement) {
    global.document.createElement = tag => {
      const el = {
        tagName: tag.toUpperCase(),
        className: '',
        innerHTML: '',
        style: {},
        remove () {
          if (global.document.body && global.document.body.removeChild) {
            global.document.body.removeChild(this)
          } else if (global.document.body) {
            global.document.body.__children =
              global.document.body.__children.filter(e => e !== this)
          }
        }
      }
      return el
    }
  }
})

describe('selection Ghost', () => {
  let originalBody

  beforeEach(() => {
    // ensure a clean document body
    originalBody = document.body.innerHTML
  })

  afterEach(() => {
    document.body.innerHTML = originalBody
  })

  it('constructor should append element to document.body and set properties', () => {
    const contentBuilder = jest.fn((el, variant, letter, special) => {
      el.innerHTML = `${variant}-${letter}-${special}`
    })

    const g = new Ghost('v1', 'A', contentBuilder, 'special')
    expect(document.body.contains(g.element)).toBe(true)
    expect(g.letter).toBe('A')
    expect(g.special).toBe('special')
    expect(g.element.className).toBe('ship-ghost')
    expect(g.element.innerHTML).toBe('v1-A-special')

    // cleanup
    g.remove()
  })

  it('hide and show should change opacity', () => {
    const contentBuilder = jest.fn(() => {})
    const g = new Ghost('v', 'B', contentBuilder, null)

    g.hide()
    expect(g.element.style.opacity).toBe(0)

    g.show()
    expect(g.element.style.opacity).toBe('')

    g.remove()
  })

  it('moveTo should set left and top styles', () => {
    const contentBuilder = jest.fn(() => {})
    const g = new Ghost('v', 'C', contentBuilder, null)

    g.moveTo(10, 20)
    expect(g.element.style.left).toBe('10px')
    expect(g.element.style.top).toBe('20px')

    g.remove()
  })

  it('setVariant should replace innerHTML using contentBuilder', () => {
    const contentBuilder = jest.fn((el, variant, letter) => {
      el.innerHTML = `variant:${variant},letter:${letter}`
    })
    const g = new Ghost('v1', 'D', contentBuilder, null)
    // replace contents
    g.setVariant('v2')
    expect(g.element.innerHTML).toBe('variant:v2,letter:D')

    g.remove()
  })

  it('remove should remove element and null it out', () => {
    const contentBuilder = jest.fn(() => {})
    const g = new Ghost('v', 'E', contentBuilder, null)
    const el = g.element
    g.remove()
    expect(document.body.contains(el)).toBe(false)
    expect(g.element).toBeNull()
  })
})

describe('Brush', () => {
  it('toObject returns size and subterrain', () => {
    const b = new Brush(3, 'water')
    expect(b.toObject()).toEqual({ size: 3, subterrain: 'water' })
  })
})
