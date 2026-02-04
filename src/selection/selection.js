import { SelectedShip } from './SelectedShip.js'

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
