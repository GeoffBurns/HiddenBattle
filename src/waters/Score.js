import { makeKey } from '../utilities.js'

export class Score {
  constructor () {
    this.shot = new Set()
    this.semi = new Set()
    this.hint = new Set()
    this.autoMisses = 0
  }
  reset () {
    this.shot.clear()
    this.semi.clear()
    this.hint.clear()
    this.autoMisses = 0
  }
  newShotKey (r, c) {
    const key = makeKey(r, c)
    if (this.shot.has(key)) return null
    return key
  }

  shotReveal (key) {
    this.shot.delete(key)
    this.semi.add(key)
  }
  hintReveal (r, c) {
    const key = makeKey(r, c)
    this.hint.add(key)
  }
  createShotKey (r, c) {
    const key = this.newShotKey(r, c)
    if (key) {
      this.shot.add(key)
    }
    return key
  }

  counts () {
    return [this.noOfShots(), this.semi.size, this.hint.size]
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
