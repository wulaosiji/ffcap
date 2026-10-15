import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createTraversal, CHARACTER_RADIUS, WALK_SPEED, RUN_SPEED, FIXED_TIMESTEP, MAX_FRAME_TIME,
} from '../src/components/editorial-home/world/settlement/physics.mjs';

const floor = { position: [0, -0.5, 0], halfExtents: [30, 0.5, 30] };
const idle = { x: 0, z: 0 };

function advance(traversal, seconds, input = idle) {
  let state;
  for (let i = 0; i < Math.round(seconds / FIXED_TIMESTEP); i++) {
    state = traversal.step(FIXED_TIMESTEP, input);
  }
  return state;
}

test('gravity lands a real capsule on the visible floor without horizontal drift', async t => {
  const traversal = await createTraversal({ colliders: [floor], spawn: [0, 4, 0] });
  t.after(() => traversal.dispose());
  const falling = advance(traversal, 0.3);
  assert.ok(falling.position.y < 4 && falling.position.y > 3);
  assert.equal(falling.grounded, false);
  const landed = advance(traversal, 2);
  assert.ok(landed.position.y >= 0 && landed.position.y < 0.03);
  assert.equal(landed.grounded, true);
  assert.equal(landed.moving, false);
  assert.ok(Math.abs(landed.position.x) < 0.001 && Math.abs(landed.position.z) < 0.001);
});

test('walls block the capsule while diagonal intent slides along them', async t => {
  const wall = { position: [2, 1.5, 0], halfExtents: [0.25, 1.5, 15] };
  const traversal = await createTraversal({ colliders: [floor, wall], spawn: [0, 0.04, 0] });
  t.after(() => traversal.dispose());
  advance(traversal, 0.4);
  const blocked = advance(traversal, 1.5, { x: 1, z: 0 });
  assert.ok(blocked.position.x <= 2 - 0.25 - CHARACTER_RADIUS + 0.005);
  assert.ok(blocked.position.x > 1.4);
  const slid = advance(traversal, 1, { x: 1, z: 1 });
  assert.ok(slid.position.x <= 2 - 0.25 - CHARACTER_RADIUS + 0.005);
  assert.ok(slid.position.z > 2);
  assert.equal(slid.grounded, true);
  assert.equal(slid.moving, true);
});

test('small solid stairs are climbable and a high obstacle is not', async t => {
  const stairs = Array.from({ length: 4 }, (_, index) => ({
    position: [1.1 + index * 0.65, (index + 1) * 0.1, 0],
    halfExtents: [0.325, (index + 1) * 0.1, 1.5],
  }));
  const traversal = await createTraversal({ colliders: [floor, ...stairs], spawn: [0, 0.04, 0] });
  t.after(() => traversal.dispose());
  advance(traversal, 0.4);
  const climbed = advance(traversal, 1.2, { x: 1, z: 0 });
  assert.ok(climbed.position.x > 2.7, `stair x: ${climbed.position.x}`);
  assert.ok(climbed.position.y > 0.78, `stair y: ${climbed.position.y}`);
  const descended = advance(traversal, 1.4, { x: -1, z: 0 });
  assert.ok(descended.position.x < 0.5);
  assert.ok(descended.position.y >= 0 && descended.position.y < 0.03);

  const obstacle = await createTraversal({ colliders: [floor, { position: [2, 0.4, 0], halfExtents: [1, 0.4, 2] }], spawn: [0, 0.04, 0] });
  t.after(() => obstacle.dispose());
  advance(obstacle, 0.4);
  const stopped = advance(obstacle, 1.5, { x: 1, z: 0 });
  assert.ok(stopped.position.x < 0.75);
  assert.ok(stopped.position.y < 0.04);
});

test('raised bridge supports walking and an actual edge lets the character fall', async t => {
  const bridge = { position: [0, 1.8, 0], halfExtents: [4, 0.2, 1] };
  const traversal = await createTraversal({ colliders: [floor, bridge], spawn: [-3, 2.04, 0] });
  t.after(() => traversal.dispose());
  advance(traversal, 0.4);
  const crossing = advance(traversal, 1.6, { x: 1, z: 0 });
  assert.ok(crossing.position.x > 2);
  assert.ok(Math.abs(crossing.position.y - 2) < 0.03);
  assert.equal(crossing.grounded, true);
  const offBridge = advance(traversal, 1, { x: 0, z: 1 });
  assert.ok(offBridge.position.y < 1);
  const landed = advance(traversal, 1);
  assert.ok(landed.position.y >= 0 && landed.position.y < 0.03);
});

test('diagonal intent is normalized, analogue input is retained, and run is faster', async t => {
  const traversal = await createTraversal({ colliders: [floor], spawn: [0, 0.04, 0] });
  t.after(() => traversal.dispose());
  advance(traversal, 0.4);
  const diagonal = advance(traversal, 1, { x: 1, z: 1 });
  const distance = Math.hypot(diagonal.position.x, diagonal.position.z);
  // Contact correction can shorten a stride; diagonal intent must never be
  // faster than walking and must retain at least 97% of its unobstructed stride.
  assert.ok(distance <= WALK_SPEED + 0.01 && distance > WALK_SPEED * 0.97);
  traversal.teleport([0, 0.04, 0]);
  advance(traversal, 0.4);
  const analogue = advance(traversal, 1, { x: 0.5, z: 0 });
  assert.ok(Math.abs(analogue.position.x - WALK_SPEED / 2) < 0.01);
  traversal.teleport([0, 0.04, 0]);
  advance(traversal, 0.4);
  const running = advance(traversal, 1, { x: 1, z: 0, run: true });
  assert.ok(Math.abs(running.position.x - RUN_SPEED) < 0.01);
});

test('large ground volumes retain contact through long diagonal walks in every quadrant', async t => {
  for (const input of [{ x: 1, z: 1 }, { x: 1, z: -1 }, { x: -1, z: 1 }, { x: -1, z: -1 }]) {
    const traversal = await createTraversal({ colliders: [floor], spawn: [0, 0.04, 0] });
    t.after(() => traversal.dispose());
    advance(traversal, 0.4);
    for (let frame = 0; frame < 600; frame++) {
      const state = traversal.step(FIXED_TIMESTEP, input);
      assert.ok(state.position.y > -0.01 && state.position.y < 0.05, `ground contact at ${JSON.stringify(state.position)}`);
    }
    assert.ok(Math.hypot(traversal.position.x, traversal.position.z) > 30);
  }
});

test('fixed steps agree at 30 and 120 Hz, and a suspended frame cannot cause a leap', async t => {
  const slow = await createTraversal({ colliders: [floor], spawn: [0, 0.04, 0] });
  const fast = await createTraversal({ colliders: [floor], spawn: [0, 0.04, 0] });
  t.after(() => { slow.dispose(); fast.dispose(); });
  for (let i = 0; i < 30; i++) slow.step(1 / 30, { x: 1, z: 0 });
  for (let i = 0; i < 120; i++) fast.step(1 / 120, { x: 1, z: 0 });
  assert.ok(Math.abs(slow.position.x - fast.position.x) < 0.001);
  const before = slow.position;
  slow.step(30, { x: 1, z: 0 });
  assert.ok(slow.position.x - before.x <= WALK_SPEED * MAX_FRAME_TIME + 0.001);
  const current = slow.position;
  slow.step(Infinity, { x: NaN, z: Infinity });
  assert.deepEqual(slow.position, current);
});

test('teleport resets falling momentum and frame backlog; snapshots cannot mutate physics', async t => {
  const traversal = await createTraversal({ colliders: [floor], spawn: [0, 10, 0] });
  t.after(() => traversal.dispose());
  advance(traversal, 0.7);
  traversal.step(FIXED_TIMESTEP / 2, { x: 1, z: 0 });
  const reset = traversal.teleport([5, 3, 2]);
  assert.deepEqual(reset.position, { x: 5, y: 3, z: 2 });
  assert.equal(reset.grounded, false);
  assert.equal(reset.moving, false);
  reset.position.x = 99;
  assert.equal(traversal.position.x, 5);
  const half = traversal.step(FIXED_TIMESTEP / 2, idle);
  assert.equal(half.position.y, 3);
  const next = traversal.step(FIXED_TIMESTEP / 2, idle);
  assert.ok(next.position.y > 2.995 && next.position.y < 3);
});

test('rotated wall collision uses its supplied world-space orientation', async t => {
  const traversal = await createTraversal({ colliders: [floor, { position: [0, 1.5, 2], halfExtents: [0.2, 1.5, 8], rotationY: Math.PI / 2 }], spawn: [0, 0.04, 0] });
  t.after(() => traversal.dispose());
  advance(traversal, 0.4);
  const stopped = advance(traversal, 2, { x: 0, z: 1 });
  assert.ok(stopped.position.z > 1.4 && stopped.position.z < 1.53);
});

test('disposal is idempotent and rejects simulation against freed WASM state', async () => {
  const traversal = await createTraversal({ colliders: [floor], spawn: [0, 0, 0] });
  traversal.dispose();
  assert.doesNotThrow(() => traversal.dispose());
  assert.throws(() => traversal.step(FIXED_TIMESTEP, idle), /disposed/);
  assert.throws(() => traversal.teleport([1, 0, 0]), /disposed/);
  assert.deepEqual(traversal.position, { x: 0, y: 0, z: 0 });
});

test('invalid collider and spawn descriptions are rejected before simulation', async () => {
  await assert.rejects(createTraversal({ colliders: [floor], spawn: [0, NaN, 0] }), /finite/);
  await assert.rejects(createTraversal({ colliders: [{ position: [0, 0, 0], halfExtents: [1, 0, 1] }], spawn: [0, 0, 0] }), /positive/);
  await assert.rejects(createTraversal({ colliders: [{ ...floor, rotationY: Infinity }], spawn: [0, 0, 0] }), /finite/);
});
