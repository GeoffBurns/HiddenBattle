export const MIN_CUSTOM_WIDTH = 16
export const MAX_CUSTOM_WIDTH = 22
export const MIN_CUSTOM_HEIGHT = 6
export const MAX_CUSTOM_HEIGHT = 12
export const oldToken = 'geoffs-battleship'

export const terrain = {
  current: null,
  terrains: [],
  minWidth: MIN_CUSTOM_WIDTH,
  maxWidth: MAX_CUSTOM_WIDTH,
  minHeight: MIN_CUSTOM_HEIGHT,
  maxHeight: MAX_CUSTOM_HEIGHT,
  default: null,
  add: function (newT) {
    if (!this.terrains.includes(newT)) {
      this.terrains.push(newT)
    }
  },
  setCurrent: function (newCurrent) {
    this.add(newCurrent)
    this.current = newCurrent
    return this.current
  },
  setDefault: function (newCurrent) {
    this.default = this.setCurrent(newCurrent)
  },
  allBodyTags () {
    return this.terrains.map(t => t.bodyTag)
  },
  setByTag (tag) {
    if (tag) {
      const newTerrain = this.terrains.find(t => t.tag === tag)
      if (newTerrain) this.setCurrent(newTerrain)

      return newTerrain
    }
    return null
  }
}

export class SubTerrain {
  constructor (
    title,
    lightColor,
    darkColor,
    letter,
    isDefault,
    isTheLand,
    zones
  ) {
    this.title = title
    this.lightColor = lightColor
    this.darkColor = darkColor
    this.letter = letter
    this.isDefault = isDefault || false
    this.isTheLand = isTheLand || false
    this.zones = zones
    this.margin = zones.find(z => z.isMarginal)
    this.core = zones.find(z => !z.isMarginal)
    this.tag = title.toLowerCase()
  }

  clone () {
    return new SubTerrain(
      this.title,
      this.lightColor,
      this.darkColor,
      this.letter,
      this.isDefault,
      this.isTheLand,
      this.zones,
      this.tag
    )
  }
}

export class Zone {
  constructor (title, letter, isMarginal) {
    this.title = title
    this.letter = letter
    this.isMarginal = isMarginal
  }
}

export class Terrain {
  constructor (
    title,
    shipCatelogue,
    subterrains,
    tag,
    weaponsCatelogue,
    mapHeading,
    fleetHeading
  ) {
    this.title = title || 'Unknown'
    this.key = title.toLowerCase().replaceAll(/\s+/g, '-')
    this.ships = shipCatelogue
    this.weapons = weaponsCatelogue
    this.minWidth = MIN_CUSTOM_WIDTH
    this.maxWidth = MAX_CUSTOM_WIDTH
    this.minHeight = MIN_CUSTOM_HEIGHT
    this.maxHeight = MAX_CUSTOM_HEIGHT
    this.subterrains = subterrains
    this.zones = subterrains.flatMap(s => s.zones)
    this.defaultSubterrain =
      subterrains.find(s => s.isDefault) || subterrains[0]
    this.landSubterrain = subterrains.find(s => s.isTheLand) || subterrains[1]
    this.tag = tag
    this.mapHeading = mapHeading || 'Waters'
    this.fleetHeading = fleetHeading || 'Fleet'
    this.bodyTag = this.defaultSubterrain.tag
  }

  static typeDescriptions = {
    A: 'Air',
    G: 'Land',
    M: 'Hybrid',
    T: 'Transformer',
    X: 'Special',
    S: 'Sea',
    W: 'Weapon'
  }

  static unitDescriptions = {
    A: 'Air',
    G: 'Land',
    X: 'Special',
    S: 'Sea',
    W: 'Weapon'
  }

  static customizeUnits (elementTag, customize = Function.prototype) {
    const desscriptions = Object.entries(Terrain.unitDescriptions)
    for (const [letter, description] of desscriptions) {
      const key = description.toLowerCase() + elementTag
      const el = document.getElementById(key)
      if (el && customize !== Function.prototype) {
        customize(letter, description, el, key)
      }
    }
  }
  static customizeUnitDescriptions (
    elementTag,
    textContent = Function.prototype,
    innerHTML = Function.prototype
  ) {
    Terrain.customizeUnits(elementTag, (letter, description, el, key) => {
      if (textContent !== Function.prototype)
        el.textContent = textContent(letter, description, el, key)
      if (innerHTML !== Function.prototype)
        el.innerHTML = innerHTML(letter, description, el, key)
    })
  }
  static showsUnits (
    elementTag,
    hasClass = Function.prototype,
    className = 'hidden'
  ) {
    Terrain.customizeUnits(elementTag, (letter, description, el, key) => {
      if (hasClass !== Function.prototype)
        if (hasClass(letter, description, el, key, className)) {
          el.classList.remove(className)
        } else {
          el.classList.add(className)
        }
    })
  }

  subterrainTag (isLand) {
    return isLand ? this.landSubterrain.tag : this.defaultSubterrain.tag
  }

  allSubterrainTag () {
    return this.subterrains.map(st => st.tag)
  }
  getWeapon (letter) {
    return this.weapons.weapons.find(w => w.letter === letter)
  }
  getNewWeapon (letter, ammo) {
    const weapon = this.getWeapon(letter)
    if (weapon) return weapon.clone(ammo)

    return null
  }
  customMapsLocalStorageKey () {
    return `${oldToken}.${this.key}-custom-maps`
  }

  getCustomMapsRaw () {
    return localStorage.getItem(this.customMapsLocalStorageKey()) || ''
  }

  setCustomMapsRaw (csv) {
    return localStorage.setItem(this.customMapsLocalStorageKey(), csv)
  }

  getCustomMapSet () {
    const customMaps = this.getCustomMapsRaw()
    if (customMaps) return new Set(customMaps.split(','))

    return new Set()
  }
  localStorageMapKey (title) {
    return `${oldToken}.${title}`
  }
  updateCustomMaps (title) {
    let customMaps = this.getCustomMapSet()
    if (customMaps.has(title)) {
      return
    }
    customMaps.add(title)
    const list = [...customMaps].filter(
      t => t && t.length > 0 && localStorage.getItem(this.localStorageMapKey(t))
    )

    const csv = list.join()
    localStorage.setItem(this.customMapsLocalStorageKey(), csv)
  }
  deleteCustomMaps (title) {
    let customMaps = this.getCustomMapSet()

    customMaps.delete(title)
    localStorage.setItem(this.customMapsLocalStorageKey, [...customMaps].join())
  }
  renameCustomMaps (oldMap, newTitle) {
    let customMaps = this.getCustomMapSet()

    customMaps.delete(oldMap.title)
    oldMap.title = newTitle
    customMaps.add(oldMap.title)
    localStorage.setItem(
      this.customMapsLocalStorageKey(),
      [...customMaps].join()
    )
  }

  getCustomMaps (builder) {
    const customMaps = this.getCustomMapsRaw()
    if (!customMaps) return []
    return [...this.getCustomMapSet()]
      .map(title => builder(title))
      .filter(m => m !== null)
  }

  getCustomMapTitles () {
    const customMaps = this.getCustomMapsRaw()
    if (!customMaps) return []
    return [...this.getCustomMapSet()]
  }

  sunkDescription (letter, middle = ' ') {
    return this.ships.sunkDescription(letter, middle)
  }
  addShapes (shapes) {
    this.ships.addShapes(shapes)
  }
  addWeapons (weapons) {
    this.weapons.addWeapons(weapons)
  }
}
