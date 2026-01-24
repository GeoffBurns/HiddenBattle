import { Hybrid, Transformer } from './SpecialShips.js'
import { SpecialCells } from './SubShape.js'
import { StandardCells } from './SubShape.js'
import { Shape } from './Shape.js'
import {
  asteroid,
  core,
  surface,
  all,
  space,
  deep,
  near,
  spaceAndAsteroids
} from './space.js'
import { Missile, RailBolt } from './spaceWeapons.js'
import { ShipGroups, ShipCatalogue } from './ShipGroups.js'
import { WeaponVariant } from './variants.js'

class Installation extends Shape {
  constructor (description, letter, symmetry, cells, tip, racks) {
    super(
      letter,
      symmetry,
      cells,
      'G',
      tip || `place ${description} on an asteroid`,
      racks
    )
    this.descriptionText = description
    this.terrain = spaceAndAsteroids
    this.subterrain = asteroid

    this.validator = Installation.validator
    this.zoneDetail = Installation.zoneDetail
    this.canBeOn = Installation.canBe
  }
  static canBe (subterrain) {
    return subterrain === asteroid
  }
  static validator = zoneInfo => Installation.canBe(zoneInfo[0])
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

class ArmedInstallation extends Installation {
  variants () {
    return new WeaponVariant(
      this.cells,
      this.weaponSystem,
      this.symmetry,
      this.validator,
      this.zoneDetail,
      all
    )
  }
}
class CoreInstallation extends Installation {
  constructor (description, letter, symmetry, cells, racks) {
    super(
      description,
      letter,
      symmetry,
      cells,
      `place ${description} deep within an asteroid`,
      racks
    )
    this.validator = CoreInstallation.validator
    this.zoneDetail = CoreInstallation.zoneDetail
    this.canBeOn = CoreInstallation.canBe
    this.notes = [
      `${description} can not touch space squares; must be surrounded by asteroid squares.`
    ]
  }
  static canBe (subterrain, zone) {
    return subterrain === asteroid && zone === core
  }
  static validator = zoneInfo =>
    CoreInstallation.canBe(zoneInfo[0], zoneInfo[1])
  static zoneDetail = 2
}
class SurfaceInstallation extends Installation {
  constructor (description, letter, symmetry, cells, racks) {
    super(
      description,
      letter,
      symmetry,
      cells,
      `place ${description} on the surface of an asteroid`,
      racks
    )
    this.validator = SurfaceInstallation.validator
    this.zoneDetail = SurfaceInstallation.zoneDetail
    this.canBeOn = SurfaceInstallation.canBe
    this.notes = [`${description} must be touching sea squares.`]
  }

  static canBe (subterrain, zone) {
    return subterrain === asteroid && zone === surface
  }
  static validator = zoneInfo =>
    SurfaceInstallation.canBe(zoneInfo[0], zoneInfo[1])
  static zoneDetail = 2
}
class Shuttle extends Shape {
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
    this.terrain = spaceAndAsteroids
    this.subterrain = all
    this.canBeOn = Shuttle.canBe
    this.immune = ['#']
  }

  static canBe = Function.prototype
  static validator = Shuttle.canBe
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
class ArmedShuttle extends Shuttle {
  variants () {
    return new WeaponVariant(
      this.cells,
      this.weaponSystem,
      this.symmetry,
      this.validator,
      this.zoneDetail,
      all
    )
  }
}
class SpaceVessel extends Shape {
  constructor (description, letter, symmetry, cells, tip, racks) {
    super(
      letter,
      symmetry,
      cells,
      'S',
      tip || `place ${description} in space`,
      racks
    )
    this.descriptionText = description
    this.terrain = spaceAndAsteroids
    this.subterrain = space

    this.validator = SpaceVessel.validator
    this.zoneDetail = SpaceVessel.zoneDetail
    this.canBeOn = SpaceVessel.canBe
  }
  static canBe (subterrain) {
    return subterrain === space
  }
  static validator = zoneInfo => SpaceVessel.canBe(zoneInfo[0])
  static zoneDetail = 1

  type () {
    return 'S'
  }
  sunkDescription () {
    return 'destroyed'
  }
  description () {
    return this.descriptionText
  }
}
class ArmedVessel extends SpaceVessel {
  variants () {
    return new WeaponVariant(
      this.cells,
      this.weaponSystem,
      this.symmetry,
      this.validator,
      this.zoneDetail,
      all
    )
  }
}
class DeepSpaceVessel extends SpaceVessel {
  constructor (description, letter, symmetry, cells, racks) {
    super(
      description,
      letter,
      symmetry,
      cells,
      `place ${description} in deep space`,
      racks
    )
    this.validator = DeepSpaceVessel.validator
    this.zoneDetail = DeepSpaceVessel.zoneDetail
    this.notes = [
      `${description} can not touch land squares; must be surrounded by sea squares.`
    ]
    this.canBeOn = DeepSpaceVessel.canBe
  }
  static canBe (subterrain, zone) {
    return subterrain === space && zone === deep
  }
  static validator = zoneInfo => DeepSpaceVessel.canBe(zoneInfo[0], zoneInfo[1])
  static zoneDetail = 2
}
class SpacePort extends SpaceVessel {
  constructor (description, letter, symmetry, cells, racks) {
    super(
      description,
      letter,
      symmetry,
      cells,
      `place ${description} in near space`,
      racks
    )
    this.validator = SpacePort.validator
    this.zoneDetail = SpacePort.zoneDetail
    this.notes = [`${description} must be touching asteroid squares.`]
    this.canBeOn = SpacePort.canBe
  }
  static canBe (subterrain, zone) {
    return subterrain === space && zone === near
  }
  static validator = zoneInfo => SpacePort.canBe(zoneInfo[0], zoneInfo[1])
  static zoneDetail = 2
}
const attackCraft = new SpaceVessel('Attack Craft', 'A', 'H', [
  [0, 0],
  [2, 0],
  [1, 1]
])
attackCraft.vulnerable = ['+']
attackCraft.notes = [
  `The ${attackCraft.descriptionText} is vulnerable against missiles.`,
  `The squares of the ${attackCraft.descriptionText} adjacent to the missiles detonation will also be destroyed.`
]
const attackCraftCarrier = new SpaceVessel('Attack Craft Carrier', 'K', 'H', [
  [1, 0],
  [0, 1],
  [2, 1],
  [0, 2],
  [2, 2]
])
// generates attack craft
const superCarrier = new SpaceVessel('Super Carrier', 'X', 'D', [
  [0, 0],
  [1, 0],
  [0, 1],
  [2, 1],
  [0, 2],
  [2, 2]
])

// generates attack craft, gun boat, scout ship, corvette,
const starbase = new SpaceVessel('Starbase', 'Z', 'D', [
  [0, 0],
  [1, 0],
  [2, 0],
  [0, 1],
  [2, 1],
  [0, 2],
  [2, 2]
])
// generates gun boat, scout ship, corvette, frigate,
const frigate = new SpaceVessel('Frigate', 'F', 'H', [
  [0, 0],
  [2, 0],
  [1, 1],
  [1, 2],
  [1, 3]
])
// heavy thermal lance
const destroyer = new SpaceVessel('Destroyer', 'D', 'D', [
  [0, 0],
  [2, 0],
  [1, 1],
  [1, 2],
  [2, 2]
])
// lays mines  defuses mines
const cruiser = new SpaceVessel('Cruiser', 'C', 'H', [
  [0, 0],
  [2, 0],
  [1, 1],
  [0, 2],
  [1, 2],
  [2, 2]
])
// x heavy thermal lance
const battlecruiser = new SpaceVessel('Battlecruiser', 'B', 'H', [
  [0, 0],
  [2, 0],
  [1, 1],
  [0, 2],
  [1, 2],
  [2, 2],
  [1, 3]
])
// x heavy thermal lance x 2
const orbital = new DeepSpaceVessel('Orbital', 'O', 'G', [
  [0, 0],
  [0, 1],
  [1, 0],
  [1, 2],
  [2, 1],
  [2, 2]
])
orbital.vulnerable = ['|']
orbital.notes = [
  `The ${orbital.descriptionText} is vulnerable against Rail Bolts.`,
  `The squares of the ${orbital.descriptionText} orthogonally adjacent to the strike will also be destroyed.`
]
const wheel = new DeepSpaceVessel('Wheel', 'W', 'G', [
  [0, 1],
  [1, 0],
  [1, 1],
  [2, 2],
  [2, 3],
  [3, 2]
])
/// generates privateer and merchanter

const patrolBoat = new SpaceVessel('Patrol Boat', 'P', 'D', [
  [0, 0],
  [1, 1],
  [0, 2],
  [1, 2]
])
// thermal lance
const privateer = new SpaceVessel('Privateer', '2', 'D', [
  [0, 0],
  [1, 1],
  [2, 2],
  [1, 3],
  [2, 3]
])
// ion cannon
const cargoHauler = new SpaceVessel('Cargo Hauler', 'U', 'D', [
  [0, 0],
  [1, 1],
  [1, 2],
  [0, 3],
  [1, 3]
])
const merchanter = new SpaceVessel('Merchanter', 'E', 'D', [
  [0, 0],
  [1, 1],
  [1, 2],
  [1, 3],
  [0, 4],
  [1, 4]
])
// ion cannon
const spaceLiner = new SpaceVessel('Space Liner', 'I', 'D', [
  [0, 0],
  [1, 1],
  [1, 2],
  [1, 3]
])
const transport = new SpaceVessel('Transport', 'T', 'L', [
  [0, 0],
  [0, 1],
  [0, 2],
  [0, 3],
  [0, 4]
])
const railgunSpace = new ArmedVessel(
  'Railgun',
  'R',
  'S',
  [
    [0, 1],
    [1, 0],
    [1, 1],
    [1, 2],
    [2, 1]
  ],
  null,
  [
    [0, 1],
    [1, 0],
    [1, 2],
    [2, 1]
  ]
)
railgunSpace.attachWeapon(() => {
  return RailBolt.single
})
const railgunAsteroid = new ArmedInstallation(
  'Railgun',
  'R',
  'S',
  [
    [0, 0],
    [2, 0],
    [1, 1],
    [0, 2],
    [2, 2]
  ],
  null,
  [
    [0, 0],
    [2, 0],
    [0, 2],
    [2, 2]
  ]
)
railgunAsteroid.attachWeapon(() => {
  return RailBolt.single
})
const railgun = new Transformer([railgunSpace, railgunAsteroid])
const corvette = new Shuttle('Corvette', 'V', 'H', [
  [0, 0],
  [2, 0],
  [1, 1],
  [1, 2]
])
// pdc + anti-missile

const lifter = new Shuttle('Lifter', 'L', 'L', [
  [0, 0],
  [0, 1],
  [0, 2],
  [0, 3]
])
const missileBoat = new ArmedShuttle(
  'Missile Boat',
  'M',
  'H',
  [
    [0, 1],
    [1, 0],
    [1, 1],
    [1, 2]
  ],
  [
    [1, 0],
    [1, 2]
  ]
)
missileBoat.attachWeapon(() => {
  return Missile.single
})
const gunBoat = new Shuttle('Gun Boat', 'G', 'D', [
  [0, 0],
  [0, 1],
  [1, 0]
])
// light guass

const miningShip = new Shuttle('Mining Ship', '3', 'L', [
  [0, 0],
  [0, 1],
  [0, 2]
])
const runabout = new Shuttle('Runabout', '4', 'D', [
  [0, 0],
  [0, 1],
  [1, 2]
])

const scoutShip = new Shuttle('Scout Ship', '1', 'D', [
  [0, 0],
  [1, 1],
  [2, 1],
  [1, 2]
])
// pdc light + anti-missile

const shelter = new Installation('Shelter', 'S', 'D', [
  [0, 1],
  [0, 2],
  [1, 0],
  [2, 0]
])
const mine = new Installation('Mine', 'N', 'D', [
  [0, 1],
  [1, 0],
  [1, 1],
  [2, 1],
  [2, 2]
])
const commandCenter = new CoreInstallation('Command Center', 'J', 'A', [
  [0, 0],
  [0, 1],
  [1, 1],
  [2, 1],
  [2, 2]
])
commandCenter.hardened = ['+']
commandCenter.notes = [
  `The ${commandCenter.descriptionText} is hardened against missiles.`,
  `Only the center square of the missile will destroy the ${commandCenter.descriptionText} the surrounding squares will only reveal the ${commandCenter.descriptionText} `
]
const habitat = new Hybrid(
  'Habitat',
  'H',
  'H',
  [
    [0, 0],
    [1, 0],
    [2, 0]
  ],
  [
    new StandardCells(SpaceVessel.validator, SpaceVessel.zoneDetail, space),
    new SpecialCells(
      [[0, 0]],
      Installation.validator,
      Installation.zoneDetail,
      asteroid
    )
  ],
  'place Habitat lowest level on an asteroid and the upper levels in space.'
)
const spacePort = new Hybrid(
  'Space Port',
  'Q',
  'H',
  [
    [0, 0],
    [0, 1],
    [0, 2],
    [1, 1],
    [2, 1]
  ],
  [
    new StandardCells(SpaceVessel.validator, SpaceVessel.zoneDetail, space),
    new SpecialCells(
      [
        [1, 1],
        [2, 1]
      ],
      Installation.validator,
      Installation.zoneDetail,
      asteroid
    )
  ],
  'place Space Port lower level on an asteroid and the upper levels in space.'
)
const observationPost = new Hybrid(
  'Observation Post',
  'Y',
  'D',
  [
    [0, 0],
    [1, 0],
    [1, 1]
  ],
  [
    new StandardCells(
      Installation.validator,
      Installation.zoneDetail,
      asteroid
    ),
    new SpecialCells(
      [[0, 0]],
      SurfaceInstallation.validator,
      SurfaceInstallation.zoneDetail,
      space
    )
  ],
  'place observation Post adjacent to the surface.'
)
observationPost.canBeOn = Installation.canBe
observationPost.subterrain = space
observationPost.notes = [
  `the dotted parts of the ${observationPost.descriptionText} must be placed adjacent to space.`
]

const spaceGroups = new ShipGroups(
  {
    A: 'Shot Down',
    G: 'Destroyed',
    M: 'Destroyed',
    T: 'Destroyed',
    X: 'Destroyed',
    S: 'Destroyed',
    W: 'Detonated'
  },
  {
    A: 'Shuttle',
    G: 'Asteroid',
    M: 'Hybrid',
    T: 'Transformer',
    X: 'Special',
    S: 'Space',
    W: 'Weapon'
  },
  {
    A: 'These are added to the any area (space or asteroid) of the map',
    G: 'These are added to the beige areas (asteroid) of the map',
    M: 'These have special rules about where they are placed on the map',
    T: 'These have special rules about where they are placed on the map',
    X: 'These have special rules about where they are placed on the map',
    S: 'These are added to the lavender areas (space) of the map',
    W: 'These have special rules about where they are placed on the map'
  }
)
export const spaceShipsCatalogue = new ShipCatalogue(
  [],
  spaceGroups,
  {
    A: '#ff6666', //  coral red
    B: '#ffccff',
    C: '#66ccff',
    D: '#55cc59',
    E: '#99ff33', // Bright Lime
    F: '#3399cc', // Teal Blue'
    G: '#33cc99',
    H: '#ffcc66', // Amber Orange
    I: '#ffdd77', // Amber Orange
    J: '#ff6699',
    K: '#ff884d',
    L: '#cc99ff',
    M: '#33ffcc', //Turquoise Mint
    N: '#6699ff',
    O: '#ffff66',
    P: '#ff9933',
    Q: '#ff99cc',
    R: '#cc33cc', // Deep Magenta
    S: '#7799ee',
    T: '#3366ff',
    U: '#2288dd',
    V: '#bb66ff',
    Y: '#3366ff',
    W: '#fff',
    Z: '#fff',
    1: '#fff',
    2: '#fff',
    3: '#fff',
    4: '#fff',
    '+': '#000',
    '|': '#000',
    '#': '#000',
    '^': '#000',
    '@': '#000',
    '%': '#000',
    '&': '#000'
  },
  {
    A: 'Attack Craft',
    B: 'Battlecruiser',
    C: 'Cruiser',
    D: 'Destroyer',
    E: 'Merchanter',
    F: 'Frigate',
    G: 'Gun Boat',
    H: 'Habitat',
    I: 'Space Liner',
    J: 'Command Center',
    K: 'Attack Craft Carrier',
    L: 'Lifter',
    M: 'Missle Boat',
    N: 'Mine',
    O: 'Orbital',
    P: 'Patrol Craft',
    Q: 'Space Port',
    R: 'Railgun',
    S: 'Shelter',
    T: 'Transport',
    U: 'Cargo Hauler',
    V: 'Corvette',
    W: 'Wheel',
    X: 'Super Carrier',
    Y: 'Observation Post',
    Z: `Starbase`,
    1: 'Scout Ship',
    2: 'Privateer',
    3: 'Mining Ship',
    4: 'Runabout'
  },

  {
    A: 'S',
    B: 'S',
    C: 'S',
    D: 'S',
    E: 'S',
    F: 'S',
    G: 'A',
    H: 'X',
    I: 'S',
    J: 'G',
    K: 'S',
    L: 'A',
    M: 'A',
    N: 'G',
    O: 'S',
    P: 'S',
    Q: 'X',
    R: 'X',
    S: 'G',
    T: 'S',
    U: 'S',
    V: 'A',
    W: 'S',
    X: 'S',
    Y: 'G',
    Z: `S`,
    1: 'A',
    2: 'A',
    3: 'A',
    4: 'A',
    '+': 'W',
    '^': 'W',
    '|': 'W',
    '#': 'W'
  },
  {
    A: 'rgba(255,102,102,0.3)',
    B: 'rgba(255,204,255,0.3)',
    C: 'rgba(102,204,255,0.3)',
    D: 'rgba(102,255,102,0.3)',
    E: 'rgba(153, 255, 51,0.3)',
    F: 'rgba(51, 153, 204,0.3)',
    G: 'rgba(51,204,153,0.3)',
    H: 'rgba(244,244,102,0.3)',
    I: 'rgba(255,255,162,0.3)',
    J: 'rgba(255,153,204,0.3)',
    K: 'rgba(255,204,102,0.3)',
    L: 'rgba(255,102,153,0.3)',
    M: 'rgba(51, 255, 204,0.3)',
    N: 'rgba(102,153,255,0.3)',
    O: 'rgba(255, 153, 51,0.3)',
    P: 'rgba(233,122,88,0.3)',
    Q: 'rgba(204, 51, 204,0.3)',
    R: 'rgba(244, 100, 40,0.3)',
    S: 'rgba(210, 100, 204,0.3)',
    T: 'rgba(160, 80, 244,0.3)',
    U: 'rgba(40, 100, 244,0.3)',
    V: 'rgba(190, 70, 130,0.3)',
    W: 'rgba(40, 200, 120,0.3)',
    X: 'rgba(160, 80, 244,0.3)',
    Y: 'rgba(51, 51, 204,0.3)',
    Z: 'rgba(71, 31, 204,0.3)',
    1: 'rgba(80, 200, 244,0.3)',
    2: 'rgba(120, 180, 244,0.3)',
    3: 'rgba(90, 200, 220,0.3)',
    4: 'rgba(120, 80, 244,0.3)',
    '+': '#ffd866',
    '|': '#cc3333',
    '^': '#cc3388',
    '*': '#3333cc',
    '@': '#66ffcc', // Seafoam Green
    '%': '#9966ff',
    '&': '#33ccff',
    '#': '#33cc33'
  }
)

spaceShipsCatalogue.addShapes([
  attackCraft,
  frigate,
  destroyer,
  cruiser,
  battlecruiser,
  attackCraftCarrier,
  superCarrier,
  starbase,
  orbital,
  wheel,
  patrolBoat,
  cargoHauler,
  privateer,
  merchanter,
  spaceLiner,
  transport,
  railgun,
  scoutShip,
  corvette,
  missileBoat,
  gunBoat,
  miningShip,
  runabout,
  lifter,
  shelter,
  mine,
  commandCenter,
  habitat,
  spacePort,
  observationPost
])
