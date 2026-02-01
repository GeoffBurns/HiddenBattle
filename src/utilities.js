export function randomElement (array) {
  const randomIndex = Math.floor(Math.random() * array.length)
  const randomObject = array[randomIndex]
  return randomObject
}

export function dedupCSV (str, delimiter) {
  const uniqueSet = [...new Set(str.split(delimiter))].join(delimiter)
  return uniqueSet
}
export function makeKey (r, c) {
  return `${r},${c}`
}
export function parsePair (key) {
  const pair = key.split(',')
  const r = Number.parseInt(pair[0])
  const c = Number.parseInt(pair[1])
  return [r, c]
}
export function makeKeyId (r, c, id) {
  return `${r},${c}:${id}`
}
export function makeKeyAndId (key, id) {
  return `${key}:${id}`
}
export function parseTriple (keyid) {
  if (!keyid) return null
  const tple = keyid?.split(':')
  const pair = tple[0]?.split(',')
  const r = Number.parseInt(pair[0])
  const c = Number.parseInt(pair[1])
  const id = Number.parseInt(tple[1])
  return [r, c, id]
}
export function coordsFromCell (cell) {
  const r = Number.parseInt(cell.dataset.r)
  const c = Number.parseInt(cell.dataset.c)
  return [r, c]
}
export function listFromCell (cell) {
  const retrievedJson = cell.dataset.numbers
  if (!retrievedJson) return null
  const stringArray = JSON.parse(retrievedJson) || []
  return stringArray.map(numStr => parseInt(numStr, 10))
}
export function keyListFromCell (cell, key) {
  const retrieved = cell.dataset[key]
  if (!retrieved) return null
  return retrieved.split('|') || []
}
export function keyIdsListFromCell (cell, key) {
  const retrieved = cell.dataset[key]
  if (!retrieved) return null
  return retrieved.split('|') || []
}
export function addKeyToCell (cell, key, addon) {
  const retrieved = cell.dataset[key]
  let result = ''
  if (!retrieved) {
    result = addon
  } else {
    result = retrieved + '|' + addon
  }
  cell.dataset[key] = dedupCSV(result, '|')
}
export function addKeysToCell (cell, key, addons) {
  const retrieved = cell.dataset[key]
  let result = ''
  if (!retrieved) {
    result = addons.join('|')
  } else {
    result = retrieved + '|' + addons.join('|')
  }
  cell.dataset[key] = dedupCSV(result, '|')
}
export function setCellCoords (cell, r, c) {
  cell.dataset.r = r
  cell.dataset.c = c
}
export function setCellList (cell, list) {
  cell.dataset.numbers = JSON.stringify(list)
}
export function addToCellList (cell, item) {
  let num = new Set(listFromCell(cell))
  num.add(item)
  cell.dataset.numbers = JSON.stringify(num)
}

export function cellListContains (cell, item) {
  let num = new Set(listFromCell(cell))
  return num.has(item)
}
export function first (arr) {
  if (!arr || arr.length === 0) return null
  return arr[0]
}

export function findClosestCoordKey (coordsList, refR, refC) {
  return findClosestCoord(coordsList, refR, refC, parsePair)
}

export function findClosestCoord (coordsList, refR, refC, getter) {
  let closestCoord = null
  let minDistance = Infinity
  for (const coord of coordsList) {
    const [r, c] = getter ? getter(coord) : coord
    const distance = Math.sqrt(Math.pow(r - refR, 2) + Math.pow(c - refC, 2))

    // If this distance is smaller than our current minimum
    if (distance < minDistance) {
      minDistance = distance // Update the minimum distance
      closestCoord = coord // Store the current coordinate as the closest
    }
  }

  return closestCoord
}

export function shuffleArray (array) {
  for (let i = array.length - 1; i > 0; i--) {
    let j = Math.floor(Math.random() * (i + 1))
    let temp = array[i]
    array[i] = array[j]
    array[j] = temp
  }
  return array
}

export function lazy (obj, prop, fn) {
  Object.defineProperty(obj, prop, {
    get () {
      const value = fn.call(this)
      Object.defineProperty(this, prop, { value })
      return value
    },
    configurable: true
  })
}
