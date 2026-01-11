class Ghost {
  constructor (variant, letter, contentBuilder, special) {
    const el = document.createElement('div')
    el.className = 'ship-ghost'
    this.element = el
    this.letter = letter
    this.special = special
    this.contentBuilder = contentBuilder
    contentBuilder(el, variant, letter, special)
    document.body.appendChild(el)
  }
  hide () {
    this.element.style.opacity = 0
  }
  show () {
    this.element.style.opacity = ''
  }
  setVariant (variant) {
    if (this.element) {
      this.element.innerHTML = ''
      this.contentBuilder(this.element, variant, this.letter)
      //  friendUI.setDragShipContents(this.element, variant, this.letter)
    }
  }
  remove () {
    if (this.element) this.element.remove()
    this.element = null
  }
  moveTo (x, y) {
    if (this.element) {
      this.element.style.left = x + 'px'
      this.element.style.top = y + 'px'
    }
  }
}

export class Brush {
  constructor (size, subterrain) {
    this.size = size
    this.subterrain = subterrain
  }

  toObject () {
    return { size: this.size, subterrain: this.subterrain }
  }
}

class SelectedShip {
  constructor (ship, variantIndex, contentBuilder) {
    this.ship = ship
    this.contentBuilder = contentBuilder
    const shape = ship.shape()
    this.shape = shape
    this.type = shape.type()
    this.id = ship.id
    this.letter = ship.letter
    this.variants = shape.variants()
    this.variants.index = variantIndex
  }
  canFlip () {
    return this.variants.canFlip
  }
  canRotate () {
    return this.variants.canRotate
  }
  canTransform () {
    return this.variants.canTransform
  }
  placeable () {
    return this.variants.placeable()
  }
  variant () {
    return this.variants.variant()
  }

  special () {
    return this.variants.special()
  }
  rotate () {
    return this.variants.rotate()
  }

  leftRotate () {
    return this.variants.leftRotate()
  }
  flip () {
    return this.variants.flip()
  }
  nextForm () {
    return this.variants.nextForm()
  }
}

export class ClickedShip extends SelectedShip {
  constructor (ship, source, variantIndex, contentBuilder) {
    super(ship, variantIndex, contentBuilder)
    this.source = source
    this.variants.onChange = () => {
      const variant = this.variants.variant()
      const special = this.variants.special()
      if (this.source) {
        this.source.innerHTML = ''
        this.contentBuilder(this.source, variant, this.letter, special)
        this.source.dataset.variant = this.variants.index
      }
    }
  }
}

class PlacedShips {
  constructor () {
    this.ships = []
    this.undoBtn = null
    this.resetBtn = null
  }

  reset () {
    this.ships = []
  }

  registerUndo (undoBtn, resetBtn) {
    this.undoBtn = undoBtn
    this.resetBtn = resetBtn
  }

  pop () {
    const ship = this.ships.pop()
    ship.unplace()
    return ship
  }
  updateUndo () {
    if (this.undoBtn) this.undoBtn.disabled = this.ships.length === 0
    if (this.resetBtn) this.resetBtn.disabled = this.ships.length === 0
  }
  popAndRefresh (shipCellGrid, mark, returnShip) {
    const ship = this.pop()
    returnShip(ship)
    for (const s of this.ships) {
      s.addToGrid(shipCellGrid)
      mark(s)
    }

    this.updateUndo()
    return ship
  }
  popAll (returnShip) {
    for (const s of this.ships) {
      returnShip(s)
    }
    this.reset()
    this.updateUndo()
  }
  push (ship, placed) {
    this.ships.push(ship)
    this.updateUndo()
    return ship.place(placed)
  }
  numPlaced () {
    return this.ships.length
  }
  getAll () {
    return this.ships.slice()
  }
}

export const placedShipsInstance = new PlacedShips()

export class DraggedShip extends SelectedShip {
  constructor (
    ship,
    offsetX,
    offsetY,
    cellSize,
    source,
    variantIndex,
    contentBuilder
  ) {
    super(ship, variantIndex, contentBuilder)
    const row = Math.floor(offsetY / cellSize)
    const col = Math.floor(offsetX / cellSize)
    this.source = source
    this.cursor = [row, col]
    this.offset = [offsetX, offsetY]
    this.ghost = new Ghost(
      super.variant(),
      ship.letter,
      contentBuilder,
      super.special()
    )
    this.shown = true
  }
  isNotShown () {
    return !this.shown
  }
  hide () {
    this.shown = false
    if (this.ghost) this.ghost.hide()
  }
  show () {
    this.shown = true
    if (this.ghost) this.ghost.show()
  }
  remove () {
    if (this.ghost) this.ghost.remove()
    this.ghost = null
  }
  moveTo (x, y) {
    if (this.ghost) this.ghost.moveTo(x, y)
  }
  move (e) {
    this.moveTo(
      e.clientX - this.offset[0] - 13,
      e.clientY - this.offset[1] - 13
    )
  }

  setGhostVariant () {
    if (this.ghost) this.ghost.setVariant(this.variant())
  }

  rotate () {
    this.resetOffset()
    super.rotate()
    this.setGhostVariant()
  }
  resetOffset () {
    this.offset = [0, 0]
    this.cursor = [0, 0]
  }

  leftRotate () {
    this.resetOffset()
    super.leftRotate()
    this.setGhostVariant()
  }
  flip () {
    this.resetOffset()
    super.flip()
    this.setGhostVariant()
  }
  canPlaceRaw (r, c, shipCellGrid) {
    const placeable = this.placeable()
    if (this.ghost) {
      // && placeable.inAllBounds(r, c))
      return placeable.canPlace(r, c, shipCellGrid)
    }
    return false
  }

  addPlaceableToShipCells (placeable, r, c, shipCellGrid) {
    this.ship.placePlaceable(placeable, r, c)
    this.ship.addToGrid(shipCellGrid)
    return this.ship.cells
  }
  addCurrentToShipCells (r, c, shipCellGrid) {
    return this.addPlaceableToShipCells(this.placeable(), r, c, shipCellGrid)
  }
  offsetCell (r, c) {
    const r0 = r - this.cursor[0]
    const c0 = c - this.cursor[1]
    return [r0, c0]
  }
  canPlace (r, c, shipCellGrid) {
    const r0 = r - this.cursor[0]
    const c0 = c - this.cursor[1]
    return this.canPlaceRaw(r0, c0, shipCellGrid)
  }
  placeCells (r, c, shipCellGrid) {
    const r0 = r - this.cursor[0]
    const c0 = c - this.cursor[1]
    if (this.canPlaceRaw(r0, c0, shipCellGrid)) {
      return this.addCurrentToShipCells(r0, c0, shipCellGrid)
    }
    return null
  }
  place (r, c, shipCellGrid) {
    const placed = this.placeCells(r, c, shipCellGrid)
    if (placed) {
      return placedShipsInstance.push(this.ship, placed)
    }
    return null
  }
}
