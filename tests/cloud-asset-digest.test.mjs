import test from 'node:test'
import assert from 'node:assert/strict'
import {createHash,webcrypto} from 'node:crypto'
import {readFile} from 'node:fs/promises'
import {cloudAssetDigest} from '../src/components/editorial-home/world/settlement/cloudAssetDigest.mjs'
const buffer=b=>b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength)
test('LAN SHA-256 matches native hashes at padding boundaries without mutating bytes',async()=>{
  for(const size of [0,1,55,56,63,64,65,119,120,127,128,1025,1048641]){
    const bytes=Uint8Array.from({length:size},(_,i)=>(i*37+19)%256),before=bytes.slice()
    const expected=createHash('sha256').update(bytes).digest('hex')
    assert.equal(await cloudAssetDigest(buffer(bytes),null),expected,`size ${size}`)
    assert.deepEqual(bytes,before)
  }
  assert.equal(await cloudAssetDigest(new TextEncoder().encode('abc').buffer,null),'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad')
})
test('HTTPS keeps native digest and does not conceal its errors',async()=>{
  const data=new TextEncoder().encode('cloud').buffer
  assert.equal(await cloudAssetDigest(data,webcrypto.subtle),await cloudAssetDigest(data,null))
  await assert.rejects(cloudAssetDigest(data,{digest(){throw Error('native failure')}}),/native failure/)
})
test('real model bytes retain the identical manifest digest in LAN mode',async()=>{
  const bytes=await readFile(process.env.CLOUD_ENV_GLB??'public/world/blender/cloud-courtyard-v2.glb')
  assert.equal(await cloudAssetDigest(buffer(bytes),null),createHash('sha256').update(bytes).digest('hex'))
})
