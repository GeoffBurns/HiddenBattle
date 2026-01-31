import { fetchNavBar } from './navbar.js'
import { setupGameOptions } from './setupOptions.js'
import { setupEnemy, newGame } from './enemySetup.js'
import { enemyUI } from './waters/enemyUI.js'

fetchNavBar('seek', "Geoff's Hidden Battle (Seek)", function () {
  document.getElementById('choose-map-container').classList.remove('hidden')
  setupGameOptions(
    enemyUI.resetBoardSize.bind(enemyUI),
    newGame.bind(null, 'seek')
  )
  setupEnemy()

  // initial
  newGame('seek')
})
