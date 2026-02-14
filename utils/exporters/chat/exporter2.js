/**
 * exporter.js
 *
 * Production-grade Chat Export Processor
 * ---------------------------------------
 * This system:
 *
 * 1. Loads raw chat exports
 * 2. Generates Gemini-powered summaries
 * 3. Detects tags automatically
 * 4. Creates embeddings incrementally
 * 5. Builds a local vector search index
 * 6. Auto-crosslinks related threads
 * 7. Performs k-means topic clustering
 * 8. Writes progress to disk entry-by-entry
 * 9. Survives Gemini failures with partial persistence
 *
 * Architecture Goals:
 * - Incremental processing
 * - Fault tolerance
 * - Deterministic disk writes
 * - Semantic enrichment
 * - No data loss on crash
 */
import fs from 'fs-extra'
//import pLimit from 'p-limit'
import process from 'process'
import { fileURLToPath } from 'url'
import path, { dirname } from 'path'
import dotenv from 'dotenv'
import { extractPromptResponsePairsFromExport } from './extract.js'

const __dirname = dirname(fileURLToPath(import.meta.url))

import crypto from 'crypto'
import { GoogleGenAI } from '@google/genai'

///////////////////////////////////////////////////////////////
// CONFIGURATION
///////////////////////////////////////////////////////////////

const OUTPUT_DIR = './output'
const RAW_INPUT_FILE = './chat-export.json'
const GEMINI_MODEL_TEXT = 'gemini-2.5-flash'
const GEMINI_MODEL_EMBED = 'text-embedding-004'
const CLUSTER_COUNT = 6
const CROSS_LINK_THRESHOLD = 0.82

dotenv.config()

//const limit = pLimit(CONFIG.MAX_CONCURRENT_REQUESTS)

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })

///////////////////////////////////////////////////////////////
// UTILITIES
///////////////////////////////////////////////////////////////

function ensureOutputDirectoryExists () {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true })
  }
}

function loadJsonSafe (filePath) {
  if (!fs.existsSync(filePath)) return []
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'))
  } catch {
    return []
  }
}

function saveJsonAtomic (filePath, data) {
  const tempPath = filePath + '.tmp'
  fs.writeFileSync(tempPath, JSON.stringify(data, null, 2))
  fs.renameSync(tempPath, filePath)
}

function generateStableHashId (inputText) {
  return crypto.createHash('sha256').update(inputText).digest('hex')
}

///////////////////////////////////////////////////////////////
// GEMINI SUMMARISATION
///////////////////////////////////////////////////////////////

async function generateGeminiSummary (prompt, response) {
  const summaryPrompt = `
Summarise this conversation concisely.
Return:
- A 1-2 sentence summary
- 3-6 tags prefixed with #

User:
${prompt}

Assistant:
${response}
`

  const result = await ai.models.generateContent({
    model: GEMINI_MODEL_TEXT,
    contents: summaryPrompt
  })

  return result.text
}

///////////////////////////////////////////////////////////////
// GEMINI EMBEDDINGS
///////////////////////////////////////////////////////////////

async function generateGeminiEmbedding (text) {
  const result = await ai.models.embedContent({
    model: GEMINI_MODEL_EMBED,
    content: text
  })

  return result.embedding.values
}

///////////////////////////////////////////////////////////////
// COSINE SIMILARITY
///////////////////////////////////////////////////////////////

function cosineSimilarity (a, b) {
  const dot = a.reduce((sum, val, i) => sum + val * b[i], 0)
  const magA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0))
  const magB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0))
  return dot / (magA * magB)
}

///////////////////////////////////////////////////////////////
// K-MEANS CLUSTERING
///////////////////////////////////////////////////////////////

function kMeansCluster (vectors, k) {
  if (vectors.length === 0) return []

  let centroids = vectors.slice(0, k)
  let assignments = new Array(vectors.length).fill(0)

  for (let iteration = 0; iteration < 10; iteration++) {
    // Assign
    for (let i = 0; i < vectors.length; i++) {
      let best = 0
      let bestScore = -1

      for (let c = 0; c < centroids.length; c++) {
        const score = cosineSimilarity(vectors[i], centroids[c])
        if (score > bestScore) {
          bestScore = score
          best = c
        }
      }

      assignments[i] = best
    }

    // Update
    for (let c = 0; c < k; c++) {
      const clusterVectors = vectors.filter((_, i) => assignments[i] === c)
      if (clusterVectors.length === 0) continue

      const dimension = clusterVectors[0].length
      const newCentroid = new Array(dimension).fill(0)

      clusterVectors.forEach(vec => {
        vec.forEach((val, i) => {
          newCentroid[i] += val
        })
      })

      centroids[c] = newCentroid.map(v => v / clusterVectors.length)
    }
  }

  return assignments
}

///////////////////////////////////////////////////////////////
// MAIN EXPORT PIPELINE
///////////////////////////////////////////////////////////////

async function runExporter () {
  ensureOutputDirectoryExists()
  console.log('cwd:', process.cwd())
  console.log('__dirname:', __dirname)
  const filePath = path.join(__dirname, '../data/conversations.json')

  const rawConversations = JSON.parse(fs.readFileSync(filePath, 'utf8'))
  const rawChats = extractPromptResponsePairsFromExport(rawConversations)

  const summaries = loadJsonSafe(`${OUTPUT_DIR}/summaries.json`)
  const embedded = loadJsonSafe(`${OUTPUT_DIR}/embedded.json`)
  const crossLinked = loadJsonSafe(`${OUTPUT_DIR}/crossLinked.json`)
  const clustered = loadJsonSafe(`${OUTPUT_DIR}/clustered.json`)
  const vectorIndex = loadJsonSafe(`${OUTPUT_DIR}/vector-index.json`)

  const existingIds = new Set(embedded.map(e => e.id))
  let processedCount = 0
  for (const entry of rawChats) {
    const prompt = entry.prompt || ''
    const response = entry.response || ''
    console.log('Raw entry:', { prompt, response })
    const id = generateStableHashId(entry.prompt + entry.response)

    if (existingIds.has(id)) continue

    console.log('Processing:', id)

    try {
      ///////////////////////////////////////////////////////////
      // 1. Summarise
      ///////////////////////////////////////////////////////////
      const summaryText = await generateGeminiSummary(
        entry.prompt,
        entry.response
      )

      const detectedTags = summaryText.match(/#\w+/g) || []

      const summaryRecord = {
        id,
        summary: summaryText,
        tags: detectedTags,
        prompt: entry.prompt,
        response: entry.response
      }

      summaries.push(summaryRecord)
      saveJsonAtomic(`${OUTPUT_DIR}/summaries.json`, summaries)
      processedCount++
      console.log(`summarized ${processedCount} entries.`)
      ///////////////////////////////////////////////////////////
      // 2. Embed
      ///////////////////////////////////////////////////////////
      const embedding = await generateGeminiEmbedding(summaryText)

      const embeddingRecord = { id, embedding }
      embedded.push(embeddingRecord)
      vectorIndex.push(embeddingRecord)

      saveJsonAtomic(`${OUTPUT_DIR}/embedded.json`, embedded)
      saveJsonAtomic(`${OUTPUT_DIR}/vector-index.json`, vectorIndex)
      console.log(`embedded ${processedCount} entries.`)
      ///////////////////////////////////////////////////////////
      // 3. Cross-link
      ///////////////////////////////////////////////////////////
      const related = embedded
        .filter(e => e.id !== id)
        .map(e => ({
          id: e.id,
          score: cosineSimilarity(embedding, e.embedding)
        }))
        .filter(e => e.score > CROSS_LINK_THRESHOLD)
        .sort((a, b) => b.score - a.score)
        .slice(0, 5)

      crossLinked.push({ id, related })
      saveJsonAtomic(`${OUTPUT_DIR}/crossLinked.json`, crossLinked)
      console.log(`cross-linked ${processedCount} entries.`)
    } catch (error) {
      console.error('Gemini error. Partial progress saved.', error.message)
      continue
    }
  }

  /////////////////////////////////////////////////////////////
  // 4. Clustering (runs after all embeddings done)
  /////////////////////////////////////////////////////////////

  const vectors = embedded.map(e => e.embedding)
  const assignments = kMeansCluster(vectors, CLUSTER_COUNT)

  const clusterRecords = embedded.map((e, i) => ({
    id: e.id,
    cluster: assignments[i]
  }))

  saveJsonAtomic(`${OUTPUT_DIR}/clustered.json`, clusterRecords)

  console.log('Export complete.')
}

runExporter()
