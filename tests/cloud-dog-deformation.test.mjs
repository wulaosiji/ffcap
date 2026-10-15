import assert from 'node:assert/strict'
import test from 'node:test'
import {inspectDogDeformation} from '../scripts/world/blender/inspect_dog_deformation.mjs'

const asset=process.env.CLOUD_DOG_GLB??new URL('../public/world/blender/cloud-dog-v1.glb',import.meta.url)
for(const turnSign of [-1,1]){
  test(`real dog skin: no long tearing spikes through walk, turn ${turnSign} and stop`,async()=>{
    const report=await inspectDogDeformation(asset,{turnSign})
    assert.equal(report.samples,60)
    // The old belly-to-opposite-leg assignment stretched a 9.5 mm edge by
    // 345 mm despite all bone-length and sole-contact tests passing.
    assert.ok(report.maxExpansion<.04,JSON.stringify(report.worst[0]))
    console.log(JSON.stringify({turnSign,maxExpansion:report.maxExpansion,edgesExpandedOver25mm:report.edgesExpandedOver25mm}))
  })
}
