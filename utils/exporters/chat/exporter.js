/**
 * Production Semantic Chat Exporter
 * ----------------------------------
 * Features:
 * - Fork-aware conversation traversal
 * - Incremental summarisation
 * - Semantic duplicate detection
 * - Incremental embeddings
 * - Cross-linking
 * - Conditional clustering
 * - Crash-safe persistence
 */
import fs from 'fs-extra'
import process from 'process'
import { fileURLToPath } from 'url'
import path, { dirname } from 'path'
import dotenv from 'dotenv'
import { extractPromptResponsePairsFromExport } from './extract.js'

import crypto from 'crypto'
import { GoogleGenAI } from '@google/genai'

///////////////////////////////////////////////////////////////
// CONFIGURATION
///////////////////////////////////////////////////////////////

const __dirname = dirname(fileURLToPath(import.meta.url))
const DATA_PATH = path.join(__dirname, '../data/conversations.json')
const OUTPUT_DIR = path.join(__dirname, '../output')

const GEMINI_TEXT_MODEL = 'gemini-1.5-flash'
const GEMINI_EMBED_MODEL = 'text-embedding-004'

const DUPLICATE_THRESHOLD = 0.94
const CROSS_LINK_THRESHOLD = 0.82
const CLUSTER_COUNT = 6
dotenv.config()
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })

///////////////////////////////////////////////////////////////
// FILE UTILITIES
///////////////////////////////////////////////////////////////

function ensureDir () {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true })
  }
}

function loadJsonSafe (file) {
  if (!fs.existsSync(file)) return []
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'))
  } catch {
    return []
  }
}

function saveJsonAtomic (file, data) {
  const temp = file + '.tmp'
  fs.writeFileSync(temp, JSON.stringify(data, null, 2))
  fs.renameSync(temp, file)
}

///////////////////////////////////////////////////////////////
// HASHING
///////////////////////////////////////////////////////////////

function generateStableHashId (prompt, response) {
  const safePrompt =
    typeof prompt === 'string' ? prompt : JSON.stringify(prompt ?? '')

  const safeResponse =
    typeof response === 'string' ? response : JSON.stringify(response ?? '')

  return crypto
    .createHash('sha256')
    .update(safePrompt + '\n\n' + safeResponse, 'utf8')
    .digest('hex')
}

///////////////////////////////////////////////////////////////
// TEXT EXTRACTION
///////////////////////////////////////////////////////////////

function extractText (message) {
  const parts = message?.content?.parts
  if (!parts) return ''
  if (Array.isArray(parts)) {
    return parts
      .map(p => (typeof p === 'string' ? p : JSON.stringify(p)))
      .join('\n')
  }
  return typeof parts === 'string' ? parts : JSON.stringify(parts)
}

///////////////////////////////////////////////////////////////
// FORK-AWARE TREE TRAVERSAL
///////////////////////////////////////////////////////////////

function extractAllPromptResponsePairs (convo) {
  const mapping = convo.mapping
  const root = Object.values(mapping).find(m => m.parent === null)
  const results = []

  function traverse (node, lastUser) {
    if (!node) return

    const role = node.message?.author?.role
    const text = extractText(node.message)?.trim()

    let currentUser = lastUser

    if (text) {
      if (role === 'user') {
        currentUser = {
          title: convo.title || '',
          time: convo.create_time || null,
          prompt: text
        }
      }

      if (role === 'assistant' && currentUser) {
        results.push({
          ...currentUser,
          response: text
        })
        currentUser = null
      }
    }

    if (node.children?.length) {
      for (const childId of node.children) {
        traverse(mapping[childId], currentUser)
      }
    }
  }

  traverse(root, null)
  return results
}

///////////////////////////////////////////////////////////////
// GEMINI CALLS
///////////////////////////////////////////////////////////////

async function summarise (prompt, response) {
  const res = await ai.models.generateContent({
    model: GEMINI_TEXT_MODEL,
    contents: `
Summarise this conversation concisely.
Return:
- 1-2 sentence summary
- 3-6 tags prefixed with #

User:
${prompt}

Assistant:
${response}
`
  })
  return res.text
}

async function embed (text) {
  const res = await ai.models.embedContent({
    model: GEMINI_EMBED_MODEL,
    content: text
  })
  return res.embedding.values
}

///////////////////////////////////////////////////////////////
// VECTOR MATH
///////////////////////////////////////////////////////////////

function cosineSimilarity (a, b) {
  const dot = a.reduce((sum, val, i) => sum + val * b[i], 0)
  const magA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0))
  const magB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0))
  return dot / (magA * magB)
}

function findSemanticDuplicate (newEmbedding, existing, threshold) {
  let best = null
  let bestScore = 0

  for (const e of existing) {
    if (!e.embedding) continue
    const score = cosineSimilarity(newEmbedding, e.embedding)
    if (score > bestScore) {
      bestScore = score
      best = e
    }
  }

  if (bestScore >= threshold) {
    return { id: best.id, score: bestScore }
  }

  return null
}

///////////////////////////////////////////////////////////////
// K-MEANS CLUSTERING
///////////////////////////////////////////////////////////////

function kMeans (vectors, k) {
  if (!vectors.length) return []

  let centroids = vectors.slice(0, k)
  let assignments = new Array(vectors.length).fill(0)

  for (let iter = 0; iter < 10; iter++) {
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

    for (let c = 0; c < k; c++) {
      const clusterVectors = vectors.filter((_, i) => assignments[i] === c)
      if (!clusterVectors.length) continue

      const dim = clusterVectors[0].length
      const newCentroid = new Array(dim).fill(0)

      clusterVectors.forEach(vec => {
        vec.forEach((v, i) => (newCentroid[i] += v))
      })

      centroids[c] = newCentroid.map(v => v / clusterVectors.length)
    }
  }

  return assignments
}

///////////////////////////////////////////////////////////////
// MAIN PIPELINE
///////////////////////////////////////////////////////////////

async function run () {
  ensureDir()

  const rawConvos = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'))

  const summariesPath = path.join(OUTPUT_DIR, 'summaries.json')
  const embeddedPath = path.join(OUTPUT_DIR, 'embedded.json')
  const crossPath = path.join(OUTPUT_DIR, 'crossLinked.json')
  const clusterPath = path.join(OUTPUT_DIR, 'clustered.json')
  const vectorIndexPath = path.join(OUTPUT_DIR, 'vector-index.json')

  const summaries = loadJsonSafe(summariesPath)
  const embedded = loadJsonSafe(embeddedPath)
  const crossLinked = loadJsonSafe(crossPath)
  const clustered = loadJsonSafe(clusterPath)

  const summaryIds = new Set(summaries.map(s => s.id))
  const embeddingIds = new Set(embedded.map(e => e.id))

  const allPairs = rawConvos.flatMap(extractAllPromptResponsePairs)

  let newEmbeddingsAdded = false

  for (const entry of allPairs) {
    const id = generateStableHashId(entry.prompt, entry.response)

    if (embeddingIds.has(id)) continue

    try {
      const lightweightEmbedding = await embed(
        entry.prompt + '\n\n' + entry.response
      )

      const duplicate = findSemanticDuplicate(
        lightweightEmbedding,
        embedded,
        DUPLICATE_THRESHOLD
      )

      if (duplicate) {
        embedded.push({
          id,
          duplicateOf: duplicate.id,
          embedding: lightweightEmbedding
        })
        saveJsonAtomic(embeddedPath, embedded)
        embeddingIds.add(id)
        newEmbeddingsAdded = true
        continue
      }

      let summaryRecord

      if (summaryIds.has(id)) {
        summaryRecord = summaries.find(s => s.id === id)
      } else {
        const summaryText = await summarise(entry.prompt, entry.response)
        const tags = summaryText.match(/#\w+/g) || []

        summaryRecord = { id, summary: summaryText, tags }
        summaries.push(summaryRecord)
        saveJsonAtomic(summariesPath, summaries)
        summaryIds.add(id)
      }

      embedded.push({ id, embedding: lightweightEmbedding })
      saveJsonAtomic(embeddedPath, embedded)
      saveJsonAtomic(vectorIndexPath, embedded)

      embeddingIds.add(id)
      newEmbeddingsAdded = true

      const related = embedded
        .filter(e => e.id !== id && e.embedding)
        .map(e => ({
          id: e.id,
          score: cosineSimilarity(lightweightEmbedding, e.embedding)
        }))
        .filter(r => r.score > CROSS_LINK_THRESHOLD)
        .sort((a, b) => b.score - a.score)
        .slice(0, 5)

      crossLinked.push({ id, related })
      saveJsonAtomic(crossPath, crossLinked)
    } catch (err) {
      console.error('Gemini failure, partial progress saved:', err.message)
      continue
    }
  }

  if (newEmbeddingsAdded) {
    console.log('New embeddings detected → reclustering')

    const vectors = embedded.map(e => e.embedding).filter(Boolean)
    const assignments = kMeans(vectors, CLUSTER_COUNT)

    const clusterRecords = embedded
      .filter(e => e.embedding)
      .map((e, i) => ({
        id: e.id,
        cluster: assignments[i]
      }))

    saveJsonAtomic(clusterPath, clusterRecords)
  } else {
    console.log('No new embeddings → skipping clustering')
  }

  console.log('Done.')
}

run()
