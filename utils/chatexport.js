import fs from 'fs-extra'
import path from 'path'
import { summarise } from './summariser.js'
import { detectTags } from './tagger.js'

const INPUT_FILE = 'conversations.json'
const OUTPUT_DIR = './output'
const OUTPUT_FILE = 'chat-knowledge-base.md'

function slugify (text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
}

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

      pairs.push({ prompt, response })
    }
  }

  return pairs
}

function buildMarkdown (conversations) {
  let toc = `# Chat Knowledge Base\n\n## Table of Contents\n\n`
  let body = ''

  conversations.forEach((conv, convIndex) => {
    const title = conv.title || `Conversation ${convIndex + 1}`
    const pairs = extractPairs(conv)

    pairs.forEach((pair, idx) => {
      const summary = summarise(pair.prompt)
      const combinedText = pair.prompt + '\n' + pair.response
      const tags = detectTags(combinedText)

      const anchor = slugify(`${title}-${idx}-${summary}`)

      toc += `- [${summary}](#${anchor}) ${tags.join(' ')}\n`

      body += `
---

## ${summary}
<a id="${anchor}"></a>

**Conversation:** ${title}  
**Tags:** ${tags.join(' ')}

### Prompt
\`\`\`
${pair.prompt}
\`\`\`

### Response
${pair.response}

`
    })
  })

  return toc + body
}

async function run () {
  console.log('Reading conversations...')
  const data = await fs.readJson(INPUT_FILE)

  await fs.ensureDir(OUTPUT_DIR)

  console.log('Building knowledge base...')
  const markdown = buildMarkdown(data)

  const outputPath = path.join(OUTPUT_DIR, OUTPUT_FILE)
  await fs.writeFile(outputPath, markdown)

  console.log(`Done. Output written to ${outputPath}`)
}

run().catch(err => {
  console.error('Export failed:', err)
})
