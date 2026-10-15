import assert from 'node:assert/strict'
import test from 'node:test'
import {readFile, access} from 'node:fs/promises'
import ts from 'typescript'
import * as T from 'three'
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js'
import {createTraversal} from '../src/components/editorial-home/world/settlement/physics.mjs'
import {CLOUD_DOG_PROFILE} from '../src/components/editorial-home/world/settlement/cloudCharacterProfile.mjs'
import {cloudGroundHeight, cloudLocationAt} from '../src/components/editorial-home/world/settlement/cloudLayout.mjs'

// Load the actual runtime and resource manager, transpiled only in memory.
const cache = new Map()
async function executable(url) {
  if (cache.has(url.href)) return cache.get(url.href)
  let source = ts.transpileModule(await readFile(url, 'utf8'), {compilerOptions: {target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022}}).outputText
  const imports = [...source.matchAll(/from (['"])([^'"]+)\1/g)]
  for (const match of imports) {
    const specifier = match[2]
    let resolved
    if (specifier.startsWith('.')) {
      const path = new URL(specifier.endsWith('.mjs') ? specifier : `${specifier}.ts`, url)
      resolved = path.pathname.endsWith('.ts') ? await executable(path) : path.href
    } else resolved = import.meta.resolve(specifier)
    source = source.replace(match[0], `from ${JSON.stringify(resolved)}`)
  }
  const result = `data:text/javascript;base64,${Buffer.from(source).toString('base64')}`
  cache.set(url.href, result); return result
}
const moduleURL = new URL('../src/components/editorial-home/world/settlement/cloudDog.ts', import.meta.url)
const {createCloudDogRig, createCloudDog, solveDogLeg} = await import(await executable(moduleURL))
const ids = ['FL', 'FR', 'HL', 'HR']
const finitePose = rig => rig.root.traverse(node => {
  assert.ok([...node.position, ...node.quaternion, ...node.scale].every(Number.isFinite), node.name)
})

function assetFixture() {
  const scene = new T.Group(), skeletonRoot = new T.Bone(), bones = [skeletonRoot]
  skeletonRoot.name = 'root'; scene.add(skeletonRoot)
  const legs = {}, positions = [], indices = [], weights = []
  const description = {schemaVersion: 1, legs: {}, gait: {idle: {duration: 3.6}, walk: {duration: .8, speed: .75, duty: .64}, run: {duration: .48, speed: 1.6, duty: .55}}}
  for (const [index, id] of ids.entries()) {
    const x = index % 2 ? -.09 : .09, z = index < 2 ? -.24 : .24
    const upper = new T.Bone(), lower = new T.Bone(), paw = new T.Bone()
    upper.name = `${id}_upper`; lower.name = `${id}_lower`; paw.name = `${id}_paw`
    upper.position.set(x, .36, z); lower.position.set(0, -.15, .17); paw.position.set(0, -.15, -.17)
    skeletonRoot.add(upper); upper.add(lower); lower.add(paw)
    bones.push(upper, lower, paw); legs[id] = {upper, lower, paw}
    description.legs[id] = {upper: upper.name, lower: lower.name, paw: paw.name, soleOffset: [0, -.06, 0], phaseWalk: [0,.5,.25,.75][index], phaseRun: [0,.5,.5,0][index]}
    for (const dx of [0, -.015, .015]) {
      positions.push(x + dx, 0, z); indices.push(bones.length - 1, 0, 0, 0); weights.push(1, 0, 0, 0)
    }
  }
  scene.userData.cloudDog = description
  const geometry = new T.BufferGeometry()
  geometry.setAttribute('position', new T.Float32BufferAttribute(positions, 3))
  geometry.setAttribute('skinIndex', new T.Uint16BufferAttribute(indices, 4))
  geometry.setAttribute('skinWeight', new T.Float32BufferAttribute(weights, 4))
  const skin = new T.SkinnedMesh(geometry, new T.MeshStandardMaterial())
  scene.add(skin); scene.updateMatrixWorld(true); skin.bind(new T.Skeleton(bones))
  const animations = []
  for (const name of ['idle', 'walk', 'run']) {
    const gait = description.gait[name], tracks = [], times = Array.from({length: 61}, (_, i) => i / 60 * gait.duration)
    const data = new Map(bones.slice(1).map(bone => [bone, []]))
    for (const time of times) {
      for (const [id, {upper, lower, paw}] of Object.entries(legs)) {
        upper.quaternion.identity(); lower.quaternion.identity(); paw.quaternion.identity(); scene.updateMatrixWorld(true)
        const config = description.legs[id], phase = name === 'idle' ? 0 : (time / gait.duration + config[name === 'walk' ? 'phaseWalk' : 'phaseRun']) % 1
        const target = paw.getWorldPosition(new T.Vector3())
        if (name !== 'idle') {
          const stride = gait.speed * gait.duration * gait.duty
          if (phase < gait.duty) target.z += (phase / gait.duty - .5) * stride
          else {const u = (phase - gait.duty) / (1 - gait.duty); target.z += (.5 - u) * stride; target.y += Math.sin(u * Math.PI) * .08}
        }
        solveDogLeg(upper, lower, paw, target, new T.Quaternion())
        for (const bone of [upper, lower, paw]) data.get(bone).push(...bone.quaternion)
      }
    }
    for (const [bone, quaternions] of data) tracks.push(new T.QuaternionKeyframeTrack(`${bone.name}.quaternion`, times, quaternions))
    animations.push(new T.AnimationClip(name, gait.duration, tracks))
  }
  bones.forEach(bone => bone.quaternion.identity()); scene.updateMatrixWorld(true)
  return {scene, scenes: [scene], animations, cameras: [], parser: {}, userData: {}, asset: {version: '2.0'}}
}

function fixture(t) {
  const asset = assetFixture(), rig = createCloudDogRig(asset)
  rig.setGroundSampler(() => ({height: 0, normal: {x: 0, y: 1, z: 0}}))
  t.after(() => rig.dispose())
  return {rig, asset}
}

test('actual two-bone IK reaches its target, retains segment lengths and works under a rotated parent', () => {
  const parent = new T.Group(), upper = new T.Bone(), lower = new T.Bone(), paw = new T.Bone()
  parent.position.set(2, 3, -1); parent.rotation.set(.15, .8, .2)
  parent.add(upper); upper.add(lower); lower.add(paw)
  lower.position.set(0, -.18, .12); paw.position.set(0, -.22, -.1); parent.updateMatrixWorld(true)
  const l1 = lower.position.length(), l2 = paw.position.length(), orientation = paw.getWorldQuaternion(new T.Quaternion())
  const target = parent.localToWorld(new T.Vector3(.07, -.31, -.16))
  assert.ok(solveDogLeg(upper, lower, paw, target, orientation) < 1e-6)
  assert.ok(paw.getWorldPosition(new T.Vector3()).distanceTo(target) < 1e-6)
  assert.ok(Math.abs(upper.getWorldPosition(new T.Vector3()).distanceTo(lower.getWorldPosition(new T.Vector3())) - l1) < 1e-7)
  assert.ok(Math.abs(lower.getWorldPosition(new T.Vector3()).distanceTo(paw.getWorldPosition(new T.Vector3())) - l2) < 1e-7)
  assert.ok(paw.getWorldQuaternion(new T.Quaternion()).angleTo(orientation) < 1e-6)
  const far = parent.localToWorld(new T.Vector3(0, -20, 0))
  assert.ok(solveDogLeg(upper, lower, paw, far, orientation) > 19)
  for (const bone of [upper, lower, paw]) assert.ok([...bone.quaternion].every(Number.isFinite))
})

test('four actual skeleton soles remain planted through idle without accumulating IK changes', t => {
  const {rig, asset} = fixture(t)
  rig.root.position.set(7, .015, -8); rig.root.rotation.y = .7
  for (let i = 0; i < 600; i++) rig.update(1/60, {speed: 0, grounded: true, turn: 0})
  const state = rig.inspectGrounding()
  assert.equal(state.gait, 'idle')
  for (const foot of state.feet) {assert.ok(foot.planted); assert.ok(Math.abs(foot.sole[1]) < .0001); assert.ok(foot.error < .0001)}
  // Check real skin transforms too, not only debug metadata.
  const skin = asset.scene.children.find(node => node.isSkinnedMesh)
  skin.skeleton.update()
  for (let index = 0; index < 12; index += 3) {
    const vertex = new T.Vector3().fromBufferAttribute(skin.geometry.attributes.position, index)
    skin.applyBoneTransform(index, vertex).applyMatrix4(skin.matrixWorld)
    assert.ok(Math.abs(vertex.y) < .0001, `skin sole y=${vertex.y}`)
  }
  finitePose(rig)
})

test('walk/run phase follows travelled speed and planted paws do not skate in world space', t => {
  for (const [speed, gait, duration, authoredSpeed] of [[1.2, 'walk', .8, .75], [2.8, 'run', .48, 1.6]]) {
    const {rig} = fixture(t)
    let previous, plants = 0, maxSlip = 0, maxError = 0, worst
    for (let i = 0; i < 300; i++) {
      rig.root.position.z -= speed / 120
      rig.update(1/120, {speed, grounded: true, turn: 0})
      const state = rig.inspectGrounding()
      if (i > 30) assert.equal(state.gait, gait)
      for (let j = 0; j < 4; j++) {
        const foot = state.feet[j], before = previous?.feet[j]
        if (i > 35 && foot.planted && before?.planted && foot.phase >= before.phase) {
          const slip = Math.hypot(foot.sole[0] - before.sole[0], foot.sole[2] - before.sole[2])
          if (slip > maxSlip) {maxSlip = slip; worst = {i, foot, before}}
          plants++
        }
        if (i > 35) maxError = Math.max(maxError, foot.error)
      }
      previous = state
    }
    assert.ok(plants > 200)
    assert.ok(maxSlip < .003, `${gait} maximum planted slip ${maxSlip}; IK residual ${maxError}; ${JSON.stringify(worst)}`)
    assert.ok(maxError < .003, `${gait} maximum IK residual ${maxError}`)
    const expected = (300 / 120 * speed / authoredSpeed / duration) % 1
    const phaseError = Math.abs(previous.cycle - expected)
    assert.ok(Math.min(phaseError, 1 - phaseError) < 1e-5)
  }
})

test('four world probes shape a smooth stair/slope posture, with no fabricated support over a gap', t => {
  const {rig} = fixture(t), calls = []
  rig.root.position.y = .09
  rig.setGroundSampler((x, z, fromY, drop) => {calls.push([x,z,fromY,drop]); return {height: z < 0 ? .18 : 0, normal: {x:0,y:1,z:0}}})
  let previous = 0, maximumChange = 0
  for (let i = 0; i < 240; i++) {
    rig.update(1/60, {speed:0,grounded:true,turn:0})
    const state = rig.inspectGrounding(); maximumChange = Math.max(maximumChange, Math.abs(state.bodyPitch - previous)); previous = state.bodyPitch
  }
  const state = rig.inspectGrounding()
  assert.ok(state.bodyPitch > .25 && state.bodyPitch <= .3)
  assert.ok(maximumChange < .05)
  assert.ok(calls.length >= 4 * 240 && calls.every(point => point.every(Number.isFinite)))
  for (const foot of state.feet) assert.ok(Math.abs(foot.sole[1] - (foot.id.startsWith('F') ? .18 : 0)) < .003, JSON.stringify(foot))
  rig.setGroundSampler(() => null)
  rig.update(1/60,{speed:0,grounded:true,turn:0})
  assert.ok(rig.inspectGrounding().feet.every(foot => !foot.planted))
  finitePose(rig)
})

test('turning in place replants, pause does not advance, teleport releases old world anchors', t => {
  const {rig} = fixture(t)
  for (let i = 0; i < 60; i++) {rig.root.rotation.y += .01; rig.update(1/60,{speed:0,grounded:true,turn:.6})}
  assert.equal(rig.inspectGrounding().gait, 'walk')
  const before = rig.inspectGrounding()
  for (const dt of [0, -1, NaN, Infinity]) rig.update(dt,{speed:2,grounded:true,turn:1})
  assert.deepEqual(rig.inspectGrounding(), before)
  assert.throws(() => rig.update(.01,{speed:NaN,grounded:true,turn:0}), /finite/)
  assert.deepEqual(rig.inspectGrounding(), before)
  rig.root.position.x += 10
  rig.update(1/60,{speed:0,grounded:true,turn:0})
  assert.ok(rig.inspectGrounding().feet.every(foot => foot.sole[0] > 9 && foot.target[0] > 9))
  rig.update(1/60,{speed:2,grounded:false,turn:0})
  assert.ok(rig.inspectGrounding().feet.every(foot => !foot.planted))
})

test('own resources dispose once; late updates are harmless and original human data is never consulted', t => {
  const {rig, asset} = fixture(t), skin = asset.scene.children.find(node => node.isSkinnedMesh)
  let geometry = 0, material = 0
  skin.geometry.addEventListener('dispose', () => geometry++)
  skin.material.addEventListener('dispose', () => material++)
  rig.dispose(); rig.dispose()
  assert.equal(geometry,1); assert.equal(material,1)
  assert.equal(rig.root.children.length,0)
  assert.doesNotThrow(() => rig.update(1,{speed:NaN,turn:NaN,grounded:false}))
  assert.doesNotThrow(() => rig.resetPose())
})

test('resetPose restores paused idle after an in-place turn without a time step or losing sampler',t=>{
  const {rig}=fixture(t)
  let queries=0
  rig.setGroundSampler(()=>{queries++;return {height:.08,normal:{x:0,y:1,z:0}}})
  for(let frame=0;frame<80;frame++){rig.root.rotation.y+=.02;rig.update(1/60,{speed:0,grounded:true,turn:1.2})}
  assert.notEqual(rig.inspectGrounding().bodyOffset,0)
  rig.root.rotation.y=0;rig.root.position.set(0,0,0)
  rig.resetPose()
  const state=rig.inspectGrounding()
  assert.deepEqual([state.gait,state.cycle,state.bodyOffset,state.bodyPitch,state.bodyRoll],['idle',0,0,0,0])
  assert.ok(state.feet.every(foot=>!foot.planted&&!foot.recovering&&Math.abs(foot.sole[1])<1e-7&&foot.error===0))
  const before=queries
  rig.update(1/60,{speed:0,grounded:true,turn:0})
  assert.ok(queries>before,'reset must preserve the supplied world sampler')
})

test('loader rejects invalid or mismatched dog manifests before any model request', async t => {
  const original = globalThis.fetch, requests = []
  t.after(() => {globalThis.fetch = original})
  globalThis.fetch = async (...args) => {requests.push(args); return new Response(JSON.stringify({schemaVersion:1,sha256:'a'.repeat(64),bytes:123}))}
  await assert.rejects(createCloudDog(false, 'b'.repeat(64)), /does not match manifest/)
  assert.equal(requests.length,1)
  assert.equal(requests[0][0],'/world/blender/cloud-dog-v1-asset.json')
  assert.deepEqual(requests[0][1],{cache:'no-store'})
  globalThis.fetch = async () => new Response(JSON.stringify({schemaVersion:1,sha256:'not-a-hash',bytes:123}))
  await assert.rejects(createCloudDog(true), /Invalid dog asset manifest/)
})

const realPath = process.env.CLOUD_DOG_GLB ?? new URL('../public/world/blender/cloud-dog-v1.glb', import.meta.url)
let realAvailable = true
try {await access(realPath)} catch {realAvailable = false}
async function loadRealAsset() {
  const bytes = await readFile(realPath), loader = new GLTFLoader()
  // CPU-only animation verification: do not decode/render images. All geometry,
  // bone transforms, inverse bind matrices, weights and clips are the actual GLB.
  loader.register(() => ({name:'CPU_pose_test_textures',loadTexture:async () => new T.Texture()}))
  return loader.parseAsync(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), '')
}

// Actual sole-band vertices weighted to each paw/toe, selected in rest space.
function soleVertices(asset) {
  const result=Object.fromEntries(ids.map(id=>[id,[]]))
  asset.scene.updateMatrixWorld(true)
  asset.scene.traverse(mesh=>{
    if(!mesh.isSkinnedMesh)return
    const joints=mesh.geometry.attributes.skinIndex,weights=mesh.geometry.attributes.skinWeight,position=mesh.geometry.attributes.position
    for(let index=0;index<position.count;index++) {
      const vertex=new T.Vector3().fromBufferAttribute(position,index), world=mesh.applyBoneTransform(index,vertex.clone()).applyMatrix4(mesh.matrixWorld)
      if(world.y>.012||world.y<-.01)continue
      for(const id of ids){
        let weight=0
        for(let channel=0;channel<4;channel++){const bone=mesh.skeleton.bones[joints.getComponent(index,channel)];if(bone?.name===`${id}_paw`||bone?.name===`${id}_toe`)weight+=weights.getComponent(index,channel)}
        if(weight>.7)result[id].push({mesh,index,vertex})
      }
    }
  })
  return result
}

test('authored dog GLB: real Loader/Mixer skin chains retain stance contact through walk/run', {skip: !realAvailable && 'Dog GLB not yet promoted; set CLOUD_DOG_GLB to validate a private candidate'}, async t => {
  const asset=await loadRealAsset(), vertices=soleVertices(asset)
  for(const id of ids)assert.ok(vertices[id].length>3,`${id} has actual skinned sole vertices`)
  const rig = createCloudDogRig(asset); t.after(() => rig.dispose())
  rig.setGroundSampler(() => ({height:0,normal:{x:0,y:1,z:0}}))
  rig.root.position.y = .015
  for (const speed of [0,.6,1.2,2.8,0]) {
    let previous, plants=0, maxSlip=0, maxError=0, maxHeight=0, minSkin=Infinity, maxSkin=-Infinity, worst
    for (let frame=0;frame<240;frame++) {
      rig.root.position.z -= speed/120
      rig.update(1/120,{speed,grounded:true,turn:0})
      const state = rig.inspectGrounding()
      for (let index=0;index<4;index++) {
        const foot=state.feet[index], before=previous?.feet[index]
        if(frame>40&&foot.planted&&before?.planted&&foot.phase>=before.phase){
          const slip=Math.hypot(foot.sole[0]-before.sole[0],foot.sole[2]-before.sole[2])
          if(slip>maxSlip){maxSlip=slip;worst={frame,foot,before}}
          maxError=Math.max(maxError,foot.error);maxHeight=Math.max(maxHeight,Math.abs(foot.sole[1]));plants++
          let lowest=Infinity
          for(const {mesh,index,vertex} of vertices[foot.id])lowest=Math.min(lowest,mesh.applyBoneTransform(index,vertex.clone()).applyMatrix4(mesh.matrixWorld).y)
          minSkin=Math.min(minSkin,lowest);maxSkin=Math.max(maxSkin,lowest)
        }
      }
      finitePose(rig); previous=state
    }
    t.diagnostic(JSON.stringify({speed,plants,maxSlip,maxError,maxHeight,minSkin,maxSkin}))
    assert.ok(plants>150)
    assert.ok(maxSlip<.003,`real dog speed=${speed}, slip=${maxSlip}, ${JSON.stringify(worst)}`)
    assert.ok(maxError<.005,`real dog speed=${speed}, IK residual=${maxError}`)
    assert.ok(maxHeight<.005,`real dog speed=${speed}, planted sole y=${maxHeight}`)
    assert.ok(minSkin>-.018&&maxSkin<.018,`real dog speed=${speed}, actual sole-band y ${minSkin}..${maxSkin}`)
  }
})

test('actual courtyard: dog and authored rig walk the bridge and Agentic route both ways', {skip: !realAvailable && 'Requires authored dog GLB'}, async t=>{
  const layout=JSON.parse(await readFile(new URL('../public/world/blender/cloud-courtyard-v2-layout.json',import.meta.url),'utf8'))
  const body=await createTraversal({...layout,character:CLOUD_DOG_PROFILE}),asset=await loadRealAsset(),vertices=soleVertices(asset),rig=createCloudDogRig(asset)
  const soleSamples=vertices
  t.after(()=>{rig.dispose();body.dispose()})
  rig.setGroundSampler(body.sampleGround)
  let heading=0,velocity=0,previous=body.position,minY=Infinity,maxY=-Infinity,bridgeSeen=false,maxIK=0,maxPawGap=0,minSkin=Infinity,maxSkin=-Infinity,minSupport=4,recoverySteps=0,worst
  const recovering={FL:false,FR:false,HL:false,HR:false}
  for(let frame=0;frame<60;frame++)body.step(1/60)
  for(const [leg,route] of [layout.guideToAgentic,[...layout.guideToAgentic].reverse().concat([[layout.spawn[0],layout.spawn[2]]])].entries()){
    let index=0
    for(let frame=0;frame<4800&&index<route.length;frame++){
      const p=body.position,dx=route[index][0]-p.x,dz=route[index][1]-p.z,length=Math.hypot(dx,dz)
      let x=0,z=0
      if(length<.17)index++
      else{x=dx/length*.64;z=dz/length*.64;const goal=Math.atan2(-x,-z);heading+=Math.atan2(Math.sin(goal-heading),Math.cos(goal-heading))/6}
      const oldHeading=rig.root.rotation.y,result=body.step(1/60,{x,z,heading});heading=result.heading
      velocity=T.MathUtils.damp(velocity,Math.hypot(result.position.x-previous.x,result.position.z-previous.z)*60,10,1/60)
      previous=result.position;rig.root.position.set(previous.x,previous.y,previous.z);rig.root.rotation.y=heading
      rig.update(1/60,{speed:velocity,grounded:result.grounded,turn:(heading-oldHeading)*60})
      minY=Math.min(minY,previous.y);maxY=Math.max(maxY,previous.y)
      bridgeSeen ||= cloudLocationAt(layout,previous)==='bridge'
      const beneath=cloudGroundHeight(layout,previous.x,previous.z,previous.y+.2)
      assert.ok(Number.isFinite(beneath)&&previous.y>=beneath-.04,'body must not fall through visible walking mesh')
      const grounding=rig.inspectGrounding()
      if(frame>60)minSupport=Math.min(minSupport,grounding.feet.filter(foot=>foot.planted).length)
      for(const foot of grounding.feet){
        if(foot.recovering&&!recovering[foot.id])recoverySteps++
        recovering[foot.id]=foot.recovering
        if(frame>60&&foot.planted){
          if(foot.error>maxIK){maxIK=foot.error;worst={leg,frame,position:previous,foot,posture:[grounding.bodyOffset,grounding.bodyPitch,grounding.bodyRoll]}}
          const actual=body.sampleGround(foot.sole[0],foot.sole[2],previous.y+.5,1.05)
          if(actual)maxPawGap=Math.max(maxPawGap,Math.abs(foot.sole[1]-actual.height))
          if(frame%3===0){
            let lowest=Infinity
            for(const {mesh,index,vertex} of soleSamples[foot.id]){
              const v=mesh.applyBoneTransform(index,vertex.clone()).applyMatrix4(mesh.matrixWorld),hit=body.sampleGround(v.x,v.z,previous.y+.5,1.05)
              if(hit)lowest=Math.min(lowest,v.y-hit.height)
            }
            if(Number.isFinite(lowest)){minSkin=Math.min(minSkin,lowest);maxSkin=Math.max(maxSkin,lowest)}
          }
        }
      }
      finitePose(rig)
    }
    assert.equal(index,route.length,`dog route leg ${leg} stopped at ${JSON.stringify(body.position)}`)
    if(leg===0)assert.equal(cloudLocationAt(layout,body.position),'agentic')
  }
  assert.ok(bridgeSeen&&minY>-.03&&maxY>.5)
  assert.ok(Math.hypot(body.position.x-layout.spawn[0],body.position.z-layout.spawn[2])<.18)
  t.diagnostic(JSON.stringify({minY,maxY,maxIK,maxPawGap,minSkin,maxSkin,minSupport,recoverySteps,worst}))
  assert.ok(maxIK<.035,`courtyard worst IK ${maxIK}: ${JSON.stringify(worst)}`)
  // A paw spanning a paver edge can be above the centre ray while its toe pad
  // contacts the higher stone. Actual skin clearance, not the centre ray alone,
  // is the support criterion below.
  assert.ok(minSkin>-.025&&maxSkin<.025,`courtyard actual sole clearance ${minSkin}..${maxSkin}`)
  assert.ok(minSupport>=1,'ordinary courtyard walking retains at least one planted support')
})

test('authored dog pivots both ways through 360 degrees with real planted support and lifted recovery', {skip:!realAvailable&&'Requires authored dog GLB'},async t=>{
  for(const turn of [-2,2]){
    const asset=await loadRealAsset(),vertices=soleVertices(asset),rig=createCloudDogRig(asset)
    t.after(()=>rig.dispose());rig.root.position.y=.015
    rig.setGroundSampler(()=>({height:0,normal:{x:0,y:1,z:0}}))
    for(let i=0;i<30;i++)rig.update(1/60,{speed:0,grounded:true,turn:0})
    let minSupport=4,maxError=0,maxSkin=0,maxShift=0,previousY=0,recoveries=0
    for(let frame=0;frame<240;frame++){
      rig.root.rotation.y+=turn/60;rig.update(1/60,{speed:0,grounded:true,turn})
      const state=rig.inspectGrounding()
      if(frame>20){
        minSupport=Math.min(minSupport,state.feet.filter(foot=>foot.planted).length)
        maxShift=Math.max(maxShift,Math.abs(state.bodyOffset-previousY))
        for(const foot of state.feet){
          if(foot.recovering)recoveries++
          if(!foot.planted)continue
          maxError=Math.max(maxError,foot.error)
          let lowest=Infinity
          for(const {mesh,index,vertex} of vertices[foot.id])lowest=Math.min(lowest,mesh.applyBoneTransform(index,vertex.clone()).applyMatrix4(mesh.matrixWorld).y)
          maxSkin=Math.max(maxSkin,Math.abs(lowest))
        }
      }
      previousY=state.bodyOffset;finitePose(rig)
    }
    t.diagnostic(JSON.stringify({turn,minSupport,maxError,maxSkin,maxShift,recoveryFrames:recoveries}))
    assert.ok(minSupport>=1,'turning must not unlock all four feet together')
    assert.ok(maxError<.005,`turn ${turn}: IK ${maxError}`)
    assert.ok(maxSkin<.018,`turn ${turn}: skin ${maxSkin}`)
    assert.ok(maxShift<.025,`turn ${turn}: torso discontinuity ${maxShift}`)
    assert.ok(Math.abs(rig.root.rotation.y)>Math.PI*2)
  }
})
