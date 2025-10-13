import { placingTarget } from './CellsToBePlaced.js'
import { Map, SavedCustomMap, CustomBlankMap, EditedCustomMap } from './map.js'
import { terrain, seaAndLand, oldToken } from './Shape.js'
export const gameHost = {
  containerWidth: 574
}

export const terrainMaps = {
  current: null,
  list: [],
  add: function (newTM) {
    terrain.add(newTM.terrain)
    if (this.list?.includes(newTM)) return
    this.list.push(newTM)
  },
  setCurrent: function (newCurrent) {
    this.add(newCurrent)
    terrain.setCurrent(newCurrent.terrain)
    this.current = newCurrent
    placingTarget.boundsChecker = newCurrent.inBounds.bind(newCurrent)
    placingTarget.allBoundsChecker = newCurrent.inAllBounds.bind(newCurrent)
    placingTarget.getZone = newCurrent.zoneInfo.bind(newCurrent)
  }
}

const jaggedXS = new Map(
  'Jagged Coast XS',
  [6, 18],
  { A: 0, B: 1, C: 1, D: 1, P: 2, G: 1, U: 1, M: 3 },
  [
    [1, 16, 17],
    [1, 0, 2],
    [1, 16, 17],
    [2, 0, 3],
    [2, 15, 17],
    [3, 15, 17],
    [4, 15, 17],
    [5, 15, 17],
    [3, 0, 7],
    [4, 0, 8],
    [5, 0, 8]
  ],
  'Jagged Coast Battle XS'
)

const jaggedVS = new Map(
  'Jagged Coast VS',
  [7, 16],
  { A: 1, B: 1, C: 1, D: 1, P: 1, G: 1, U: 1, M: 3 },
  [
    [2, 14, 15],
    [2, 0, 2],
    [2, 14, 15],
    [3, 0, 3],
    [3, 13, 15],
    [4, 13, 15],
    [5, 13, 15],
    [6, 13, 15],
    [4, 0, 7],
    [5, 0, 8],
    [6, 0, 8]
  ],
  'Jagged Coast Battle VS'
)

const jaggedSS = new Map(
  'Jagged Coast SS',
  [7, 18],
  { A: 1, B: 1, C: 1, D: 1, P: 2, G: 1, U: 1, M: 3 },
  [
    [2, 16, 17],
    [2, 0, 2],
    [2, 16, 17],
    [3, 0, 3],
    [3, 15, 17],
    [4, 15, 17],
    [5, 15, 17],
    [6, 15, 17],
    [4, 0, 7],
    [5, 0, 8],
    [6, 0, 8]
  ]
)

const defaultMap = jaggedSS

const jaggedS = new Map(
  'Jagged Coast S',
  [7, 19],
  { A: 1, B: 1, C: 1, D: 2, P: 2, G: 1, U: 1, M: 3 },
  [
    [1, 16, 18],
    [2, 0, 2],
    [2, 16, 18],
    [3, 0, 3],
    [3, 15, 18],
    [4, 15, 18],
    [5, 15, 18],
    [6, 15, 18],
    [4, 0, 7],
    [5, 0, 8],
    [6, 0, 8]
  ],
  'Jagged Coast Battle S'
)

const jaggedMS = new Map(
  'Jagged Coast MS',
  [8, 18],
  { A: 1, B: 1, C: 1, D: 2, P: 2, G: 1, U: 1, M: 3 },
  [
    [2, 14, 16],
    [3, 0, 2],
    [3, 14, 17],
    [4, 0, 3],
    [4, 14, 17],
    [5, 14, 17],
    [6, 14, 17],
    [7, 14, 17],
    [5, 0, 8],
    [6, 0, 10],
    [7, 0, 10]
  ],
  'Jagged Coast Battle MS'
)

const jaggedM = new Map(
  'Jagged Coast M',
  [9, 17],
  { A: 1, B: 1, C: 1, D: 1, P: 2, G: 2, U: 1, M: 3 },
  [
    [3, 13, 15],
    [4, 0, 2],
    [4, 13, 16],
    [5, 0, 3],
    [5, 13, 16],
    [6, 0, 9],
    [6, 13, 16],
    [7, 0, 16],
    [8, 0, 16]
  ],
  'Jagged Coast Battle M'
)

const jaggedML = new Map(
  'Jagged Coast ML',
  [9, 18],
  { A: 1, B: 1, C: 1, D: 2, P: 2, G: 2, U: 1, M: 3 },
  [
    [3, 14, 16],
    [4, 0, 2],
    [4, 14, 17],
    [5, 0, 3],
    [5, 14, 17],
    [6, 0, 10],
    [6, 14, 17],
    [7, 0, 17],
    [8, 0, 17]
  ],
  'Jagged Coast Battle ML'
)
const JaggedL = new Map(
  'Jagged Coast L',
  [10, 18],
  { A: 1, B: 1, C: 2, D: 2, P: 2, G: 2, U: 1, M: 3 },
  [
    [4, 14, 16],
    [5, 0, 2],
    [5, 14, 17],
    [6, 0, 3],
    [6, 14, 17],
    [7, 0, 10],
    [7, 14, 17],
    [8, 0, 17],
    [9, 0, 17]
  ],
  'Jagged Coast Battle L'
)
const NarrowS = new Map(
  'Narrow Coast S',
  [11, 17],
  { A: 1, B: 1, C: 2, D: 2, P: 3, G: 1, U: 1, M: 3 },
  [
    [7, 13, 16],
    [7, 1, 5],
    [8, 13, 16],
    [8, 0, 10],
    [9, 0, 16],
    [10, 0, 16]
  ],
  'Narrow Coast Battle S'
)
const JaggedLL = new Map(
  'Jagged Coast LL',
  [10, 20],
  { A: 1, B: 1, C: 2, D: 2, P: 3, G: 2, U: 1, M: 3 },
  [
    [4, 16, 18],
    [5, 1, 4],
    [5, 16, 19],
    [6, 1, 6],
    [6, 16, 19],
    [7, 0, 13],
    [7, 16, 19],
    [8, 0, 19],
    [9, 0, 19]
  ],
  'Jagged Coast Battle LL'
)
const NarrowM = new Map(
  'Narrow Coast M',
  [12, 17],
  { A: 1, B: 1, C: 2, D: 3, P: 4, G: 1, U: 1, M: 3 },
  [
    [8, 13, 16],
    [8, 1, 5],
    [9, 13, 16],
    [9, 0, 10],
    [10, 0, 16],
    [11, 0, 16]
  ],
  'Narrow Coast Battle M'
)
const JaggedVL = new Map(
  'Jagged Coast VL',
  [10, 21],
  { A: 1, B: 1, C: 2, D: 2, P: 4, G: 2, U: 1, M: 3 },
  [
    [4, 16, 18],
    [5, 1, 4],
    [5, 16, 19],
    [6, 1, 6],
    [6, 16, 19],
    [7, 0, 13],
    [7, 16, 19],
    [8, 0, 20],
    [9, 0, 20]
  ],
  'Jagged Coast Battle VL'
)

const JaggedXL = new Map(
  'Jagged Coast XL',
  [10, 22],
  { A: 1, B: 1, C: 2, D: 3, P: 4, G: 2, U: 1, M: 3 },
  [
    [4, 16, 18],
    [5, 1, 4],
    [5, 16, 19],
    [6, 1, 6],
    [6, 16, 19],
    [7, 0, 13],
    [7, 16, 19],
    [8, 0, 21],
    [9, 0, 21]
  ],
  'Jagged Coast Battle XL'
)

// gameMapTypes
class TerrainMaps {
  constructor (terrain, list, currentMap) {
    this.list = list
    this.current = currentMap
    this.terrain = terrain
    this.title = terrain.title || 'Unknown'
    this.key = terrain.key || 'unknown'
    this.baseShapes = terrain.ships.baseShapes
    this.shipSunkDescriptions = terrain.ships.sunkDescriptions
    this.shipLetterColors = terrain.ships.letterColors
    this.shipDescription = terrain.ships.description
    this.shipTypes = terrain.ships.types
    this.shipColors = terrain.ships.colors
    this.shipDescription = terrain.ships.description
    this.shapesByLetter = terrain.ships.shapesByLetter
    this.minWidth = terrain.minWidth
    this.maxWidth = terrain.maxWidth
    this.minHeight = terrain.minHeight
    this.maxHeight = terrain.maxHeight
  }
  clearBlankWith (r, c) {
    this.current = new CustomBlankMap(r, c, this.terrain)
  }
  clearBlank () {
    this.current = new CustomBlankMap(
      this.current.rows,
      this.current.cols,
      this.terrain
    )
  }
  setToBlank (r, c) {
    if (this.current instanceof CustomBlankMap) this.current.setSize(r, c)
    else this.clearBlankWith(r, c)
  }
  setTo (mapName) {
    this.current = this.getMap(mapName) || this.list[0]
  }

  addCurrentCustomMap (example) {
    if (
      !(
        this.current instanceof CustomBlankMap ||
        this.current instanceof EditedCustomMap
      )
    )
      return

    if (example) {
      this.current.example = example
    }
    this.current.saveToLocalStorage(this.current.title)
  }
  hasMapSize (r, c) {
    return this.mapWithSize(r, c) !== undefined
  }

  mapWithSize (r, c) {
    return this.list.find(m => m.rows === r && m.cols === c)
  }

  setToDefaultBlank (r, c) {
    this.clearBlankWith(r, c)
    const map = this.mapWithSize(r, c)
    if (map) {
      for (let i = 0; i < r; i++) {
        for (let j = 0; j < c; j++) {
          if (map.isLand(i, j)) {
            this.current.addLand(i, j)
          }
        }
      }
    }
  }
  prefilledMapIndex (mapName) {
    this.list.findIndex(m => m.title === mapName)
  }

  getCustomMap (mapName) {
    if (!mapName) return
    return SavedCustomMap.load(mapName)
  }

  getEditableMap (mapName) {
    if (!mapName) return null
    return EditedCustomMap.load(mapName)
  }

  getMap (mapName) {
    if (!mapName) return
    let map = this.list.find(m => m.title === mapName)
    if (!map) map = this.getCustomMap(mapName)
    return map
  }

  oldLastMapLocalStorageKey = `${oldToken}.map-name`
  lastMapLocalStorageKey = `${oldToken}.${this.key}-last-map-name`

  getLastMapTitleRaw () {
    const title = localStorage.getItem(this.lastMapLocalStorageKey)
    return title || this.getOldLastMapTitle()
  }
  getLastMapTitle () {
    const title = this.getLastMapTitleRaw()
    return title || this.list[0].title
  }
  getLastMap () {
    const title = this.getLastMapTitleRaw()
    return this.getMap(title) || this.list[0]
  }

  getOldLastMapTitle () {
    return localStorage.getItem(this.oldLastMapLocalStorageKey)
  }
  getOldLastMap () {
    const title = this.getOldLastMapTitle()
    return this.getMap(title) || this.list[0]
  }
  storeLastMap () {
    localStorage.setItem(this.lastMapLocalStorageKey, this.current.title)
  }

  lastWidthStorageKey = `${oldToken}.custom-map-width`
  lastHeightStorageKey = `${oldToken}.custom-map-height`
  getLastWidth (defaultWidth) {
    const width = parseInt(localStorage.getItem(this.lastWidthStorageKey), 10)
    if (
      isNaN(width) ||
      width < this.terrain.minWidth ||
      width > this.terrain.maxWidth
    )
      return defaultWidth || this.terrain.minWidth
    return width
  }
  getLastHeight (defaultHeight) {
    const height = parseInt(localStorage.getItem(this.lastHeightStorageKey), 10)
    if (
      isNaN(height) ||
      height < this.terrain.minHeight ||
      height > this.terrain.maxHeight
    )
      return defaultHeight || this.terrain.minHeight
    return height
  }
  storeLastHeight (height) {
    if (height) {
      localStorage.setItem(this.lastHeightStorageKey, height)
    }
  }
  storeLastWidth (width) {
    if (width) {
      localStorage.setItem(this.lastWidthStorageKey, width)
    }
  }
  storeLastCustomSize (width, height) {
    this.storeLastWidth(width)
    this.storeLastHeight(height)
  }

  customMapList () {
    return this.terrain.getCustomMaps(SavedCustomMap.load)
  }

  maps () {
    return this.list.concat(this.customMapList())
  }
  preGenMapList () {
    return this.list
  }

  mapTitles () {
    const result = this.list
      .map(m => m.title)
      .concat(this.terrain.getCustomMapTitles())

    return result
  }

  noOfShipOfShape (shape) {
    return gameMaps.current.shipNum[shape.letter]
  }
  inBounds (r, c) {
    return this.current.inBounds(r, c)
  }
  zoneInfo (r, c, zoneDetail) {
    return this.current.zoneInfo(r, c, zoneDetail)
  }

  inAllBounds (r, c, height, width) {
    return this.current.inAllBounds(r, c, height, width)
  }

  isLand (r, c) {
    return this.current.isLand(r, c)
  }
}
// gameMapTypes
class SeaAndLandMaps extends TerrainMaps {
  constructor () {
    super(
      seaAndLand,
      [
        jaggedXS,
        jaggedVS,
        defaultMap,
        jaggedS,
        jaggedMS,
        jaggedM,
        jaggedML,
        JaggedL,
        NarrowS,
        JaggedLL,
        NarrowM,
        JaggedVL,
        JaggedXL
      ],
      defaultMap
    )
    this.maxBombs = 3
  }
}

const seaAndLandMaps = new SeaAndLandMaps()

terrainMaps.setCurrent(seaAndLandMaps)

export const gameMaps = seaAndLandMaps
