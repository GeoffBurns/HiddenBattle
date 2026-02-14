import fs from 'fs-extra'
import path from 'path'

export async function writeKnowledgeBase (entries) {
  let toc = `# Chat Knowledge Base\n\n## Table of Contents\n\n`
  let body = ''
  const tagMap = new Map()

  entries.forEach((entry, i) => {
    const anchor = `entry-${i}`

    toc += `- [${entry.title}](#${anchor}) ${entry.tags
      .map(t => `#${t}`)
      .join(' ')}\n`

    body += `
---

## ${entry.title}
<a id="${anchor}"></a>

**Summary:** ${entry.summary}  
**Tags:** ${entry.tags.map(t => `#${t}`).join(' ')}

### Prompt
\`\`\`
${entry.prompt}
\`\`\`

### Response
${entry.response}
`

    entry.tags.forEach(tag => {
      if (!tagMap.has(tag)) tagMap.set(tag, [])
      tagMap.get(tag).push(entry)
    })
  })

  await fs.ensureDir('./output')
  await fs.writeFile('./output/knowledge-base.md', toc + body)

  await writeTagPages(tagMap)
}

async function writeTagPages (tagMap) {
  await fs.ensureDir('./output/tags')

  for (const [tag, entries] of tagMap.entries()) {
    let content = `# Tag: #${tag}\n\n`

    entries.forEach(entry => {
      content += `
## ${entry.title}

${entry.summary}

---
`
    })

    await fs.writeFile(`./output/tags/${tag}.md`, content)
  }
}
