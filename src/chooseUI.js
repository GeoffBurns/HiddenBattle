import { gameMaps } from './maps.js'

export class ChooseUI {
  constructor (targetId) {
    this.choose = document.getElementById(targetId)
  }

  addOption (id, choice, defaultIndex, defaultText) {
    let option = document.createElement('option')
    option.value = id
    option.textContent = choice
    this.choose.appendChild(option)
    if (id === defaultIndex || choice === defaultText) {
      option.selected = 'selected'
    }
  }

  onChange (callback) {
    this.choose.addEventListener('change', function () {
      const index = this.value
      const text = this.options[this.selectedIndex].textContent
      callback(index, text)
    })
  }
}

export class ChooseFromListUI extends ChooseUI {
  constructor (list, targetId) {
    super(targetId)
    this.list = list
  }

  setup (callback, selectedId, selectedText) {
    let id = 0
    this.list.forEach(choice => {
      this.addOption(id, choice, selectedId, selectedText)
      id++
    })
    this.onChange(callback)
  }
}

export class ChooseNumberUI extends ChooseUI {
  constructor (min, max, step, targetId) {
    super(targetId)
    this.min = min
    this.max = max
    this.step = step
  }

  setup (callback, defaultIndex) {
    if (defaultIndex === undefined) defaultIndex = this.min
    for (let i = this.min; i <= this.max; i += this.step) {
      this.addOption(i, i, defaultIndex, defaultIndex)
    }
    this.onChange(callback)
  }
}
