export class RectBase {
  constructor (width, height) {
    this.width = width
    this.height = height
    if (new.target === RectBase) {
      throw new Error(
        'base class cannot be instantiated directly. Please extend it.'
      )
    }
  }

  index (x, y) {
    return BigInt(y * this.width + x)
  }
  get size () {
    return this.width * this.height
  }
  get indexMax () {
    return this.width * this.height
  }
  get rowMax () {
    return this.width
  }
  loc (index) {
    const y = Math.floor(index / this.rowMax)
    const x = index % this.rowMax
    return [x, y]
  }
  inBounds (x, y) {
    return x >= 0 && y >= 0 && x < this.width && y < this.height
  }

  *keys () {
    const n = this.indexMax
    for (let i = 0; i < n; i++) {
      const lc = this.loc(i)
      yield [lc[0], lc[1], i]
    }
  }
}
