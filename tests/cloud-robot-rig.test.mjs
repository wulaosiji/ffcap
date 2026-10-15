import test from 'node:test'
import assert from 'node:assert/strict'
import {readFile} from 'node:fs/promises'
import {createHash} from 'node:crypto'
import ts from 'typescript'
import * as T from 'three'
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js'

const cache=new Map()
async function executable(url){
  if(cache.has(url.href))return cache.get(url.href)
  let source=ts.transpileModule(await readFile(url,'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022}}).outputText
  for(const match of [...source.matchAll(/from (['"])([^'"]+)\1/g)]){
    const spec=match[2]
    const target=spec.startsWith('.')?new URL(spec.endsWith('.mjs')?spec:`${spec}.ts`,url):null
    const resolved=target?(target.pathname.endsWith('.ts')?await executable(target):target.href):import.meta.resolve(spec)
    source=source.replace(match[0],`from ${JSON.stringify(resolved)}`)
  }
  const result=`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`;cache.set(url.href,result);return result
}
const {createCloudRobotRig}=await import(await executable(new URL('../src/components/editorial-home/world/settlement/cloudRobot.ts',import.meta.url)))
const modelPath=process.env.CLOUD_ROBOT_GLB??new URL('../public/world/blender/cloud-robot-v1.glb',import.meta.url)
async function fixture(t){
  const bytes=await readFile(modelPath)
  const asset=await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.length),'')
  const rig=createCloudRobotRig(asset);t.after(()=>rig.dispose());return {rig,asset,bytes}
}
test('authored full tread asset has high-detail articulated geometry, no external dependencies and metre scale',async t=>{
  const {asset,rig,bytes}=await fixture(t)
  const json=JSON.parse(bytes.subarray(20,20+bytes.readUInt32LE(12)).toString())
  assert.ok(!(json.images??[]).some(image=>image.uri))
  assert.ok(!(json.buffers??[]).some(buffer=>buffer.uri))
  assert.equal(asset.scene.getObjectByName('CloudRobot').userData.cloudRobot.linkCount,48)
  assert.equal(asset.scene.getObjectByName('CloudRobot').userData.cloudRobot.trackCount,1)
  const bounds=new T.Box3().setFromObject(rig.root),size=bounds.getSize(new T.Vector3())
  assert.ok(size.y>.95&&size.y<1.1,JSON.stringify(size))
  assert.ok(size.x>.72&&size.x<.80,JSON.stringify(size))
  assert.ok(bounds.min.y>=-.003&&bounds.min.y<=.008,String(bounds.min.y))
  // The central gap must really be covered by rendered belt geometry, not just a box collider.
  const ray=new T.Raycaster()
  for(const x of [-.30,-.15,0,.15,.30])for(const z of [-.14,0,.14]){
    ray.set(new T.Vector3(x,-.04,z),new T.Vector3(0,1,0))
    const hit=ray.intersectObject(rig.root,true).find(h=>h.object.visible)
    assert.ok(hit&&hit.point.y<.025,`Full width ground coverage missing at ${x},${z}`)
  }
  assert.ok(json.meshes.reduce((sum,m)=>sum+m.primitives.reduce((n,p)=>n+(json.accessors[p.indices]?.count??0)/3,0),0)>20000)
  if(!process.env.CLOUD_ROBOT_GLB){
    const manifest=JSON.parse(await readFile(new URL('../public/world/blender/cloud-robot-v1-asset.json',import.meta.url),'utf8'))
    assert.equal(manifest.bytes,bytes.length);assert.equal(manifest.sha256,createHash('sha256').update(bytes).digest('hex'))
  }
})
test('instanced treads retain exact authored matrices and roll only with measured travel',async t=>{
  const {rig,asset}=await fixture(t)
  const authored=asset.scene.getObjectByName('CloudRobot')
  const instances=[];authored.traverse(n=>{if(n instanceof T.InstancedMesh)instances.push(n)})
  assert.ok(instances.length>0&&instances.length<10)
  for(const mesh of instances){
    const matrix=new T.Matrix4();mesh.getMatrixAt(0,matrix)
    const original=asset.scene.getObjectByName('TrackLink_C_00')
    let matching;original.traverse(n=>{if(n instanceof T.Mesh&&n.geometry===mesh.geometry)matching=n})
    assert.ok(matching)
    rig.root.updateMatrixWorld(true)
    const expected=authored.matrixWorld.clone().invert().multiply(matching.matrixWorld)
    assert.ok(matrix.elements.every((v,i)=>Math.abs(v-expected.elements[i])<1e-6))
  }
  rig.update(1/60,{speed:0,grounded:true,turn:0})
  for(let i=0;i<120;i++)rig.update(1/60,{speed:0,grounded:true,turn:0})
  assert.equal(rig.inspectMotion().left,0);assert.equal(rig.inspectMotion().right,0)
  for(let i=0;i<60;i++){rig.root.position.z-=.01;rig.update(1/60,{speed:.6,grounded:true,turn:0})}
  assert.ok(Math.abs(rig.inspectMotion().left-.6)<1e-8)
  rig.root.rotation.y=.1;rig.update(1/60,{speed:0,grounded:true,turn:6})
  assert.equal(rig.inspectMotion().left,rig.inspectMotion().right)
  rig.setAttention({yaw:.3,pitch:.05,amount:1})
  for(let i=0;i<120;i++)rig.update(1/60,{speed:0,grounded:true,turn:0})
  assert.ok(rig.inspectMotion().headYaw>.2)
  rig.resetPose();assert.equal(rig.inspectMotion().left,0)
})
