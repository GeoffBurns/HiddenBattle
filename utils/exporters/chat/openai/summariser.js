import { openai } from './openaiClient.js'
import { CONFIG } from './config.js'

export async function summariseWithAI (prompt, response) {
  const content = `
You are generating a structured knowledge base entry.

Return valid JSON with:
{
  "title": "short descriptive title",
  "summary": "2-3 sentence technical summary",
  "tags": ["tag1", "tag2"]
}

Be precise and technical. Use lowercase tags.
Conversation:

USER:
${prompt}

ASSISTANT:
${response}
`

  const completion = await openai.chat.completions.create({
    model: CONFIG.MODEL,
    temperature: 0.2,
    max_tokens: CONFIG.MAX_TOKENS,
    messages: [
      { role: 'system', content: 'You produce structured JSON only.' },
      { role: 'user', content }
    ]
  })

  const text = completion.choices[0].message.content.trim()

  try {
    return JSON.parse(text)
  } catch {
    console.error('⚠ Failed to parse JSON. Raw output:', text)
    return {
      title: prompt.slice(0, 60),
      summary: prompt.slice(0, 200),
      tags: []
    }
  }
}
