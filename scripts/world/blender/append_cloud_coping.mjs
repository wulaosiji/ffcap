/** Add only the authored coping to the original asset; never re-encode old data. */
import assert from 'node:assert/strict'
import {readFile,writeFile,access} from 'node:fs/promises'
import {createHash} from 'node:crypto'
import {pathToFileURL,fileURLToPath} from 'node:url'
import path from 'node:path'
import {parseGLB} from './inspect_glb.mjs'

export function appendCoping(baseBytes,candidateBytes){
  const base=parseGLB(baseBytes),candidate=parseGLB(candidateBytes),j=structuredClone(base.json),src=candidate.json
  const meshes=src.meshes.filter(m=>m.name==='Bridge_Edge_Coping');assert.equal(meshes.length,1)
  assert.ok(!j.meshes.some(m=>m.name==='Bridge_Edge_Coping'))
  const mesh=structuredClone(meshes[0]),sourceIndex=src.meshes.indexOf(meshes[0])
  const nodes=src.nodes.filter(n=>n.mesh===sourceIndex);assert.equal(nodes.length,1)
  assert.ok(!nodes[0].children&&!nodes[0].skin)
  assert.equal(j.buffers.length,1);assert.equal(src.buffers.length,1)
  const chunks=[base.binary],views=new Map(),accessors=new Map();let size=base.binary.length
  const view=id=>{
    if(views.has(id))return views.get(id)
    const v=src.bufferViews[id];assert.equal(v.buffer??0,0)
    const bytes=candidate.binary.subarray(v.byteOffset??0,(v.byteOffset??0)+v.byteLength)
    const dest=j.bufferViews.length;views.set(id,dest)
    j.bufferViews.push({...v,buffer:0,byteOffset:size});chunks.push(bytes);size+=bytes.length
    const padding=(4-size%4)%4;if(padding){chunks.push(Buffer.alloc(padding));size+=padding}
    return dest
  }
  const accessor=id=>{
    if(accessors.has(id))return accessors.get(id)
    const a=structuredClone(src.accessors[id]);assert.ok(!a.sparse)
    if(a.bufferView!==undefined)a.bufferView=view(a.bufferView)
    const dest=j.accessors.length;accessors.set(id,dest);j.accessors.push(a);return dest
  }
  let triangles=0
  for(const p of mesh.primitives){
    assert.equal(p.mode??4,4);assert.ok(!p.targets)
    triangles+=src.accessors[p.indices].count/3
    const name=src.materials[p.material].name,index=j.materials.findIndex(m=>m.name===name);assert.ok(index>=0)
    assert.equal(name,'R12n warm mineral limestone');p.material=index
    p.indices=accessor(p.indices)
    p.attributes=Object.fromEntries(Object.entries(p.attributes).map(([k,id])=>[k,accessor(id)]))
    if(p.extensions){assert.deepEqual(Object.keys(p.extensions),['KHR_draco_mesh_compression']);p.extensions.KHR_draco_mesh_compression.bufferView=view(p.extensions.KHR_draco_mesh_compression.bufferView)}
  }
  assert.ok(triangles>0&&triangles<=5000)
  const node={...nodes[0],mesh:j.meshes.length};j.meshes.push(mesh)
  j.scenes[j.scene??0].nodes.push(j.nodes.length);j.nodes.push(node)
  j.buffers[0].byteLength=size
  for(const key of ['extensionsUsed','extensionsRequired'])j[key]=[...new Set([...(j[key]??[]),...(src[key]??[])])]
  const raw=Buffer.from(JSON.stringify(j)),json=Buffer.concat([raw,Buffer.alloc((4-raw.length%4)%4,32)]),binary=Buffer.concat(chunks)
  const header=Buffer.alloc(20);header.writeUInt32LE(0x46546c67);header.writeUInt32LE(2,4);header.writeUInt32LE(28+json.length+binary.length,8);header.writeUInt32LE(json.length,12);header.writeUInt32LE(0x4e4f534a,16)
  const binHeader=Buffer.alloc(8);binHeader.writeUInt32LE(binary.length);binHeader.writeUInt32LE(0x004e4942,4)
  const result=Buffer.concat([header,json,binHeader,binary]);assert.ok(parseGLB(result).binary.subarray(0,base.binary.length).equals(base.binary))
  return result
}

if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){
  const [dir,baseline,candidate,revision]=process.argv.slice(2)
  assert.ok(dir&&[baseline,candidate,revision].every(v=>/^r12[a-z0-9-]+$/.test(v))&&revision!==baseline&&revision!==candidate)
  const root=fileURLToPath(new URL('../../../../../11_本机私密资料库/Blender制作_20260905/云上庭院_v2',import.meta.url))
  assert.equal(path.resolve(dir),root,'Only the existing private V2 directory')
  const prefix=r=>path.join(dir,'cloud-courtyard-v2-'+r),hash=b=>createHash('sha256').update(b).digest('hex')
  for(const suffix of ['-optimized.glb','-uncompressed.glb','-layout.json','-composition.json']){try{await access(prefix(revision)+suffix);throw Error('Preserve existing candidate')}catch(e){if(e.code!=='ENOENT')throw e}}
  const record={baseline,candidate,revision,addedMesh:'Bridge_Edge_Coping',sources:[]};let optimized
  for(const kind of ['uncompressed','optimized']){
    const a=await readFile(prefix(baseline)+'-'+kind+'.glb'),b=await readFile(prefix(candidate)+'-'+kind+'.glb'),out=appendCoping(a,b)
    record.sources.push({kind,baselineSha256:hash(a),authoringSha256:hash(b),outputSha256:hash(out),bytes:out.length});if(kind==='optimized')optimized=hash(out)
    await writeFile(prefix(revision)+'-'+kind+'.glb',out,{flag:'wx'})
  }
  const layout=await readFile(prefix(baseline)+'-layout.json','utf8'),oldHash=JSON.parse(layout).assetSha256
  assert.equal((layout.match(new RegExp(oldHash,'g'))??[]).length,1)
  await writeFile(prefix(revision)+'-layout.json',layout.replace(oldHash,optimized),{flag:'wx'})
  await writeFile(prefix(revision)+'-composition.json',JSON.stringify(record,null,2),{flag:'wx'})
  console.log(JSON.stringify(record))
}
