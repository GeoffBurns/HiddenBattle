import { setupPrintOptions, fetchNavBar } from './navbar.js'
import { friendUI } from './friendUI.js'
import { Friend } from './friend.js'
import { enemyUI } from './enemyUI.js'
import { enemy } from './enemy.js'
import { gameMap } from './maps.js'
import { terrain, Terrain } from './Shape.js'
import { toTitleCase } from './utils.js'

const friend = new Friend(friendUI)

function resetBoardSize () {
  friendUI.resetBoardSizePrint()
  enemyUI.resetBoardSizePrint()
}
function customSplash (hasPower) {
  let legend = {}
  let translate = {}

  translate[20] = 20
  legend[20] = 'Weapon Path'
  if (hasPower[2]) {
    translate[2] = 2
    translate[32] = 2
    legend[2] = 'Hardened Destroyed'
    translate[12] = 12
    legend[12] = 'Hardened Revealed'
    translate[1] = 1
    translate[31] = 1
    if (hasPower[1]) {
      legend[1] = 'Normal Destroyed, Hardened Revealed'
      translate[11] = 11
      legend[11] = 'Normal Revealed'

      if (hasPower[0]) {
        translate[0] = 0
        translate[30] = 0
        legend[0] = 'Vunerable Destroyed'
        translate[10] = 10
        legend[10] = 'Vunerable Revealed'
      } else {
        translate[0] = -1
        translate[30] = 20
        translate[10] = -1
      }
    } else {
      if (hasPower[0]) {
        translate[1] = 0
        translate[31] = 0
        legend[1] = 'Vunerable Destroyed, Hardened Revealed'
      } else {
        translate[1] = 12
        translate[31] = 12

        legend[12] = 'Hardened Revealed'
      }
    }
  } else {
    // not hasPower[2]
    if (hasPower[1]) {
      translate[2] = 1
      translate[32] = 1
      translate[12] = 11
      translate[1] = 1
      translate[31] = 1
      legend[1] = 'Normal Destroyed'
      translate[11] = 11
      legend[11] = 'Normal Revealed'

      if (hasPower[0]) {
        translate[0] = 0
        translate[30] = 0
        legend[0] = 'Vunerable Destroyed'
        translate[10] = 10
        legend[10] = 'Vunerable Revealed'
      } else {
        translate[0] = -1
        translate[30] = 20
        translate[10] = -1
      }
    } else {
      if (hasPower[0]) {
        translate[1] = 0
        translate[31] = 0
        legend[1] = 'Vunerable Destroyed, Hardened Revealed'
      } else {
        translate[1] = -1
        translate[31] = -1
      }
    }
  }
  return [translate, legend]
}

function refresh () {
  friend.setMap()
  enemy.setMap()
  friendUI.buildBoardPrint()
  enemyUI.buildBoardPrint()
  friendUI.showMapTitle()
  enemyUI.showMapTitle()
  friendUI.score.buildTally(
    friend.ships,
    friend.loadOut.weaponSystems,
    friendUI
  )

  enemyUI.score.buildTally(enemy.ships, enemy.loadOut.weaponSystems, enemyUI)
  document.title = "Geoff's Hidden Battle - " + gameMap().title
  friendUI.hideEmptyUnits(friend.ships)

  const weapons = terrain.current.weapons.weapons
  let i = 2
  for (const weapon of weapons) {
    if (friend.loadOut.hasWeapon(weapon.letter)) {
      const el = document.getElementById('weapon-info-' + weapon.tag)
      if (el) {
        el.dataset.listText = i + '.'
        el.classList.remove('hidden')
        i++
        const { vulnerable, normal, hardened, immune } = getPowerGroups(weapon)
        const hasPower = [
          vulnerable.length > 0,
          normal.length > 0,
          hardened.length > 0
        ]

        const [translate, legend] = customSplash(hasPower)
        const cells = weapon.splashCoords.map(m => {
          const t = translate[m[2]] || m[2]

          return [m[0], m[1], t]
        })
        friendUI.buildWeaponsSplashPrint(cells, weapon)
        friendUI.buildSplashLegend(cells, weapon, legend)
        showSplashInfo(weapon, vulnerable, normal, hardened, immune)
        showPowerGroups(hardened, vulnerable, immune, weapon, normal)
      }
    }
    Terrain.customizeUnitDescriptions(
      '-unit-header',
      (letter, _description) => {
        return terrain.current.ships.unitDescriptions[letter] + ' Units'
      }
    )

    Terrain.customizeUnitDescriptions('-unit-info', (letter, _description) => {
      return terrain.current.ships.unitInfo[letter]
    })
  }
  showNotesPrintOut()
}

fetchNavBar('print', 'Battleship', function () {
  document.getElementById('second-tab-bar').classList.remove('hidden')
  const select = document.getElementById('choose-map-container')
  select.classList.remove('hidden')
  select.classList.add('right')

  const printMap = setupPrintOptions(resetBoardSize, refresh, 'print')

  resetBoardSize()
  refresh()

  if (printMap) {
    globalThis.print()
  }
})
function getPowerGroups (weapon) {
  const immune = enemy.ships.flatMap(s => {
    const shape = s.shape()
    return (shape.immune || []).includes(weapon.letter)
      ? shape.descriptionText
      : []
  })

  const vulnerable = enemy.ships.flatMap(s => {
    const shape = s.shape()
    return (shape.vulnerable || []).includes(weapon.letter)
      ? shape.descriptionText
      : []
  })

  const hardened = enemy.ships.flatMap(s => {
    const shape = s.shape()
    return (shape.hardened || []).includes(weapon.letter)
      ? shape.descriptionText
      : []
  })

  const normal = enemy.ships.flatMap(s => {
    const shape = s.shape()
    if (
      !(shape.immune || []).includes(weapon.letter) &&
      !(shape.vulnerable || []).includes(weapon.letter) &&
      !(shape.hardened || []).includes(weapon.letter)
    ) {
      return shape.descriptionText
    } else {
      return []
    }
  })
  return { vulnerable, normal, hardened, immune }
}

function showPowerGroups (hardened, vulnerable, immune, weapon, normal) {
  if (hardened.length > 0 || vulnerable.length > 0 || immune.length > 0) {
    const powerEl = document.getElementById('power-info-' + weapon.tag)
    if (powerEl) {
      powerEl.classList.remove('hidden')
      powerEl.innerHTML = ''
      if (immune.length > 0) {
        powerEl.innerHTML += `<p>◦ Immune to ${weapon.name} : ${immune.join(
          ', '
        )}</p>`
      }
      if (hardened.length > 0) {
        powerEl.innerHTML += `<p>◦ Hardened against ${
          weapon.name
        } : ${hardened.join(', ')}</p>`
      }
      if (vulnerable.length > 0) {
        powerEl.innerHTML += `<p>◦ Vulnerable to ${
          weapon.name
        } : ${vulnerable.join(', ')}</p>`
      }
      if (normal.length > 0 && normal.length < 7) {
        powerEl.innerHTML += `<p>◦ ${
          weapon.name
        } has normal effect on: ${normal.join(', ')}</p>`
      }
    }
  }
}

function showSplashInfo (weapon, vulnerable, normal, hardened, immune) {
  const splashPower = weapon.splashPower
  if (splashPower >= 0) {
    const powerGroup = [vulnerable, normal, hardened, immune]
    const splashedGroup = powerGroup.slice(0, weapon.splashPower + 1)
    const splashedList = splashedGroup.flat()

    if (splashedList.length > 0) {
      const splashInfoEl = document.getElementById('splash-info-' + weapon.tag)
      if (splashInfoEl) {
        splashInfoEl.classList.remove('hidden')
        showSplashedUnit(weapon, powerGroup, splashedList)
      }
    }
  }
}

function showSplashedUnit (weapon, powerGroup, splashedList) {
  const powerGroupName = ['vulnerable', 'normal', 'hardened', 'immune']
  const unsplashedGroup =
    weapon.splashPower < 3 ? powerGroup.slice(weapon.splashPower + 1) : []
  const unsplashedList = unsplashedGroup.flat()
  const splashedEl = document.getElementById('splashed-' + weapon.tag)
  const unsplashedEl = document.getElementById('unsplashed-' + weapon.tag)
  if (unsplashedList.length === 0 && unsplashedEl) {
    unsplashedEl.classList.remove('hidden')
    unsplashedEl.textContent = ' all units are not effected'
  } else if (
    splashedEl &&
    (!unsplashedEl || splashedList.length < unsplashedList.length)
  ) {
    const names = toTitleCase(
      powerGroupName.slice(0, weapon.splashPower + 1).join(', ')
    )

    splashedEl.classList.remove('hidden')
    splashedEl.textContent = ` ${names} units are effected such as ${splashedList.join(
      ', '
    )}`
  } else if (
    unsplashedEl &&
    (!splashedEl || unsplashedList.length < splashedList.length)
  ) {
    const names = powerGroupName
      .slice(weapon.splashPower + 1)
      .join(', ')
      .toTitleCase()

    unsplashedEl.classList.remove('hidden')
    unsplashedEl.textContent =
      ` ${names} units are not effected such as ${unsplashedList.join(
        ', '
      )}`.join(', ')
  }
}

function showNotesPrintOut () {
  const groups = friendUI.splitUnits(friend.ships)
  for (let type in groups) {
    const shipsInfo = groups[type]
    for (let letter in shipsInfo) {
      const shipInfo = shipsInfo[letter]
      if (shipInfo)
        friendUI.buildTrayItemPrint(shipInfo, friendUI.getTrayOfType(type))
    }
    const notes = Object.values(shipsInfo).flatMap(info => {
      return info.shape.notes || []
    })
    const notesEl = friendUI.getNotesOfType(type)
    if (notesEl && notes.length > 0) {
      notesEl.classList.remove('hidden')
      notesEl.innerHTML = `<p><b>Notes : </b> ${notes.join('<br>')} </p>`
    }
  }
}
