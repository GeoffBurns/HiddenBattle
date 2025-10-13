import { setupGameOptions, fetchNavBar } from './navbar.js'
import { setupEnemy, newGame } from './enemySetup.js'
import { enemyUI } from './enemyUI.js'

fetchNavBar('seek', "Geoff's Hidden Battle (Seek)", function () {
  document.getElementById('choose-map-container').classList.remove('hidden')

  setupGameOptions(enemyUI.resetBoardSize.bind(enemyUI), newGame)
  setupEnemy()
  // initial
  newGame()
})
