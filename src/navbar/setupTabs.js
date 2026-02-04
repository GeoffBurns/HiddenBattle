import { bh } from '../terrain/terrain.js'
import { trackClick, trackTab } from './gtag.js'
import { SavedCustomMap } from '../terrain/map.js'
import { storeShips } from '../waters/saveCustomMap.js'

export function switchTo (target, huntMode, mapName) {
  if (target) {
    const params = new URLSearchParams()
    const map = bh.map
    if (!mapName) {
      params.append('height', map.rows)
      params.append('width', map.cols)
    }
    mapName = mapName || map.title
    params.append('mapName', mapName)
    params.append('terrain', bh.terrain.tag)
    const result = storeShips(params, huntMode, target, map)

    if (result) {
      // alert('going to ' + result)
      globalThis.location.href = result
    }
  }
}
class Tab {
  constructor (name) {
    this.name = name
    this.element = document.getElementById(`tab-${this.name}`)
    this.handers = new Set()
  }
  addClickListener (hander) {
    this.element?.addEventListener('click', hander)
    this.handers.add(hander)
  }
  overrideClickListener (hander) {
    for (const h of this.handers) {
      this.element?.removeEventListener('click', h)
    }
    this.handers.clear()
    this.addClickListener(hander)
  }
  youAreHere () {
    this.element?.classList.add('you-are-here')
  }
}

export const tabs = {
  build: null,
  add: null,
  hide: null,
  seek: null,
  list: null,
  rules: null,
  import: null,
  about: null,
  print: null,
  source: null
}

export function setupTabs (huntMode) {
  function switchToSeek () {
    switchTo('battleseek', huntMode)
  }
  function switchToHide () {
    switchTo('index', huntMode)
  }
  function switchToBuild () {
    switchTo('battlebuild', huntMode)
  }

  function switchToList () {
    switchTo('maplist', huntMode)
  }
  function switchToRules () {
    switchTo('rules', huntMode)
  }

  function switchToImport () {
    // Create a hidden file input
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'application/json'

    input.onchange = async e => {
      const file = e.target.files[0]
      if (!file) return

      try {
        const text = await file.text()
        const map = new SavedCustomMap(JSON.parse(text))
        const maps = bh.maps
        if (maps.getMap(map.title) || maps.getCustomMap(map.title)) {
          if (
            !confirm(
              'A map with this title already exists. Do you want to overwrite it?'
            )
          ) {
            return
          }
        }
        map.saveToLocalStorage()

        trackClick(map, 'import map')
        alert('Map imported successfully.')
      } catch (err) {
        alert('Invalid JSON: ' + err.message)
      }
    }

    // Trigger the file dialog
    input.click()
  }

  tabs.build = new Tab('build')
  tabs.add = new Tab('add')
  tabs.hide = new Tab('hide')
  tabs.seek = new Tab('seek')
  tabs.list = new Tab('list')
  tabs.rules = new Tab('rules')
  tabs.import = new Tab('import')
  tabs.about = new Tab('about')
  tabs.source = new Tab('source')
  tabs.print = new Tab('print')
  if (huntMode === 'build') {
    tabs.build.youAreHere()
    tabs.add.youAreHere()
  } else {
    tabs.build?.addClickListener(switchToBuild)

    tabs.add?.addClickListener(switchToBuild)
  }

  if (huntMode === 'hide') {
    tabs.hide?.youAreHere()
  } else {
    tabs.hide?.addClickListener(switchToHide)
  }

  if (huntMode === 'seek') {
    tabs.seek?.youAreHere()
  } else {
    tabs.seek?.addClickListener(switchToSeek)
  }

  if (huntMode === 'list') {
    tabs.build?.youAreHere()
    tabs.list?.youAreHere()
  } else {
    tabs.list?.addClickListener(switchToList)
  }
  if (huntMode === 'rules') {
    tabs.build?.youAreHere()
    tabs.rules?.youAreHere()
  } else {
    tabs.rules?.addClickListener(switchToRules)
  }

  if (huntMode !== 'import') {
    tabs.import?.addClickListener(switchToImport)
  }
  if (huntMode === 'print') {
    tabs.build?.youAreHere()
    tabs.print?.youAreHere()
  }
  tabs.print?.addClickListener(function () {
    trackTab('print')
    globalThis.print()
  })

  tabs.about?.addClickListener(function () {
    trackTab('go to blog')
    globalThis.location.href =
      'https://geoffburns.blogspot.com/2015/10/pencil-and-paper-battleships.html'
  })
  tabs.source?.addClickListener(function () {
    trackTab('go to source code')
    globalThis.location.href = 'https://github.com/GeoffBurns/battleship'
  })
}
