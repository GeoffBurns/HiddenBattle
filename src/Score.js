export class Score {
  constructor () {
    this.shot = new Set()
    this.semi = new Set()
    this.autoMisses = 0
  }
  reset () {
    this.shot.clear()
    this.semi.clear()
    this.autoMisses = 0
  }
  newShotKey (r, c) {
    const key = `${r},${c}`
    if (this.shot.has(key)) return null
    return key
  }

  shotReveal (key) {
    this.shot.delete(key)
    this.semi.add(key)
  }

  createShotKey (r, c) {
    const key = this.newShotKey(r, c)
    if (key) {
      this.shot.add(key)
    }
    return key
  }
  noOfShots () {
    return this.shot.size - this.autoMisses
  }

  addAutoMiss (r, c) {
    const key = this.createShotKey(r, c)
    if (!key) return null // already shot here
    this.autoMisses++
    return key
  }
}
