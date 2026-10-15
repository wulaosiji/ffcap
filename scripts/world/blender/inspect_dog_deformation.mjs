// Actual runtime skin deformation, not a bone-only or foot-only check.
// CPU inspection preserves real mesh, weights, bind matrices and animations.
import {readFile} from 'node:fs/promises'
import {pathToFileURL} from 'node:url'
import ts from 'typescript'
import * as T from 'three'
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js'

const cache=new Map()
async function executable(url){
  if(cache.has(url.href))return cache.get(url.href)
  let source=ts.transpileModule(await readFile(url,'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022}}).outputText
  for(const match of [...source.matchAll(/from (['"])([^'"]+)\1/g)]){
    const specifier=match[2]
    const path=specifier.startsWith('.')?new URL(specifier.endsWith('.mjs')?specifier:`${specifier}.ts`,url):null
    const resolved=path?(path.pathname.endsWith('.ts')?await executable(path):path.href):import.meta.resolve(specifier)
    source=source.replace(match[0],`from ${JSON.stringify(resolved)}`)
  }
  const result=`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`
  cache.set(url.href,result);return result
}
const {createCloudDogRig}=await import(await executable(new URL('../../../src/components/editorial-home/world/settlement/cloudDog.ts',import.meta.url)))

export async function loadDogInspectionRig(file){
  const bytes=await readFile(file),loader=new GLTFLoader()
  loader.register(()=>({name:'CPU_deformation_no_images',loadTexture:async()=>new T.Texture()}))
  const asset=await loader.parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'')
  return {asset,rig:createCloudDogRig(asset)}
}

export async function inspectDogDeformation(file,{turnSign=1,restCycle=false}={}){
  const {asset,rig}=await loadDogInspectionRig(file),meshes=[]
  rig.setGroundSampler(()=>({height:0,normal:{x:0,y:1,z:0}}))
  asset.scene.traverse(mesh=>{
    if(!mesh.isSkinnedMesh)return
    const position=mesh.geometry.getAttribute('position'),index=mesh.geometry.index
    const rest=Array.from({length:position.count},(_,i)=>new T.Vector3().fromBufferAttribute(position,i))
    const seen=new Set(),edges=[]
    for(let i=0;i<(index?.count??position.count);i+=3){
      const tri=[0,1,2].map(k=>index?index.getX(i+k):i+k)
      for(let k=0;k<3;k++){
        const a=Math.min(tri[k],tri[(k+1)%3]),b=Math.max(tri[k],tri[(k+1)%3]),key=`${a}:${b}`
        if(seen.has(key))continue
        seen.add(key);const length=rest[a].distanceTo(rest[b])
        if(length>.001)edges.push({a,b,length})
      }
    }
    meshes.push({mesh,rest,edges})
  })
  const worst=[],damaged=new Set();let maxExpansion=0,maxRatio=0,samples=0
  if(restCycle)rig.setResting(true,true)
  for(let frame=0;frame<(restCycle?420:300);frame++){
    if(restCycle)rig.setResting(frame<60||frame>=260)
    const speed=frame<30||frame>=260||(restCycle&&!rig.isReadyToWalk())?0:.75
    const turn=speed>0&&frame>=130&&frame<210?1.1*turnSign:0
    rig.root.rotation.y+=turn/60
    rig.root.position.x-=Math.sin(rig.root.rotation.y)*speed/60
    rig.root.position.z-=Math.cos(rig.root.rotation.y)*speed/60
    rig.update(1/60,{speed,turn,grounded:true})
    if(frame%5)continue
    samples++
    for(const {mesh,rest,edges} of meshes){
      mesh.skeleton.update()
      const posed=rest.map((v,i)=>mesh.applyBoneTransform(i,v.clone()))
      for(const edge of edges){
        const length=posed[edge.a].distanceTo(posed[edge.b]),expansion=length-edge.length,ratio=length/edge.length
        maxExpansion=Math.max(maxExpansion,expansion);maxRatio=Math.max(maxRatio,ratio)
        if(expansion>.025)damaged.add(`${mesh.name}:${edge.a}:${edge.b}`)
        if(expansion>(worst.at(-1)?.expansion??0)||worst.length<8){
          const joints=mesh.geometry.getAttribute('skinIndex'),weights=mesh.geometry.getAttribute('skinWeight')
          const influences=i=>[0,1,2,3].map(k=>[mesh.skeleton.bones[joints.getComponent(i,k)]?.name,weights.getComponent(i,k)]).filter(p=>p[1]>.001)
          worst.push({frame,mesh:mesh.name,expansion,ratio,restLength:edge.length,rest:[rest[edge.a].toArray(),rest[edge.b].toArray()],weights:[influences(edge.a),influences(edge.b)]})
          worst.sort((a,b)=>b.expansion-a.expansion);worst.length=Math.min(8,worst.length)
        }
      }
    }
  }
  rig.dispose()
  return {samples,maxExpansion,maxRatio,edgesExpandedOver25mm:damaged.size,worst}
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
  console.log(JSON.stringify(await inspectDogDeformation(process.argv[2]??new URL('../../../public/world/blender/cloud-dog-v1.glb',import.meta.url)),null,2))
}
