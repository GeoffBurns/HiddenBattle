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
