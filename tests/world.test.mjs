import assert from 'node:assert/strict';
import test from 'node:test';
import { SEGMENT_COUNT, SEGMENT_LENGTH, WORLD_SPAN, RECYCLE_Z, PORTAL_Z, wrapSegmentZ, crossedPortal, sectionTopic, bounded } from '../src/components/editorial-home/world/math.mjs';

test('infinite travel preserves segment spacing and a fixed memory footprint', () => {
  let positions = Array.from({ length: SEGMENT_COUNT }, (_, i) => 20 - i * SEGMENT_LENGTH);
  for (let frame = 0; frame < 36000; frame++) {
    positions = positions.map(z => wrapSegmentZ(z + 0.1));
    assert.equal(positions.length, SEGMENT_COUNT);
    assert.ok(positions.every(z => z <= RECYCLE_Z && z > RECYCLE_Z - WORLD_SPAN));
  }
  const sorted = [...positions].sort((a, b) => a - b);
  sorted.slice(1).forEach((z, i) => assert.ok(Math.abs(z - sorted[i] - SEGMENT_LENGTH) < 1e-6));
  assert.ok(wrapSegmentZ(10000) <= RECYCLE_Z);
});

test('discoveries require exploring and one real portal crossing', () => {
  assert.equal(crossedPortal(PORTAL_Z - 0.1, PORTAL_Z + 0.1, false), false);
  assert.equal(crossedPortal(PORTAL_Z - 0.1, PORTAL_Z + 0.1, true), true);
  assert.equal(crossedPortal(PORTAL_Z + 0.1, PORTAL_Z + 0.2, true), false);
  assert.equal(crossedPortal(PORTAL_Z - 1, PORTAL_Z - 0.1, true), false);
  assert.equal(crossedPortal(PORTAL_Z + 1, PORTAL_Z - 1, true), false);
  let z = -24;
  let discoveries = 0;
  for (let frame = 0; frame < 2640; frame++) {
    const next = z + 0.1;
    if (crossedPortal(z, next, true)) discoveries++;
    z = wrapSegmentZ(next);
  }
  assert.equal(discoveries, 1);
});

test('topic selection stays cyclical and pointer input remains finite', () => {
  assert.deepEqual([0, 1, 2, 3, 4, 5].map(i => sectionTopic(i)), [0, 1, 2, 0, 1, 2]);
  assert.equal(sectionTopic(6, -2), 1);
  assert.equal(bounded(Infinity, -1, 1), 0);
  assert.equal(bounded(NaN, -1, 1), 0);
  assert.equal(bounded(3, -1, 1), 1);
  assert.equal(bounded(-3, -1, 1), -1);
});
