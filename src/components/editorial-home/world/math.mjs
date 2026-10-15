export const SEGMENT_LENGTH = 44;
export const SEGMENT_COUNT = 6;
export const WORLD_SPAN = SEGMENT_LENGTH * SEGMENT_COUNT;
export const RECYCLE_Z = 56;
export const PORTAL_Z = 10;

/** Keep recycled architecture in a bounded interval, including long advances. */
export function wrapSegmentZ(z) {
  return z > RECYCLE_Z ? z - Math.ceil((z - RECYCLE_Z) / WORLD_SPAN) * WORLD_SPAN : z;
}

/** Count actual forward crossings, never proximity or time spent in auto mode. */
export function crossedPortal(previousZ, nextZ, exploring) {
  return exploring && previousZ <= PORTAL_Z && nextZ > PORTAL_Z;
}

/** A stable three-part sequence also accepts a negative manual topic offset. */
export function sectionTopic(ordinal, offset = 0) {
  return ((ordinal + offset) % 3 + 3) % 3;
}

export function bounded(value, minimum, maximum) {
  return Number.isFinite(value) ? Math.min(maximum, Math.max(minimum, value)) : 0;
}
