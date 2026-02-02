export class GridBase {
  constructor (width, height) {
    this.width = width
    this.height = height
  }

  index (x, y) {
    return BigInt(y * this.width + x)
  }

  inBounds (x, y) {
    return x >= 0 && y >= 0 && x < this.width && y < this.height
  }
}
