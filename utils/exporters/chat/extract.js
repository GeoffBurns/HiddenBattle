import fs from 'fs-extra'

import process from 'process'
import { fileURLToPath } from 'url'
import path, { dirname } from 'path'
/*
 
const __dirname = dirname(fileURLToPath(import.meta.url))

console.log('cwd:', process.cwd())
console.log('__dirname:', __dirname)
const filePath = path.join(__dirname, '../data/conversations.json')

const rawChats = JSON.parse(fs.readFileSync(filePath))
*/
///////////////////////////////////////////////////////////////
// NORMALISE CHATGPT EXPORT INTO FLAT PROMPT/RESPONSE PAIRS
///////////////////////////////////////////////////////////////

export function extractPromptResponsePairsFromExport (rawChats) {
  const allPairs = []

  for (const convo of rawChats) {
    const branch = getMainBranch(convo.mapping)

    let lastUserMessage = null

    for (const node of branch) {
      const role = node.message?.author?.role
      const text = extractText(node.message)?.trim()

      if (!text) continue

      if (role === 'user') {
        lastUserMessage = {
          conversation_title: convo.title || '',
          conversation_time: convo.create_time || null,
          prompt_id: node.id,
          prompt: text
        }
      }

      if (role === 'assistant' && lastUserMessage) {
        allPairs.push({
          ...lastUserMessage,
          response_id: node.id,
          response: text
        })

        lastUserMessage = null
      }
    }
  }

  return allPairs
}

function getMainBranch (mapping) {
  const root = Object.values(mapping).find(m => m.parent === null)
  const branch = []

  let current = root

  while (current) {
    branch.push(current)
    const nextId = current.children?.[0]
    current = mapping[nextId]
  }

  return branch
}

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
