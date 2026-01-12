import {
  Dihedral4,
  Klein4,
  Blinker,
  Cyclic4,
  Invariant,
  Variant3,
  shuffleArray,
  Diagonal,
  TransformableVariants
} from './variants.js'

export const oldToken = 'geoffs-battleship'
export const token = 'geoffs-hidden-battle'
const MIN_CUSTOM_WIDTH = 16
const MAX_CUSTOM_WIDTH = 22
const MIN_CUSTOM_HEIGHT = 6
const MAX_CUSTOM_HEIGHT = 12

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

export function addCellToFootPrint (r, c, fp) {
  for (let i = -1; i <= 1; i++) {
    for (let j = -1; j <= 1; j++) {
      fp.add(`${r + i},${c + j}`)
    }
  }
}
export class Shape {
  constructor (letter, symmetry, cells, tallyGroup, tip, racks) {
    this.letter = letter
    this.symmetry = symmetry
    this.cells = cells
    this.racks =
      racks instanceof Array
        ? new Set(racks.map(([r, c]) => `${r},${c}`))
        : null
    this.canAttachWeapons = racks && racks.length > 0
    this.isAttachedToRack = false
    this.terrain = terrain.current
    this.subterrain = null
    this.validator = Function.prototype
    this.zoneDetail = 0
    this.tip = tip
    this.tallyGroup = tallyGroup
    const area = cells.length
    let footPrint = new Set()
    for (const cell of cells) {
      addCellToFootPrint(cell[0], cell[1], footPrint)
    }
    this.displacement = (area + footPrint.size) / 2
    this.vulnerable = []
    this.hardened = []
    this.immune = []
  }
  canBeOn (subterrain) {
    return this.subterrain === subterrain
  }
  protectionAgainst (weapon) {
    if (this.immune.includes(weapon)) return 3
    if (this.hardened.includes(weapon)) return 2
    if (this.vulnerable.includes(weapon)) return 0
    return 1
  }
  attachWeapon (ammoBuilder) {
    if (!this.canAttachWeapons) {
      throw new Error('Cannot attach weapon to shape ' + this.letter)
    }
    if (this.isAttachedToRack) {
      throw new Error('Weapon already attached to shape ' + this.letter)
    }
    this.isAttachedToRack = true
    const newObject = {}
    for (const key in this.racks) {
      newObject[key] = ammoBuilder()
    }
    this.attachedWeapons = newObject
    return this.attachedWeapons
  }

  variants () {
    switch (this.symmetry) {
      case 'D':
        return new Dihedral4(this.cells, this.validator, this.zoneDetail)
      case 'A':
        return new Klein4(this.cells, this.validator, this.zoneDetail)
      case 'S':
        return new Invariant(this.cells, this.validator, this.zoneDetail)
      case 'H':
        return new Cyclic4(this.cells, this.validator, this.zoneDetail)
      case 'L':
        return new Blinker(this.cells, this.validator, this.zoneDetail)
      case 'G':
        return new Diagonal(this.cells, this.validator, this.zoneDetail)
      default:
        throw new Error(
          'Unknown symmetry type for ' + JSON.stringify(this, null, 2)
        ) // The 'null, 2' adds indentation for readability);
    }
  }
  placeables () {
    return this.variants().placeables()
  }
  type () {
    return this.terrain.ships.types[this.letter]
  }
  color () {
    return this.terrain.ships.colors[this.letter]
  }
  sunkDescription (middle = ' ') {
    return this.description() + middle + this.shipSunkDescriptions()
  }
  letterColors () {
    return this.terrain.ships.letterColors[this.letter]
  }
  description () {
    return this.terrain.ships.description[this.letter]
  }
  shipSunkDescriptions () {
    return this.terrain.ships.shipSunkDescriptions[this.type()]
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

export class Weapon {
  constructor (name, letter, isLimited, destroys, points) {
    if (new.target === Weapon) {
      throw new Error(
        'base class cannot be instantiated directly. Please extend it.'
      )
    }
    this.name = name
    this.plural = name + 's'
    this.letter = letter
    this.isLimited = isLimited
    this.destroys = destroys
    this.points = points
    this.hasFlash = false
    this.tip = `drag on to the map to increase the tally of ${this.name}`
    this.isOneAndDone = false
    this.splashPower = -1
  }

  info () {
    return `${this.name} (${this.letter})`
  }

  addSplash () {
    throw Error('override in derided class')
  }

  addNeighbours (map, r, c, p1, p2, newEffect) {
    this.addOrthogonal(map, r, c, p1, newEffect)
    this.addDiagonal(map, r, c, p2, newEffect)
    return newEffect
  }

  addDiagonal (map, r, c, power, newEffect) {
    this.addSplash(map, r + 1, c + 1, power, newEffect)
    this.addSplash(map, r - 1, c + 1, power, newEffect)
    this.addSplash(map, r + 1, c - 1, power, newEffect)
    this.addSplash(map, r - 1, c - 1, power, newEffect)
    return newEffect
  }

  addOrthogonal (map, r, c, power, newEffect) {
    this.addSplash(map, r + 1, c, power, newEffect)
    this.addSplash(map, r - 1, c, power, newEffect)
    this.addSplash(map, r, c + 1, power, newEffect)
    this.addSplash(map, r, c - 1, power, newEffect)
    return newEffect
  }
}

export class StandardShot extends Weapon {
  constructor () {
    super('Standard Shot', '-', false, true, 1)
    this.cursors = ['']
    this.tag = 'single'
    this.hints = ['Click On Square To Fire']
    this.buttonHtml = '<span class="shortcut">S</span>ingle Shot'
  }
  aoe (_map, coords) {
    return [[coords[0][0], coords[0][1], 4]]
  }
  ammoStatus () {
    return `Single Shot Mode`
  }
}

export const standardShot = new StandardShot()

export class WeaponCatelogue {
  constructor (weapons) {
    this.weapons = weapons
    this.defaultWeapon = standardShot
  }
  addWeapons (weapons) {
    this.weapons = weapons
    this.weaponsByLetter = Object.fromEntries(weapons.map(w => [w.letter, w]))
  }
}

export class ShipGroups {
  constructor (shipSunkDescriptions, shipUnitDescriptions, shipUnitInfo) {
    this.shipSunkDescriptions = shipSunkDescriptions
    this.unitDescriptions = shipUnitDescriptions
    this.unitInfo = shipUnitInfo
  }
}

export class ShipCatelogue {
  constructor (
    baseShapes,
    shipGroups,
    shipLetterColors,
    shipDescription,
    shiptypes,
    shipColors
  ) {
    this.baseShapes = baseShapes
    this.shipSunkDescriptions = shipGroups.shipSunkDescriptions
    this.unitDescriptions = shipGroups.unitDescriptions
    this.unitInfo = shipGroups.unitInfo
    this.letterColors = shipLetterColors
    this.descriptions = shipDescription
    this.types = shiptypes
    this.colors = shipColors
    this.shapesByLetter = Object.fromEntries(
      baseShapes.map(base => [base.letter, base])
    )
  }

  addShapes (shapes) {
    this.baseShapes = shapes
    this.shapesByLetter = Object.fromEntries(
      shapes.map(base => [base.letter, base])
    )
  }

  sunkDescription (letter, middle = ' ') {
    return (
      this.descriptions[letter] +
      middle +
      this.shipSunkDescriptions[this.types[letter]]
    )
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
const seaAndLandWeapons = new WeaponCatelogue([])

const seaAndLandGroups = new ShipGroups(
  {
    A: 'Shot Down',
    G: 'Destroyed',
    M: 'Destroyed',
    T: 'Destroyed',
    X: 'Destroyed',
    S: 'Sunk'
  },
  {
    A: 'Air',
    G: 'Land',
    M: 'Hybrid',
    T: 'Transformer',
    X: 'Special',
    S: 'Sea',
    W: 'Weapon'
  },
  {
    A: 'These are added to the any area (sea or land) of the map',
    G: 'These are added to the greens areas (land) of the map',
    M: 'These have special rules about where they are placed on the map',
    T: 'These have special rules about where they are placed on the map',
    X: 'These have special rules about where they are placed on the map',
    S: 'These are added to the blue areas (sea) of the map',
    W: 'These have special rules about where they are placed on the map'
  }
)

const seaAndLandShips = new ShipCatelogue(
  [],
  seaAndLandGroups,
  {
    A: '#ff6666', //  coral red
    T: '#ffccff',
    B: '#66ccff',
    C: '#55cc59',
    D: '#99ff33', // Bright Lime
    O: '#33cc99',
    S: '#3399cc', // Teal Blue
    Q: '#ffcc66', // Amber Orange
    H: '#ff6699',
    J: '#ff884d',
    P: '#cc99ff',
    G: '#ff99cc',
    R: '#6699ff',
    U: '#ffff66',
    L: '#ff9933',
    N: '#33ffcc', //Turquoise Mint
    I: '#cc33cc', // Deep Magenta
    Y: '#7799ee',
    M: '#000',
    K: '#fff',
    W: '#fff',
    '+': '#000',
    E: '#000',
    F: '#000',
    Z: '#000'
  },
  {
    A: 'Aircraft Carrier',
    T: 'Tanker',
    B: 'Battleship',
    C: 'Cruiser',
    O: 'Oil Rig',
    D: 'Destroyer',
    S: 'Submarine',
    Q: 'Stealth Bomber',
    H: 'Helicopter',
    J: 'Fighter Jet',
    P: 'Airplane',
    G: 'Anti-Aircraft Gun',
    R: 'Radar Station',
    U: 'Underground Bunker',
    L: 'Bomb Shelter',
    N: 'Naval Base',
    I: 'Pier',
    Y: 'Supply Depot'
  },
  {
    A: 'S',
    T: 'S',
    B: 'S',
    C: 'S',
    O: 'S',
    D: 'S',
    S: 'S',
    Q: 'A',
    H: 'A',
    J: 'A',
    P: 'A',
    G: 'G',
    R: 'G',
    U: 'G',
    L: 'G',
    N: 'X',
    I: 'X',
    Y: 'X',
    M: 'W',
    K: 'W',
    W: 'W',
    '+': 'W',
    E: 'W',
    F: 'W',
    Z: 'W'
  },
  {
    A: 'rgba(255,102,102,0.3)',
    B: 'rgba(102,204,255,0.3)',
    C: 'rgba(102,255,102,0.3)',
    D: 'rgba(153, 255, 51,0.3)',
    S: 'rgba(51, 153, 204,0.3)',
    G: 'rgba(255,153,204,0.3)',
    U: 'rgba(255,255,102,0.3)',
    T: 'rgba(255,204,255,0.3)',
    O: 'rgba(51,204,153,0.3)',
    Q: 'rgba(255,204,102,0.3)',
    H: 'rgba(255,102,153,0.3)',
    J: 'rgba(255,136,77,0.3)',
    R: 'rgba(102,153,255,0.3)',
    L: 'rgba(255, 153, 51,0.3)',
    N: 'rgba(51, 255, 204,0.3)',
    I: 'rgba(204, 51, 204,0.3)',
    Y: 'rgba(51, 51, 204,0.3)',
    M: '#ffd866',
    K: '#cc3333',
    W: '#3333cc',
    '+': '#66ffcc', // Seafoam Green
    E: '#9966ff',
    F: '#33ccff',
    Z: '#33cc33'
  }
)

const deep = new Zone('Depths', 'D', false)
const littoral = new Zone('Shallows', 'L', true)
const coast = new Zone('Coast', 'C', true)
const inland = new Zone('Highlands', 'I', false)
const sea = new SubTerrain('Sea', '#1a78d6', '#1761b0', 'S', true, false, [
  littoral,
  deep
])
const land = new SubTerrain('Land', '#348239', '#296334', 'G', false, true, [
  coast,
  inland
])
export const mixed = new SubTerrain(
  'Mixed',
  '#888',
  '#666',
  'M',
  false,
  false,
  []
)
export const all = new SubTerrain('Air', '#a77', '#955', 'A', false, false, [])

export const seaAndLand = new Terrain(
  'Sea and Land',
  seaAndLandShips,
  [sea, land],
  'SeaAndLand',
  seaAndLandWeapons
)

class Building extends Shape {
  constructor (description, letter, symmetry, cells, tip, racks) {
    super(
      letter,
      symmetry,
      cells,
      'G',
      tip || `place ${description} on the land`,
      racks
    )
    this.descriptionText = description
    this.terrain = seaAndLand
    this.subterrain = land

    this.validator = Building.validator
    this.zoneDetail = Building.zoneDetail
    this.canBeOn = HillFort.canBe
    this.immune = ['Z', '+']
  }
  static canBe (subterrain) {
    return subterrain === land
  }
  static validator = zoneInfo => Building.canBe(zoneInfo[0])
  static zoneDetail = 1
  type () {
    return 'G'
  }
  sunkDescriptionRaw () {
    return 'Destroyed'
  }

  description () {
    return this.descriptionText
  }
}
class HillFort extends Building {
  constructor (description, letter, symmetry, cells, racks) {
    super(
      description,
      letter,
      symmetry,
      cells,
      `place ${description} on the highlands`,
      racks
    )
    this.validator = HillFort.validator
    this.zoneDetail = HillFort.zoneDetail
    this.canBeOn = HillFort.canBe
    this.notes = [
      `${description} can not touch sea squares; must be surrounded by land squares.`
    ]
  }
  static canBe (subterrain, zone) {
    return subterrain === land && zone === inland
  }
  static validator = zoneInfo => HillFort.canBe(zoneInfo[0], zoneInfo[1])
  static zoneDetail = 2
}
class CoastalPort extends Building {
  constructor (description, letter, symmetry, cells, racks) {
    super(
      description,
      letter,
      symmetry,
      cells,
      `place ${description} on the coast`,
      racks
    )
    this.validator = CoastalPort.validator
    this.zoneDetail = CoastalPort.zoneDetail
    this.canBeOn = CoastalPort.canBe
    this.notes = [`${description} must be touching sea squares.`]
  }

  static canBe (subterrain, zone) {
    return subterrain === land && zone === coast
  }
  static validator = zoneInfo => CoastalPort.canBe(zoneInfo[0], zoneInfo[1])
  static zoneDetail = 2
}
class Plane extends Shape {
  constructor (description, letter, symmetry, cells, racks) {
    super(
      letter,
      symmetry,
      cells,
      'A',
      `place ${description} at any location`,
      racks
    )
    this.descriptionText = description
    this.terrain = seaAndLand
    this.subterrain = all
    this.canBeOn = Plane.canBe
    this.immune = ['Z', '+']
    this.vulnerable = ['F']
  }

  static canBe = Function.prototype
  static validator = Plane.canBe
  static zoneDetail = 0

  type () {
    return 'A'
  }
  sunkDescription () {
    return 'Shot Down'
  }
  description () {
    return this.descriptionText
  }

  canBeOn () {
    return true
  }
}

class SeaVessel extends Shape {
  constructor (description, letter, symmetry, cells, tip, racks) {
    super(
      letter,
      symmetry,
      cells,
      'S',
      tip || `place ${description} in the sea`,
      racks
    )
    this.descriptionText = description
    this.terrain = seaAndLand
    this.subterrain = sea

    this.validator = SeaVessel.validator
    this.zoneDetail = SeaVessel.zoneDetail
    this.canBeOn = SeaVessel.canBe
  }
  static canBe (subterrain) {
    return subterrain === sea
  }
  static validator = zoneInfo => SeaVessel.canBe(zoneInfo[0])
  static zoneDetail = 1

  type () {
    return 'S'
  }
  sunkDescription () {
    return 'Sunk'
  }
  description () {
    return this.descriptionText
  }
}

class DeepSeaVessel extends SeaVessel {
  constructor (description, letter, symmetry, cells, racks) {
    super(
      description,
      letter,
      symmetry,
      cells,
      `place ${description} in the deep sea`,
      racks
    )
    this.validator = DeepSeaVessel.validator
    this.zoneDetail = DeepSeaVessel.zoneDetail
    this.notes = [
      `${description} can not touch land squares; must be surrounded by sea squares.`
    ]
    this.canBeOn = DeepSeaVessel.canBe
  }
  static canBe (subterrain, zone) {
    return subterrain === sea && zone === deep
  }
  static validator = zoneInfo => DeepSeaVessel.canBe(zoneInfo[0], zoneInfo[1])
  static zoneDetail = 2
}
class ShallowDock extends SeaVessel {
  constructor (description, letter, symmetry, cells, racks) {
    super(
      description,
      letter,
      symmetry,
      cells,
      `place ${description} in the shallow sea`,
      racks
    )
    this.validator = ShallowDock.validator
    this.zoneDetail = ShallowDock.zoneDetail

    this.notes = [`${description} must be touching land squares.`]
    this.canBeOn = ShallowDock.canBe
  }
  static canBe (subterrain, zone) {
    return subterrain === sea && zone === littoral
  }
  static validator = zoneInfo => ShallowDock.canBe(zoneInfo[0], zoneInfo[1])
  static zoneDetail = 2
}

class SubShape {
  constructor (validator, zoneDetail, subterrain) {
    this.validator = validator
    this.zoneDetail = zoneDetail
    this.subterrain = subterrain
    this.faction = 1
  }

  clone () {
    return new SubShape(this.validator, this.zoneDetail, this.subterrain)
  }
}
export class StandardCells extends SubShape {
  constructor (validator, zoneDetail, subterrain) {
    super(validator, zoneDetail, subterrain)
    this.cells = []
  }
  setCells (allCells, secondary) {
    this.cells = allCells.filter(
      ([r0, c0]) => !secondary.cells.some(([r, c]) => r0 === r && c0 === c)
    )
  }
}
export class SpecialCells extends SubShape {
  constructor (cells, validator, zoneDetail, subterrain) {
    super(validator, zoneDetail, subterrain)
    this.cells = cells
  }
}

export class Hybrid extends Shape {
  constructor (description, letter, symmetry, cells, subGroups, tip, racks) {
    super(
      letter,
      symmetry,
      cells,
      'X',
      tip || `place ${description} so that the parts are in the correct area`,
      racks
    )
    this.primary = subGroups[0]
    this.primary.setCells(cells, subGroups[1])
    this.secondary = subGroups[1]
    this.subGroups = subGroups
    this.size = cells.length
    for (const group of subGroups) {
      group.faction = group.cells.length / this.size
    }
    this.descriptionText = description
    this.terrain = seaAndLand
    this.subterrain = mixed
    this.canBeOn = Function.prototype
  }
  displacementFor (subterrain) {
    const groups = this.subGroups.filter(g => g.subterrain === subterrain)
    const result = groups.reduce(
      (accumulator, group) => accumulator + group.faction * this.displacement,
      0
    )
    return result
  }
  variants () {
    return new Variant3(
      this.cells,
      [this.primary, this.secondary],
      this.symmetry
    )
  }
  type () {
    return 'M'
  }
  sunkDescription () {
    return 'Destroyed'
  }
  description () {
    return this.descriptionText
  }
}
export class Transformer extends Shape {
  constructor (forms) {
    super(
      forms[0].letter,
      forms[0].symmetry,
      forms[0].cells,
      'X',
      `place ${forms[0].descriptionText} on the map`,
      forms[0].racks
    )

    this.forms = forms
    this.formVariants = new TransformableVariants(forms.map(f => f.variants()))
    this.totalVariants = forms.reduce((acc, f) => acc + f.variants().length, 0)
    this.canTransform = true
  }
  get index () {
    return this.formVariants.index
  }
  get formsIdx () {
    return this.formVariants.formsIdx
  }
  get currentForm () {
    return this.forms[this.formsIdx]
  }
  get descriptionText () {
    return this.currentForm.descriptionText
  }
  get tip () {
    return this.currentForm.tip
  }
  set tip (newTip) {
    if (
      !newTip ||
      newTip.length === 0 ||
      !this.forms ||
      this.forms.length === 0
    )
      return
    for (const form of this.forms) {
      form.tip = newTip
    }
  }

  get displacement () {
    return this.currentForm.displacement
  }
  set displacement (_newDisplacement) {}
  get vulnerable () {
    return this.currentForm.vulnerable
  }
  set vulnerable (newVulnerable) {
    if (
      !newVulnerable ||
      newVulnerable.length === 0 ||
      !this.forms ||
      this.forms.length === 0
    )
      return
    for (const form of this.forms) {
      form.vulnerable = newVulnerable
    }
  }
  get hardened () {
    return this.currentForm.hardened
  }
  set hardened (newHardened) {
    if (
      !newHardened ||
      newHardened.length === 0 ||
      !this.forms ||
      this.forms.length === 0
    )
      return
    for (const form of this.forms) {
      form.hardened = newHardened
    }
  }
  get immune () {
    return this.currentForm.immune
  }
  set immune (newImmune) {
    if (
      !newImmune ||
      newImmune.length === 0 ||
      !this.forms ||
      this.forms.length === 0
    )
      return
    for (const form of this.forms) {
      form.immune = newImmune
    }
  }
  description () {
    return this.currentForm.description()
  }

  protectionAgainst (weapon) {
    const form = this.currentForm
    return form.protectionAgainst(weapon)
  }
  attachWeapon (ammoBuilder) {
    return this.currentForm.attachWeapon(ammoBuilder)
  }
  variants () {
    return this.formVariants
  }

  placeables () {
    return this.formVariants.placeables()
  }
  sunkDescription (middle = ' ') {
    return this.currentForm.sunkDescription(middle)
  }
  shipSunkDescriptions () {
    return this.currentForm.shipSunkDescriptions()
  }
  type () {
    return 'T'
  }
}

const undergroundBunker = new Building('Underground Bunker', 'U', 'H', [
  [0, 0],
  [1, 0],
  [1, 1],
  [1, 2],
  [1, 3],
  [1, 4],
  [0, 4]
])

const antiAircraftGun = new Building('Anti-Aircraft Gun', 'G', 'S', [
  [0, 0],
  [1, 1],
  [0, 2],
  [2, 0],
  [2, 2]
])
const radarStation = new Building('Radar Station', 'R', 'H', [
  [0, 0],
  [1, 0],
  [2, 0],
  [2, 1],
  [2, 2]
])

const bombShelter = new HillFort('Bomb Shelter', 'L', 'H', [
  [0, 0],
  [1, 0],
  [1, 1],
  [1, 2],
  [0, 2]
])
bombShelter.hardened = ['M']
bombShelter.notes = [
  `The ${bombShelter.descriptionText} is hardened against Mega bombs.`,
  `Only the center square of the bomb will destroy the ${bombShelter.descriptionText} the surrounding squares will only reveal the ${bombShelter.descriptionText} `
]

const supplyDepot = new Hybrid(
  'Supply Depot',
  'Y',
  'D',
  [
    [0, 0],
    [1, 0],
    [1, 1]
  ],
  [
    new StandardCells(Building.validator, Building.zoneDetail, land),
    new SpecialCells(
      [[0, 0]],
      CoastalPort.validator,
      CoastalPort.zoneDetail,
      land
    )
  ],
  'place Supply Depot on the coast.'
)
supplyDepot.subterrain = land
supplyDepot.canBeOn = Building.canBe
supplyDepot.notes = [
  `the dotted parts of the ${supplyDepot.descriptionText} must be placed adjacent to sea.`
]
const pier = new Hybrid(
  'Pier',
  'I',
  'H',
  [
    [0, 0],
    [1, 0]
  ],
  [
    new StandardCells(SeaVessel.validator, SeaVessel.zoneDetail, sea),
    new SpecialCells(
      [[0, 0]],
      ShallowDock.validator,
      ShallowDock.zoneDetail,
      sea
    )
  ],
  'place Pier adjacent to the coast.'
)
pier.canBeOn = SeaVessel.canBe
pier.subterrain = sea
pier.notes = [
  `the dotted parts of the ${pier.descriptionText} must be placed adjacent to land.`
]

const navalBase = new Hybrid(
  'Naval Base',
  'N',
  'D',
  [
    [0, 0],
    [1, 0],
    [2, 0],
    [2, 1]
  ],
  [
    new StandardCells(Building.validator, Building.zoneDetail, land),
    new SpecialCells(
      [
        [0, 0],
        [1, 0]
      ],
      SeaVessel.validator,
      SeaVessel.zoneDetail,
      sea
    )
  ],
  'place Naval Base half on land and half on sea.'
)
navalBase.notes = [
  `the dotted parts of the ${navalBase.descriptionText} must be placed on sea, while the undotted parts on the land`
]
const jetFighterCraft = new Plane('Jet Fighter', 'J', 'H', [
  [0, 1],
  [1, 1],
  [2, 0],
  [2, 1],
  [2, 2]
])

const helicopter = new Plane('Helicopter', 'H', 'S', [
  [0, 1],
  [1, 0],
  [1, 1],
  [1, 2],
  [2, 1]
])
helicopter.vulnerable = ['W', 'F']
const airplane = new Plane('Airplane', 'P', 'H', [
  [0, 1],
  [1, 0],
  [1, 1],
  [1, 2]
])
airplane.vulnerable = ['W', 'F']
const stealthBomber = new Plane('Stealth Bomber', 'Q', 'H', [
  [0, 0],
  [1, 0],
  [2, 0],
  [0, 1],
  [1, 1],
  [0, 2]
])

stealthBomber.vulnerable = ['K']
stealthBomber.hardened = ['W']
stealthBomber.immune = ['+']
stealthBomber.notes = [
  `The ${stealthBomber.descriptionText} is vulnerable against Kinetic Strikes.`,
  `The squares of the ${stealthBomber.descriptionText} orthogonally adjacent to the strike will also be destroyed.`
]

const aircraftCarrier = new SeaVessel('Aircraft Carrier', 'A', 'A', [
  [0, 0],
  [0, 1],
  [0, 2],
  [0, 3],
  [1, 1],
  [1, 2],
  [1, 3],
  [1, 4]
])

const tanker = new SeaVessel('Tanker', 'T', 'L', [
  [0, 0],
  [0, 1],
  [0, 2],
  [0, 3],
  [0, 4],
  [0, 5]
])
tanker.vulnerable = ['Z', '+']
const battleship = new SeaVessel('Battleship', 'B', 'L', [
  [0, 0],
  [0, 1],
  [0, 2],
  [0, 3],
  [0, 4]
])
const oilRig = new DeepSeaVessel('Oil Rig', 'O', 'S', [
  [0, 0],
  [0, 1],
  [1, 0],
  [1, 1]
])
oilRig.vulnerable = ['M']
oilRig.notes = [
  `The ${oilRig.descriptionText} is vulnerable against Mega bombs.`,
  `The squares of the ${oilRig.descriptionText} adjacent to the bomb will also be destroyed.`
]
const cruiser = new SeaVessel('Cruiser', 'C', 'L', [
  [0, 0],
  [0, 1],
  [0, 2],
  [0, 3]
])
const destroyer = new SeaVessel(
  'Destroyer',
  'D',
  'L',
  [
    [0, 0],
    [0, 1],
    [0, 2]
  ],
  null,
  [[0, 2]]
)

const submarine = new SeaVessel(
  'Submarine',
  'S',
  'L',
  [
    [0, 0],
    [0, 1]
  ],
  null,
  [
    [0, 0],
    [0, 1]
  ]
)
submarine.vulnerable = ['E']
submarine.hardened = ['M']
submarine.immune = ['R']
submarine.notes = [
  `The ${submarine.descriptionText} is hardened against Mega bombs.`,
  `Only the center square of the bomb will destroy the ${submarine.descriptionText} the surrounding squares will only reveal the ${submarine.descriptionText}.`
]

seaAndLandShips.addShapes([
  undergroundBunker,
  antiAircraftGun,
  radarStation,
  aircraftCarrier,
  stealthBomber,
  helicopter,
  jetFighterCraft,
  bombShelter,
  airplane,
  tanker,
  battleship,
  navalBase,
  cruiser,
  oilRig,
  supplyDepot,
  destroyer,
  pier,
  submarine
])

terrain.setDefault(seaAndLand)

export class Megabomb extends Weapon {
  constructor (ammo) {
    super('Megabomb', 'M', true, true, 1)
    this.ammo = ammo
    this.cursors = ['bomb']
    this.hints = ['Click On Square To Drop Bomb']
    this.buttonHtml = '<span class="shortcut">M</span>ega Bomb'
    this.tip =
      'drag a megabomb on to the map to increase the number of times you can drop bombs'
    this.hasFlash = true
    this.tag = 'mega'
    this.splashCoords = this.aoe(null, [[2, 2]])
    this.dragShape = [
      [0, 0, 0],
      [0, 1, 0],
      [0, 2, 0],
      [1, 0, 0],
      [1, 1, 1],
      [1, 2, 0],
      [2, 0, 0],
      [2, 1, 0],
      [2, 2, 0]
    ]
  }
  clone (ammo) {
    ammo = ammo || this.ammo
    return new Megabomb(ammo)
  }
  ammoStatus (ammoLeft) {
    return `Bomb Mode (${ammoLeft} left)`
  }

  aoe (_map, coords) {
    const r = coords[0][0]
    const c = coords[0][1]
    let result = [[r, c, 2]]
    for (let i = -1; i < 2; i++) {
      for (let j = -1; j < 2; j++) {
        if (i !== 0 || j !== 0) {
          result.push([r + i, c + j, 1])
        }
      }
    }
    for (let i = -1; i < 2; i++) {
      result.push([r + i, c - 2, 0])
      result.push([r + i, c + 2, 0])
    }
    for (let j = -1; j < 2; j++) {
      result.push([r - 2, c + j, 0])
      result.push([r + 2, c + j, 0])
    }
    return result
  }
}

function getExtendedLinePoints (x1, y1, x2, y2, width, height) {
  // Direction vector
  const dx = x2 - x1
  const dy = y2 - y1

  // Avoid divide by zero
  if (dx === 0 && dy === 0) return []

  // Compute intersections with each border of the grid
  const tValues = []

  if (dx !== 0) {
    tValues.push((0 - x1) / dx)
    tValues.push((width - 1 - x1) / dx)
  }
  if (dy !== 0) {
    tValues.push((0 - y1) / dy)
    tValues.push((height - 1 - y1) / dy)
  }

  // Filter valid intersections (inside the grid)
  const intersections = tValues
    .map(t => [x1 + dx * t, y1 + dy * t])
    .filter(([x, y]) => x >= 0 && x < width && y >= 0 && y < height)

  // If fewer than two intersections, nothing to draw
  if (intersections.length < 2) return []

  // Pick first and last intersection
  const [start, end] = [
    intersections[0],
    intersections[intersections.length - 1]
  ]

  // Use Bresenham’s algorithm between those two clipped points
  const linePoints = getLinePoints(
    Math.round(start[0]),
    Math.round(start[1]),
    Math.round(end[0]),
    Math.round(end[1])
  )

  return linePoints
}

function getLinePoints (x1, y1, x2, y2) {
  const points = []

  const dx = Math.abs(x2 - x1)
  const dy = Math.abs(y2 - y1)
  const sx = x1 < x2 ? 1 : -1
  const sy = y1 < y2 ? 1 : -1
  let err = dx - dy

  while (true) {
    points.push([x1, y1, 2])

    if (x1 === x2 && y1 === y2) break

    const e2 = 2 * err
    if (e2 > -dy) {
      err -= dy
      x1 += sx
    }
    if (e2 < dx) {
      err += dx
      y1 += sy
    }
  }

  return points
}
export class Kinetic extends Weapon {
  constructor (ammo) {
    super('Kinetic Strike', 'K', true, true, 2)
    this.ammo = ammo
    this.cursors = ['satelite', 'strike']
    this.hints = [
      'Click on square to start kinetic strike',
      'Click on square end kinetic strike'
    ]
    this.buttonHtml = '<span class="shortcut">K</span>inetic Strike'
    this.tip =
      'drag a kinetic on to the map to increase the number of times you can strike'
    this.isOneAndDone = true
    this.hasFlash = false
    this.tag = 'kinetic'
    this.splashCoords = this.addOrthogonal(null, 2, 2, 0, [
      [2, 2, 2],
      [0, 0, 20],
      [1, 1, 20],
      [3, 3, 20],
      [4, 4, 20]
    ])

    this.dragShape = [
      [0, 0, 1],
      [0, 1, 0],
      [0, 2, 0],
      [0, 3, 0],
      [0, 4, 1]
    ]
    this.splashPower = 0
  }
  clone (ammo) {
    ammo = ammo || this.ammo
    return new Kinetic(ammo)
  }
  ammoStatus (ammoLeft) {
    return `Strike Mode (${ammoLeft} left)`
  }

  aoe (map, coords) {
    const r = coords[0][0]
    const c = coords[0][1]

    const r1 = coords[1][0]
    const c1 = coords[1][1]

    return getExtendedLinePoints(r, c, r1, c1, map.rows, map.cols)
  }
  splash (map, coords) {
    const [r, c] = coords
    const newEffect = [coords]
    this.addOrthogonal(map, r, c, 0, newEffect)
    return newEffect
  }

  addSplash (map, r, c, power, newEffect) {
    const noCheck = map === null || map === undefined
    if (noCheck || map.inBounds(r, c)) newEffect.push([r, c, power])
  }
}

export class Torpedo extends Weapon {
  constructor (ammo) {
    super('Torpedo', '+', true, true, 2)
    this.ammo = ammo
    this.cursors = ['torpedo', 'periscope']
    this.hints = [
      'Click on square to start torpedo',
      'Click on square aim torpedo'
    ]
    this.buttonHtml = '<span class="shortcut">T</span>orpedo'
    this.tip =
      'drag a torpedo on to the map to increase the number of times you can strike'
    this.isOneAndDone = true
    this.hasFlash = false
    this.tag = 'torpedo'
    this.splashCoords = this.addOrthogonal(null, 3, 3, 1, [
      [3, 3, 2],
      [4, 2, 0],
      [2, 4, 0],
      [0, 0, 20],
      [1, 1, 20],
      [2, 2, 30],
      [4, 4, 30],
      [5, 5, 20],
      [6, 6, 20]
    ])
    this.dragShape = [
      [1, 0, 1],
      [1, 1, 0],
      [1, 2, 0],
      [0, 3, 0],
      [2, 3, 0]
    ]
    this.splashPower = 1
  }
  clone (ammo) {
    ammo = ammo || this.ammo
    return new Torpedo(ammo)
  }
  ammoStatus (ammoLeft) {
    return `Torpedo Mode (${ammoLeft} left)`
  }

  aoe (map, coords) {
    const r = coords[0][0]
    const c = coords[0][1]

    const r1 = coords[1][0]
    const c1 = coords[1][1]

    const line = getLinePoints(r, c, r1, c1)
    const landIdx = line.findIndex(([r, c]) => map.isLand(r, c))

    if (landIdx >= 0) {
      line.length = landIdx
    }
    return line
  }

  addSplash (map, r, c, power, newEffect) {
    const noCheck = map === null || map === undefined
    if (noCheck || (map.inBounds(r, c) && !map.isLand(r, c)))
      newEffect.push([r, c, power])
  }

  splash (map, coords) {
    const [r, c] = coords
    const newEffect = [coords]

    this.addNeighbours(map, r, c, 1, 0, newEffect)
    return newEffect
  }
}

export class Flack extends Weapon {
  constructor (ammo) {
    super('Flack', 'F', true, true, 1)
    this.ammo = ammo
    this.cursors = ['cluster']
    this.hints = ['Click on square to initiate flack']
    this.buttonHtml = '<span class="shortcut">F</span>lack'
    this.tip = ''
    this.isOneAndDone = false
    this.hasFlash = false
    this.tag = 'flack'
    this.splashCoords = [
      [0, 0, 1],
      [1, 1, 2],
      [0, 2, 1],
      [2, 0, 1],
      [2, 2, 1],
      [1, 3, 2],
      [0, 4, 1],
      [2, 4, 1],
      [0, 1, 0],
      [2, 3, 0]
    ]
    this.dragShape = [
      [0, 0, 0],
      [1, 1, 1],
      [0, 2, 0],
      [2, 0, 0],
      [2, 2, 0],
      [1, 3, 1],
      [0, 4, 0]
    ]
  }
  clone (ammo) {
    ammo = ammo || this.ammo
    return new Flack(ammo)
  }
  ammoStatus (ammoLeft) {
    return `Flack Mode (${ammoLeft} left)`
  }

  aoe (map, coords) {
    const r = coords[0][0]
    const c = coords[0][1]
    let area = []

    for (let i = -1; i < 2; i++) {
      for (let j = -2; j < 2; j++) {
        area.push([r + i, c + j, 0])
      }
    }
    const middle = shuffleArray(area)

    const head = middle.slice(0, 2)
    const leftOver = middle.slice(3)

    for (let j = -1; j < 2; j++) {
      leftOver.push([r - 2, c + j, 0], [r + 2, c + j, 0])
    }
    for (let i = -1; i < 2; i++) {
      leftOver.push([r + i, c - 2, 0], [r + i, c + 2, 0])
    }
    const result = head.concat(shuffleArray(leftOver))
    for (let i = 0; i < 8; i++) {
      if (i < 2) {
        result[i][2] = 2
      } else {
        result[i][2] = 1
      }
    }
    result.length = 16
    return result.filter(([r, c]) => map.inBounds(r, c))
  }
}

function getPieSegmentCells (x1, y1, x2, y2, radius = 4, spreadDeg = 22.5) {
  const cells = []

  // Compute the main direction angle
  const angle = Math.atan2(y2 - y1, x2 - x1)

  const spread = (spreadDeg * Math.PI) / 180 // convert to radians
  const halfSpread = spread // ±spreadDeg
  const narrowSpread = (8 * Math.PI) / 180

  // Bounding box to limit checks
  const minX = Math.floor(x1 - radius)
  const maxX = Math.ceil(x1 + radius)
  const minY = Math.floor(y1 - radius)
  const maxY = Math.ceil(y1 + radius)

  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      const dx = x - x1
      const dy = y - y1
      const dist = Math.hypot(dx, dy)

      if (dist > radius) continue // outside circle

      const cellAngle = Math.atan2(dy, dx)
      let delta = cellAngle - angle

      // Normalize to [-PI, PI]
      delta = Math.abs(((delta + Math.PI) % (2 * Math.PI)) - Math.PI)
      if (delta <= narrowSpread) {
        cells.push([x, y, 2])
      } else if (delta <= halfSpread) {
        cells.push([x, y, 1])
      }
    }
  }

  return cells
}

export class Sweep extends Weapon {
  constructor (ammo) {
    super('Radar Sweep', 'W', true, false, 2)
    this.ammo = ammo
    this.cursors = ['dish', 'sweep']
    this.hints = [
      'Click on square to start radar scan',
      'Click on square end radar scan'
    ]
    this.buttonHtml = 's<span class="shortcut">W</span>eep'
    this.tip = ''
    this.isOneAndDone = false
    this.hasFlash = false
    this.tag = 'sweep'
    this.dragShape = [
      [2, 0, 1],
      [1, 1, 0],
      [2, 1, 0],
      [2, 2, 0],
      [0, 2, 0],
      [1, 2, 1],
      [1, 3, 0]
    ]
  }
  clone (ammo) {
    ammo = ammo || this.ammo
    return new Sweep(ammo)
  }
  ammoStatus (ammoLeft) {
    return `Radar Mode (${ammoLeft} left)`
  }

  aoe (map, coords) {
    const r = coords[0][0]
    const c = coords[0][1]

    const r1 = coords[1][0]
    const c1 = coords[1][1]

    return getPieSegmentCells(r, c, r1, c1)
  }
}

seaAndLandWeapons.addWeapons([
  new Megabomb(1),
  new Kinetic(1),
  new Flack(1),
  new Torpedo(1)
  //  new Sweep(1)
])

export class WeaponSystem {
  constructor (weapon) {
    this.ammo = weapon.isLimited ? weapon.ammo : null
    this.weapon = weapon
  }
  ammoLeft () {
    return this.ammo
  }
  ammoTotal () {
    return this.weapon.ammo
  }

  ammoUsed () {
    return this.weapon.ammo - this.ammo
  }
}
export class LoadOut {
  constructor (weapons) {
    this.weapons = weapons
    this.weaponSystems = LoadOut.wps(weapons)
    this.allSystems = [...this.weaponSystems]
    this.OutOfAllAmmo = Function.prototype
    this.OutOfAmmo = Function.prototype
    this.destroy = Function.prototype
    this.reveal = Function.prototype
    this.onCursorChange = Function.prototype
    this.sound = Function.prototype
    this.index = 0
    this.coords = []
  }

  static wps (weapons) {
    return weapons.map(w => {
      return new WeaponSystem(w)
    })
  }
  limitedSystems () {
    return this.weaponSystems.filter(w => w.weapon.isLimited)
  }
  limitedAllSystems () {
    return this.allSystems.filter(w => w.weapon.isLimited)
  }
  limitedWeapons () {
    return this.weapons.filter(w => w.isLimited)
  }
  totalAmmo () {
    return this.limitedSystems().reduce((acc, w) => acc + w.ammo, 0)
  }
  ammoLeft () {
    return this.limitedSystems().reduce((acc, w) => acc + w.ammoLeft(), 0)
  }
  reload (weapons) {
    weapons = weapons || this.weapons
    this.weaponSystems = LoadOut.wps(weapons)
  }
  weaponSystem () {
    return this.weaponSystems[this.index]
  }

  nextWeaponSystem () {
    return this.weaponSystems[this.nextIndex()]
  }
  weapon () {
    return this.weaponSystem().weapon
  }
  hasWeapon (wletter) {
    return this.weapons.find(w => w.letter === wletter) !== undefined
  }
  switchTo (wletter) {
    const idx = this.weaponSystems.findIndex(
      w => w.weapon.letter === wletter && w.ammo > 0
    )
    if (idx < 0) return false
    this.index = idx
    return true
  }
  switchToSShot () {
    this.index = 0
    return true
  }
  nextWeapon () {
    return this.nextWeaponSystem().weapon
  }
  removeWeaponSystem () {
    const i = this.index
    this.weaponSystems.splice(i, 1)

    if (i >= this.weaponSystems.length) {
      this.index = 0
    }
  }
  isOutOfAmmo () {
    return 1 >= this.weaponSystems.length
  }
  currentAmmo () {
    return this.weaponSystem().ammo
  }
  hasNoCurrentAmmo () {
    return !this.hasCurrentAmmo()
  }
  hasCurrentAmmo () {
    return !this.weapon().isLimited || this.currentAmmo() !== 0
  }
  useAmmo () {
    if (!this.weapon().isLimited) return

    this.weaponSystem().ammo--

    if (this.hasNoCurrentAmmo()) {
      const oldWeapon = this.weapon()
      this.removeWeaponSystem()
      this.OutOfAmmo(oldWeapon, this.weapon())
      if (this.isOutOfAmmo()) {
        this.OutOfAllAmmo()
      }
    }
  }
  cursors () {
    return this.weaponSystems
      .flatMap(w => {
        return w.weapon.cursors
      })
      .filter(c => c !== '')
  }

  cursor () {
    const weapon = this.weapon()
    const index = Math.min(this.coords.length, weapon.points - 1)
    return weapon.cursors[index]
  }

  nextIndex () {
    let idx = this.index
    idx++
    if (idx >= this.weaponSystems.length) {
      idx = 0
    }
    return idx
  }
  switchToNextWPS () {
    this.index = this.nextIndex()
    this.coords = []
  }
  switch () {
    const oldCursor = this.cursor()
    this.switchToNextWPS()

    this.onCursorChange(oldCursor, this.cursor())
    return this.weapon()
  }
  cursorIndex () {
    return this.coords.length
  }
  aim (map, r, c) {
    const oldCursor = this.cursor()
    this.onCursorChange(oldCursor, this.cursor())
    this.coords.push([r, c])
    if (this.coords.length >= this.weapon().points) {
      this.fire(map, this.coords)
      this.coords = []
    }

    const newCursor = this.cursor()
    if (oldCursor !== newCursor) {
      this.onCursorChange(oldCursor, this.cursor())
    }
  }

  dismiss () {
    const oldCursor = this.cursor()
    this.coords = []
    this.onCursorChange(oldCursor, this.cursor())
  }

  fire (map) {
    const weapon = this.weapon()
    const effected = weapon.aoe(map, this.coords)
    this.useAmmo()
    if (weapon.destroys) {
      if (weapon.isOneAndDone) {
        this.destroyOne(weapon, effected)
      } else {
        this.destroy(weapon, effected)
      }
    } else {
      this.reveal(weapon, effected)
    }
  }
}
