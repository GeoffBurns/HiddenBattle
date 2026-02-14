import fs from 'fs-extra'
import pLimit from 'p-limit'
import process from 'process'
import { fileURLToPath } from 'url'
import path, { dirname } from 'path'
import { summariseWithAI } from './summariser.js'
import { writeKnowledgeBase } from './markdown.js'
import { CONFIG } from './config.js'
import { embed } from './embedder.js'
import { clusterEmbeddings } from './cluster.js'

const __dirname = dirname(fileURLToPath(import.meta.url))

const limit = pLimit(CONFIG.MAX_CONCURRENT_REQUESTS)

function extractPairs (conversation) {
  const messages = Object.values(conversation.mapping)
    .map(m => m.message)
    .filter(Boolean)
    .sort((a, b) => a.create_time - b.create_time)

  const pairs = []

  for (let i = 0; i < messages.length; i++) {
    if (messages[i].author.role === 'user') {
      const prompt = messages[i].content?.parts?.join('') || ''
      const response =
        messages[i + 1]?.author.role === 'assistant'
          ? messages[i + 1].content?.parts?.join('') || ''
          : ''

      if (response) pairs.push({ prompt, response })
    }
  }

  return pairs
}

async function run () {
  console.log('Reading export...')
  console.log('cwd:', process.cwd())
  console.log('__dirname:', __dirname)
  const filePath = path.join(__dirname, '../data/conversations.json')
  // const data = await fs.readJson('../data/conversations.json')
  const data = await fs.readJson(filePath)

  const entries = []

  for (const conv of data) {
    const pairs = extractPairs(conv)

    const tasks = pairs.map(pair =>
      limit(async () => {
        const aiData = await summariseWithAI(pair.prompt, pair.response)

        return {
          ...aiData,
          prompt: pair.prompt,
          response: pair.response
        }
      })
    )

    for (const entry of entries) {
      entry.embedding = await embed(entry.title + '\n' + entry.summary)
    }

    clusterEmbeddings(entries, 6)

    const results = await Promise.all(tasks)
    entries.push(...results)
  }

  console.log('Writing knowledge base...')
  await writeKnowledgeBase(entries)

  console.log('Done. Files written to /output')
}

run().catch(err => console.error(err))
