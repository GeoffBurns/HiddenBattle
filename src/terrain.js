export const MIN_CUSTOM_WIDTH = 16
export const MAX_CUSTOM_WIDTH = 22
export const MIN_CUSTOM_HEIGHT = 6
export const MAX_CUSTOM_HEIGHT = 12
export const oldToken = 'geoffs-battleship'

export const terrains = {
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
  },
  getByTag (tag) {
    if (tag) {
      return this.terrains.find(t => t.tag === tag)
    }
    return null
  }
}

export const bh = {
  terrainMaps: {},
  widthUI: null,
  heightUI: null,
  get terrain () {
    return terrains.current
  },
  get terrainTitle () {
    return terrains.current?.title
  },
  get mapHeading () {
    return terrains.current.mapHeading
  },
  get fleetHeading () {
    return terrains.current.fleetHeading
  },
  get hasTransforms () {
    return terrains.current.hasTransforms
  },
  get defaultTerrain () {
    return terrains.default
  },
  terrainByTitle (title) {
    return terrains.terrains.find(t => t.title === title) || bh.defaultTerrain
  },
  shipSunkText (letter, middle) {
    return terrains?.current?.sunkDescription(letter, middle)
  },
  shipDescription (letter) {
    return terrains?.current?.ships?.descriptions[letter]
  },
  get terrainList () {
    return terrains?.terrains
  },
  get ships () {
    return terrains?.current?.ships
  },
  get shipTypes () {
    return terrains?.current?.ships?.types
  },
  shipType (letter) {
    return terrains?.current?.ships?.types[letter]
  },
  get terrainMap () {
    return this.terrainMaps?.current
  },
  set terrainMap (newCurrent) {
    if (
      this.terrainMaps.setCurrent &&
      newCurrent &&
      this.terrainMaps?.current !== newCurrent
    ) {
      this.terrainMaps.setCurrent(newCurrent)
    }
  },
  get maps () {
    return this.terrainMaps.current
  },
  set maps (newCurrent) {
    if (
      this.terrainMaps?.setCurrent &&
      newCurrent &&
      this.terrainMaps.current !== newCurrent
    ) {
      this.terrainMaps.setCurrent(newCurrent)
    }
  },
  get map () {
    return this.terrainMaps?.current?.current
  },
  set map (newMap) {
    if (newMap && this.terrainMaps?.current?.setToMap) {
      this.terrainMaps.current.setToMap()
    }
  },
  inBounds (r, c) {
    return this.terrainMaps?.current?.current?.inBounds(r, c)
  },
  isLand (r, c) {
    return this.terrainMaps?.current?.current?.isLand(r, c)
  },
  shapesByLetter (letter) {
    return this.terrainMaps?.current?.shapesByLetter[letter]
  },
  shipBuilder: Function.prototype,
  fleetBuilder: Function.prototype,
  setTheme () {
    const terrainTheme = document.getElementById('terrainTheme')
    const body = document.getElementsByTagName('body')[0]
    if (terrainTheme) {
      const bodyTag = terrains?.current.bodyTag || 'default'

      if (body.classList.contains(bodyTag)) return
      body.className = 'hidden-battle ' + bodyTag
      terrainTheme.href = `./styles/${bodyTag}.css`
    }
  },
  setTest (urlParams) {
    const testTag = urlParams.getAll('test')[0]
    this.test = testTag ? true : false
  },
  get terrainTitleList () {
    return this.terrainMaps.list.map(t => t?.terrain?.title)
  },
  setTerrainByTitle (title) {
    let result = null
    if (title) {
      result = this.terrainMaps.setByTitle(title)
    }

    return (
      result ||
      this.terrainMaps.setToDefault() ||
      this.terrainMaps.setByIndex(0)
    )
  },
  setTerrainByTag (tag) {
    let result = null
    if (tag) {
      result = this.terrainMaps.setByTag(tag)
    }

    return (
      result ||
      this.terrainMaps.setToDefault() ||
      this.terrainMaps.setByIndex(0)
    )
  },
  getTerrainByTag (tag) {
    if (tag) {
      return terrains.getByTag(tag)
    }
    return null
  },
  get spashTags () {
    return {
      0: 'destroy-vunerable',
      1: 'destroy-normal',
      2: 'destroy-hardened',
      3: 'destroy-hardened',
      4: 'destroy-hardened',
      10: 'reveal-vunerable',
      11: 'reveal-normal',
      12: 'reveal-hardened',
      20: 'weapon-path'
    }
  },
  typeDescriptions: {
    A: 'Air',
    G: 'Land',
    M: 'Hybrid',
    T: 'Transformer',
    X: 'Special',
    S: 'Sea',
    W: 'Weapon'
  },
  unitDescriptions: {
    A: 'Air',
    G: 'Land',
    X: 'Special',
    S: 'Sea',
    W: 'Weapon'
  },
  customizeUnits (elementTag, customize = Function.prototype) {
    const descriptions = Object.entries(bh.unitDescriptions)
    for (const [letter, description] of descriptions) {
      const key = description.toLowerCase() + elementTag
      const el = document.getElementById(key)
      if (el && customize !== Function.prototype) {
        customize(letter, description, el, key)
      }
    }
  },
  get newSubterrainTrackers () {
    return this.terrain.subterrains.map(s => {
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
  }
}
export class SubTerrainBase {
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
    this.canBe = Function.prototype
    this.validator = Function.prototype
    this.zoneDetail = 0
  }
  /*
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
      */
}
export class SubTerrain extends SubTerrainBase {
  constructor (
    title,
    lightColor,
    darkColor,
    letter,
    isDefault,
    isTheLand,
    zones
  ) {
    super(title, lightColor, darkColor, letter, isDefault, isTheLand, zones)
    this.canBe = subterrain => subterrain === this
    this.validator = zoneInfo => this.canBe(zoneInfo[0])
    this.zoneDetail = 1
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
    this.hasUnattachedWeapons = true
    this.hasAttachedWeapons = false
  }

  static customizeUnitDescriptions (
    elementTag,
    textContent = Function.prototype,
    innerHTML = Function.prototype
  ) {
    bh.customizeUnits(elementTag, (letter, description, el, key) => {
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
    bh.customizeUnits(elementTag, (letter, description, el, key) => {
      if (hasClass !== Function.prototype)
        if (hasClass(letter, description, el, key, className)) {
          el.classList.remove(className)
        } else {
          el.classList.add(className)
        }
    })
  }

  get newFleetForTerrain () {
    return bh.fleetBuilder(this.ships.baseShapes)
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
export const all = new SubTerrain('Air', '#a77', '#955', 'A', false, false, [])

export const mixed = new SubTerrain(
  'Mixed',
  '#888',
  '#666',
  'M',
  false,
  false,
  []
)

export class Matcher {
  constructor (validator, zoneDetail, subterrain) {
    this.validator = validator
    this.zoneDetail = zoneDetail
    this.subterrian = subterrain
  }
  canBe (subterrain) {
    return subterrain === this.subterrain
  }
}
