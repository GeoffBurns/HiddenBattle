function distance (a, b) {
  return Math.sqrt(a.reduce((sum, val, i) => sum + (val - b[i]) ** 2, 0))
}

function average (vectors) {
  const dim = vectors[0].length
  const centroid = new Array(dim).fill(0)

  vectors.forEach(vec => {
    vec.forEach((val, i) => {
      centroid[i] += val
    })
  })

  return centroid.map(v => v / vectors.length)
}

export function kMeans (entries, k = 6, iterations = 10) {
  let centroids = entries.slice(0, k).map(e => e.embedding)

  for (let iter = 0; iter < iterations; iter++) {
    const clusters = Array.from({ length: k }, () => [])

    entries.forEach(entry => {
      const distances = centroids.map(c => distance(entry.embedding, c))

      const clusterIndex = distances.indexOf(Math.min(...distances))
      clusters[clusterIndex].push(entry)
      entry.cluster = clusterIndex
    })

    centroids = clusters.map(cluster =>
      cluster.length ? average(cluster.map(e => e.embedding)) : centroids[0]
    )
  }

  return entries
}
