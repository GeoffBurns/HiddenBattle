import { bh } from './terrain.js'
import { enemy } from './enemy.js'
import { friendUI } from './friendUI.js'

let otherboard = null
const newGameBtn = document.getElementById('newGame')
export function newGame (seek, opponentBoard) {
  bh.seekingMode = seek === 'seek'
  if (bh.seekingMode) {
    enemy.ships = []
  }
  enemy.resetModel()
  enemy.resetUI(enemy.ships)
  enemy.updateMode()
  const title = document.getElementById('enemy-title')
  title.textContent = 'Enemy ' + bh.terrain.mapHeading

  if (otherboard) {
    otherboard()
  } else {
    otherboard = opponentBoard
    friendUI.clearFriendClasses()
    enemy.setupAttachedAim()
  }
}

function setupSeekShortcuts (placement) {
  if (placement) {
    document.getElementById('newPlace2').addEventListener('click', placement)
  }

  function handleSeekShortcuts (event) {
    switch (event.key) {
      case 'p':
      case 'P':
        if (placement) placement()
        break
      case 'r':
      case 'R':
        newGame()
        break
      case 'v':
      case 'V':
        enemy.onClickReveal()
        break
      case 'm':
      case 'M':
        enemy.onClickWeaponMode()
        break
      case 's':
      case 'S':
        enemy.onClickWeaponMode()
        break
    }
  }

  document.addEventListener('keydown', handleSeekShortcuts)

  return () => document.removeEventListener('keydown', handleSeekShortcuts)
}

export function setupEnemy (placement) {
  // wire buttons
  newGameBtn.addEventListener('click', newGame.bind(null, 'seek', null))
  enemy.wireupButtons()
  return setupSeekShortcuts(placement)
}
