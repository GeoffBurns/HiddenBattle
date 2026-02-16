import { bh } from '../terrain/terrain.js'
import { Megabomb, Kinetic, Torpedo, Sweep } from '../sea/SeaWeapons.js'
import { WeaponCatelogue as WeaponCatalogue } from '../weapon/Weapon.js'

export class Missile extends Megabomb {
  constructor (ammo) {
    super(ammo, 'Missile', '+')
    this.plural = 'Missiles'
    this.unattachedCursor = 0 // = 1
    this.postSelectCursor = 0
    this.givesHint = true
    this.launchCursor = 'launch'
    this.totalCursors = 2
    this.cursors = ['missile'] //['launch', 'missile']
    this.animateOnTarget = true
    this.explodeOnTarget = true
    this.points = 1
    this.hints = ['Click On Square To Aim Missile']
    this.buttonHtml = '<span class="shortcut">M</span>issile'
    this.tip =
      'drag a missile on to the map to increase the number of times you can fire missiles'
    this.hasFlash = true
    this.splashCoords = this.aoe(null, [
      [-1, -1],
      [2, 2]
    ])
    this.tag = 'missile'
    this.volatile = true
  }
  clone (ammo) {
    ammo = ammo || this.ammo
    return new Missile(ammo)
  }

  launchTo (coords, r, c, onEnd, map, viewModel, opposingViewModel) {
    if (!opposingViewModel) {
      super.launchTo(coords, r, c, onEnd, map, viewModel, opposingViewModel)
      return
    }
    const target = coords[0]

    const start1 = opposingViewModel.gridCellAt(r, c)
    const end1 = viewModel.gridCellAt(target[0], target[1])

    this.animateFlying(
      start1,
      end1,
      () => {
        onEnd()
      },
      viewModel.cellSizeScreen(),
      map,
      viewModel
    )
  }

  redoCoords (_map, base, coords) {
    return [base, coords[0]]
  }
  aoe (_map, coords) {
    if (coords.length < 1) return []
    const [r, c] = coords[0]
    let result = this.boom(r, c)
    return result
  }
  static get single () {
    return new Missile(1)
  }

  getTurn (variant) {
    let turn = ''
    switch (variant) {
      case 0:
        turn = 'turn4'
        break
      case 2:
        turn = 'turn2'
        break
      case 3:
        turn = 'turn3'
        break
      default:
        turn = ''
        break
    }
    return turn
  }
}
export class RailBolt extends Kinetic {
  constructor (ammo) {
    super(ammo, 'Rail Bolt', '|')
    this.plural = 'Rail Bolts'
    this.launchCursor = 'rail'
    this.postSelectCursor = 1
    this.totalCursors = 2
    this.cursors = ['rail', 'bolt']
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

  launchTo (coords, rr, cc, onEnd, map, viewModel, opposingViewModel) {
    if (!opposingViewModel) {
      super.launchTo(coords, rr, cc, onEnd, map, viewModel, opposingViewModel)
      return
    }
    const [[r, c], target] = this.redoCoords(map, [rr, cc], coords)
    const start1 = opposingViewModel.gridCellAt(r, c)
    const end1 = opposingViewModel.gridCellAt(target[0], target[1])
    const start2 = viewModel.gridCellAt(r, c)
    const end2 = viewModel.gridCellAt(target[0], target[1])
    end1.classList.add('portal')
    start2.classList.add('portal')
    this.animateFlying(
      start1,
      end1,
      this.animateFlying.bind(
        this,
        start2,
        end2,
        () => {
          end1.classList.remove('portal')
          start2.classList.remove('portal')
          onEnd()
        },
        viewModel.cellSizeScreen(),
        map,
        viewModel
      ),
      viewModel.cellSizeScreen(),
      map,
      opposingViewModel
    )
  }

  static get single () {
    return new RailBolt(1)
  }
}

export class GuassRound extends Torpedo {
  constructor (ammo) {
    super(ammo)
    this.name = 'Gauss Round'
    this.letter = '^'
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

  static get single () {
    return new GuassRound(1)
  }
}

export class Scan extends Sweep {
  constructor (ammo) {
    super(ammo)
    this.name = 'Scan'
    this.letter = 'Z'
    this.cursors = ['dish', 'sweep']
    this.hints = ['Click on square to startscan', 'Click on square end scan']
    this.buttonHtml = 's<span class="shortcut">W</span>eep'
    this.tip = ''
    this.isOneAndDone = false
    this.hasFlash = false
    this.tag = 'scan'
  }
  clone (ammo) {
    ammo = ammo || this.ammo
    return new Scan(ammo)
  }
}

export const spaceWeaponsCatalogue = new WeaponCatalogue([
  new Missile(1),
  new RailBolt(1)
])
