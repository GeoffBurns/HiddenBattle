import { gameMaps } from './gameMaps.js'
import { WeaponSystem, AttachedWeaponSystems } from './WeaponSystem.js'

export class LoadOut {
  constructor (weapons, ships, seekingMode, viewModel) {
    this.OutOfAllAmmo = Function.prototype
    this.OutOfAmmo = Function.prototype
    this.destroy = Function.prototype
    this.reveal = Function.prototype
    this.onCursorChange = Function.prototype
    this.sound = Function.prototype
    this.index = 0
    this.viewModel = viewModel
    this.seekingMode = seekingMode
    const hasAttachedWeapons = ships.length > 0
    this.hasAttachedWeapons = hasAttachedWeapons
    this.selectRack = !seekingMode && hasAttachedWeapons
    this.selectedWeapon = null
    this.hintCoord = []
    this.coords = []
    this.weapons = {}
    this.unattachedWeapons = weapons
    this.ships = ships
    this.load()
    this.allSystems = [...this.weaponSystems]
    this.launch = LoadOut.launchDefault.bind(this, this.viewModel)
  }

  static launchDefault (viewModel, coords, onEnd, weapon) {
    const targetCoords = coords.at(-1)
    const target = viewModel.gridCellAt(targetCoords[0], targetCoords[1])
    weapon.animateExplode(target, null, null, onEnd, viewModel.cellSizeScreen())
  }
  load () {
    const wps = LoadOut.wps(this.unattachedWeapons)
    const weaponByLetter = wps.reduce((obj, w) => {
      obj[w.weapon.letter] = w
      return obj
    }, {})
    //
    const allWeaponByLetter = this.ships.reduce((racks, ship) => {
      const weapon = ship.weapon()
      if (weapon) {
        const key = weapon.letter
        const old = racks[key]
        racks[key] = old
          ? WeaponSystem.build(old, ship)
          : new AttachedWeaponSystems(ship)
      }
      return racks
    }, weaponByLetter)
    this.weaponByLetter = allWeaponByLetter
    this.weaponSystems = Object.values(weaponByLetter)
  }
  static wps (weapons) {
    return weapons.map(w => {
      return new WeaponSystem(w)
    })
  }

  armedShips () {
    return this.ships.filter(s => s.hasAmmoLeft())
  }
  getUnattachedWeapon () {
    return this.weaponSystem()?.getUnattachedWeapon()
  }
  limitedSystems () {
    return this.weaponSystems.filter(w => w.weapon.isLimited)
  }
  limitedAllSystems () {
    return this.allSystems.filter(w => w.weapon.isLimited)
  }

  totalAmmo () {
    return this.limitedSystems().reduce((acc, w) => acc + w.ammoTotal(), 0)
  }
  ammoLeft () {
    return this.limitedSystems().reduce((acc, w) => acc + w.ammoLeft(), 0)
  }
  reload (weapons) {
    this.unattachedWeapons = weapons
    this.load()
  }
  weaponSystem () {
    return this.weaponSystems[this.index]
  }

  weapon () {
    return this.weaponSystem().weapon
  }
  hasWeapon (wletter) {
    return wletter in this.weaponByLetter
    //this.weapons.find(w => w.letter === wletter) !== undefined
  }

  nextWeapon () {
    return this.nextWeaponSystem().weapon
  }

  isOutOfAmmo () {
    return 1 >= this.weaponSystems.length
  }
  hasNoCurrentAmmo () {
    return !this.hasCurrentAmmo()
  }
  hasCurrentAmmo () {
    const wps = this.weaponSystem()
    if (!wps.weapon.isLimited) return true
    return wps.ammoLeft() !== 0
  }
  hasAllAmmo () {
    const wps = this.weaponSystem()
    if (!wps.weapon.isLimited) return true
    return this.ammoLeft() !== 0
  }
  useAmmo (wps) {
    const w = wps || this.weaponSystem()
    if (!w.weapon.isLimited) return

    w.useAmmo()

    this.checkNoAmmo()
  }

  checkNoAmmo () {
    if (this.hasNoCurrentAmmo()) {
      this.removeWeaponSystem()

      return true
    }

    return false
  }
  checkAllAmmo () {
    for (const wps of this.limitedSystems()) {
      if (!wps.hasAmmoLeft()) {
        this.removeWeaponSystem()
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
    const len = weapon.cursors.length
    if (this.coords.length >= weapon.points || this.coords.length >= len)
      return ''
    const index = this.coords.length
    return weapon.cursors[index]
  }
  changeSince (oldCursor) {
    //const wletter = this.isArming() ? this.selectableWeapon?.letter : null
    this.onCursorChange(oldCursor, this.cursor())
  }
  removeWeaponSystem () {
    const oldCursor = this.cursor()
    const i = this.index
    this.weaponSystems.splice(i, 1)

    if (i >= this.weaponSystems.length) {
      this.index = 0
    }
    this.OutOfAmmo()
    this.changeSince(oldCursor)
    this.OutOfAmmo()
    if (this.isOutOfAmmo()) {
      this.OutOfAllAmmo()
    }
  }

  getRack () {
    return this.ships[0]?.loadedWeapon()
  }
  getRackById (id) {
    // const wps = this.ships.find(w => w.getRackById(id) !== null)
    return this.getLoadedWeapons().find(w => w.id === id)
    //   return wps?.getRackById(id)
  }
  getRacks () {
    const r = this.ships.flatMap(w => w.weaponList())
    return r
  }
  getShipById (id) {
    const ship = this.ships.find(w => w.id === id)
    return ship
  }
  getShipByWeaponId (id) {
    const ship = this.ships.find(w => w.getRackById(id) !== null)
    return ship
  }
  getLoadedWeapons () {
    const r = this.ships.flatMap(w => w.loadedWeapons())
    return r
  }
  switchToPrefered () {
    const prefs = gameMaps().weaponPreference
    for (const [letter, op] of prefs) {
      if (this.switchTo(letter)) {
        return op
      }
    }
    return null
  }
  setIndex (idx) {
    const oldCursor = this.cursor()
    this.index = idx
    this.OutOfAmmo()
    this.changeSince(oldCursor)
  }
  switchTo (wletter) {
    const idx = this.weaponSystems.findIndex(
      w => w.weapon.letter === wletter && w.ammo > 0
    )
    if (idx < 0) return false
    this.setIndex(idx)
    return true
  }
  switchToSShot () {
    this.setIndex(0)
    return true
  }
  nextWeaponSystem () {
    const result = this.weaponSystems[this.nextIndex()]
    return result
  }
  moveToNextIndex () {
    this.setIndex(this.nextIndex())
  }
  nextIndex () {
    let idx = this.index
    idx++
    if (idx >= this.weaponSystems.length) {
      idx = 0
    }
    return idx
  }
  clearCoords () {
    const oldCursor = this.cursor()
    this.coords = []
    let wps = this.getUnattachedWeapon()
    if (this.seekingMode && !wps) {
      wps = this.getRack()
    }
    if (wps && wps.weapon.unattachedCursor > 0) {
      this.addCoords(-1, -1)
      return
    }
    this.changeSince(oldCursor)
    this.selectableWeapon = this.getRack()
  }
  addCoords (r, c) {
    const oldCursor = this.cursor()
    this.coords.push([r, c])
    this.changeSince(oldCursor)
  }
  switchToNextWPS () {
    this.moveToNextIndex()
    this.clearCoords()
  }
  switch () {
    this.switchToNextWPS()
    return this.weapon()
  }
  cursorIndex () {
    return this.coords.length
  }
  isArmed () {
    const ishide = !this.seekingMode
    const selected = this.selectedWeapon
    const result =
      ishide &&
      selected &&
      this.coords.length >= selected.weapon.postSelectCursor
    return result
  }
  isNotArming () {
    return !this.selectRack // || this.isArmed()
  }
  isArming () {
    return !this.isNotArming()
  }
  onExplode (map, coords, wps) {
    this.fire(map, coords, wps)
  }
  aim (map, r, c, wps) {
    const w = wps || this.weaponSystem()
    const weapon = w.weapon
    const p = weapon.points
    this.addCoords(r, c)

    if (this.coords.length == p) {
      const fireCoords = structuredClone(this.coords)
      this.selectedWeapon = null
      this.clearCoords()
      this.useAmmo(w)
      this.checkNoAmmo()
      this.launch(fireCoords, this.fire.bind(this, map, fireCoords, w), weapon)
    }
  }

  dismiss () {
    this.clearCoords()
  }

  fire (map, coord, wps) {
    const c = coord || this.coord
    const w = wps || this.weaponSystem()
    const weapon = w.weapon

    const effected = weapon.aoe(map, c)
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
