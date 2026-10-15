export interface SurfaceSweepBounds {
  /** False proves conservative separation; true delegates exact contact to Rapier. */
  mayIntersectAabb(min: ArrayLike<number>, max: ArrayLike<number>): boolean;
}
/** Exact Float32/Uint32 buffers for an existing static world-space collider.
 * Invalid/unbounded input fails open; recreate when the collider/layout changes.
 */
export function createSurfaceSweepBounds(vertices: Float32Array, indices: Uint32Array): SurfaceSweepBounds;
