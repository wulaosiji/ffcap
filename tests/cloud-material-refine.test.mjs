import test from 'node:test'
import assert from 'node:assert/strict'
import {refineCloudMaterials,STONE_NAMES} from '../scripts/world/blender/refine_cloud_materials.mjs'
import {parseGLB} from '../scripts/world/blender/inspect_glb.mjs'

function fixture(kind='optimized',change=j=>j){
 const data=change({asset:{version:'2.0'},buffers:[{byteLength:4}],materials:[
  ...STONE_NAMES.map(name=>({name,normalTexture:{index:0,scale:.3000000119},pbrMetallicRoughness:{roughnessFactor:.87}})),
  {name:'Oiled oak',pbrMetallicRoughness:{roughnessFactor:.8,...(kind==='optimized'?{baseColorFactor:[.64,.48,.29,1]}:{})}},
  {name:'Untouched',pbrMetallicRoughness:{baseColorFactor:[.2,.3,.4,1]}}
 ],nodes:[{name:'preserved',translation:[1,2,3]}]})
 const raw=Buffer.from(JSON.stringify(data)),json=Buffer.concat([raw,Buffer.alloc((4-raw.length%4)%4,32)]),h=Buffer.alloc(20),bh=Buffer.alloc(8),binary=Buffer.from([1,2,3,4])
 h.writeUInt32LE(0x46546c67);h.writeUInt32LE(2,4);h.writeUInt32LE(28+json.length+binary.length,8);h.writeUInt32LE(json.length,12);h.writeUInt32LE(0x4e4f534a,16)
 bh.writeUInt32LE(binary.length);bh.writeUInt32LE(0x004e4942,4)
 return Buffer.concat([h,json,bh,binary])
}
for(const kind of ['optimized','uncompressed'])test(`material trial changes only five approved properties (${kind})`,()=>{
 const input=fixture(kind),copy=Buffer.from(input),before=parseGLB(input),after=parseGLB(refineCloudMaterials(input,kind)),expected=structuredClone(before.json)
 for(const m of expected.materials){
  if(STONE_NAMES.includes(m.name))m.normalTexture.scale=.16
  if(m.name==='Oiled oak')m.pbrMetallicRoughness.baseColorFactor=[.74,.56,.36,1]
 }
 assert.deepEqual(after.json,expected);assert.ok(after.binary.equals(before.binary));assert.ok(input.equals(copy))
 assert.throws(()=>refineCloudMaterials(refineCloudMaterials(input,kind),kind))
})
test('material trial rejects missing targets, changed baselines and unknown export kinds',()=>{
 assert.throws(()=>refineCloudMaterials(fixture('optimized',j=>({...j,materials:j.materials.slice(1)}))))
 assert.throws(()=>refineCloudMaterials(fixture('optimized',j=>{j.materials[4].pbrMetallicRoughness.baseColorFactor=[1,1,1,1];return j})))
 assert.throws(()=>refineCloudMaterials(fixture(),'other'))
 assert.throws(()=>refineCloudMaterials(fixture('uncompressed')))
})
