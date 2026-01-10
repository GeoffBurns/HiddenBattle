import { setupPrintOptions, fetchNavBar } from './navbar.js'
import { friendUI } from './friendUI.js'
import { Friend } from './friend.js'
import { enemyUI } from './enemyUI.js'
import { enemy } from './enemy.js'
import { gameMap } from './maps.js'
import { terrain, Terrain } from './Shape.js'

const friend = new Friend(friendUI)

function resetBoardSize () {
  friendUI.resetBoardSizePrint()
  enemyUI.resetBoardSizePrint()
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

  for (const weapon of weapons) {
    if (!friend.loadOut.hasWeapon(weapon.letter)) {
      const el = document.getElementById('weapon-info-' + weapon.tag)
      el.classList.toggle('hidden', el !== null)
    }
  }
  Terrain.customizeUnitDescriptions('-unit-header', (letter, _description) => {
    return terrain.current.ships.unitDescriptions[letter] + ' Units'
  })

  Terrain.customizeUnitDescriptions('-unit-info', (letter, _description) => {
    return terrain.current.ships.unitInfo[letter]
  })

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
