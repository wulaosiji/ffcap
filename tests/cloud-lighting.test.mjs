import assert from 'node:assert/strict'
import test from 'node:test'
import {sampleCloudLightRig} from '../src/components/editorial-home/world/settlement/cloudLighting.mjs'
import {sampleCloudWeather} from '../src/components/editorial-home/world/settlement/cloudWeather.mjs'

test('lighting keeps reviewed night fill but gives daytime a directional key',()=>{
  const night=sampleCloudLightRig({daylight:0,cloudCover:0})
  assert.deepEqual(night,{sun:.22,hemisphere:.70,fill:.25,environment:.20,position:[-18,14,20]})
  const day=sampleCloudLightRig({daylight:1,cloudCover:0})
  assert.ok(day.sun/(day.hemisphere+day.fill+day.environment)>2.4)
  assert.ok(day.hemisphere>.85,'Do not crush all sky-lit shadow detail')
  assert.deepEqual(day.position,[-22,23,14])
})

test('all quiet weather phases keep finite light and bounded continuous movement',()=>{
  for(const phase of ['day','sunrise','sunset','night']){
    let previous
    for(let time=0;time<=600;time+=.5){
      const rig=sampleCloudLightRig(sampleCloudWeather(time,{seed:0,preview:phase}),time)
      for(const key of ['sun','hemisphere','fill','environment'])assert.ok(Number.isFinite(rig[key])&&rig[key]>=0&&rig[key]<4)
      assert.ok(rig.position.every(Number.isFinite))
      if(previous)assert.ok(Math.hypot(...rig.position.map((v,i)=>v-previous.position[i]))<.01)
      previous=rig
    }
  }
  for(const time of [NaN,Infinity])assert.throws(()=>sampleCloudLightRig({daylight:1,cloudCover:0},time),/Finite/)
})
