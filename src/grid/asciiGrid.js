import { GridBase } from './gridBase.js'
import { Shape } from './shape.js'
export class AsciiGrid extends GridBase {
  constructor (width, height, ascii, fillChar = '.') {
    super(Shape.rectangle(width, height))
    this.fillChar = fillChar
    this.string = ascii || fillChar.repeat(width) + '\n'.repeat(height - 1)
  }
  index (x, y) {
    return y * (this.width + 1) + x
  }
  at (x, y) {
    const idx = this.index(x, y)
    return this.string.charAt(idx)
  }
  set (x, y, color = 1) {
    const idx = this.index(x, y)
    const newString =
      this.string.substring(0, idx) +
      (color ? '#' : this.fillChar) +
      this.string.substring(idx + 1)
    this.string = newString
  }

  get indexMax () {
    return (this.width + 1) * this.height - 1
  }
  get rowMax () {
    return this.width + 1
  }
}
