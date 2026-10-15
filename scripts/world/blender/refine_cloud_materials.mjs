/** Reproducible JSON-only material trial; original binary payload is untouched. */
import assert from 'node:assert/strict'
import {readFile,writeFile,access} from 'node:fs/promises'
import {createHash} from 'node:crypto'
import {fileURLToPath,pathToFileURL} from 'node:url'
import path from 'node:path'
import {parseGLB} from './inspect_glb.mjs'
export const STONE_NAMES=Object.freeze(['R12n warm mineral limestone','R12n shaded mineral limestone','R12o Bridge_Masonry_Light','R12o Bridge_Masonry_Shade'])
export function refineCloudMaterials(bytes,kind='optimized'){
 assert.ok(['optimized','uncompressed'].includes(kind))
 const a=parseGLB(bytes),j=structuredClone(a.json);let stones=0,wood=0
 for(const m of j.materials){
  if(STONE_NAMES.includes(m.name)){assert.ok(Math.abs(m.normalTexture.scale-.3)<1e-6);m.normalTexture.scale=.16;stones++}
  if(m.name==='Oiled oak'){assert.deepEqual(m.pbrMetallicRoughness.baseColorFactor,kind==='optimized'?[.64,.48,.29,1]:undefined);m.pbrMetallicRoughness.baseColorFactor=[.74,.56,.36,1];wood++}
 }
 assert.equal(stones,4);assert.equal(wood,1)
 const raw=Buffer.from(JSON.stringify(j)),json=Buffer.concat([raw,Buffer.alloc((4-raw.length%4)%4,32)]),h=Buffer.alloc(20),bh=Buffer.alloc(8)
 h.writeUInt32LE(0x46546c67);h.writeUInt32LE(2,4);h.writeUInt32LE(28+json.length+a.binary.length,8);h.writeUInt32LE(json.length,12);h.writeUInt32LE(0x4e4f534a,16)
 bh.writeUInt32LE(a.binary.length);bh.writeUInt32LE(0x004e4942,4)
 return Buffer.concat([h,json,bh,a.binary])
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){
 const [base,revision]=process.argv.slice(2);assert.ok([base,revision].every(v=>/^r12[a-z0-9-]+$/.test(v))&&base!==revision)
 const root=fileURLToPath(new URL('../../../../../11_本机私密资料库/Blender制作_20260905/云上庭院_v2/',import.meta.url)),p=r=>path.join(root,'cloud-courtyard-v2-'+r),sha=b=>createHash('sha256').update(b).digest('hex')
 for(const s of ['-optimized.glb','-uncompressed.glb','-layout.json','-materials.json']){try{await access(p(revision)+s);throw Error('Preserve existing candidate')}catch(e){if(e.code!=='ENOENT')throw e}}
 const record={base,revision,changedNormalScales:STONE_NAMES,wood:[.74,.56,.36,1],sources:[]};let outputHash
 for(const kind of ['optimized','uncompressed']){const old=await readFile(p(base)+'-'+kind+'.glb'),next=refineCloudMaterials(old,kind);assert.ok(parseGLB(old).binary.equals(parseGLB(next).binary));await writeFile(p(revision)+'-'+kind+'.glb',next,{flag:'wx'});record.sources.push({kind,before:sha(old),after:sha(next),binaryUnchanged:true});if(kind==='optimized')outputHash=sha(next)}
 const layout=await readFile(p(base)+'-layout.json','utf8'),hash=JSON.parse(layout).assetSha256;assert.equal((layout.match(new RegExp(hash,'g'))??[]).length,1)
 await writeFile(p(revision)+'-layout.json',layout.replace(hash,outputHash),{flag:'wx'});await writeFile(p(revision)+'-materials.json',JSON.stringify(record,null,2),{flag:'wx'});console.log(JSON.stringify(record))
}
