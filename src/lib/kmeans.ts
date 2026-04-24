export type KMeansResult = {
  assignments: number[];
  centroids: number[][];
};

function euclideanDistanceSquared(a: number[], b: number[]): number {
  let sum = 0;
  for (let i = 0; i < a.length; i += 1) {
    const d = a[i] - b[i];
    sum += d * d;
  }
  return sum;
}

function normalizeRows(rows: number[][]): number[][] {
  if (rows.length === 0) return [];
  const dims = rows[0].length;
  const mins = Array.from({ length: dims }, () => Number.POSITIVE_INFINITY);
  const maxs = Array.from({ length: dims }, () => Number.NEGATIVE_INFINITY);

  for (const row of rows) {
    for (let i = 0; i < dims; i += 1) {
      mins[i] = Math.min(mins[i], row[i]);
      maxs[i] = Math.max(maxs[i], row[i]);
    }
  }

  return rows.map((row) =>
    row.map((value, i) => {
      const span = maxs[i] - mins[i];
      if (span === 0) return 0;
      return (value - mins[i]) / span;
    })
  );
}

function nearestCentroidIndex(point: number[], centroids: number[][]): number {
  let best = 0;
  let bestDistance = Number.POSITIVE_INFINITY;
  for (let i = 0; i < centroids.length; i += 1) {
    const d = euclideanDistanceSquared(point, centroids[i]);
    if (d < bestDistance) {
      bestDistance = d;
      best = i;
    }
  }
  return best;
}

export function kMeans(rawRows: number[][], k: number, maxIterations = 25): KMeansResult {
  if (rawRows.length === 0) return { assignments: [], centroids: [] };

  const rows = normalizeRows(rawRows);
  const clusterCount = Math.max(1, Math.min(k, rows.length));
  const dims = rows[0].length;

  // Deterministic seed: evenly-spaced picks from sorted indices.
  const centroids: number[][] = [];
  for (let i = 0; i < clusterCount; i += 1) {
    const pick = Math.floor((i * rows.length) / clusterCount);
    centroids.push([...rows[pick]]);
  }

  const assignments = new Array(rows.length).fill(0);

  for (let iter = 0; iter < maxIterations; iter += 1) {
    let changed = false;

    for (let i = 0; i < rows.length; i += 1) {
      const next = nearestCentroidIndex(rows[i], centroids);
      if (next !== assignments[i]) {
        assignments[i] = next;
        changed = true;
      }
    }

    const sums = Array.from({ length: clusterCount }, () => new Array(dims).fill(0));
    const counts = new Array(clusterCount).fill(0);

    for (let i = 0; i < rows.length; i += 1) {
      const c = assignments[i];
      counts[c] += 1;
      for (let d = 0; d < dims; d += 1) {
        sums[c][d] += rows[i][d];
      }
    }

    for (let c = 0; c < clusterCount; c += 1) {
      if (counts[c] === 0) continue;
      for (let d = 0; d < dims; d += 1) {
        centroids[c][d] = sums[c][d] / counts[c];
      }
    }

    if (!changed) break;
  }

  return { assignments, centroids };
}
