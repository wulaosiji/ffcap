import assert from 'node:assert/strict';
import test from 'node:test';
import { createTraversal, CHARACTER_RADIUS, FIXED_TIMESTEP } from '../src/components/editorial-home/world/settlement/physics.mjs';
import { createSolids, SPAWN, GUIDE, ROOMS, locationAt, buildGuideRoute } from '../src/components/editorial-home/world/settlement/layout.mjs';

const idle = { x: 0, z: 0 };

function settle(traversal, frames = 40) {
  let state;
  for (let frame = 0; frame < frames; frame++) state = traversal.step(FIXED_TIMESTEP, idle);
  return state;
}

function walkTo(traversal, [x, z], onFrame = () => {}) {
  let state;
  for (let frame = 0; frame < 900; frame++) {
    const p = traversal.position;
    const dx = x - p.x;
    const dz = z - p.z;
    const distance = Math.hypot(dx, dz);
    if (distance < 0.14) return settle(traversal, 4);
    state = traversal.step(FIXED_TIMESTEP, { x: dx / distance, z: dz / distance });
    onFrame(state);
  }
  assert.fail(`Guide could not reach [${x}, ${z}]; stopped at ${JSON.stringify(state)}`);
}

test('the rendered settlement route is a grounded bridge-and-stairs round trip into Agentic', async t => {
  const traversal = await createTraversal({ colliders: createSolids(), spawn: SPAWN });
  t.after(() => traversal.dispose());
  const visited = new Set();
  const record = state => {
    visited.add(locationAt(state.position));
    assert.ok(state.position.y > -0.015, 'the guided route must never fall into the stream');
    assert.ok(state.position.y < 1.85, 'the route must not climb invisible geometry');
  };
  for (const target of GUIDE) walkTo(traversal, target, record);
  const arrival = settle(traversal);
  assert.equal(locationAt(arrival.position), 'agentic');
  assert.equal(arrival.grounded, true);
  assert.ok(Math.abs(arrival.position.y - ROOMS[0].y) < 0.03);
  assert.ok(visited.has('commons') && visited.has('bridge') && visited.has('agentic'));

  const returnRoute = [...GUIDE.slice(0, -1)].reverse();
  returnRoute.push([SPAWN[0], SPAWN[2]]);
  for (const target of returnRoute) walkTo(traversal, target, record);
  const returned = settle(traversal);
  assert.equal(locationAt(returned.position), 'commons');
  assert.equal(returned.grounded, true);
  assert.ok(Math.abs(returned.position.y) < 0.03);
  assert.ok(Math.hypot(returned.position.x - SPAWN[0], returned.position.z - SPAWN[2]) < 0.15);
});

test('the Agentic side wall and real desk block traversal within the entered room', async t => {
  const room = ROOMS.find(r => r.id === 'agentic');
  const traversal = await createTraversal({ colliders: createSolids(), spawn: [room.x, room.y + 0.03, room.front - 2] });
  t.after(() => traversal.dispose());
  settle(traversal);
  let state;
  for (let frame = 0; frame < 180; frame++) state = traversal.step(FIXED_TIMESTEP, { x: 1, z: 0 });
  const wallInside = room.x + room.width / 2 - 0.225;
  assert.ok(state.position.x <= wallInside - CHARACTER_RADIUS + 0.01);
  assert.ok(state.position.x > wallInside - CHARACTER_RADIUS - 0.08);
  assert.ok(Math.abs(state.position.y - room.y) < 0.03);

  traversal.teleport([room.x, room.y + 0.03, room.front - 3.8]);
  settle(traversal);
  for (let frame = 0; frame < 120; frame++) state = traversal.step(FIXED_TIMESTEP, { x: 0, z: -1 });
  const deskFront = -15.8 + 1.25 / 2;
  assert.ok(state.position.z >= deskFront + CHARACTER_RADIUS - 0.01);
  assert.ok(state.position.z < deskFront + CHARACTER_RADIUS + 0.08);
});

test('both unopened doorways have real blocking gates, not enterable placeholder rooms', async t => {
  for (const room of ROOMS.filter(r => !r.open)) {
    const traversal = await createTraversal({ colliders: createSolids(), spawn: [room.x, room.y + 0.03, room.front + 0.8] });
    t.after(() => traversal.dispose());
    settle(traversal);
    let state;
    for (let frame = 0; frame < 180; frame++) state = traversal.step(FIXED_TIMESTEP, { x: 0, z: -1 });
    const gateFront = room.front + 0.13 + 0.13 / 2;
    assert.ok(state.position.z >= gateFront + CHARACTER_RADIUS - 0.01, `${room.id} gate was crossed`);
    assert.ok(state.position.z < gateFront + CHARACTER_RADIUS + 0.09, `${room.id} was blocked before the gate`);
    assert.equal(state.grounded, true);
    assert.equal(locationAt(state.position), 'commons');
  }
});

test('the visible rear retaining terrace blocks its sides but leaves the theatre staircase usable', async t => {
  const solids = createSolids();
  const retaining = solids.find(s => s.id === 'back-terrace-retaining');
  assert.ok(retaining && !retaining.visible);
  const traversal = await createTraversal({ colliders: solids, spawn: [-8, 0.83, -30] });
  t.after(() => traversal.dispose());
  settle(traversal);
  let state;
  for (let frame = 0; frame < 120; frame++) state = traversal.step(FIXED_TIMESTEP, { x: 1, z: 0 });
  const leftFace = retaining.position[0] - retaining.halfExtents[0];
  assert.ok(state.position.x < leftFace - CHARACTER_RADIUS + 0.01);
  assert.ok(state.position.x > leftFace - CHARACTER_RADIUS - 0.08);
  assert.ok(Math.abs(state.position.y - 0.8) < 0.03);

  const room = ROOMS.find(r => r.id === 'entertainment');
  traversal.teleport([room.x, 0.83, -7.5]);
  settle(traversal);
  walkTo(traversal, [room.x, room.front + 0.8]);
  for (let frame = 0; frame < 100; frame++) state = traversal.step(FIXED_TIMESTEP, { x: 0, z: -1 });
  assert.ok(state.position.z < room.front + 0.6, 'the retaining terrace must not stop the stair approach early');
  assert.ok(state.position.z > room.front, 'the closed theatre gate still blocks entry');
  assert.ok(Math.abs(state.position.y - room.y) < 0.04);
  assert.equal(state.grounded, true);
});

test('layout, generated solids, and guide are deterministic and have usable physical dimensions', () => {
  const first = createSolids();
  const second = createSolids();
  assert.deepEqual(first, second);
  assert.notEqual(first, second);
  assert.equal(new Set(first.map(s => s.id)).size, first.length);
  for (const solid of first) {
    assert.ok(solid.position.length === 3 && solid.position.every(Number.isFinite));
    assert.ok(solid.halfExtents.length === 3 && solid.halfExtents.every(n => Number.isFinite(n) && n > 0), solid.id);
  }
  assert.deepEqual(GUIDE, [[0, 10], [0, 0], [-10, -4.5], [-10, -11], [-10, -14]]);
  assert.ok(GUIDE.every(p => p.length === 2 && p.every(Number.isFinite)));
  assert.equal(locationAt({ x: SPAWN[0], y: SPAWN[1], z: SPAWN[2] }), 'commons');
  assert.equal(locationAt({ x: 0, y: 0.5, z: 5 }), 'bridge');
  assert.equal(locationAt({ x: -10, y: 1.8, z: -14 }), 'agentic');
  assert.equal(locationAt({ x: -10, y: 0.8, z: -14 }), 'commons', 'standing below a room is not entry');
  first[0].position[0] = 999;
  assert.deepEqual(createSolids(), second, 'consumer mutation cannot change future world generation');
});

test('the return guide walks around the solid desk from the back aisle and both sides', async t => {
  for (const start of [[-10, 1.83, -16.78], [-11.95, 1.83, -15.8], [-8.05, 1.83, -16.78]]) {
    const traversal = await createTraversal({ colliders: createSolids(), spawn: start });
    t.after(() => traversal.dispose());
    settle(traversal);
    const route = buildGuideRoute(traversal.position, true);
    assert.ok(route.length > 5, 'a rear-desk return needs a side aisle waypoint');
    for (const target of route) walkTo(traversal, target);
    assert.ok(Math.hypot(traversal.position.x, traversal.position.z - SPAWN[2]) < 0.15);
    assert.ok(Math.abs(traversal.position.y) < 0.03);
  }
});

test('requesting a guide outside known safe paths preserves the current position', async t => {
  const traversal = await createTraversal({ colliders: createSolids(), spawn: [18, 0.83, -4] });
  t.after(() => traversal.dispose());
  settle(traversal);
  const before = traversal.position;
  assert.equal(buildGuideRoute(before), null);
  assert.deepEqual(traversal.position, before);
  assert.deepEqual(buildGuideRoute({ x: 20, y: 0.015, z: 25 }), GUIDE);
  assert.deepEqual(buildGuideRoute({ x: -10, y: 1.815, z: -14 }), []);
});

test('both sides of the full Agentic interior retain room actions and a usable return guide', async t => {
  for (const start of [[-13.6, 1.83, -13], [-6.1, 1.83, -13], [-6.1, 1.83, -16.7]]) {
    const traversal = await createTraversal({ colliders: createSolids(), spawn: start });
    t.after(() => traversal.dispose());
    const state = settle(traversal);
    assert.equal(state.grounded, true);
    assert.equal(locationAt(state.position), 'agentic', `interior point ${JSON.stringify(state.position)} lost room state`);
    const route = buildGuideRoute(state.position, true);
    assert.ok(route && route.length > 0);
    for (const target of route) walkTo(traversal, target);
    assert.equal(locationAt(traversal.position), 'commons');
    assert.ok(Math.hypot(traversal.position.x, traversal.position.z - SPAWN[2]) < 0.15);
  }
  for (const x of [-15.1, -4.9]) {
    assert.equal(locationAt({ x, y: 1.815, z: -13 }), 'commons', 'the actual side walls are not room interior');
  }
  assert.equal(locationAt({ x: -10, y: 6.5, z: -13 }), 'commons', 'the roof is not room interior');
});
