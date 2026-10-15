import assert from 'node:assert/strict'
import {createHash} from 'node:crypto'
import {readFile} from 'node:fs/promises'
import {after, before, test} from 'node:test'
import {Box3, Matrix4, PerspectiveCamera, Quaternion, Ray, Vector3} from 'three'
import RAPIER from '@dimforge/rapier3d-compat'
import {decodeDracoAccessors, parseGLB} from '../scripts/world/blender/inspect_glb.mjs'
import {CLOUD_INTRO_SECONDS, createCloudCameraPath, createExplorerCameraPose, createIslandOverview} from '../src/components/editorial-home/world/settlement/cloudCamera.mjs'
import {CLOUD_DOG_PROFILE} from '../src/components/editorial-home/world/settlement/cloudCharacterProfile.mjs'

let layout, runtimeBounds, geometryBounds, cases, cameraBoxes, meshWorld, knownMeshPoint
let triangleCount = 0
const vector = values => new Vector3(...values)
const aspects = [.35, .46, .75, 1, 1.6, 2.3, 3.55]
const dogCamera = CLOUD_DOG_PROFILE.camera

before(async () => {
  await RAPIER.init()
  meshWorld = new RAPIER.World({x: 0, y: 0, z: 0})
  const bytes = await readFile(process.env.CLOUD_CAMERA_GLB || new URL('../public/world/blender/cloud-courtyard-v2.glb', import.meta.url))
  const {json} = parseGLB(bytes), decoded = await decodeDracoAccessors(bytes)
  layout = JSON.parse(await readFile(process.env.CLOUD_CAMERA_LAYOUT || new URL('../public/world/blender/cloud-courtyard-v2-layout.json', import.meta.url), 'utf8'))
  assert.equal(createHash('sha256').update(bytes).digest('hex'), layout.assetSha256, 'camera tests must use the matching authored model and layout')
  const parents = new Map(), matrices = new Map()
  json.nodes.forEach((node, index) => (node.children || []).forEach(child => parents.set(child, index)))
  const worldMatrix = index => {
    if (matrices.has(index)) return matrices.get(index)
    const node = json.nodes[index]
    const matrix = node.matrix ? new Matrix4().fromArray(node.matrix) : new Matrix4().compose(
      vector(node.translation || [0, 0, 0]), new Quaternion(...(node.rotation || [0, 0, 0, 1])), vector(node.scale || [1, 1, 1]),
    )
    if (parents.has(index)) matrix.premultiply(worldMatrix(parents.get(index)))
    matrices.set(index, matrix)
    return matrix
  }
  runtimeBounds = new Box3(); geometryBounds = new Box3()
  const point = new Vector3()
  for (const [index, node] of json.nodes.entries()) {
    if (node.mesh === undefined) continue
    for (const primitive of json.meshes[node.mesh].primitives) {
      const accessor = json.accessors[primitive.attributes.POSITION]
      // Match GLTFLoader's accessor bounds plus Box3.setFromObject. Rotated
      // primitives can make these deliberately more conservative than vertices.
      runtimeBounds.union(new Box3(vector(accessor.min), vector(accessor.max)).applyMatrix4(worldMatrix(index)))
      const positions = decoded.get(primitive.attributes.POSITION)?.array
      const indices = decoded.get(primitive.indices)?.array
      assert.ok(positions, 'collision proof must use actual decoded courtyard positions')
      assert.ok(indices, 'collision proof must use actual decoded triangle indices')
      const worldPositions = new Float32Array(positions.length)
      for (let i = 0; i < positions.length; i += 3) {
        point.set(positions[i], positions[i + 1], positions[i + 2]).applyMatrix4(worldMatrix(index))
        geometryBounds.expandByPoint(point)
        knownMeshPoint ??= point.clone()
        point.toArray(worldPositions, i)
      }
      meshWorld.createCollider(RAPIER.ColliderDesc.trimesh(worldPositions, new Uint32Array(indices)))
      triangleCount += indices.length / 3
    }
  }
  // The runtime now uses setFromObject(root, true), not transformed accessor
  // boxes. Keep this independent decoded-vertex measurement identical in scope.
  runtimeBounds.copy(geometryBounds)
  meshWorld.step()
  cameraBoxes = layout.colliders.map(box => {
    const matrix = new Matrix4().compose(vector(box.position), new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), box.rotationY || 0), new Vector3(1, 1, 1))
    const half = vector(box.halfExtents).addScalar(.18)
    return {inverse: matrix.invert(), bounds: new Box3(half.clone().negate(), half), id: box.id}
  })
  const center = runtimeBounds.getCenter(new Vector3()).toArray()
  const halfExtents = runtimeBounds.getSize(new Vector3()).multiplyScalar(.5).toArray()
  cases = aspects.flatMap(aspect => [false, true].flatMap(mobile => [undefined,dogCamera].map(cameraProfile => {
    const fov = aspect < 1 ? 58 : 53
    const overview = createIslandOverview({center, halfExtents, aspect, fov})
    return {aspect, mobile, cameraProfile, fov, overview, path: createCloudCameraPath({heroPosition: overview.position, heroTarget: overview.target, spawn: layout.spawn, mobile,cameraProfile})}
  })))
})

after(() => meshWorld?.free())

test('entry endpoints exactly match desktop and mobile free cameras without changing the overview', () => {
  for (const {mobile, overview, path,cameraProfile} of cases) {
    const distance = mobile ? (cameraProfile?.distanceMobile??4.6) : (cameraProfile?.distanceDesktop??5.3), spawn = layout.spawn
    const expected = {
      position: [spawn[0] + Math.sin(.053) * distance, spawn[1] + (cameraProfile?.baseHeight??1.5) + Math.sin(.265) * distance, spawn[2] + Math.cos(.053) * distance],
      target: [spawn[0], spawn[1] + (cameraProfile?.targetHeight??1.32), spawn[2]],
    }
    assert.deepEqual(path.sample(0), overview)
    assert.deepEqual(createExplorerCameraPose(spawn, mobile,cameraProfile), expected)
    assert.deepEqual(path.sample(1), expected)
    assert.deepEqual(path.shoulder, expected.position)
  }
})

test('a sixteen-second full spiral continuously reduces island radius and height, not distance to the moving azimuth', () => {
  assert.equal(CLOUD_INTRO_SECONDS, 16)
  for (const {path, aspect, mobile} of cases) {
    const center = runtimeBounds.getCenter(new Vector3())
    let previous = [Infinity, Infinity]
    for (let i = 0; i <= 1000; i++) {
      const pose = path.sample(i / 1000), position = vector(pose.position)
      assert.ok([...pose.position, ...pose.target].every(Number.isFinite))
      const current = [Math.hypot(position.x - center.x, position.z - center.z), position.y]
      current.forEach((value, k) => assert.ok(value <= previous[k] + 1e-9, `no pullback/rise: aspect=${aspect}, mobile=${mobile}, sample=${i}, measure=${k}`))
      previous = current
    }
  }
})

test('the unchanged initial overview retains the whole island, then continuously advances and descends', () => {
  for (const {path, overview, aspect, fov} of cases) {
    const camera = new PerspectiveCamera(fov, aspect, .075, 420)
    camera.position.fromArray(overview.position); camera.lookAt(...overview.target); camera.updateMatrixWorld()
    for (const x of [runtimeBounds.min.x, runtimeBounds.max.x]) for (const y of [runtimeBounds.min.y, runtimeBounds.max.y]) for (const z of [runtimeBounds.min.z, runtimeBounds.max.z]) {
      const projected = new Vector3(x, y, z).project(camera)
      assert.ok(Math.abs(projected.x) < .94 && Math.abs(projected.y) < .94, 'retain the complete initial island with a visible frame margin')
    }
    const center = vector(overview.target), initialDistance = camera.position.distanceTo(center)
    for (const progress of [.01, .05, .15, .35, .65, .95]) {
      const pose = path.sample(progress)
      assert.ok(pose.position[1] < overview.position[1], 'descent starts together with forward movement')
      assert.ok(vector(pose.position).distanceTo(center) < initialDistance, 'do not reserve an initial constant-distance orbit phase')
      assert.notDeepEqual(pose.target, overview.target, 'gaze progresses without waiting for a phase switch')
    }
  }
})

test('the actual trajectory completes at least 360 degrees plus the continuous endpoint alignment', () => {
  for (const {path, overview} of cases) {
    const center = overview.target
    let previousAngle, winding = 0
    const quadrants = new Set()
    for (let i = 0; i <= 1000; i++) {
      const position = path.sample(i / 1000).position
      const angle = Math.atan2(position[0] - center[0], position[2] - center[2])
      quadrants.add(Math.floor((angle + Math.PI) / (Math.PI / 2)))
      if (previousAngle !== undefined) {
        const delta = Math.atan2(Math.sin(angle - previousAngle), Math.cos(angle - previousAngle))
        assert.ok(delta <= 1e-10, 'keep one continuous rotation direction')
        winding += delta
      }
      previousAngle = angle
    }
    const degrees = Math.abs(winding) * 180 / Math.PI
    assert.ok(degrees >= 360 && degrees < 405, `complete the actual island revolution: ${degrees}`)
    assert.equal(quadrants.size, 4, 'visit the back and both sides, not only the front')
  }
})

test('swept camera volume clears every actual GLB triangle around the front, sides and back', () => {
  assert.ok(triangleCount > 100000, 'validate the detailed visible model, not only floor proxies')
  const volume = new RAPIER.Ball(.22), rotation = {x: 0, y: 0, z: 0, w: 1}
  assert.ok(meshWorld.intersectionWithShape(knownMeshPoint, rotation, volume), 'positive control: the query must detect a ball placed on an actual triangle')
  for (const {path, aspect, mobile} of cases) {
    let previous
    for (let i = 0; i <= 1000; i++) {
      const position = vector(path.sample(i / 1000).position)
      const context = `aspect=${aspect}, mobile=${mobile}, sample=${i}`
      assert.equal(meshWorld.intersectionWithShape(position, rotation, volume), null, `camera intersects visible geometry: ${context}`)
      if (previous) {
        assert.equal(meshWorld.castShape(previous, rotation, position.clone().sub(previous), volume, 0, 1, true), null, `swept camera segment intersects visible geometry: ${context}`)
      }
      for (const box of cameraBoxes) assert.ok(!box.bounds.containsPoint(position.clone().applyMatrix4(box.inverse)), `camera entered ${box.id}: ${context}`)
      previous = position
    }
  }
})

test('the scene stays ahead of the camera without a wall or rock clipping the near sightline', t => {
  let minimumBackHitRatio = 1, minimumSightlineClearance = Infinity
  for (const {path, aspect, mobile} of cases) {
    let backSamples = 0, backHits = 0
    for (let i = 0; i <= 200; i++) {
      const pose = path.sample(i / 200), position = vector(pose.position), target = vector(pose.target)
      const ray = new RAPIER.Ray(position, target.sub(position).normalize())
      // The gaze intentionally meets real island surfaces during the revolution;
      // visibility of a particular doorway from behind the rock is not promised.
      const hit = meshWorld.castRay(ray, 1000, true)
      if (hit) {
        minimumSightlineClearance = Math.min(minimumSightlineClearance, hit.timeOfImpact)
        assert.ok(hit.timeOfImpact > .6, `near sightline clipped: aspect=${aspect}, mobile=${mobile}, sample=${i}`)
      }
      if (position.z < runtimeBounds.getCenter(new Vector3()).z) {
        backSamples++
        if (hit) backHits++
      }
    }
    assert.ok(backSamples > 0)
    minimumBackHitRatio = Math.min(minimumBackHitRatio, backHits / backSamples)
    assert.ok(backHits / backSamples > .8, 'most rear-view centre rays must see the real island, not empty sky')
  }
  t.diagnostic(`rear centre-ray coverage=${(minimumBackHitRatio * 100).toFixed(1)}%; minimum surface sightline=${minimumSightlineClearance.toFixed(3)}m`)
})

test('the final free-camera sightline is clear so collision correction does not move the handoff', () => {
  for (const mobile of [false, true]) for(const cameraProfile of [undefined,dogCamera]) {
    const endpoint = createExplorerCameraPose(layout.spawn, mobile,cameraProfile)
    const position = vector(endpoint.position), target = vector(endpoint.target), direction = position.clone().sub(target)
    const length = direction.length(), ray = new Ray(target, direction.normalize()), hit = new Vector3()
    for (const box of cameraBoxes) {
      const localRay = ray.clone().applyMatrix4(box.inverse)
      if (localRay.intersectBox(box.bounds, hit)) assert.ok(localRay.origin.distanceTo(hit) > length, `free camera would be shortened by ${box.id}`)
    }
  }
})

test('one continuous motion has no interior stops, speed discontinuities or phase changes', () => {
  const epsilon = 1e-6
  const elapsedSeconds = epsilon * CLOUD_INTRO_SECONDS
  for (const {path, overview} of cases) {
    const directLength = vector(overview.position).distanceTo(vector(path.shoulder))
    for (let i = 0; i <= 100; i++) {
      const progress = i / 100
      const a = path.sample(progress - epsilon), b = path.sample(progress), c = path.sample(progress + epsilon)
      for (const key of ['position', 'target']) {
        // Compare physical m/s, not metres per normalized 0..1 progress; the
        // latter incorrectly changes the tolerance with shot duration/extent.
        const before = vector(b[key]).sub(vector(a[key])).multiplyScalar(1 / elapsedSeconds)
        const after = vector(c[key]).sub(vector(b[key])).multiplyScalar(1 / elapsedSeconds)
        assert.ok(before.distanceTo(after) < .001, `no velocity discontinuity at ${progress}`)
        if (i === 0 || i === 100) {
          assert.ok(before.length() < .001 && after.length() < .001, 'ease only at the beginning and end')
        } else {
          assert.ok(before.length() > 0 && after.length() > 0, 'never stop the position or gaze in mid-shot')
          if (key === 'position' && i >= 10 && i <= 90) assert.ok(before.length() > directLength / CLOUD_INTRO_SECONDS * .5, 'maintain spiral momentum throughout the middle 80%')
        }
      }
    }
  }
})

test('camera orientation changes gently without a sudden pan or angular-velocity jump', () => {
  const dt = CLOUD_INTRO_SECONDS / 1000
  for (const {path,aspect,mobile,cameraProfile} of cases) {
    const camera = new PerspectiveCamera()
    let previousOrientation, previousRate
    for (let i = 0; i <= 1000; i++) {
      const pose = path.sample(i / 1000)
      camera.position.fromArray(pose.position); camera.lookAt(...pose.target)
      if (previousOrientation) {
        const rate = camera.quaternion.angleTo(previousOrientation) * 180 / Math.PI / dt
        assert.ok(rate < 35, 'full-circle camera rotation stays below 35 degrees per second')
        if (previousRate !== undefined) assert.ok(Math.abs(rate - previousRate) / dt < 35, `no angular acceleration spike: ${Math.abs(rate-previousRate)/dt}, aspect=${aspect}, mobile=${mobile}, dog=${!!cameraProfile}, sample=${i}`)
        previousRate = rate
      }
      previousOrientation = camera.quaternion.clone()
    }
  }
})

test('path samples are deterministic, independent and safely clamp invalid progress', () => {
  const path = cases[0].path, start = path.sample(0), end = path.sample(1)
  for (const progress of [NaN, Infinity, -Infinity, -2]) assert.deepEqual(path.sample(progress), start)
  assert.deepEqual(path.sample(2), end)
  const first = path.sample(.4), second = path.sample(.4)
  assert.deepEqual(first, second)
  first.position[0] += 50; first.target[1] -= 50; path.shoulder[0] += 50
  assert.deepEqual(path.sample(.4), second)
  assert.deepEqual(path.sample(1), end)
})
