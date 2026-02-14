import fs from 'fs'

const data = JSON.parse(fs.readFileSync('conversations.json', 'utf8'))

function slugify (text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, '-')
}

let output = `# Chat Export\n\n## Table of Contents\n\n`

let sections = []

data.forEach((conv, i) => {
  const messages = Object.values(conv.mapping)
    .map(m => m.message)
    .filter(Boolean)

  let pairs = []
  for (let j = 0; j < messages.length; j++) {
    if (messages[j].author.role === 'user') {
      const prompt = messages[j].content.parts.join('')
      const response = messages[j + 1]?.content?.parts?.join('') || ''

      pairs.push({ prompt, response })
    }
  }

  pairs.forEach((p, idx) => {
    const summary = p.prompt.slice(0, 100).replace(/\n/g, ' ')
    const anchor = slugify(`conv-${i}-q-${idx}`)

    output += `- [${summary}](#${anchor})\n`

    sections.push(`
---

## ${summary}
<a id="${anchor}"></a>

### Prompt
${p.prompt}

### Response
${p.response}
`)
  })
})

output += sections.join('\n')

fs.writeFileSync('export.md', output)
