export function cosineSimilarity (a, b) {
  const dot = a.reduce((sum, val, i) => sum + val * b[i], 0)
  const magA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0))
  const magB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0))
  return dot / (magA * magB)
}

export function findSimilar (entries) {
  for (let i = 0; i < entries.length; i++) {
    const related = []

    for (let j = 0; j < entries.length; j++) {
      if (i === j) continue

      const score = cosineSimilarity(entries[i].embedding, entries[j].embedding)

      if (score > 0.82) {
        related.push({ index: j, score })
      }
    }

    entries[i].related = related
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map(r => r.index)
  }

  return entries
}
