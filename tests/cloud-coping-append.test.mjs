import test from 'node:test'
import assert from 'node:assert/strict'
import {appendCoping} from '../scripts/world/blender/append_cloud_coping.mjs'
import {parseGLB} from '../scripts/world/blender/inspect_glb.mjs'

function fixture(name){
 const binary=Buffer.alloc(44);[0,0,0,1,0,0,0,1,0].forEach((v,i)=>binary.writeFloatLE(v,i*4));[0,1,2].forEach((v,i)=>binary.writeUInt16LE(v,36+i*2))
 const json={asset:{version:'2.0'},buffers:[{byteLength:44}],bufferViews:[{buffer:0,byteOffset:0,byteLength:36},{buffer:0,byteOffset:36,byteLength:6}],accessors:[{bufferView:0,componentType:5126,count:3,type:'VEC3'},{bufferView:1,componentType:5123,count:3,type:'SCALAR'}],materials:[{name:'R12n warm mineral limestone'}],meshes:[{name,primitives:[{attributes:{POSITION:0},indices:1,material:0}]}],nodes:[{name,mesh:0}],scenes:[{nodes:[0]}],scene:0}
 const raw=Buffer.from(JSON.stringify(json)),j=Buffer.concat([raw,Buffer.alloc((4-raw.length%4)%4,32)])
 const h=Buffer.alloc(20);h.writeUInt32LE(0x46546c67);h.writeUInt32LE(2,4);h.writeUInt32LE(28+j.length+binary.length,8);h.writeUInt32LE(j.length,12);h.writeUInt32LE(0x4e4f534a,16)
 const b=Buffer.alloc(8);b.writeUInt32LE(binary.length);b.writeUInt32LE(0x004e4942,4)
 return Buffer.concat([h,j,b,binary])
}
test('coping composition appends only new references and preserves original payload',()=>{
 const original=fixture('Original'),before=Buffer.from(original),a=parseGLB(original),out=appendCoping(original,fixture('Bridge_Edge_Coping')),b=parseGLB(out)
 assert.ok(original.equals(before));assert.ok(b.binary.subarray(0,a.binary.length).equals(a.binary))
 for(const key of ['accessors','bufferViews','meshes','nodes'])assert.deepEqual(b.json[key].slice(0,a.json[key].length),a.json[key])
 assert.deepEqual(b.json.materials,a.json.materials);assert.deepEqual(b.json.scenes[0].nodes,[0,1])
 assert.equal(b.json.meshes[1].primitives[0].attributes.POSITION,3);assert.equal(b.json.meshes[1].primitives[0].indices,2)
 assert.equal(b.json.accessors[3].type,'VEC3');assert.equal(b.json.accessors[2].type,'SCALAR')
})
test('composition refuses missing or duplicate coping',()=>{
 assert.throws(()=>appendCoping(fixture('Original'),fixture('Other')))
 assert.throws(()=>appendCoping(fixture('Bridge_Edge_Coping'),fixture('Bridge_Edge_Coping')))
})
