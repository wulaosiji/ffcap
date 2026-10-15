import { CLOUD_HUMAN_PROFILE } from './cloudCharacterProfile.mjs';
import { createSurfaceSweepBounds } from './cloudSurfaceSweepBounds.mjs';

// Distances are metres. All public positions refer to the character's feet.
export const CHARACTER_HEIGHT = 1.75;
export const CHARACTER_RADIUS = 0.28;
export const WALK_SPEED = 3.2;
export const RUN_SPEED = 5.3;
export const FIXED_TIMESTEP = 1 / 60;
export const MAX_FRAME_TIME = 0.1;
export const MAX_STEP_HEIGHT = 0.26;
export const MAX_SLOPE_ANGLE = 40 * Math.PI / 180;
export const CONTACT_GAP = 0.015;

const GRAVITY = -9.81;
const MAX_BOX_SPAN = 6;
let rapierReady;

async function loadRapier() {
  // React Strict Mode can start more than one async scene. Initialise WASM once,
  // while keeping each traversal's bodies and controller entirely independent.
  if (!rapierReady) {
    rapierReady = import('@dimforge/rapier3d-compat').then(async module => {
      const RAPIER = module.default ?? module;
      await RAPIER.init();
      return RAPIER;
    }).catch(error => {
      rapierReady = undefined;
      throw error;
    });
  }
  return rapierReady;
}

function validateVector(value, label) {
  if (!Array.isArray(value) || value.length !== 3 || !value.every(Number.isFinite)) {
    throw new TypeError(`${label} must be a finite [x, y, z] vector`);
  }
}

/**
 * Collision-aware third-person traversal without rendering or browser input.
 * Static box descriptions must use the same transforms as visible scene meshes.
 * @param {{colliders: Array<{position: number[], halfExtents: number[], rotationY?: number}>, spawn: number[], surfaces?: Array<{vertices: number[], indices: number[]}>}} config
 */
export async function createTraversal({ colliders, spawn, surfaces = [], character = CLOUD_HUMAN_PROFILE }) {
  const { radius, height, walkSpeed, runSpeed, collision } = character;
  if (![radius, height, walkSpeed, runSpeed, collision?.halfLength, collision?.stepHeight, collision?.snapDistance, collision?.turnSpeed].every(value => Number.isFinite(value) && value > 0)) {
    throw new TypeError('character dimensions and movement parameters must be finite and positive');
  }
  if (!['capsule', 'box'].includes(collision.shape) || height <= radius * 2) {
    throw new RangeError('character collision shape has invalid proportions');
  }
  const halfHeight = height / 2;
  validateVector(spawn, 'spawn');
  if (!Array.isArray(colliders)) throw new TypeError('colliders must be an array');
  for (const box of colliders) {
    validateVector(box.position, 'collider.position');
    validateVector(box.halfExtents, 'collider.halfExtents');
    if (box.halfExtents.some(value => value <= 0)) {
      throw new RangeError('collider.halfExtents must be positive');
    }
    if (box.rotationY !== undefined && !Number.isFinite(box.rotationY)) {
      throw new TypeError('collider.rotationY must be finite');
    }
  }
  if (!Array.isArray(surfaces)) throw new TypeError('surfaces must be an array');
  for (const surface of surfaces) {
    if (!Array.isArray(surface.vertices) || surface.vertices.length < 9 || surface.vertices.length % 3 || !surface.vertices.every(Number.isFinite)) {
      throw new TypeError('surface.vertices must contain finite xyz triangles');
    }
    const count = surface.vertices.length / 3;
    if (!Array.isArray(surface.indices) || surface.indices.length < 3 || surface.indices.length % 3 || !surface.indices.every(i => Number.isInteger(i) && i >= 0 && i < count)) {
      throw new TypeError('surface.indices must reference complete valid triangles');
    }
  }

  const RAPIER = await loadRapier();
  const world = new RAPIER.World({ x: 0, y: GRAVITY, z: 0 });
  world.timestep = FIXED_TIMESTEP;
  const surfaceSweepBounds = new Map();

  // V2 uses the authored walking mesh, including curved bridges and uneven
  // stone paths. Keep these fixed: triangle meshes are not dynamic bodies.
  try {
    for (const surface of surfaces) {
      const vertices = new Float32Array(surface.vertices);
      const indices = new Uint32Array(surface.indices);
      const desc = RAPIER.ColliderDesc.trimesh(
        vertices, indices,
        RAPIER.TriMeshFlags.FIX_INTERNAL_EDGES,
      ).setFriction(.8);
      const collider = world.createCollider(desc);
      // Read-only bounds of these exact triangles, not a replacement collider.
      // Used only to prove separation during the inflated yaw sweep below.
      surfaceSweepBounds.set(collider.handle, createSurfaceSweepBounds(vertices, indices));
    }
  } catch (error) {
    world.free();
    throw error;
  }

  for (const box of colliders) {
    // Very large thin convex boxes lose capsule-contact precision in Rapier.
    // The human tiles retain that fix. Long flat dog bodies instead keep one
    // box: overlapping coplanar tile seams produce intermittent zero movement.
    const nx = collision.shape === 'capsule' ? Math.ceil(box.halfExtents[0] * 2 / MAX_BOX_SPAN) : 1;
    const nz = collision.shape === 'capsule' ? Math.ceil(box.halfExtents[2] * 2 / MAX_BOX_SPAN) : 1;
    const hx = box.halfExtents[0] / nx;
    const hz = box.halfExtents[2] / nz;
    const rotation = box.rotationY ?? 0;
    const cos = Math.cos(rotation);
    const sin = Math.sin(rotation);
    for (let ix = 0; ix < nx; ix++) {
      for (let iz = 0; iz < nz; iz++) {
        const localX = -box.halfExtents[0] + hx * (ix * 2 + 1);
        const localZ = -box.halfExtents[2] + hz * (iz * 2 + 1);
        const desc = RAPIER.ColliderDesc.cuboid(hx, box.halfExtents[1], hz)
          .setTranslation(
            box.position[0] + cos * localX + sin * localZ,
            box.position[1],
            box.position[2] - sin * localX + cos * localZ,
          );
        if (rotation) desc.setRotation({ x: 0, y: Math.sin(rotation / 2), z: 0, w: Math.cos(rotation / 2) });
        world.createCollider(desc);
      }
    }
  }

  const body = world.createRigidBody(
    RAPIER.RigidBodyDesc.kinematicPositionBased()
      .setTranslation(spawn[0], spawn[1] + halfHeight, spawn[2]),
  );
  const capsule = world.createCollider(
    collision.shape === 'capsule'
      ? RAPIER.ColliderDesc.capsule(halfHeight - radius, radius)
      : RAPIER.ColliderDesc.cuboid(radius, halfHeight, collision.halfLength),
    body,
  );
  const controller = world.createCharacterController(CONTACT_GAP);
  controller.setUp({ x: 0, y: 1, z: 0 });
  controller.setSlideEnabled(true);
  // A 1 mm collision-normal nudge stabilises long flat support faces; the
  // human's existing controller settings remain unchanged.
  if (collision.shape === 'box') controller.setNormalNudgeFactor(.001);
  controller.setMaxSlopeClimbAngle(MAX_SLOPE_ANGLE);
  controller.setMinSlopeSlideAngle(MAX_SLOPE_ANGLE);
  controller.enableAutostep(collision.stepHeight, 0.15, false);
  controller.enableSnapToGround(collision.snapDistance);

  // Populate broad-phase queries before the very first character shape cast.
  world.step();

  let accumulator = 0;
  let verticalVelocity = 0;
  let grounded = false;
  let moving = false;
  let disposed = false;
  let heading = 0;
  // Sample a rotational sweep in <= .01 rad increments, inflated by the
  // maximum corner displacement between samples. This covers the *interval*,
  // not just the requested end pose (which could be clear past a thin wall).
  const turnIncrement = .01;
  const turnMargin = CONTACT_GAP + Math.hypot(radius, collision.halfLength) * turnIncrement / 2 + .0001;
  const sweepShape = collision.shape === 'box' ? new RAPIER.Cuboid(
    radius + turnMargin, halfHeight - .02, collision.halfLength + turnMargin,
  ) : null;
  let lastPosition = { x: spawn[0], y: spawn[1], z: spawn[2] };

  function ensureAlive() {
    if (disposed) throw new Error('Traversal has been disposed');
  }

  function readPosition() {
    const translation = body.translation();
    lastPosition = { x: translation.x, y: translation.y - halfHeight, z: translation.z };
  }

  function snapshot() {
    return { position: { ...lastPosition }, grounded, moving, heading };
  }

  function rotateSafely(target) {
    const delta = Math.atan2(Math.sin(target - heading), Math.cos(target - heading));
    if (Math.abs(delta) < 1e-8) return;
    const change = Math.max(-collision.turnSpeed * FIXED_TIMESTEP, Math.min(collision.turnSpeed * FIXED_TIMESTEP, delta));
    const count = Math.max(1, Math.ceil(Math.abs(change) / turnIncrement));
    const start = heading;
    for (let index = 1; index <= count; index++) {
      const next = start + change * index / count;
      const rotation = {x: 0, y: Math.sin(next / 2), z: 0, w: Math.cos(next / 2)};
      let blocked = false;
      // Yaw leaves the support face unchanged. Exclude the bottom 4 cm from
      // this horizontal sweep so a touching floor cannot veto every rotation;
      // translation/gravity still cast the complete body against that floor.
      const at = body.translation();
      const cos = Math.abs(Math.cos(next)), sin = Math.abs(Math.sin(next));
      const extentX = cos * (radius + turnMargin) + sin * (collision.halfLength + turnMargin);
      const extentZ = sin * (radius + turnMargin) + cos * (collision.halfLength + turnMargin);
      const min = [at.x - extentX, at.y + .02 - (halfHeight - .02), at.z - extentZ];
      const max = [at.x + extentX, at.y + .02 + (halfHeight - .02), at.z + extentZ];
      if (sweepShape) world.intersectionsWithShape({x: at.x, y: at.y + .02, z: at.z}, rotation, sweepShape, () => {
        blocked = true; return false;
      }, undefined, undefined, capsule, body, collider => {
        const bounds = surfaceSweepBounds.get(collider.handle);
        return !bounds || bounds.mayIntersectAabb(min, max);
      });
      if (blocked) break;
      heading = next;
    }
    const rotation = {x: 0, y: Math.sin(heading / 2), z: 0, w: Math.cos(heading / 2)};
    // Update now so this fixed step's translation casts the accepted shape.
    body.setRotation(rotation, true);
    body.setNextKinematicRotation(rotation);
  }

  return {
    /** dt is elapsed seconds; x/z are world-space analogue intent, limited to length 1. */
    step(dt, input = { x: 0, z: 0 }) {
      ensureAlive();
      const elapsed = Number.isFinite(dt) ? Math.min(MAX_FRAME_TIME, Math.max(0, dt)) : 0;
      accumulator = Math.min(MAX_FRAME_TIME, accumulator + elapsed);
      const x = Number.isFinite(input.x) ? input.x : 0;
      const z = Number.isFinite(input.z) ? input.z : 0;
      const length = Math.hypot(x, z);
      const divisor = Math.max(1, length);
      const speed = input.run ? runSpeed : walkSpeed;
      const dx = x / divisor * speed * FIXED_TIMESTEP;
      const dz = z / divisor * speed * FIXED_TIMESTEP;
      let stepped = false;
      let travelled = 0;

      while (accumulator + 1e-10 >= FIXED_TIMESTEP) {
        if (Number.isFinite(input.heading)) rotateSafely(input.heading);
        // A quadruped turns before advancing into the opposite direction. An
        // instant backwards velocity with a still-forward skeleton would drag
        // all four stance feet through an impossible reach during a U-turn.
        const alignment = collision.shape === 'box' && Number.isFinite(input.heading) && length > .001
          ? Math.max(0, (-Math.sin(heading) * x - Math.cos(heading) * z) / length) : 1;
        // Kinematic bodies ignore world gravity. Apply it explicitly; slight
        // downward intent while grounded also enables Rapier's stair descent.
        verticalVelocity = grounded ? (collision.shape === 'box' ? -.05 : -1) : Math.max(-30, verticalVelocity + GRAVITY * FIXED_TIMESTEP);
        controller.computeColliderMovement(capsule, {
          x: dx * alignment,
          y: verticalVelocity * FIXED_TIMESTEP,
          z: dz * alignment,
        });
        const movement = controller.computedMovement();
        const translation = body.translation();
        body.setNextKinematicTranslation({
          x: translation.x + movement.x,
          y: translation.y + movement.y,
          z: translation.z + movement.z,
        });
        grounded = controller.computedGrounded();
        if (grounded) verticalVelocity = 0;
        world.step();
        travelled += Math.hypot(movement.x, movement.z);
        accumulator = Math.max(0, accumulator - FIXED_TIMESTEP);
        stepped = true;
      }

      if (stepped) {
        readPosition();
        moving = length > 0.001 && travelled > 0.0001;
      } else if (length <= 0.001) {
        moving = false;
      }
      return snapshot();
    },

    /** Reset momentum when entering or leaving a room, including queued frame time. */
    teleport(target) {
      ensureAlive();
      validateVector(target, 'teleport target');
      const translation = { x: target[0], y: target[1] + halfHeight, z: target[2] };
      body.setTranslation(translation, true);
      body.setNextKinematicTranslation(translation);
      body.setLinvel({ x: 0, y: 0, z: 0 }, true);
      accumulator = 0;
      verticalVelocity = 0;
      grounded = false;
      moving = false;
      heading = 0;
      const rotation = {x: 0, y: 0, z: 0, w: 1};
      body.setRotation(rotation, true);
      body.setNextKinematicRotation(rotation);
      world.step();
      readPosition();
      return snapshot();
    },

    get position() {
      return { ...lastPosition };
    },

    /** World-space downward probe, excluding our own body. Safe to pass unbound. */
    sampleGround(x, z, fromY, maxDrop = 1) {
      ensureAlive();
      if (![x, z, fromY, maxDrop].every(Number.isFinite) || maxDrop <= 0) return null;
      const hit = world.castRayAndGetNormal(new RAPIER.Ray({x, y: fromY, z}, {x: 0, y: -1, z: 0}), maxDrop, false, undefined, undefined, capsule, body);
      if (!hit || hit.normal.y < Math.cos(MAX_SLOPE_ANGLE)) return null;
      return {height: fromY - hit.timeOfImpact, normal: {...hit.normal}};
    },

    dispose() {
      if (disposed) return;
      disposed = true;
      world.removeCharacterController(controller);
      world.free();
    },
  };
}
