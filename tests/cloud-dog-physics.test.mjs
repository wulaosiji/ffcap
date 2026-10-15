import assert from 'node:assert/strict'
import test from 'node:test'
import {createTraversal, FIXED_TIMESTEP} from '../src/components/editorial-home/world/settlement/physics.mjs'
import {CLOUD_DOG_PROFILE as dog, CLOUD_HUMAN_PROFILE as human} from '../src/components/editorial-home/world/settlement/cloudCharacterProfile.mjs'

const floor = {position: [0, -.2, 0], halfExtents: [20, .2, 20]}
const tick = (body, seconds, input = {x: 0, z: 0}) => {
  let state
  for (let frame = 0; frame < Math.round(seconds / FIXED_TIMESTEP); frame++) state = body.step(FIXED_TIMESTEP, input)
  return state
}
async function fixture(t, colliders = [floor], spawn = [0, .03, 0], character = dog) {
  const body = await createTraversal({colliders, spawn, character})
  t.after(() => body.dispose()); tick(body, .4)
  return body
}

test('separate frozen profiles preserve the human contract and bound dog dimensions/camera', () => {
  assert.deepEqual([human.height, human.radius, human.walkSpeed, human.runSpeed], [1.75, .28, 3.2, 5.3])
  assert.deepEqual([dog.height, dog.radius, dog.collision.halfLength, dog.collision.stepHeight], [.79, .17, .61, .2])
  assert.deepEqual(dog.camera, {targetHeight: .5, baseHeight: .68, distanceDesktop: 3.5, distanceMobile: 3, yaw: .053, pitch: .265})
  for (const profile of [human, dog]) for (const value of [profile, profile.camera, profile.collision]) assert.ok(Object.isFrozen(value))
})

test('low long dog body grounds, matches dog speeds, and does not inherit human head clearance', async t => {
  const roof = {position: [0, .98, 0], halfExtents: [4, .08, 4]}
  const body = await fixture(t, [floor, roof])
  const start = body.position, walked = tick(body, 1, {x: 0, z: -1, heading: 0})
  assert.ok(Math.abs(walked.position.z - start.z + dog.walkSpeed) < .025)
  assert.ok(walked.grounded && walked.position.y > -.005 && walked.position.y < .035)
  body.teleport([0, .03, 0]); tick(body, .4)
  const ran = tick(body, 1, {x: 0, z: -1, heading: 0, run: true})
  assert.ok(Math.abs(ran.position.z + dog.runSpeed) < .025)
})

test('four 18 cm risers are crossed and descended; a 30 cm vertical obstacle is blocked', async t => {
  const stairs = Array.from({length: 4}, (_, i) => ({position: [0, .09 * (i + 1), -(1.4 + .48 * i)], halfExtents: [1.5, .09 * (i + 1), .25]}))
  const landing = {position: [0, .36, -4], halfExtents: [1.5, .36, 1.5]}
  const body = await fixture(t, [floor, ...stairs, landing])
  const top = tick(body, 3.2, {x: 0, z: -1, heading: 0})
  assert.ok(top.position.z < -2.45, JSON.stringify(top))
  assert.ok(top.position.y > .68, JSON.stringify(top))
  const back = tick(body, 4.4, {x: 0, z: 1, heading: Math.PI})
  assert.ok(back.position.z > -.4 && back.position.y < .04, JSON.stringify(back))
  const wall = await fixture(t, [floor, {position: [0, .15, -1.5], halfExtents: [2, .15, .3]}])
  const blocked = tick(wall, 2, {x: 0, z: -1, heading: 0})
  assert.ok(blocked.position.z > -.7 && blocked.position.y < .04, JSON.stringify(blocked))
})

test('body length blocks its nose before the narrow radius would touch a wall', async t => {
  const body = await fixture(t, [floor, {position: [0, 1, -2], halfExtents: [4, 1, .1]}])
  const stopped = tick(body, 3, {x: 0, z: -1, heading: 0})
  const stop = -1.9 + dog.collision.halfLength + .015
  assert.ok(Math.abs(stopped.position.z - stop) < .015, JSON.stringify(stopped))
})

test('rotation sweeps stop between clear endpoint poses, and translation can release the turn', async t => {
  const wall = {position: [.37, .6, 0], halfExtents: [.02, .6, 2]}
  const body = await fixture(t, [floor, wall])
  const stopped = tick(body, 2, {x: 0, z: 0, heading: Math.PI})
  assert.ok(stopped.heading > .2 && stopped.heading < 1, JSON.stringify(stopped))
  assert.ok(Math.abs(stopped.position.x) < .01 && Math.abs(stopped.position.z) < .01, JSON.stringify(stopped))
  tick(body, 2, {x: -1, z: 0, heading: Math.PI/2})
  const released = tick(body, 1, {x: 0, z: 1, heading: Math.PI})
  assert.ok(released.heading > 3.1, JSON.stringify(released))
  assert.ok(released.position.x < -1)
})

test('world probes exclude own body, return real tilted normals, and are safe to pass unbound', async t => {
  const body = await fixture(t)
  const probe = body.sampleGround
  const hit = probe(.08, -.23, .8, 1)
  assert.ok(hit && Math.abs(hit.height) < 1e-5)
  assert.ok(hit.normal.y > .99)
  assert.equal(probe(50, 50, .8, 1), null)
  assert.equal(probe(NaN, 0, 1), null)
  assert.equal(probe(0, 0, 1, -1), null)
  const ramp = await createTraversal({colliders: [], spawn: [0, 3, 0], character: dog, surfaces: [{vertices: [-2,0,-2, -2,0,2, 2,1,2, 2,1,-2], indices: [0,1,2,0,2,3]}]})
  t.after(() => ramp.dispose())
  const tilted = ramp.sampleGround(0, 0, 2, 2)
  assert.ok(tilted && Math.abs(tilted.height - .5) < .001)
  assert.ok(tilted.normal.y > .96 && tilted.normal.x < -.2)
})

test('finite input, pause, teleport and disposal retain independent physical heading', async t => {
  const body = await fixture(t)
  const state = tick(body, .5, {x: 0, z: 0, heading: 1})
  assert.ok(Math.abs(state.heading - 1) < .001)
  assert.deepEqual(body.step(0, {x: 1, z: 0, heading: 2}), state)
  assert.equal(body.step(NaN, {x: 0, z: 0, heading: Infinity}).heading, state.heading)
  assert.equal(body.teleport([2, 1, 3]).heading, 0)
  body.dispose(); assert.throws(() => body.sampleGround(0, 0, 1), /disposed/)
  await assert.rejects(createTraversal({colliders: [], spawn: [0, 0, 0], character: {...dog, radius: NaN}}), /finite/)
})

test('dog contact remains stable on real triangle floors across headings and render rates', async t => {
  const surface = {vertices: [-20,0,-20, -20,0,20, 20,0,20, 20,0,-20], indices: [0,1,2,0,2,3]}
  for (const fps of [30, 60, 120]) for (const angle of [0,.7,Math.PI/2,Math.PI,4.1]) {
    const body = await createTraversal({colliders: [], surfaces: [surface], spawn: [.31,.035,.43], character: dog})
    t.after(() => body.dispose())
    tick(body, 2, {x:0,z:0,heading:angle})
    const start = body.position, x = -Math.sin(angle), z = -Math.cos(angle)
    let maximumVertical = 0, maxStep = 0, previous = start
    for (let frame=0;frame<fps*3;frame++) {
      const state=body.step(1/fps,{x,z,heading:angle,run:true})
      maximumVertical=Math.max(maximumVertical,Math.abs(state.position.y))
      maxStep=Math.max(maxStep,Math.hypot(state.position.x-previous.x,state.position.z-previous.z));previous=state.position
    }
    const travelled=Math.hypot(previous.x-start.x,previous.z-start.z), requested=dog.runSpeed*3
    // The collision solver may shorten contact frames at a triangle seam. We
    // check the actual physical travel, while the separate rig tests verify
    // cadence follows that travel rather than the requested nominal speed.
    assert.ok(travelled>requested*.95 && travelled<=requested+.03, `${fps} Hz yaw ${angle}: ${travelled}/${requested}`)
    assert.ok(maximumVertical<.04, `${fps} Hz yaw ${angle}: height ${maximumVertical}`)
    assert.ok(maxStep<=dog.runSpeed/Math.min(fps,60)+.01)
  }
})
