export const Player = Object.freeze({
  friend: 'FRIEND',
  enemy: 'ENEMY'
})

export const WeaponMode = Object.freeze({
  sourceSelect: 'SELECT',
  targetAim: 'AIM',
  othersTurn: 'OTHERS'
})
export class steps {
  constructor (player) {
    this.player = player
    this.source = null
    this.sourceHint = null
    this.sourceShadow = null
    this.target = null
    this.mode = WeaponMode.othersTurn
  }

  addSource (source, hint, shadow) {
    this.source = source
    this.sourceHint = hint
    this.sourceShadow = shadow
  }
  endTurn () {
    //  this.source = null
    this.mode = WeaponMode.othersTurn
    this.onEndTurn(this)
  }
  beginTurn () {
    //  this.source = null
    this.mode = WeaponMode.sourceSelect
    this.onBeginTurn(this)
  }
  onEndTurn = Function.prototype
  onBeginTurn = Function.prototype
  onAim = Function.prototype
  onSelect = Function.prototype
}
