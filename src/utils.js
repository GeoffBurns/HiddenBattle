import { gameMaps } from './maps.js'

export function randomPlaceShape (ship, shipCellGrid) {
  const letter = ship.letter
  const shape = ship.shape()
  if (!shape) throw new Error('No shape for letter ' + letter)
  let placeables = shape.placeables()

  // try random placements
  const maxAttempts = 5000
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    for (const placeable of placeables) {
      // compute bounds for random origin so variant fits
      const maxR = placeable.height()
      const maxC = placeable.width()
      const r0 = Math.floor(Math.random() * (gameMaps.current.rows - maxR))
      const c0 = Math.floor(Math.random() * (gameMaps.current.cols - maxC))
      if (placeable.canPlace(r0, c0, shipCellGrid)) {
        ship.placePlaceable(placeable, r0, c0)
        ship.addToGrid(shipCellGrid)
        return ship.cells
      }
    }
  }
  return null
}

export function throttle (func, delay) {
  let inThrottle
  let lastFn
  let lastTime

  return function () {
    const context = this
    const args = arguments

    if (!inThrottle) {
      func.apply(context, args)
      lastTime = Date.now()
      inThrottle = true
    } else {
      clearTimeout(lastFn)
      lastFn = setTimeout(function () {
        if (Date.now() - lastTime >= delay) {
          func.apply(context, args)
          lastTime = Date.now()
        }
      }, Math.max(delay - (Date.now() - lastTime), 0))
    }
  }
}
