import assert from 'node:assert/strict'
import {createHash} from 'node:crypto'
import {readFile} from 'node:fs/promises'
import test from 'node:test'
import {decodeDracoAccessors,inspectGLB,parseGLB} from '../scripts/world/blender/inspect_glb.mjs'
import {CLOUD_DOG_PROFILE} from '../src/components/editorial-home/world/settlement/cloudCharacterProfile.mjs'

const publicAsset = url => new URL(`../public${url}`,import.meta.url)
const dogAsset = async () => {
  const [bytes,manifestText] = await Promise.all([
    readFile(publicAsset(CLOUD_DOG_PROFILE.glbUrl)),readFile(publicAsset(CLOUD_DOG_PROFILE.manifestUrl),'utf8'),
  ])
  return {bytes,manifest:JSON.parse(manifestText),decoded:await decodeDracoAccessors(bytes)}
}

test('the dog is a separately hashed, embedded and genuinely skinned quadruped asset',async()=>{
  const {bytes,manifest,decoded}=await dogAsset()
  assert.equal(manifest.schemaVersion,1)
  assert.equal(createHash('sha256').update(bytes).digest('hex'),manifest.sha256)
  assert.equal(bytes.length,manifest.bytes)
  const result=inspectGLB(bytes,'dog',decoded)
  assert.deepEqual(result.errors,[])
  assert.deepEqual(result.externalDependencies,[])
  assert.deepEqual(result.animations.map(clip=>clip.name).sort(),['idle','run','sit','walk'])
  assert.ok(result.skinnedMeshes>=1)
  assert.ok(Math.abs(result.bounds.min[1])<.01,'standing paw surface starts at physical ground')
  assert.ok(result.bounds.max[1]<.9,'ear height must not inherit human dimensions')
  const {json}=parseGLB(bytes)
  const animatedNodes=new Set(json.animations.flatMap(clip=>clip.channels.map(channel=>channel.target.node)))
  assert.ok(animatedNodes.size>=16,'four limbs and body must have actual animation tracks')
})

test('dog validation does not silently accept the preserved human or remove its original contract',async()=>{
  const human=await readFile(publicAsset('/world/blender/explorer-v2.glb'))
  const decoded=await decodeDracoAccessors(human)
  assert.equal(inspectGLB(human,'character',decoded).valid,true)
  const rejected=inspectGLB(human,'dog',decoded)
  assert.equal(rejected.valid,false)
  assert.ok(rejected.errors.some(error=>error.includes('Dog ear height')))
  const {bytes,decoded:dogDecoded}=await dogAsset()
  assert.ok(inspectGLB(bytes,'character',dogDecoded).errors.some(error=>error.includes('human scale')))
})

test('the agreed dog camera remains grounded and distinct from the preserved human framing',()=>{
  assert.equal(CLOUD_DOG_PROFILE.kind,'dog')
  assert.equal(CLOUD_DOG_PROFILE.camera.targetHeight,.5)
  assert.ok(CLOUD_DOG_PROFILE.camera.baseHeight<1)
  assert.ok(CLOUD_DOG_PROFILE.glbUrl.includes('cloud-dog-v1'))
})
