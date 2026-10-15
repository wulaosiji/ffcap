import test from 'node:test'
import assert from 'node:assert/strict'
import {readFile} from 'node:fs/promises'
import {cloudRenderQuality} from '../src/components/editorial-home/world/settlement/cloudRenderQuality.mjs'

test('clarity probes are bounded and require an exact loopback hostname',()=>{
  for(const hostname of ['ffcap.cn','localhost.example.com','127.0.0.1.example.com','']){
    for(const mode of ['baseline','smaa','msaa4'])assert.deepEqual(cloudRenderQuality(hostname,'?render-aa='+mode+'&render-dpr=2',3),{aa:'msaa4',pixelRatio:1.5,samples:4})
  }
  for(const hostname of ['localhost','127.0.0.1','[::1]']){
    assert.deepEqual(cloudRenderQuality(hostname,'',2),{aa:'msaa4',pixelRatio:1.5,samples:4})
    assert.deepEqual(cloudRenderQuality(hostname,'?render-aa=baseline',2),{aa:'baseline',pixelRatio:1.5,samples:0})
    assert.deepEqual(cloudRenderQuality(hostname,'?render-aa=smaa&render-dpr=2',3),{aa:'smaa',pixelRatio:2,samples:0})
    assert.deepEqual(cloudRenderQuality(hostname,'?render-aa=msaa4',2),{aa:'msaa4',pixelRatio:1.5,samples:4})
  }
  for(const value of [-1,0,NaN,Infinity])assert.equal(cloudRenderQuality('localhost','',value).pixelRatio,1)
  assert.equal(cloudRenderQuality('localhost','?render-dpr=2',1).pixelRatio,1)
  assert.deepEqual(cloudRenderQuality('localhost','?render-aa=99&render-dpr=99',3),{aa:'baseline',pixelRatio:1.5,samples:0})
})

test('single-guide UI removes selection controls while preserving the original character sources',async()=>{
  const ui=await readFile(new URL('../src/components/editorial-home/SettlementHero.tsx',import.meta.url),'utf8')
  assert.doesNotMatch(ui,/ed-settlement-characters|selectCharacter\(|UserRound|PawPrint/)
  assert.match(ui,/const CharacterIcon=Bot/)
  for(const file of ['cloudDog.ts','cloudRobot.ts','cloudCharacterProfile.mjs']){
    assert.ok((await readFile(new URL('../src/components/editorial-home/world/settlement/'+file,import.meta.url))).length>0)
  }
})
