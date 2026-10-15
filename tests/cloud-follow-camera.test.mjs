import test from 'node:test'
import assert from 'node:assert/strict'
import {Vector3} from 'three'
import {readFile} from 'node:fs/promises'
import {createCloudFollowCamera} from '../src/components/editorial-home/world/settlement/cloudFollowCamera.mjs'
import {createCloudCameraCollision} from '../src/components/editorial-home/world/settlement/cloudCameraCollision.mjs'
import {createTraversal} from '../src/components/editorial-home/world/settlement/physics.mjs'
import {CLOUD_ROBOT_PROFILE} from '../src/components/editorial-home/world/settlement/cloudCharacterProfile.mjs'
import {cloudGuideRoute} from '../src/components/editorial-home/world/settlement/cloudLayout.mjs'
import {cloudBridgeCameraLift} from '../src/components/editorial-home/world/settlement/cloudGuideFraming.mjs'

test('continuous guided translation never triggers a distance-threshold camera snap',()=>{
  const rig=createCloudFollowCamera((_target,desired)=>desired.clone())
  const position=new Vector3(0,2,4),focus=new Vector3(0,1,0),target=focus.clone(),desired=position.clone()
  let previous=position.clone(),previousDelta=0,maxDelta=0,maxAcceleration=0
  for(let frame=0;frame<900;frame++){
    const z=-frame*.024
    target.set(0,1,z);desired.set(0,2,z+4)
    rig.update(position,focus,target,desired,1/60)
    const delta=position.distanceTo(previous)
    maxDelta=Math.max(maxDelta,delta);maxAcceleration=Math.max(maxAcceleration,Math.abs(delta-previousDelta))
    previous.copy(position);previousDelta=delta
  }
  assert.ok(maxDelta<.025,`frame movement ${maxDelta} must follow travel, not jump .2m`)
  assert.ok(maxAcceleration<.002,`frame acceleration spike ${maxAcceleration}`)
})

test('a real wall still clamps the final eased camera position and release is gradual',()=>{
  let limit=2
  const rig=createCloudFollowCamera((target,desired)=>target.clone().add(desired.clone().sub(target).clampLength(0,limit)))
  const target=new Vector3(),focus=target.clone(),position=new Vector3(0,0,4),desired=position.clone()
  rig.update(position,focus,target,desired,1/60)
  assert.ok(position.length()<=2+1e-9)
  limit=10
  rig.update(position,focus,target,desired,1/60)
  assert.ok(position.length()>2&&position.length()<2.2)
})

test('zero and invalid frame durations do not introduce a tracking jump in clear space',()=>{
  const rig=createCloudFollowCamera((_target,desired)=>desired.clone())
  const position=new Vector3(0,2,4),focus=new Vector3(0,1,0)
  for(const dt of [0,-1,NaN])rig.update(position,focus,new Vector3(5,1,0),new Vector3(5,2,4),dt)
  assert.deepEqual(position.toArray(),[0,2,4]);assert.deepEqual(focus.toArray(),[0,1,0])
})

test('actual bridge return framing clears a low rail without collapsing into the robot',async()=>{
  const layout=JSON.parse(await readFile(new URL('../public/world/blender/cloud-courtyard-v2-layout.json',import.meta.url),'utf8'))
  const resolve=createCloudCameraCollision(layout.colliders)
  // Position observed in the desktop return route; both headings cross the rail.
  for(const yaw of [2.9,3.1]){
    const target=new Vector3(-2.34,.7,6.58),focus=target.clone()
    const desired=target.clone().add(new Vector3(Math.sin(yaw)*3.8,1.165,Math.cos(yaw)*3.8))
    const position=resolve(target,desired),rig=createCloudFollowCamera(resolve)
    // Historical full-panel collision reduced these shots below 1.7m. The
    // optical resolver now represents the actual tubes, not the empty panel.
    for(let i=0;i<300;i++){
      rig.update(position,focus,target,desired,1/60)
      assert.ok(position.distanceTo(resolve(focus,position))<1e-8,'camera must remain on the unoccluded side')
    }
    assert.ok(position.distanceTo(target)>3.8,'restore the whole-character shoulder framing')
    assert.ok(position.y-desired.y<.26,'a 25cm lift suffices; do not jump to a top-down view')
    rig.reset()
    const clear=createCloudFollowCamera((_t,d)=>d.clone()),control=position.clone(),clearFocus=focus.clone()
    const clearTarget=new Vector3(-3,.7,8),clearDesired=clearTarget.clone().add(new Vector3(0,1.165,3.8))
    rig.update(position,focus,clearTarget,clearDesired,1/60)
    clear.update(control,clearFocus,clearTarget,clearDesired,1/60)
    // A reset cannot carry the elevated boom into the next entrance shot.
    assert.ok(position.y<=control.y+1e-8)
  }
})

test('a tall wall is not mistaken for a rail and is never crossed to preserve distance',()=>{
  const resolve=createCloudCameraCollision([{position:[0,4,2],halfExtents:[6,4,.1]}])
  const target=new Vector3(0,.7,0),focus=target.clone(),desired=new Vector3(0,1.865,3.8)
  const position=resolve(target,desired),rig=createCloudFollowCamera(resolve)
  for(let i=0;i<300;i++)rig.update(position,focus,target,desired,1/60)
  assert.ok(position.z<1.74)
  assert.ok(Math.abs(position.distanceTo(resolve(target,desired)))<1e-8,'no needless lift against a solid facade')
})

test('the courtyard-facing shot keeps a readable robot throughout the actual physical round trip',async t=>{
  const layout=JSON.parse(await readFile(new URL('../public/world/blender/cloud-courtyard-v2-layout.json',import.meta.url),'utf8'))
  const body=await createTraversal({...layout,character:CLOUD_ROBOT_PROFILE});t.after(()=>body.dispose())
  for(let i=0;i<60;i++)body.step(1/60)
  const profile=CLOUD_ROBOT_PROFILE.camera,resolve=createCloudCameraCollision(layout.colliders),rig=createCloudFollowCamera(resolve)
  const target=new Vector3(),focus=new Vector3(body.position.x,body.position.y+profile.targetHeight,body.position.z)
  const offset=new Vector3(Math.sin(profile.yaw)*profile.distanceDesktop,profile.baseHeight-profile.targetHeight+Math.sin(profile.pitch)*profile.distanceDesktop,Math.cos(profile.yaw)*profile.distanceDesktop)
  const position=focus.clone().add(offset),desired=new Vector3(),previous=position.clone()
  let heading=0,height=body.position.y,ahead=0,minDistance=Infinity,maxFrameTravel=0,worst
  const damp=(a,b,lambda)=>a+(b-a)*(1-Math.exp(-lambda/60))
  for(const returning of [false,true]){
    const route=cloudGuideRoute(layout,body.position,returning,'agentic');let index=0
    for(let i=0;i<20000&&index<route.length;i++){
      const [x,z]=route[index],p=body.position,dx=x-p.x,dz=z-p.z,d=Math.hypot(dx,dz)
      if(d<.17){index++;continue}
      const next=Math.atan2(-dx,-dz);heading+=Math.atan2(Math.sin(next-heading),Math.cos(next-heading))/6
      heading=body.step(1/60,{x:dx/d*.64,z:dz/d*.64,heading}).heading
      height=damp(height,body.position.y,5);ahead=damp(ahead,.64*CLOUD_ROBOT_PROFILE.walkSpeed*.23,3)
      target.set(body.position.x-Math.sin(heading)*ahead,height+profile.targetHeight,body.position.z-Math.cos(heading)*ahead)
      desired.set(body.position.x,height+profile.targetHeight,body.position.z).add(offset)
      desired.y+=cloudBridgeCameraLift(body.position,layout.locations.find(p=>p.id==='bridge'))
      rig.update(position,focus,target,desired,1/60)
      if(position.distanceTo(focus)<minDistance){minDistance=position.distanceTo(focus);worst={returning,actor:{...body.position},camera:position.toArray(),focus:focus.toArray(),desired:desired.toArray()}}
      maxFrameTravel=Math.max(maxFrameTravel,position.distanceTo(previous));previous.copy(position)
      assert.ok(position.distanceTo(resolve(focus,position))<1e-8,'no collision bypass')
    }
    assert.equal(index,route.length,'the whole route must be covered')
  }
  t.diagnostic(JSON.stringify({minDistance,maxFrameTravel,worst}))
  assert.ok(minDistance>2.8,'the full-width robot must not become a face-filling close-up')
  assert.ok(maxFrameTravel<.12,'the route must not introduce a camera position jump')
})

test('optical rail collision preserves real timber while leaving the authored gap transparent',()=>{
  const colliders=[
    {id:'bridge-post-1-0',position:[0,.44,0],halfExtents:[.07,.45,.07]},
    {id:'bridge-post-1-4',position:[2,.44,0],halfExtents:[.07,.45,.07]},
    {id:'bridge-rail-1-0',position:[1,.46,0],halfExtents:[1,.43,.0475]},
  ]
  const before=JSON.stringify(colliders),resolve=createCloudCameraCollision(colliders)
  for(const [x,y,clear] of [[1,.55,true],[1,.74,false],[1,.36,false],[0,.55,false]]){
    const target=new Vector3(x,y,-2),desired=new Vector3(x,y,2),position=resolve(target,desired)
    assert.equal(position.distanceTo(desired)<1e-8,clear,`timber/gap at ${x},${y}`)
  }
  assert.equal(JSON.stringify(colliders),before,'character barriers are never changed')
})

test('bridge crane starts and ends at zero without a discontinuity at the region edge',()=>{
  const bridge={center:[-2,.35,4],halfExtents:[1.8,1,1.9]}
  assert.equal(cloudBridgeCameraLift({x:-3,z:8},bridge),0)
  assert.equal(cloudBridgeCameraLift({x:-5.7,z:-.49},bridge),0)
  assert.equal(cloudBridgeCameraLift({x:-2,z:4},bridge),2.2)
  let previous=0
  for(let z=10;z>-2;z-=.015){
    const height=cloudBridgeCameraLift({x:-2,z},bridge)
    assert.ok(height>=0&&height<=2.2)
    assert.ok(Math.abs(height-previous)<.02)
    previous=height
  }
})
