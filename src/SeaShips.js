import {
  seaAndLand,
  land,
  inland,
  coast,
  all,
  sea,
  deep,
  littoral
} from './seaAndLand.js'
import { seaAndLandShipsCatalogue } from './seaShipsCatalogue.js'
import { Shape } from './Shape.js'
import { Hybrid } from './SpecialShips.js'
import { SpecialCells } from './SubShape.js'
import { StandardCells } from './SubShape.js'

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

seaAndLandShipsCatalogue.addShapes([
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

export const seaShipsCatalogue = seaAndLandShipsCatalogue
