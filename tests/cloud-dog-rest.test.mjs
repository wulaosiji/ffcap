import assert from 'node:assert/strict'
import test from 'node:test'
import * as T from 'three'
import {inspectDogDeformation,loadDogInspectionRig} from '../scripts/world/blender/inspect_dog_deformation.mjs'

const asset=process.env.CLOUD_DOG_GLB??new URL('../public/world/blender/cloud-dog-v1.glb',import.meta.url)
test('real seated dog waits, rises before moving, and sits after arrival',async()=>{
  const {rig,asset:loaded}=await loadDogInspectionRig(asset)
  try{
    assert.ok(loaded.animations.some(clip=>clip.name==='sit'),'requires real authored sit clip')
    rig.setGroundSampler(()=>({height:0,normal:{x:0,y:1,z:0}}))
    const pelvis=loaded.scene.getObjectByName('pelvis')
    const standing=pelvis.getWorldPosition(new T.Vector3()).y
    rig.setResting(true,true)
    for(let f=0;f<60;f++)rig.update(1/60,{speed:0,turn:0,grounded:true})
    assert.equal(rig.isReadyToWalk(),false)
    assert.ok(pelvis.getWorldPosition(new T.Vector3()).y<standing-.20,'rump visibly lowers into a seated pose')
    assert.equal(rig.inspectGrounding().restAmount,1)
    for(const foot of rig.inspectGrounding().feet)assert.ok(Math.abs(foot.sole[1])<.012,`${foot.id} sits on ground`)
    let minSkin=Infinity
    loaded.scene.traverse(mesh=>{
      if(!mesh.isSkinnedMesh)return
      mesh.skeleton.update()
      const positions=mesh.geometry.getAttribute('position')
      for(let i=0;i<positions.count;i++)minSkin=Math.min(minSkin,mesh.applyBoneTransform(i,new T.Vector3().fromBufferAttribute(positions,i)).applyMatrix4(mesh.matrixWorld).y)
    })
    assert.ok(minSkin>-.015,`seated coat/tail cannot penetrate ground: ${minSkin}`)
    rig.setResting(false)
    for(let f=0;f<40;f++){
      rig.update(1/60,{speed:0,turn:0,grounded:true})
      assert.equal(rig.isReadyToWalk(),false,'must finish rising before route can move')
    }
    for(let f=0;f<10;f++)rig.update(1/60,{speed:0,turn:0,grounded:true})
    assert.equal(rig.isReadyToWalk(),true)
    assert.ok(pelvis.getWorldPosition(new T.Vector3()).y>standing-.04)
    for(let f=0;f<100;f++){
      rig.root.position.z-=.75/60
      rig.update(1/60,{speed:.75,turn:0,grounded:true})
      assert.equal(rig.inspectGrounding().restAmount,0)
    }
    rig.setResting(true)
    for(let f=0;f<70;f++)rig.update(1/60,{speed:0,turn:0,grounded:true})
    assert.equal(rig.inspectGrounding().restAmount,1)
    assert.ok(pelvis.getWorldPosition(new T.Vector3()).y<standing-.20)
    rig.resetPose();rig.setResting(true,true)
    assert.equal(rig.inspectGrounding().restAmount,1,'world reset restores seated start')
  }finally{rig.dispose()}
})

test('real sitting/rising/walking/arrival skin remains continuous',async()=>{
  const report=await inspectDogDeformation(asset,{restCycle:true})
  assert.equal(report.samples,84)
  assert.ok(report.maxExpansion<.04,JSON.stringify(report.worst[0]))
  console.log(JSON.stringify({restCycleMaxExpansion:report.maxExpansion}))
})
