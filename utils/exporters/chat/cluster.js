import { kmeans } from 'ml-kmeans'

function autoK (n) {
  if (n <= 5) return 2
  if (n <= 15) return 3
  if (n <= 40) return 5
  return Math.floor(Math.sqrt(n))
}

export function clusterEmbeddings (entries, desiredK = 6) {
  const n = entries.length

  if (n < 2) {
    // Nothing to cluster
    entries.forEach(e => (e.cluster = 0))
    return entries
  }

  // Ensure valid k
  const k = Math.min(autoK(n), n - 1)

  const vectors = entries.map(e => e.embedding)

  const result = kmeans(vectors, k)

  entries.forEach((entry, i) => {
    entry.cluster = result.clusters[i]
  })

  return entries
}
