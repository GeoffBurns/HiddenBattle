import fs from 'fs'

const data = JSON.parse(fs.readFileSync('staticAnalysis/depcruise/deps.json'))

const fanOut = new Map()
const fanIn = new Map()

for (const mod of data.modules) {
  fanOut.set(mod.source, mod.dependencies.length)

  for (const dep of mod.dependencies) {
    fanIn.set(dep.resolved, (fanIn.get(dep.resolved) || 0) + 1)
  }
}

function printTop (title, map, n = 10) {
  console.log('\n' + title)
  console.log('-'.repeat(title.length))
  ;[...map.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .forEach(([k, v]) => console.log('   ' + v.toString(), k))
}

printTop('Module Fan-Out', fanOut)
printTop('Module Fan-In', fanIn)

console.log('\nModule Instability (Ce/(Ca+Ce))')
console.log('-------------------------------')

for (const file of fanOut.keys()) {
  const ce = fanOut.get(file) || 0
  const ca = fanIn.get(file) || 0
  const i = ce + ca === 0 ? 0 : (ce / (ce + ca)).toFixed(2)
  console.log('   ' + i, file)
}
