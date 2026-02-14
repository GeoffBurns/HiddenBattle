import { GoogleGenerativeAI } from '@google/generative-ai'
import dotenv from 'dotenv'
import { CONFIG } from './config.js'
import process from 'process'

dotenv.config()

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)

export async function generateEmbedding (text) {
  const model = genAI.getGenerativeModel({
    model: CONFIG.EMBEDDING_MODEL
  })

  const result = await model.embedContent(text)
  return result.embedding.values
}

import { openai } from './openaiClient.js'

export async function embed (text) {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text
  })

  return response.data[0].embedding
}
