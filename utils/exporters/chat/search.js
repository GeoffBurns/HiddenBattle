import fs from 'fs-extra'
import { generateEmbedding } from './embedding.js'
import { cosineSimilarity } from './vector.js'
import process from 'process'

async function search (query) {
  const data = await fs.readJson('./output/vector-index.json')

  const queryEmbedding = await generateEmbedding(query)

  const results = data
    .map(entry => ({
      title: entry.title,
      summary: entry.summary,
      score: cosineSimilarity(queryEmbedding, entry.embedding)
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)

  console.log('\nTop Matches:\n')
  results.forEach(r => {
    console.log(`${r.score.toFixed(3)} - ${r.title}`)
    console.log(r.summary)
    console.log('-----\n')
  })
}

search(process.argv[2])
