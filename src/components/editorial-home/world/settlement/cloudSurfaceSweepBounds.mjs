const CELL_SIZE = 2
const TOLERANCE = 1e-6
const MAX_BUILD_CELL_VISITS = 2_000_000
const MAX_QUERY_CELL_VISITS = 16_384
const uncertainBounds = Object.freeze({mayIntersectAabb: () => true})

const cellKey = (x, z) => `${x},${z}`
const cellIndex = value => Math.floor(value / CELL_SIZE)
const gridBoundary = value => Math.abs(value / CELL_SIZE - Math.round(value / CELL_SIZE)) <= TOLERANCE / CELL_SIZE

/**
 * Conservative bounds for one already-created, static, world-space trimesh.
 * Keep the exact Float32 collider coordinates; never replace its triangles.
 * Recreate for another collider/layout. False proves only AABB separation.
 */
export function createSurfaceSweepBounds(vertices, indices) {
  try {
    if (!(vertices instanceof Float32Array) || !(indices instanceof Uint32Array)
      || vertices.length < 9 || vertices.length % 3 || indices.length < 3 || indices.length % 3) return uncertainBounds
    for (const value of vertices) if (!Number.isFinite(value)) return uncertainBounds
    const vertexCount = vertices.length / 3
    for (const index of indices) if (index >= vertexCount) return uncertainBounds

    const cells = new Map()
    let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity, visits = 0
    for (let n = 0; n < indices.length; n += 3) {
      const a = indices[n] * 3, b = indices[n + 1] * 3, c = indices[n + 2] * 3
      const loX = Math.min(vertices[a], vertices[b], vertices[c])
      const hiX = Math.max(vertices[a], vertices[b], vertices[c])
      const loY = Math.min(vertices[a + 1], vertices[b + 1], vertices[c + 1])
      const hiY = Math.max(vertices[a + 1], vertices[b + 1], vertices[c + 1])
      const loZ = Math.min(vertices[a + 2], vertices[b + 2], vertices[c + 2])
      const hiZ = Math.max(vertices[a + 2], vertices[b + 2], vertices[c + 2])
      const x0 = cellIndex(loX - TOLERANCE), x1 = cellIndex(hiX + TOLERANCE)
      const z0 = cellIndex(loZ - TOLERANCE), z1 = cellIndex(hiZ + TOLERANCE)
      if (![x0, x1, z0, z1].every(Number.isSafeInteger)) return uncertainBounds
      const count = (x1 - x0 + 1) * (z1 - z0 + 1)
      if (!Number.isSafeInteger(count) || count > MAX_BUILD_CELL_VISITS - visits) return uncertainBounds
      visits += count
      minX = Math.min(minX, loX); maxX = Math.max(maxX, hiX)
      minZ = Math.min(minZ, loZ); maxZ = Math.max(maxZ, hiZ)
      // Include every cell touched by the whole triangle AABB, including
      // vertical/degenerate faces and both sides of a grid boundary.
      for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) {
        const key = cellKey(x, z), previous = cells.get(key)
        if (previous) {
          previous[0] = Math.min(previous[0], loY)
          previous[1] = Math.max(previous[1], hiY)
        } else cells.set(key, [loY, hiY])
      }
    }

    return Object.freeze({
      mayIntersectAabb(min, max) {
        try {
          if (!min || !max || min.length !== 3 || max.length !== 3) return true
          const lo = [min[0], min[1], min[2]], hi = [max[0], max[1], max[2]]
          if (![...lo, ...hi].every(Number.isFinite) || lo.some((value, axis) => value > hi[axis])) return true
          // Outside this surface's coverage, or touching its/grid boundaries,
          // deliberately leave the decision to Rapier rather than guessing.
          if (lo[0] <= minX + TOLERANCE || hi[0] >= maxX - TOLERANCE
            || lo[2] <= minZ + TOLERANCE || hi[2] >= maxZ - TOLERANCE
            || [lo[0], hi[0], lo[2], hi[2]].some(gridBoundary)) return true
          const x0 = cellIndex(lo[0] - TOLERANCE), x1 = cellIndex(hi[0] + TOLERANCE)
          const z0 = cellIndex(lo[2] - TOLERANCE), z1 = cellIndex(hi[2] + TOLERANCE)
          if (![x0, x1, z0, z1].every(Number.isSafeInteger)) return true
          const count = (x1 - x0 + 1) * (z1 - z0 + 1)
          if (!Number.isSafeInteger(count) || count > MAX_QUERY_CELL_VISITS) return true
          for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) {
            const range = cells.get(cellKey(x, z))
            if (range && hi[1] >= range[0] - TOLERANCE && lo[1] <= range[1] + TOLERANCE) return true
          }
          return false
        } catch {
          return true
        }
      },
    })
  } catch {
    return uncertainBounds
  }
}
