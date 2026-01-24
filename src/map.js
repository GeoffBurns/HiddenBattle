import { addCellToFootPrint, makeKey, parsePair } from './utilities.js'
import { terrain, oldToken } from './terrain.js'
import { standardShot } from './Weapon.js'
import { seaAndLand } from './seaAndLand.js'
import { Megabomb } from './SeaWeapons.js'

// geometry helper
export const inRange = (r, c) => element =>
  element[0] == r && element[1] <= c && element[2] >= c

export class Map {
  constructor (title, size, shipNum, landArea, name, mapTerrain, land) {
    this.title = title
    this.name = name
    this.rows = size[0]
    this.cols = size[1]
    this.shipNum = shipNum
    this.landArea = landArea
    this.land = land instanceof Set ? land : new Set()
    this.terrain = mapTerrain || terrain.current

    if (!this?.terrain.subterrains) {
      console.log('bad')
      throw new Error('map called with bad parameter : ', this.terrain)
    }
    this.subterrainTrackers = this.terrain.subterrains.map(s => {
      return {
        subterrain: s,
        total: new Set(),
        m_zone: s.zones.find(z => z.isMarginal),
        margin: new Set(),
        c_zone: s.zones.find(z => !z.isMarginal),
        core: new Set(),
        footprint: new Set()
      }
    })
    this.calcTrackers()
    this.isPreGenerated = true
    this.weapons = [standardShot, new Megabomb(3)]
  }
  recalcTracker (subterrain, tracker) {
    tracker.total.clear()
    tracker.margin.clear()
    tracker.core.clear()

    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        this.setTracker(r, c, subterrain, tracker)
      }
    }
  }
  calcTrackers () {
    for (const tracker of this.subterrainTrackers) {
      this.recalcTracker(tracker.subterrain, tracker)
    }
  }
  setTracker (r, c, subterrain, tracker) {
    const isLand = subterrain.isTheLand
    if (isLand !== this.isLand(r, c)) return
    const key = makeKey(r, c)
    tracker.total.add(key)
    for (let i = -1; i <= 1; i++) {
      for (let j = -1; j <= 1; j++) {
        if (!(i === 0 && j === 0) && this.inBounds(r + i, c + j)) {
          if (isLand !== this.isLand(r + i, c + j)) {
            tracker.margin.add(key)
          }
        }
      }
    }
    tracker.core = new Set(
      [...tracker.total].filter(x => !tracker.margin.has(x))
    )
  }

  calcFootPrints () {
    for (const tracker of this.subterrainTrackers) {
      this.calcFootPrint(tracker)
    }
  }

  calcFootPrint (tracker) {
    tracker.footprint.clear()

    tracker.total.forEach((value, key) => {
      const [r, c] = parsePair(key)
      addCellToFootPrint(r, c, tracker.footprint)
    })
  }

  inBounds (r, c) {
    return r >= 0 && r < this.rows && c >= 0 && c < this.cols
  }
  inAllBounds (r, c, height, width) {
    return r >= 0 && r + height < this.rows && c + width >= 0 && c < this.cols
  }

  addLand (_r, _c) {
    throw new Error('Not a custom map')
  }

  subterrain (r, c) {
    for (const tracker of this.subterrainTrackers) {
      if (tracker.total.has(makeKey(r, c))) return tracker.subterrain
    }

    return this.terrain.defaultSubterrain
  }

  zoneDetail (r, c) {
    for (const tracker of this.subterrainTrackers) {
      if (tracker.total.has(makeKey(r, c))) {
        if (tracker.margin.has(makeKey(r, c)))
          return [tracker.subterrain, tracker.m_zone]
        else if (tracker.core.has(makeKey(r, c)))
          return [tracker.subterrain, tracker.c_zone]
        else {
          throw new Error('Unknown zone')
        }
      }
    }
    throw new Error('Unknown subterrain')
  }
  zone (r, c) {
    return this.zoneDetail(r, c)[1]
  }

  zoneInfo (r, c, zoneDetail) {
    switch (zoneDetail) {
      case 0:
        return []
      case 1:
        return [this.subterrain(r, c)]
      case 2:
        return this.zoneDetail(r, c)
      default:
        throw new Error('zoneDetail not valid :', zoneDetail)
    }
  }
  isLand (r, c) {
    return this.landArea.some(inRange(r, c))
  }

  tag (r, c) {
    return this.terrain.subterrainTag(this.isLand(r, c)) || ''
  }
  allTags () {
    return this.terrain.allSubterrainTag() || ''
  }

  tagCell (cell, r, c) {
    const allTags = this.allTags()
    cell.remove(...allTags)
    const tag = this.tag(r, c)

    const checker = (r + c) % 2 === 0
    cell.add(tag, checker ? 'light' : 'dark')
  }

  savedMap (newTitle) {
    newTitle = newTitle || makeTitle(this.terrain, this.cols, this.rows)

    const clone = new EditedCustomMap({ ...this })
    for (let i = 0; i < this.rows; i++) {
      for (let j = 0; j < this.cols; j++) {
        if (this.isLand(i, j)) clone.addLand(i, j)
      }
    }
    clone.title = newTitle
    return clone
  }

  clone (newTitle) {
    newTitle = newTitle || makeTitle(this.terrain, this.cols, this.rows)

    const clonedMap = this.savedMap(newTitle)
    clonedMap.saveToLocalStorage(newTitle)
  }

  exportName () {
    return this.name + ' copy'
  }

  jsonString (newTitle) {
    newTitle = newTitle || this.exportName()
    const exportingMap = this.savedMap(newTitle)
    return exportingMap.jsonString()
  }
}
function getCopyNumKey (terrain, cols, rows) {
  return `${oldToken}.${terrain.key}-index-${cols}x${rows}`
}
function getCopyNum (terrain, cols, rows) {
  return Number.parseInt(
    localStorage.getItem(getCopyNumKey(terrain, cols, rows))
  )
}
function setCopyNum (terrain, cols, rows, index) {
  localStorage.setItem(getCopyNumKey(terrain, cols, rows), index)
}
function getNextCopyNum (terrain, cols, rows) {
  return getCopyNum(terrain, cols, rows) + 1 || 1
}
function makeTitle (terrain, cols, rows) {
  const index = getNextCopyNum(terrain, cols, rows)
  setCopyNum(terrain, cols, rows, index)
  return `${terrain.key}-${index}-${cols}x${rows}`
}

export class CustomMap extends Map {
  constructor (title, size, shipNum, land, mapTerrain, example) {
    super(title, size, shipNum, [], title, mapTerrain || terrain.current, land)
    this.isPreGenerated = false
    this.example = example
    this.weapons = [standardShot]
  }

  isLand (r, c) {
    return this.land.has(makeKey(r, c))
  }

  exportName () {
    return this.title
  }

  jsonObj () {
    const data = { ...this }
    delete data.terrain
    delete data.land
    data.land = [...this.land]
    data.terrain = this.terrain.title
    return data
  }
  jsonString () {
    const data = this.jsonObj()
    return JSON.stringify(data, null, 2)
  }
  saveToLocalStorage (title, key) {
    title = title || makeTitle(this.terrain, this.cols, this.rows)
    key = key || this.localStorageKey(title)

    localStorage.setItem(key, this.jsonString())

    this.terrain.updateCustomMaps(title)
  }

  localStorageKey (title) {
    this.title = title || makeTitle(this.terrain, this.cols, this.rows)
    return `${oldToken}.${this.title}`
  }
}

const withModifyable = Base =>
  class extends Base {
    constructor (...args) {
      super(...args) // REQUIRED
    }

    addLand (r, c) {
      if (this.inBounds(r, c)) this.land.add(makeKey(r, c))
    }

    removeLand (r, c) {
      if (this.inBounds(r, c)) this.land.delete(makeKey(r, c))
    }

    addShips (ships) {
      this.shipNum = {}
      for (const ship of ships) {
        this.shipNum[ship.letter] = (this.shipNum[ship.letter] || 0) + 1
      }
    }
    setLand (r, c, subterrain) {
      if (subterrain.isDefault) {
        this.removeLand(r, c)
      } else {
        this.addLand(r, c)
      }
    }
  }

export class CustomBlankMap extends withModifyable(CustomMap) {
  constructor (rows, cols, mapTerrain) {
    super(
      makeTitle(mapTerrain || terrain.current, cols, rows),
      [rows, cols],
      0,
      new Set(),
      mapTerrain || terrain.current
    )
  }
  indexToken (rows, cols) {
    return getCopyNumKey(this.terrain, cols, rows)
  }

  setSize (rows, cols) {
    this.title = makeTitle(this.terrain, cols, rows)
    this.rows = rows
    this.cols = cols
    for (const key of this.land) {
      const [r, c] = key.split(',').map(n => Number.parseInt(n, 10))
      if (!this.inBounds(r, c)) this.land.delete(key)
    }
  }
}

export class SavedCustomMap extends CustomMap {
  constructor (data) {
    super(
      data.title,
      [data.rows, data.cols],
      data.shipNum,
      new Set(data.land),
      null,
      data.example
    )
    this.terrain =
      terrain.terrains.find(t => t.title === data.terrain) || seaAndLand

    const weapons = data.weapons.map(w =>
      this.terrain.getNewWeapon(w.letter, w.ammo)
    )
    this.weapons = [standardShot].concat(weapons.filter(Boolean))
  }

  static loadObj (title) {
    const newLocal = `${oldToken}.${title}`
    const data = localStorage.getItem(newLocal)
    if (!data) return null
    const obj = JSON.parse(data)
    return obj
  }

  static load (title) {
    const obj = SavedCustomMap.loadObj(title)
    if (obj) return new SavedCustomMap(obj)

    console.log("Can't Load Map : ", title)
    return null
  }

  localStorageKey () {
    return `${oldToken}.${this.title}`
  }

  remove () {
    const key = this.localStorageKey()
    const title = this.title
    localStorage.removeItem(key)
    const check = localStorage.getItem(key)
    if (check) {
      throw new Error('Failed to delete map with key ' + key)
    }

    this.terrain.deleteCustomMaps(title)
  }

  rename (newTitle) {
    this.remove()
    this.title = newTitle
    this.saveToLocalStorage(newTitle)
  }

  clone (newTitle) {
    newTitle = newTitle || makeTitle(this.terrain, this.cols, this.rows)
    this.title = newTitle
    const key = this.localStorageKey()
    this.saveToLocalStorage(newTitle, key)

    const check = localStorage.getItem(key)
    if (!check) {
      throw new Error('Failed to copy map with key ' + key)
    }
  }
}

export class EditedCustomMap extends withModifyable(SavedCustomMap) {
  constructor (...args) {
    super(...args) // REQUIRED
  }

  static load (title) {
    const obj = SavedCustomMap.loadObj(title)
    if (obj) {
      return new EditedCustomMap(obj)
    } else {
      return null
    }
  }
}
