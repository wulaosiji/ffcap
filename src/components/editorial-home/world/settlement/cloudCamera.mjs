import { Vector3 } from 'three'

export const CLOUD_INTRO_SECONDS = 16
const clamp = n => Math.max(0, Math.min(1, Number.isFinite(n) ? n : 0))
// One time mapping for the entire shot: smoothly accelerate, cruise, then
// smoothly decelerate. Its velocity never drops to zero inside the shot.
const ease = (n, ramp = .16) => {
  const lead = value => {
    const t = value / ramp
    return ramp * (t ** 3 - .5 * t ** 4) / (1 - ramp)
  }
  if (n < ramp) return lead(n)
  if (n > 1 - ramp) return 1 - lead(1 - n)
  return (n - ramp / 2) / (1 - ramp)
}
const EXPLORER_YAW = .053
const EXPLORER_PITCH = .265

/** The reveal fits the entire authored island, including its rock foundation. */
export function fitIslandDistance(radius, aspect, fov = 53) {
  const halfVertical = fov * Math.PI / 360
  const halfHorizontal = Math.atan(Math.tan(halfVertical) * Math.max(.2, aspect))
  return Math.max(1, radius) / Math.sin(Math.min(halfVertical, halfHorizontal)) * 1.12
}

/** Fit all eight corners in the actual view, without a wasteful enclosing sphere. */
export function fitIslandBoxDistance(halfExtents, aspect, direction, fov = 53) {
  const forward = new Vector3(...direction).normalize()
  const right = new Vector3(0, 1, 0).cross(forward).normalize()
  const up = forward.clone().cross(right).normalize()
  const tanV = Math.tan(fov * Math.PI / 360), tanH = tanV * Math.max(.2, aspect)
  let distance = 1
  for (const x of [-1, 1]) for (const y of [-1, 1]) for (const z of [-1, 1]) {
    const corner = new Vector3(x * halfExtents[0], y * halfExtents[1], z * halfExtents[2])
    const depth = corner.dot(forward)
    distance = Math.max(distance, depth + Math.abs(corner.dot(right)) * 1.10 / tanH, depth + Math.abs(corner.dot(up)) * 1.10 / tanV)
  }
  return distance
}

export function createIslandOverview({ center, halfExtents, aspect, fov = 53 }) {
  const direction = new Vector3(.46, .32, 1).normalize()
  // Desktop framing is height-locked from square through ultrawide. The loading
  // poster uses this same pose with extra sky on either side; wider windows must
  // reveal more sky, not zoom/crop the island during the WebGL handoff.
  const distance = fitIslandBoxDistance(halfExtents, Math.min(1,aspect), direction.toArray(), fov)
  return {position: direction.multiplyScalar(distance).add(new Vector3(...center)).toArray(), target: [...center]}
}

/** Keep this pose identical to the initial, unobstructed free-exploration camera. */
export function createExplorerCameraPose(spawn, mobile = false, profile) {
  const distance = mobile ? (profile?.distanceMobile ?? 4.6) : (profile?.distanceDesktop ?? 5.3)
  const yaw = profile?.yaw ?? EXPLORER_YAW, pitch = profile?.pitch ?? EXPLORER_PITCH
  return {
    position: [
      spawn[0] + Math.sin(yaw) * distance,
      spawn[1] + (profile?.baseHeight ?? 1.5) + Math.sin(pitch) * distance,
      spawn[2] + Math.cos(yaw) * distance,
    ],
    target: [spawn[0], spawn[1] + (profile?.targetHeight ?? 1.32), spawn[2]],
  }
}

/**
 * Complete a full island revolution while radius and height decrease together.
 * Continue through the small remaining azimuth to the exact explorer shoulder;
 * the current courtyard needs about 392 degrees, never a shortened 328-degree
 * substitute. One global time mapping keeps all three movements continuous.
 * This is the authored full-island route, not a generic path planner.
 */
export function createCloudCameraPath({ heroPosition, heroTarget, spawn, mobile = false, cameraProfile }) {
  const start = new Vector3(...heroPosition), focus = new Vector3(...heroTarget)
  const explorer = createExplorerCameraPose(spawn, mobile, cameraProfile)
  const shoulder = new Vector3(...explorer.position)
  const shoulderTarget = new Vector3(...explorer.target)
  const fromCenter = start.clone().sub(focus), toCenter = shoulder.clone().sub(focus)
  const startRadius = Math.hypot(fromCenter.x, fromCenter.z)
  const endRadius = Math.hypot(toCenter.x, toCenter.z)
  const startAngle = Math.atan2(fromCenter.x, fromCenter.z)
  const endAngle = Math.atan2(toCenter.x, toCenter.z)
  const alignment = Math.atan2(Math.sin(endAngle - startAngle), Math.cos(endAngle - startAngle))
  const turn = (Math.sign(alignment) || -1) * Math.PI * 2 + alignment

  return {
    shoulder: shoulder.toArray(),
    sample(progress) {
      const progress01 = clamp(progress)
      if (progress01 === 0) return { position: start.toArray(), target: focus.toArray() }
      if (progress01 === 1) return { position: shoulder.toArray(), target: shoulderTarget.toArray() }
      // The closer quadruped camera needs a longer braking interval so its
      // final gaze change does not become an abrupt pan near the ground.
      const t = ease(progress01, cameraProfile?.targetHeight < 1 ? .22 : .16)
      const radius = startRadius + (endRadius - startRadius) * t
      const angle = startAngle + turn * t
      const position = new Vector3(
        focus.x + Math.sin(angle) * radius,
        start.y + (shoulder.y - start.y) * t,
        focus.z + Math.cos(angle) * radius,
      )
      return { position: position.toArray(), target: focus.clone().lerp(shoulderTarget, t).toArray() }
    },
  }
}
