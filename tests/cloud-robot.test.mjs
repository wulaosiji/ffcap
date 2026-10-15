import test from 'node:test'
import assert from 'node:assert/strict'
import {readFile} from 'node:fs/promises'
import {sampleRobotTrack,robotTrackTravel} from '../src/components/editorial-home/world/settlement/cloudRobotMotion.mjs'
import {sampleCloudPresence} from '../src/components/editorial-home/world/settlement/cloudPresence.mjs'
import {createEntranceSelection} from '../src/components/editorial-home/world/settlement/cloudEntranceSelection.mjs'
import {CLOUD_ROBOT_PROFILE} from '../src/components/editorial-home/world/settlement/cloudCharacterProfile.mjs'
import {createTraversal} from '../src/components/editorial-home/world/settlement/physics.mjs'
import {cloudGuideRoute,cloudLocationAt} from '../src/components/editorial-home/world/settlement/cloudLayout.mjs'

test('track loop is continuous, metric, cyclic and stationary at rest',()=>{
  const length=sampleRobotTrack(0).length
  for(let d=-length;d<length*2;d+=.001){
    const a=sampleRobotTrack(d),b=sampleRobotTrack(d+.001)
    assert.ok(Math.hypot(a.forward-b.forward,a.height-b.height)<.00101)
    assert.ok(a.height>=.015-1e-9&&a.height<=.225+1e-9)
  }
  assert.deepEqual(robotTrackTravel(0,0),{left:0,right:0})
  assert.deepEqual(robotTrackTravel(1,0),{left:1,right:1})
  const turn=robotTrackTravel(0,1)
  assert.equal(turn.left,-turn.right)
  assert.throws(()=>sampleRobotTrack(NaN))
})

test('presence holds long compositions, remains bounded, and yields camera to manual control',()=>{
  for(let time=0;time<75;time+=.1){
    const state=sampleCloudPresence(time,{x:-3,z:8})
    assert.ok(Math.abs(state.yaw)<=.42&&Math.abs(state.cameraYaw)<=.17)
    const next=sampleCloudPresence(time+.01,{x:-3,z:8})
    assert.ok(Math.abs(next.cameraYaw-state.cameraYaw)<.001,'camera must not flip sides when the head returns to rest')
    assert.equal(sampleCloudPresence(time,{x:-3,z:8,manualSeconds:3}).cameraYaw,0)
    assert.equal(sampleCloudPresence(time,{x:-3,z:8,reducedMotion:true}).amount,0)
  }
  assert.equal(sampleCloudPresence(4,{x:-3,z:8}).amount,0)
  assert.ok(sampleCloudPresence(10,{x:-3,z:8}).amount>.9)
  assert.equal(sampleCloudPresence(27,{x:-3,z:8}).amount,0)
})

test('selection is courtyard-only, every selection including current restarts at entrance',async()=>{
  let phase='hero',position=[7,1,-4],loads=0,commits=0
  const controller=createEntranceSelection({phase:()=>phase,prepare:async kind=>{loads++;return {kind,dispose(){}}},commit:()=>{commits++;position=[-3,.05,8]}})
  assert.equal(await controller.select('robot'),false)
  phase='reveal';assert.equal(await controller.select('human'),false)
  assert.equal(loads,0)
  phase='explore'
  for(const kind of ['robot','human','dog','dog']){
    position=[7,1,-4];assert.equal(await controller.select(kind),true);assert.deepEqual(position,[-3,.05,8])
  }
  assert.equal(commits,4)
})

test('failed, duplicate, cancelled and unmounted loads do not replace the current actor',async()=>{
  let phase='explore',resolve,commits=0,disposed=0,errors=0
  const controller=createEntranceSelection({phase:()=>phase,prepare:()=>new Promise(r=>{resolve=r}),commit:()=>commits++,onError:()=>errors++})
  const pending=controller.select('dog')
  assert.equal(await controller.select('human'),false)
  phase='hero';controller.cancel();resolve({dispose(){disposed++}})
  assert.equal(await pending,false);assert.equal(commits,0);assert.equal(disposed,1)
  phase='explore';const second=controller.select('human');controller.dispose();resolve({dispose(){disposed++}})
  assert.equal(await second,false);assert.equal(disposed,2)
  const failing=createEntranceSelection({phase:()=>phase,prepare:async()=>{throw Error('network')},commit:()=>commits++,onError:()=>errors++})
  assert.equal(await failing.select('robot'),false);assert.equal(errors,1);assert.equal(commits,0)
})

test('real robot collision profile completes the authored studio route and return',async t=>{
  const layout=JSON.parse(await readFile(new URL('../public/world/blender/cloud-courtyard-v2-layout.json',import.meta.url),'utf8'))
  const body=await createTraversal({...layout,character:CLOUD_ROBOT_PROFILE});t.after(()=>body.dispose())
  for(let i=0;i<60;i++)body.step(1/60)
  let heading=0
  for(const returning of [false,true]){
    const route=cloudGuideRoute(layout,body.position,returning,'agentic');assert.ok(route)
    let index=0
    for(let i=0;i<20000&&index<route.length;i++){
      const [x,z]=route[index],p=body.position,dx=x-p.x,dz=z-p.z,d=Math.hypot(dx,dz)
      if(d<.17){index++;continue}
      const desired=Math.atan2(-dx,-dz);heading+=Math.atan2(Math.sin(desired-heading),Math.cos(desired-heading))/6
      heading=body.step(1/60,{x:dx/d*.64,z:dz/d*.64,heading}).heading
    }
    assert.equal(index,route.length,JSON.stringify(body.position))
    assert.equal(cloudLocationAt(layout,body.position),returning?'commons':'agentic')
  }
})
