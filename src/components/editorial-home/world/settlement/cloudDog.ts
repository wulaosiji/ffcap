import * as T from 'three'
import type {GLTF} from 'three/addons/loaders/GLTFLoader.js'
import {loadOwnedGLB, resourceOwner, validateAuthoredScene} from './blenderAssets'
import {CLOUD_DOG_PROFILE} from './cloudCharacterProfile.mjs'
import {createCloudAttention} from './cloudAttention'

export type DogGroundHit = {height: number; normal: {x: number; y: number; z: number}}
/** All positions/heights are world-space metres; null means no supporting ground. */
export type DogGroundSampler = (x: number, z: number, fromY: number, maxDrop: number) => DogGroundHit | null
export type DogMotion = {speed: number; grounded: boolean; turn: number; groundHeight?: number}
type GaitName = 'idle' | 'walk' | 'run'
type LegName = 'FL' | 'FR' | 'HL' | 'HR'
type LegDescription = {upper: string; lower: string; paw: string; soleOffset: number[]; phaseWalk: number; phaseRun: number}
type DogDescription = {schemaVersion: 1; legs: Record<LegName, LegDescription>; gait: Record<GaitName, {duration: number; speed?: number; duty?: number}> & {sit?: {duration: number}}}
type Leg = LegDescription & {id: LegName; upperBone: T.Bone; lowerBone: T.Bone; pawBone: T.Bone; offset: T.Vector3; localUp: T.Vector3; neutral: T.Vector3; support: T.Vector3[]; planted: boolean; lock: T.Vector3; sole: T.Vector3; target: T.Vector3; hit: DogGroundHit | null; phase: number; error: number; recoveryTime: number; recoveryStart: T.Vector3; lastSole: T.Vector3; hasLast: boolean}
const LEG_NAMES: LegName[] = ['FL', 'FR', 'HL', 'HR']
const GAIT_NAMES: GaitName[] = ['idle', 'walk', 'run']
const UP = new T.Vector3(0, 1, 0)
const clamp = T.MathUtils.clamp
const smooth = (x: number) => {const v = clamp(x, 0, 1); return v * v * (3 - 2 * v)}

function readDescription(scene: T.Object3D): DogDescription {
  let value: DogDescription | undefined
  scene.traverse(node => {if (node.userData.cloudDog) value = node.userData.cloudDog as DogDescription})
  if (!value || value.schemaVersion !== 1) throw new Error('Dog GLB requires cloudDog rig metadata')
  for (const id of LEG_NAMES) {
    const leg = value.legs?.[id]
    if (!leg || ![leg.upper, leg.lower, leg.paw].every(name => typeof name === 'string' && name.length > 0)
      || !Array.isArray(leg.soleOffset) || leg.soleOffset.length !== 3 || !leg.soleOffset.every(Number.isFinite)
      || ![leg.phaseWalk, leg.phaseRun].every(v => Number.isFinite(v) && v >= 0 && v < 1)) throw new Error(`Invalid dog ${id} rig metadata`)
  }
  for (const name of GAIT_NAMES) {
    const gait = value.gait?.[name]
    if (!gait || !Number.isFinite(gait.duration) || gait.duration <= 0) throw new Error(`Invalid dog ${name} timing`)
    if (name !== 'idle' && (!Number.isFinite(gait.speed) || gait.speed! <= 0 || !Number.isFinite(gait.duty) || gait.duty! < .3 || gait.duty! > .8)) throw new Error(`Invalid dog ${name} stride`)
  }
  return value
}

/** Analytic two-link IK in world space, independent of Blender's bone roll axes. */
export function solveDogLeg(upper: T.Bone, lower: T.Bone, paw: T.Bone, target: T.Vector3, pawOrientation: T.Quaternion) {
  const a = upper.getWorldPosition(new T.Vector3()), b = lower.getWorldPosition(new T.Vector3()), c = paw.getWorldPosition(new T.Vector3())
  const length1 = a.distanceTo(b), length2 = b.distanceTo(c)
  if (length1 < 1e-5 || length2 < 1e-5) throw new Error('Dog IK requires nonzero limb lengths')
  const direction = target.clone().sub(a), requested = direction.length()
  if (requested < 1e-8) return c.distanceTo(target)
  direction.divideScalar(requested)
  const reach = clamp(requested, Math.abs(length1 - length2) + .00001, length1 + length2 - .00001)
  const pole = b.clone().sub(a).addScaledVector(direction, -b.clone().sub(a).dot(direction))
  if (pole.lengthSq() < 1e-10) {
    pole.set(0, 0, 1).applyQuaternion(upper.getWorldQuaternion(new T.Quaternion()))
    pole.addScaledVector(direction, -pole.dot(direction))
    if (pole.lengthSq() < 1e-10) pole.copy(UP).addScaledVector(direction, -direction.y)
  }
  pole.normalize()
  const along = (length1 * length1 - length2 * length2 + reach * reach) / (2 * reach)
  const bend = Math.sqrt(Math.max(0, length1 * length1 - along * along))
  const knee = a.clone().addScaledVector(direction, along).addScaledVector(pole, bend)
  const ankle = a.clone().addScaledVector(direction, reach)
  const orient = (bone: T.Bone, from: T.Vector3, to: T.Vector3) => {
    const world = bone.getWorldQuaternion(new T.Quaternion())
    world.premultiply(new T.Quaternion().setFromUnitVectors(from.normalize(), to.normalize()))
    const parent = bone.parent?.getWorldQuaternion(new T.Quaternion()) ?? new T.Quaternion()
    bone.quaternion.copy(parent.invert().multiply(world)); bone.updateWorldMatrix(false, true)
  }
  orient(upper, b.clone().sub(a), knee.clone().sub(a))
  const actualB = lower.getWorldPosition(new T.Vector3()), actualC = paw.getWorldPosition(new T.Vector3())
  orient(lower, actualC.sub(actualB), ankle.sub(actualB))
  paw.quaternion.copy((paw.parent?.getWorldQuaternion(new T.Quaternion()) ?? new T.Quaternion()).invert().multiply(pawOrientation))
  paw.updateWorldMatrix(false, true)
  return paw.getWorldPosition(new T.Vector3()).distanceTo(target)
}

/** Same runtime factory used by the loader and real-Three, headless rig tests. */
export function createCloudDogRig(asset: GLTF, resources = resourceOwner()) {
  try {return assembleCloudDogRig(asset, resources)} catch (error) {resources.dispose(); throw error}
}

function assembleCloudDogRig(asset: GLTF, resources: ReturnType<typeof resourceOwner>) {
  validateAuthoredScene(asset, 'Cloud dog')
  const description = readDescription(asset.scene)
  const root = new T.Group(), tilt = new T.Group(), pivot = new T.Group()
  root.name = 'Cloud island explorer dog'; tilt.name = 'Dog terrain posture'
  tilt.position.y = .4; pivot.position.y = -.4
  root.add(tilt); tilt.add(pivot); pivot.add(asset.scene)
  resources.object(root)
  let skins = 0
  asset.scene.traverse(node => {
    if (node instanceof T.SkinnedMesh) skins++
    if (node instanceof T.Mesh) {node.castShadow = true; node.receiveShadow = true; node.frustumCulled = false}
  })
  if (!skins) throw new Error('Cloud dog must be a real skinned quadruped')
  root.updateMatrixWorld(true)
  const bone = (name: string) => {
    const node = asset.scene.getObjectByName(name)
    if (!(node instanceof T.Bone)) throw new Error(`Dog bone ${name} is missing`)
    return node
  }
  const legs: Leg[] = LEG_NAMES.map(id => {
    const info = description.legs[id], upperBone = bone(info.upper), lowerBone = bone(info.lower), pawBone = bone(info.paw)
    if (lowerBone.parent !== upperBone || pawBone.parent !== lowerBone) throw new Error(`Dog ${id} is not a direct two-link chain`)
    const localUp = UP.clone().applyQuaternion(pawBone.getWorldQuaternion(new T.Quaternion()).invert())
    const offset = new T.Vector3(...info.soleOffset as [number, number, number])
    const neutral = root.worldToLocal(offset.clone().applyMatrix4(pawBone.matrixWorld))
    return {...info, id, upperBone, lowerBone, pawBone, localUp, offset, neutral, support:[], planted: false, lock: new T.Vector3(), sole: new T.Vector3(), target: new T.Vector3(), hit: null, phase: 0, error: 0, recoveryTime:0,recoveryStart:new T.Vector3(),lastSole:new T.Vector3(),hasLast:false}
  })
  // Derive the contact patch from real weighted sole geometry, not a rectangle
  // whose empty corners could falsely rest on an adjacent raised paving stone.
  asset.scene.traverse(mesh=>{
    if(!(mesh instanceof T.SkinnedMesh))return
    const positions=mesh.geometry.getAttribute('position'),joints=mesh.geometry.getAttribute('skinIndex'),weights=mesh.geometry.getAttribute('skinWeight')
    for(let index=0;index<positions.count;index++){
      const point=mesh.applyBoneTransform(index,new T.Vector3().fromBufferAttribute(positions,index)).applyMatrix4(mesh.matrixWorld)
      root.worldToLocal(point)
      for(const leg of legs){
        if(point.y-leg.neutral.y>.012||point.y-leg.neutral.y<-.006)continue
        let weight=0
        for(let channel=0;channel<4;channel++){
          const name=mesh.skeleton.bones[joints.getComponent(index,channel)]?.name
          if(name===leg.paw||name===`${leg.id}_toe`)weight+=weights.getComponent(index,channel)
        }
        if(weight>.7)leg.support.push(point.clone().sub(leg.neutral))
      }
    }
  })
  for(const leg of legs){
    if(!leg.support.length)throw new Error(`Dog ${leg.id} has no weighted sole geometry`)
    const points=leg.support
    leg.support=Array.from({length:8},(_,index)=>{
      const angle=index*Math.PI/4,x=Math.cos(angle),z=Math.sin(angle)
      return points.reduce((best,point)=>point.x*x+point.z*z>best.x*x+best.z*z?point:best).clone()
    })
  }
  const clips = new Map(asset.animations.map(clip => [clip.name.toLowerCase().split(/[|:]/).pop()!.trim(), clip]))
  if(new Set(legs.flatMap(leg=>[leg.upper,leg.lower,leg.paw])).size!==12)throw new Error('Dog legs must have independent bones')
  for (const name of GAIT_NAMES) {
    const clip = clips.get(name)
    if (!clip || clip.duration <= 0 || !clip.tracks.length || Math.abs(clip.duration - description.gait[name].duration) > .001) throw new Error(`Dog ${name} clip does not match its rig timing`)
  }
  const mixer = new T.AnimationMixer(asset.scene)
  const attention=createCloudAttention(asset.scene,.6)
  const initialPose: {node:T.Object3D;position:T.Vector3;quaternion:T.Quaternion;scale:T.Vector3}[]=[]
  asset.scene.traverse(node=>initialPose.push({node,position:node.position.clone(),quaternion:node.quaternion.clone(),scale:node.scale.clone()}))
  const actions = Object.fromEntries(GAIT_NAMES.map(name => [name, mixer.clipAction(clips.get(name)!).setLoop(T.LoopRepeat, Infinity)])) as Record<GaitName, T.AnimationAction>
  // Resting is distinct from locomotion idle: brief waypoint pauses must not
  // sit down. The guide explicitly requests rest only at a true destination.
  const sitClip = clips.get('sit')
  if(sitClip&&(!sitClip.tracks.length||!Number.isFinite(description.gait.sit?.duration)||Math.abs(sitClip.duration-description.gait.sit!.duration)>.001))throw new Error('Dog sit clip does not match its rig timing')
  const sitAction = sitClip ? mixer.clipAction(sitClip).setLoop(T.LoopRepeat, Infinity) : undefined
  if (sitAction) sitAction.setEffectiveWeight(0).play()
  let restRequested=false, restAmount=0, restFrom=0, restElapsed=.75
  // Restore only bones modified by IK before evaluating the next authored pose.
  // Animation clips need not key every component on every frame for this to work.
  const restored = legs.flatMap(leg => [leg.upperBone, leg.lowerBone, leg.pawBone]).map(node => ({node, position: node.position.clone(), quaternion: node.quaternion.clone(), scale: node.scale.clone()}))
  let current: GaitName = 'idle', sampler: DogGroundSampler | undefined, disposed = false
  let bodyOffset = 0, bodyPitch = 0, bodyRoll = 0, sinceTransition = 1
  const previousRoot = new T.Vector3(), rootWorld = new T.Vector3()
  let hasPrevious = false
  actions.idle.play(); mixer.update(0)

  function probe(point: T.Vector3, motion: DogMotion) {
    const hit = sampler ? sampler(point.x, point.z, rootWorld.y + .5, 1.05)
      : Number.isFinite(motion.groundHeight) ? {height: motion.groundHeight!, normal: {x: 0, y: 1, z: 0}} : null
    if (!hit || ![hit.height, hit.normal?.x, hit.normal?.y, hit.normal?.z].every(Number.isFinite) || hit.normal.y < .65) return null
    return hit
  }

  function probeSupport(point:T.Vector3,motion:DogMotion,leg:Leg) {
    const center=probe(point,motion)
    if(!center||!sampler)return center
    // A ray at the ankle alone misses a raised stone under the toe. Use the
    // authored paw's ~7 x 11 cm support patch, fit its slope and lift that plane
    // only enough to clear the samples; this is not a full-body height offset.
    const orientation=root.getWorldQuaternion(new T.Quaternion())
    const at=(x:number,z:number)=>{
      const position=new T.Vector3(x,0,z).applyQuaternion(orientation).add(point),hit=probe(position,motion)
      return hit?{position,hit}:null
    }
    const left=at(-.036,0),right=at(.036,0),front=at(0,-.06),back=at(0,.05)
    let normal=new T.Vector3(center.normal.x,center.normal.y,center.normal.z).normalize()
    if(left&&right&&front&&back){
      const xAxis=right.position.clone().sub(left.position);xAxis.y=right.hit.height-left.hit.height
      const zAxis=back.position.clone().sub(front.position);zAxis.y=back.hit.height-front.hit.height
      const fitted=zAxis.cross(xAxis).normalize()
      if(fitted.y>.75)normal=fitted
    }
    const slope=new T.Quaternion().setFromUnitVectors(UP,normal)
    let height=center.height
    for(const support of leg.support){
      const offset=support.clone().applyQuaternion(orientation).applyQuaternion(slope)
      const hit=probe(point.clone().add(offset),motion)
      if(hit)height=Math.max(height,hit.height-offset.y)
    }
    return {height,normal:{x:normal.x,y:normal.y,z:normal.z}}
  }

  const resetPlants = () => {for (const leg of legs) {leg.planted = false;leg.recoveryTime=0;leg.hasLast=false}}
  function resetPose() {
    if(disposed)return
    attention.reset()
    resetPlants();hasPrevious=false;bodyOffset=bodyPitch=bodyRoll=0;sinceTransition=1;current='idle'
    mixer.stopAllAction()
    for(const pose of initialPose){pose.node.position.copy(pose.position);pose.node.quaternion.copy(pose.quaternion);pose.node.scale.copy(pose.scale)}
    actions.idle.reset().setEffectiveWeight(1).setEffectiveTimeScale(1).play();mixer.setTime(0)
    restRequested=false;restAmount=restFrom=0;restElapsed=.75
    sitAction?.reset().setEffectiveWeight(0).play()
    for(const pose of restored){pose.position.copy(pose.node.position);pose.quaternion.copy(pose.node.quaternion);pose.scale.copy(pose.node.scale)}
    tilt.position.set(0,.4,0);tilt.rotation.set(0,0,0);root.updateWorldMatrix(true,true)
    for(const leg of legs){leg.error=0;leg.phase=0;leg.sole.copy(leg.offset).applyMatrix4(leg.pawBone.matrixWorld);leg.target.copy(leg.sole)}
  }
  return {
    root,
    resetPose,
    setAttention:attention.set,
    setResting(value: boolean, immediate=false) {
      if(disposed||!sitAction)return
      if(value!==restRequested||immediate){
        restRequested=value;restFrom=restAmount;restElapsed=0;resetPlants()
        if(immediate){
          restAmount=value?1:0;restFrom=restAmount;restElapsed=.75
          actions.idle.setEffectiveWeight(1-restAmount);sitAction.setEffectiveWeight(restAmount)
          mixer.update(0);root.updateMatrixWorld(true)
          for(const pose of restored){pose.position.copy(pose.node.position);pose.quaternion.copy(pose.node.quaternion);pose.scale.copy(pose.node.scale)}
        }
      }
    },
    isReadyToWalk() {return !sitAction||(!restRequested&&restAmount<.00001)},
    setGroundSampler(value?: DogGroundSampler) {
      if (disposed) return
      if (value !== undefined && typeof value !== 'function') throw new TypeError('Dog ground sampler must be a function')
      sampler = value; resetPlants()
    },
    update(dt: number, motion: DogMotion) {
      if (disposed || !Number.isFinite(dt) || dt <= 0) return
      if (![motion.speed, motion.turn].every(Number.isFinite) || (motion.groundHeight !== undefined && !Number.isFinite(motion.groundHeight))) throw new TypeError('Dog motion must be finite')
      const step = Math.min(dt, .1), speed = clamp(motion.speed, 0, 6)
      root.updateWorldMatrix(true, false); root.getWorldPosition(rootWorld)
      const travelled = hasPrevious ? Math.hypot(rootWorld.x - previousRoot.x, rootWorld.z - previousRoot.z) : 0
      const measuredSpeed = hasPrevious && travelled < .65 ? clamp(travelled / step, 0, 6) : speed
      // Turning in place needs stepping paws, not a stationary four-foot swivel.
      // A short-step turning gait limits a planted foot to about .64 rad of
      // body rotation. Long forward strides are compressed around its neutral
      // footprint; this is a stepping pivot, not unlocked feet sliding around.
      const turningSpeed = Math.min(2.4, Math.abs(motion.turn) * .6)
      const turnBlend = clamp((turningSpeed - measuredSpeed) / Math.max(turningSpeed, .001), 0, 1)
      const gaitSpeed = Math.max(speed, Math.min(.75, turningSpeed))
      // The UI's speed is smoothed for gait choice. Cadence instead integrates
      // actual root travel, including 120 Hz frames between 60 Hz physics steps.
      const cadenceSpeed = Math.max(measuredSpeed, turningSpeed)
      const next: GaitName = !motion.grounded || gaitSpeed < (current === 'idle' ? .08 : .035) ? 'idle'
        : gaitSpeed > (current === 'run' ? 1.45 : 1.7) ? 'run' : 'walk'
      if (!motion.grounded) resetPlants()
      if (next !== current) {
        const old = actions[current], target = actions[next]
        target.reset().setEffectiveWeight(1).play()
        if (current !== 'idle' && next !== 'idle') target.time = old.time / old.getClip().duration * target.getClip().duration
        old.crossFadeTo(target, .18, false); current = next; sinceTransition = 0; resetPlants()
      }
      sinceTransition += step
      actions.idle.setEffectiveTimeScale(1)
      actions.walk.setEffectiveTimeScale(cadenceSpeed / description.gait.walk.speed!)
      actions.run.setEffectiveTimeScale(cadenceSpeed / description.gait.run.speed!)
      if(sitAction){
        restElapsed=Math.min(.75,restElapsed+step)
        restAmount=T.MathUtils.lerp(restFrom,restRequested?1:0,smooth(restElapsed/.75))
        // Walking retains its existing blend. Rest is allowed only from idle,
        // after the controller has stopped travel, and rises before travel.
        sitAction.setEffectiveWeight(restAmount)
        if(current==='idle')actions.idle.setEffectiveWeight(1-restAmount)
      }
      for (const pose of restored) {pose.node.position.copy(pose.position); pose.node.quaternion.copy(pose.quaternion); pose.node.scale.copy(pose.scale)}
      attention.restore();mixer.update(step);attention.update(step)
      for (const pose of restored) {pose.position.copy(pose.node.position); pose.quaternion.copy(pose.node.quaternion); pose.scale.copy(pose.node.scale)}
      root.updateWorldMatrix(true, true); root.getWorldPosition(rootWorld)
      if (hasPrevious && previousRoot.distanceTo(rootWorld) > .65) {resetPlants(); bodyOffset = bodyPitch = bodyRoll = 0}
      else if (hasPrevious && motion.grounded) {
        // The physical step controller may climb a full 18 cm in one fixed
        // step. Keep the visual torso continuous while the four feet take over
        // the rise; otherwise the rear legs momentarily overextend in midair.
        const rise = rootWorld.y - previousRoot.y
        if (Math.abs(rise) <= .22) bodyOffset = clamp(bodyOffset - rise, -.22, .22)
      }
      previousRoot.copy(rootWorld); hasPrevious = true
      for (const leg of legs) {
        leg.sole.copy(leg.offset).applyMatrix4(leg.pawBone.matrixWorld)
        const neutral = leg.neutral.clone().applyMatrix4(root.matrixWorld)
        leg.sole.x = T.MathUtils.lerp(leg.sole.x, neutral.x, turnBlend * .85)
        leg.sole.z = T.MathUtils.lerp(leg.sole.z, neutral.z, turnBlend * .85)
        leg.hit = motion.grounded ? probe(leg.planted ? leg.lock : leg.sole, motion) : null
      }
      const ground = legs.map(leg => leg.hit?.height)
      const contacts = ground.filter((h): h is number => h !== undefined)
      let wantedPitch = 0, wantedRoll = 0, wantedOffset = 0
      if (contacts.length) {
        const average = contacts.reduce((a,b) => a+b, 0) / contacts.length
        const mean = (a: number | undefined, b: number | undefined) => a !== undefined && b !== undefined ? (a+b)/2 : a ?? b ?? average
        const front = mean(ground[0],ground[1]), back = mean(ground[2],ground[3])
        const left = mean(ground[0],ground[2]), right = mean(ground[1],ground[3])
        wantedPitch = clamp(Math.atan2(front - back, .5), -.30, .30)
        wantedRoll = clamp(Math.atan2(left - right, .17), -.22, .22)
        const lowest = Math.min(...contacts)
        // Keep reach reserve above the lower support on a stair. Equal-average
        // height would overextend a still-planted low front paw while its mate
        // is already on the next tread.
        wantedOffset = clamp(lowest + (average - lowest) * .25 - rootWorld.y, -.22, .18)
      }
      if (motion.grounded) wantedOffset -= turnBlend * .035
      const follow = 1 - Math.exp(-step * 10)
      bodyPitch += (wantedPitch - bodyPitch) * follow
      bodyRoll += (wantedRoll - bodyRoll) * follow
      bodyOffset += (wantedOffset - bodyOffset) * follow
      tilt.position.y = .4 + bodyOffset; tilt.rotation.set(bodyPitch, 0, bodyRoll)
      root.updateWorldMatrix(true, true)
      const cycle = actions[current].time / actions[current].getClip().duration
      const goals: {leg: Leg;target: T.Vector3;orientation: T.Quaternion;landing: T.Vector3}[] = []
      for (const leg of legs) {
        const gait = description.gait[current]
        leg.phase = current === 'idle' ? 0 : (cycle + (current === 'walk' ? leg.phaseWalk : leg.phaseRun)) % 1
        const inStance = current === 'idle' || leg.phase < gait.duty!
        leg.sole.copy(leg.offset).applyMatrix4(leg.pawBone.matrixWorld)
        const neutral = leg.neutral.clone().applyMatrix4(root.matrixWorld)
        leg.sole.x = T.MathUtils.lerp(leg.sole.x, neutral.x, turnBlend * .85)
        leg.sole.z = T.MathUtils.lerp(leg.sole.z, neutral.z, turnBlend * .85)
        const hit = motion.grounded ? probe(leg.sole, motion) : null
        if (!hit) {leg.planted = false; leg.error = 0; continue}
        if (!inStance) leg.planted = false
        // A crossfaded idle paw is not yet at the new gait's authored contact
        // position. Locking that intermediate point would overextend its first
        // stance; establish the anchor after the short blend has completed.
        if(restElapsed<.75)leg.planted=false
        if (inStance && !leg.planted && leg.recoveryTime <= 0 && sinceTransition >= .18 && restElapsed>=.75) {leg.lock.copy(leg.sole); leg.lock.y = hit.height; leg.planted = true}
        const lockHit = leg.planted ? probeSupport(leg.lock, motion,leg) : null
        if (leg.planted && !lockHit) leg.planted = false
        leg.target.copy(leg.sole)
        if (leg.planted && lockHit) {
          // Retain the world-space plant through the stance. Do not re-sample
          // a different X/Z every frame or the paw will skate with the root.
          leg.target.copy(leg.lock); leg.target.y = lockHit.height
        } else {
          // Keep baked swing lift while adapting it to the actual stair height.
          const clearance = Math.max(0, leg.sole.y - rootWorld.y - bodyOffset)
          leg.target.y = hit.height + clearance
        }
        const groundNormal = (lockHit ?? hit).normal
        const normal = new T.Vector3(groundNormal.x, groundNormal.y, groundNormal.z).normalize()
        const pawWorld = leg.pawBone.getWorldQuaternion(new T.Quaternion())
        const alignment = new T.Quaternion().setFromUnitVectors(leg.localUp.clone().applyQuaternion(pawWorld).normalize(), normal)
        const authoredOrientation = pawWorld.clone()
        // A restrained normal adjustment retains the authored paw's toe-off.
        pawWorld.premultiply(new T.Quaternion().slerp(alignment, leg.planted ? 1 : .3))
        const targetAnkle = leg.target.clone().sub(leg.offset.clone().applyQuaternion(pawWorld))
        const blend = smooth(sinceTransition / .18)
        targetAnkle.lerp(leg.pawBone.getWorldPosition(new T.Vector3()), 1 - blend)
        pawWorld.slerp(authoredOrientation, 1 - blend)
        const landing=leg.sole.clone()
        landing.y=hit.height+(inStance ? 0 : Math.max(0,leg.sole.y-rootWorld.y-bodyOffset))
        goals.push({leg,target:targetAnkle,orientation:pawWorld,landing})
      }
      // Solve the shared torso height before any leg. Near a bridge edge one
      // planted paw may still be below the others: lowering the shoulder a few
      // centimetres is physically possible, stretching that leg is not. This
      // analytic reach limit is a contact constraint, not an arbitrary Y clamp.
      let lowerBy = 0
      for (const {leg,target} of goals) if (leg.planted) {
        const a=leg.upperBone.getWorldPosition(new T.Vector3()),b=leg.lowerBone.getWorldPosition(new T.Vector3()),c=leg.pawBone.getWorldPosition(new T.Vector3())
        const reach=(a.distanceTo(b)+b.distanceTo(c))*.995
        const horizontal=(target.x-a.x)**2+(target.z-a.z)**2
        if (horizontal < reach*reach) lowerBy=Math.min(lowerBy,target.y+Math.sqrt(reach*reach-horizontal)-a.y)
      }
      if (lowerBy < 0) {
        const corrected=Math.max(-.26,bodyOffset+Math.max(-.12,lowerBy))
        tilt.position.y += corrected-bodyOffset; bodyOffset=corrected; root.updateWorldMatrix(true,true)
      }
      for (const {leg,target,orientation,landing} of goals) {
        const a=leg.upperBone.getWorldPosition(new T.Vector3()),b=leg.lowerBone.getWorldPosition(new T.Vector3()),c=leg.pawBone.getWorldPosition(new T.Vector3())
        const reach=a.distanceTo(b)+b.distanceTo(c)
        if (leg.planted && a.distanceTo(target)>reach+.002 && leg.hasLast) {
          // A stair edge or a changing turn radius can shorten a stance. This
          // paw takes a real 140 ms lifted recovery step from its last solved
          // contact to the authored landing; other feet keep their anchors.
          leg.planted=false;leg.recoveryTime=.14;leg.recoveryStart.copy(leg.lastSole)
        }
        if (leg.recoveryTime>0) {
          leg.planted=false;leg.recoveryTime=Math.max(0,leg.recoveryTime-step)
          const progress=1-leg.recoveryTime/.14
          leg.target.copy(leg.recoveryStart).lerp(landing,smooth(progress))
          leg.target.y+=Math.sin(progress*Math.PI)*.045
          target.copy(leg.target).sub(leg.offset.clone().applyQuaternion(orientation))
        }
        leg.error=solveDogLeg(leg.upperBone,leg.lowerBone,leg.pawBone,target,orientation)
        leg.lastSole.copy(leg.offset).applyMatrix4(leg.pawBone.matrixWorld);leg.hasLast=true
      }
      // Match the renderer's update path: SkinnedMesh.updateMatrixWorld also
      // refreshes its attached bindMatrixInverse after the posture group moves.
      root.updateMatrixWorld(true)
    },
    /** Copies only: useful for checking actual planted feet, never scene control. */
    inspectGrounding() {
      root.updateWorldMatrix(true, false);root.updateMatrixWorld(true)
      return {gait: current, resting:restRequested, restAmount, readyToWalk:!restRequested&&restAmount<.00001, cycle: actions[current].time / actions[current].getClip().duration, bodyOffset, bodyPitch, bodyRoll,
        feet: legs.map(leg => ({id: leg.id, planted: leg.planted, recovering:leg.recoveryTime>0, phase: leg.phase, sole: leg.offset.clone().applyMatrix4(leg.pawBone.matrixWorld).toArray(), target: leg.target.toArray(), error: leg.error}))}
    },
    dispose() {
      if (disposed) return
      disposed = true; sampler = undefined; resetPlants()
      mixer.stopAllAction(); mixer.uncacheRoot(asset.scene); resources.dispose()
    },
  }
}

/** Own manifest and hash-checked bytes; human loader/assets stay untouched. */
export async function createCloudDog(mobile: boolean, assetSha?: string) {
  const response = await fetch(CLOUD_DOG_PROFILE.manifestUrl, {cache: 'no-store'})
  if (!response.ok) throw new Error(`Dog manifest failed: ${response.status}`)
  const data = await response.json()
  if (data.schemaVersion !== 1 || typeof data.sha256 !== 'string' || !/^[a-f0-9]{64}$/.test(data.sha256)
    || !Number.isSafeInteger(data.bytes) || data.bytes <= 0) throw new Error('Invalid dog asset manifest')
  if (assetSha !== undefined && assetSha !== data.sha256) throw new Error('Requested dog revision does not match manifest')
  const resources = resourceOwner()
  try {
    const asset = await loadOwnedGLB(`${CLOUD_DOG_PROFILE.glbUrl}?v=${data.sha256}`, resources, mobile, data.sha256)
    resources.configureTextures(mobile)
    return {...createCloudDogRig(asset, resources), assetSha256: data.sha256 as string}
  } catch (error) {resources.dispose(); throw error}
}
