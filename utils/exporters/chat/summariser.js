import { openai } from './openaiClient.js'
import { CONFIG } from './config.js'
import { model } from './geminiClient.js'

export async function summariseWithGemini (prompt, response) {
  const input = `
You are generating a structured technical knowledge base entry.

Return ONLY valid JSON with this exact structure:

{
  "title": "short technical title",
  "summary": "2-3 sentence technical explanation",
  "tags": ["tag1", "tag2"]
}

Rules:
- tags must be lowercase
- no hashtags in tags
- no prose outside JSON
- no markdown formatting
- focus on technical classification

Conversation:

USER:
${prompt}

ASSISTANT:
${response}
`

  const result = await model.generateContent({
    contents: [{ role: 'user', parts: [{ text: input }] }],
    generationConfig: {
      temperature: 0.2,
      maxOutputTokens: CONFIG.MAX_OUTPUT_TOKENS
    }
  })

  const text = result.response.text().trim()

  try {
    return JSON.parse(text)
  } catch (err) {
    console.error('⚠ JSON parse failed. Raw output:', text)
    return {
      title: prompt.slice(0, 60),
      summary: prompt.slice(0, 200),
      tags: []
    }
  }
}

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
