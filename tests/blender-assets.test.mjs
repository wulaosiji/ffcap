import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';
import { BufferAttribute, BufferGeometry, DoubleSide, Group, Mesh, MeshBasicMaterial, Raycaster, Vector3 } from 'three';
import { decodeDracoAccessors, inspectGLB, parseGLB } from '../scripts/world/blender/inspect_glb.mjs';
import { createSolids } from '../src/components/editorial-home/world/settlement/layout.mjs';

const assetURL = name => new URL(`../public/world/blender/${name}`, import.meta.url);
const courtyardPromise = readFile(assetURL('courtyard-v1-draco.glb')).then(async bytes => ({ bytes, decoded: await decodeDracoAccessors(bytes), ...parseGLB(bytes) }));

test('the original Blender character has a grounded skinned rig and all three in-place motions', async () => {
  const result = inspectGLB(await readFile(assetURL('explorer-v1.glb')), 'character');
  assert.deepEqual(result.errors, []);
  assert.equal(result.skinnedMeshes, 1);
  assert.equal(result.skins[0].joints, 24);
  assert.ok(result.bytes < 2.5e6);
  assert.ok(Math.abs(result.bounds.min[1]) < .005);
  assert.ok(Math.abs(result.bounds.max[1] - 1.74) < .005);
  assert.deepEqual(result.animations.map(animation => animation.name).sort(), ['idle', 'run', 'walk']);
});

test('the courtyard genuinely decodes within its web budget and retains authored colors', async () => {
  const { bytes, decoded, json } = await courtyardPromise;
  const result = inspectGLB(bytes, 'environment', decoded);
  assert.deepEqual(result.errors, []);
  assert.ok(result.decodedAccessors > 0, 'Draco geometry must be decoded, not merely counted from metadata');
  assert.ok(result.bytes < 5e6);
  assert.ok(result.materials <= 16);
  for (const [name, tint] of Object.entries({ 'Meadow ground': [.34,.58,.17,1], 'Weathered cliff': [.70,.78,.69,1], 'Oiled oak': [.64,.48,.29,1] })) {
    const material = json.materials.find(value => value.name === name);
    assert.deepEqual(material.pbrMetallicRoughness.baseColorFactor, tint, `${name} lost its authored multiplier on export`);
    assert.ok(material.pbrMetallicRoughness.baseColorTexture);
  }
});

test('decoded Blender floors and bridge treads coincide with the independently simulated route', async t => {
  const { json, decoded } = await courtyardPromise;
  const material = new MeshBasicMaterial({ side: DoubleSide });
  const geometries = [], meshes = [], root = new Group();
  const objects = json.nodes.map(node => {
    const object = new Group();
    if (node.matrix) { object.matrix.fromArray(node.matrix); object.matrixAutoUpdate = false; }
    else {
      if (node.translation) object.position.fromArray(node.translation);
      if (node.rotation) object.quaternion.fromArray(node.rotation);
      if (node.scale) object.scale.fromArray(node.scale);
    }
    if (node.mesh !== undefined) for (const primitive of json.meshes[node.mesh].primitives) {
      const positions = decoded.get(primitive.attributes.POSITION), indices = decoded.get(primitive.indices);
      assert.ok(positions && indices, 'Every environment mesh must use the verified Draco path');
      const geometry = new BufferGeometry();
      geometry.setAttribute('position', new BufferAttribute(positions.array, 3));
      geometry.setIndex(new BufferAttribute(indices.array, 1));
      const mesh = new Mesh(geometry, material); object.add(mesh); meshes.push(mesh); geometries.push(geometry);
    }
    return object;
  });
  json.nodes.forEach((node, index) => (node.children || []).forEach(child => objects[index].add(objects[child])));
  for (const index of json.scenes[json.scene || 0].nodes) root.add(objects[index]);
  root.updateMatrixWorld(true);
  t.after(() => { geometries.forEach(geometry => geometry.dispose()); material.dispose(); root.clear(); });
  const ray = new Raycaster(), down = new Vector3(0, -1, 0);
  const check = (x, y, z, name) => {
    ray.set(new Vector3(x, y + .25, z), down); ray.far = .5;
    const hit = ray.intersectObjects(meshes, false)[0];
    assert.ok(hit, `${name}: visible floor missing at ${x}, ${z}`);
    assert.ok(Math.abs(hit.point.y - y) < .027, `${name}: visible floor ${hit.point.y} differs from collider top ${y}`);
  };
  for (const solid of createSolids().filter(s => /^bridge-\d+$/.test(s.id) || /^agentic-step-/.test(s.id))) {
    const [x, y, z] = solid.position;
    // Sample the actual left/right sole support, not the intentional 15 mm
    // expansion joint down the bridge's exact centre line.
    for (const offset of [-.12, .12]) check(x + offset, y + solid.halfExtents[1], z, solid.id);
  }
  check(.12, 0, 15.1, 'courtyard spawn');
  check(-10.12, 1.8, -13.8, 'Agentic arrival');
});
