import {
  Shape,
  Terrain,
  WeaponCatelogue,
  ShipGroups,
  ShipCatelogue,
  Zone,
  SubTerrain,
  Megabomb,
  Kinetic,
  Torpedo,
  Sweep,
  Hybrid,
  StandardCells,
  SpecialCells,
  Transformer,
  standardShot
} from './Shape.js'
import { TerrainMaps } from './maps.js'
import { Map } from './map.js'

const spaceWeapons = new WeaponCatelogue([])

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
const spaceShips = new ShipCatelogue(
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
    '+': '#000',
    X: '#000',
    Z: '#000',
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
    Y: 'Observation Post'
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
    Y: 'G',
    '+': 'W',
    '^': 'W',
    X: 'W',
    Z: 'W'
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
    Y: 'rgba(51, 51, 204,0.3)',
    1: 'rgba(80, 200, 244,0.3)',
    2: 'rgba(120, 180, 244,0.3)',
    '+': '#ffd866',
    X: '#cc3333',
    '^': '#cc3388',
    '*': '#3333cc',
    '@': '#66ffcc', // Seafoam Green
    '%': '#9966ff',
    '&': '#33ccff',
    Z: '#33cc33'
  }
)

const deep = new Zone('Deep Space', 'D', false)
const near = new Zone('Near Space', 'N', true)
const surface = new Zone('Surface', 'S', true)
const core = new Zone('Core', 'C', false)
const space = new SubTerrain('Space', '#e1d4f3', '#c2bdd2', 'S', true, false, [
  near,
  deep
])
const asteroid = new SubTerrain(
  'Asteroid',
  '#eed8a0',
  '#d6c286',
  'G',
  false,
  true,
  [surface, core]
)
export const all = new SubTerrain(
  'Shuttle',
  '#a77',
  '#955',
  'A',
  false,
  false,
  []
)

export const spaceAndAsteroids = new Terrain(
  'Space and Asteroids',
  spaceShips,
  [space, asteroid],
  'SpaceAndAsteroid',
  spaceWeapons,
  'Sector'
)
spaceAndAsteroids.hasTransforms = true
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
    this.immune = ['Z']
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

const attackCraftCarrier = new SpaceVessel('Attack Craft Carrier', 'K', 'H', [
  [1, 0],
  [0, 1],
  [2, 1],
  [0, 2],
  [2, 2]
])

const frigate = new SpaceVessel('Frigate', 'F', 'H', [
  [0, 0],
  [2, 0],
  [1, 1],
  [1, 2],
  [1, 3]
])

const destroyer = new SpaceVessel('Destroyer', 'D', 'D', [
  [0, 0],
  [2, 0],
  [1, 1],
  [1, 2],
  [2, 2]
])

const cruiser = new SpaceVessel('Cruiser', 'C', 'H', [
  [0, 0],
  [2, 0],
  [1, 1],
  [0, 2],
  [1, 2],
  [2, 2]
])

const battlecruiser = new SpaceVessel('Battlecruiser', 'B', 'H', [
  [0, 0],
  [2, 0],
  [1, 1],
  [0, 2],
  [1, 2],
  [2, 2],
  [1, 3]
])
const orbital = new DeepSpaceVessel('Orbital', 'O', 'G', [
  [0, 0],
  [0, 1],
  [1, 0],
  [1, 2],
  [2, 1],
  [2, 2]
])

const wheel = new DeepSpaceVessel('Wheel', 'W', 'G', [
  [0, 1],
  [1, 0],
  [1, 1],
  [2, 2],
  [2, 3],
  [3, 2]
])

const patrolBoat = new SpaceVessel('Patrol Boat', 'P', 'D', [
  [0, 0],
  [1, 1],
  [0, 2],
  [1, 2]
])

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

const railgunSpace = new SpaceVessel('Railgun', 'R', 'S', [
  [0, 1],
  [1, 0],
  [1, 1],
  [1, 2],
  [2, 1]
])
const railgunAsteroid = new Installation('Railgun', 'R', 'S', [
  [0, 0],
  [2, 0],
  [1, 1],
  [0, 2],
  [2, 2]
])

const railgun = new Transformer([railgunSpace, railgunAsteroid])
const corvette = new Shuttle('Corvette', 'V', 'H', [
  [0, 0],
  [2, 0],
  [1, 1],
  [1, 2]
])

const lifter = new Shuttle('Lifter', 'L', 'L', [
  [0, 0],
  [0, 1],
  [0, 2],
  [0, 3]
])
const missileBoat = new Shuttle('Missile Boat', 'M', 'H', [
  [0, 0],
  [1, 0],
  [2, 0],
  [1, 1]
])

const gunBoat = new Shuttle('Gun Boat', 'G', 'D', [
  [0, 0],
  [0, 1],
  [1, 0]
])

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

spaceAndAsteroids.addShapes([
  attackCraft,
  frigate,
  destroyer,
  cruiser,
  battlecruiser,
  attackCraftCarrier,
  orbital,
  wheel,
  patrolBoat,
  cargoHauler,
  merchanter,
  spaceLiner,
  transport,
  railgun,
  corvette,
  missileBoat,
  gunBoat,
  lifter,
  shelter,
  mine,
  commandCenter,
  habitat,
  spacePort,
  observationPost
])

export class Missile extends Megabomb {
  constructor (ammo) {
    super(ammo)
    this.name = 'Missile'
    this.plural = 'Missiles'
    this.symbol = '+'
    this.letter = '+'
    this.cursors = ['bomb']
    this.hints = ['Click On Square To Aim Missile']
    this.buttonHtml = '<span class="shortcut">M</span>issile'
    this.tip =
      'drag a missile on to the map to increase the number of times you can fire missiles'
    this.hasFlash = true
    this.tag = 'missile'
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
    return new Missile(ammo)
  }
  ammoStatus (ammoLeft) {
    return `Missiles (${ammoLeft} left)`
  }
}
export class RailBolt extends Kinetic {
  constructor (ammo) {
    super(ammo)
    this.name = 'Rail Bolt'
    this.plural = 'Rail Bolts'
    this.letter = 'X'
    this.symbol = 'X'
    this.cursors = ['satelite', 'strike']
    this.hints = [
      'Click on square to start rail bolt',
      'Click on square end rail bolt'
    ]
    this.buttonHtml = '<span class="shortcut">R</span>ail Bolt'
    this.tip =
      'drag a rail bolt on to the map to increase the number of times you can strike'
    this.isOneAndDone = true
    this.hasFlash = false
    this.tag = 'rail'
    this.dragShape = [
      [0, 0, 1],
      [0, 1, 0],
      [0, 2, 0],
      [0, 3, 0],
      [0, 4, 1]
    ]
  }
  clone (ammo) {
    ammo = ammo || this.ammo
    return new RailBolt(ammo)
  }
  ammoStatus (ammoLeft) {
    return `Rail Mode (${ammoLeft} left)`
  }
}

export class GuassRound extends Torpedo {
  constructor (ammo) {
    super(ammo)
    this.name = 'Gauss Round'
    this.symbol = '^'
    this.cursors = ['torpedo', 'periscope']
    this.hints = [
      'Click on square to start guass round',
      'Click on square aim guass round'
    ]
    this.buttonHtml = '<span class="shortcut">G</span>uass Round'
    this.tip =
      'drag a guass round on to the map to increase the number of times you can strike'
    this.isOneAndDone = true
    this.hasFlash = false
    this.tag = 'guass'
    this.dragShape = [
      [1, 0, 1],
      [1, 1, 0],
      [1, 2, 0],
      [0, 3, 0],
      [2, 3, 0]
    ]
  }
  clone (ammo) {
    ammo = ammo || this.ammo
    return new GuassRound(ammo)
  }
  ammoStatus (ammoLeft) {
    return `Gauss Round Mode (${ammoLeft} left)`
  }
}

export class Scan extends Sweep {
  constructor (ammo) {
    super(ammo)
    this.name = 'Scan'
    this.symbol = 'Z'
    this.cursors = ['dish', 'sweep']
    this.hints = ['Click on square to startscan', 'Click on square end scan']
    this.buttonHtml = 's<span class="shortcut">W</span>eep'
    this.tip = ''
    this.isOneAndDone = false
    this.hasFlash = false
    this.tag = 'scan'
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
    return new Scan(ammo)
  }
  ammoStatus (ammoLeft) {
    return `Radar Mode (${ammoLeft} left)`
  }
}

const smugglerSS = new Map(
  "Smuggler's Run SS",
  [7, 18],
  { H: 2, R: 1, S: 1, F: 1, T: 1, M: 3, L: 1, '+': 6, X: 4 },
  [
    [0, 7, 9],
    [1, 0, 1],
    [2, 0, 2],
    [3, 0, 3],
    [3, 15, 17],
    [4, 13, 17],
    [5, 12, 17],
    [6, 11, 17],
    [4, 0, 3],
    [5, 0, 3],
    [6, 0, 3]
  ],
  'Smugglers Run Battle SS',
  spaceAndAsteroids
)
smugglerSS.weapons = [standardShot, new Missile(6), new RailBolt(4)]

const smugglerMS = new Map(
  "Smuggler's Run MS",
  [8, 18],
  { H: 2, R: 1, S: 1, F: 1, T: 1, M: 3, L: 1, '+': 6, X: 4 },
  [
    [0, 7, 9],
    [2, 0, 1],
    [3, 0, 2],
    [4, 0, 3],
    [4, 15, 17],
    [5, 13, 17],
    [6, 12, 17],
    [7, 11, 17],
    [5, 0, 3],
    [6, 0, 3],
    [7, 0, 3]
  ],
  'Smugglers Run Battle MS',
  spaceAndAsteroids
)
smugglerMS.weapons = [standardShot, new Missile(6), new RailBolt(4)]
const smugglerM = new Map(
  "Smuggler's Run M",
  [9, 17],
  { H: 2, R: 1, S: 1, F: 1, T: 1, V: 1, M: 2, L: 1, '+': 4, X: 4 },
  [
    [0, 7, 9],
    [3, 0, 1],
    [4, 0, 2],
    [5, 0, 3],
    [5, 15, 16],
    [6, 13, 16],
    [7, 12, 16],
    [8, 11, 16],
    [6, 0, 3],
    [7, 0, 3],
    [8, 0, 3]
  ],
  'Smugglers Run Battle M',
  spaceAndAsteroids
)
smugglerM.weapons = [standardShot, new Missile(5), new RailBolt(4)]
const smugglerML = new Map(
  "Smuggler's Run ML",
  [9, 18],
  { H: 2, R: 1, S: 1, F: 1, T: 2, V: 1, M: 2, L: 1, '+': 6, X: 4 },
  [
    [2, 7, 9],
    [3, 6, 9],
    [4, 5, 9],
    [5, 7, 9],
    [4, 0, 1],
    [5, 0, 2],
    [6, 0, 3],
    [5, 15, 17],
    [6, 13, 17],
    [7, 12, 17],
    [8, 11, 17],
    [7, 0, 3],
    [8, 0, 3]
  ],
  'SmugglerML',
  spaceAndAsteroids
)
smugglerML.weapons = [standardShot, new Missile(4), new RailBolt(4)]
const smugglerL = new Map(
  "Smuggler's Run L",
  [9, 18],
  { H: 2, R: 1, S: 1, F: 1, T: 2, V: 1, M: 2, L: 2, '+': 6, X: 4 },
  [
    [3, 7, 9],
    [4, 6, 9],
    [5, 5, 9],
    [6, 7, 9],
    [5, 0, 1],
    [6, 0, 2],
    [7, 0, 3],
    [6, 15, 17],
    [7, 13, 17],
    [8, 12, 17],
    [9, 11, 17],
    [8, 0, 3],
    [9, 0, 3]
  ],
  'Smugglers Run Battle L',
  spaceAndAsteroids
)
smugglerL.weapons = [standardShot, new Missile(4), new RailBolt(4)]
spaceAndAsteroids.addWeapons([new Missile(1), new RailBolt(1)])

class SpaceAndAsteroidsMaps extends TerrainMaps {
  constructor () {
    super(
      spaceAndAsteroids,
      [smugglerSS, smugglerMS, smugglerM, smugglerML, smugglerL],
      smugglerSS
    )
  }
}

const spaceAndAsteroidsMaps = new SpaceAndAsteroidsMaps()

TerrainMaps.currentTerrainMaps(spaceAndAsteroidsMaps)
