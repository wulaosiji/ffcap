import * as T from 'three'

// GLTFLoader sanitizes Blender's .001 suffix to 001. Limit the opt-in to the
// reviewed 82 Garden21 edge-colony nodes (the unsuffixed first + 001..081).
const GARDEN21_EDGE_NAME=/^Leaf_Garden21_Edge_Colony(?:00[1-9]|0[1-7][0-9]|08[01])?_Garden21$/
const PILOT_NAME=/^(Leaf_BroadleafColony_|Wood_ShrubSupport_)/

function uniformPositiveScale(matrix){
 const e=matrix.elements,axis=[0,4,8].map(i=>new T.Vector3(e[i],e[i+1],e[i+2]))
 const lengths=axis.map(v=>v.length()),max=Math.max(...lengths)
 if(!(max>0)||matrix.determinant()<=0||max-Math.min(...lengths)>max*1e-4)return false
 for(let i=0;i<3;i++)for(let j=i+1;j<3;j++)if(Math.abs(axis[i].dot(axis[j]))>lengths[i]*lengths[j]*1e-4)return false
 return true
}

/** Reversible batching of this pilot's repeated meshes; owns instance buffers only. */
export function batchCloudFoliage(root,{garden21Edge=false}={}){
 root.updateMatrixWorld(true)
 const inverse=root.matrixWorld.clone().invert(),groups=new Map(),batches=[]
 root.traverse(mesh=>{
  if(!mesh.isMesh||mesh.isInstancedMesh||mesh.isSkinnedMesh||!mesh.visible||Array.isArray(mesh.material)||mesh.morphTargetInfluences)return
  if(garden21Edge){
   if(!GARDEN21_EDGE_NAME.test(mesh.name)||!uniformPositiveScale(mesh.matrixWorld)||!uniformPositiveScale(root.matrixWorld))return
   // Keep distinct UV-root policies, per-object hooks and authored notes out
   // of this static, ordinary-foliage pilot.
   const sourceName=mesh.userData.name
   if(mesh.userData.cloudRootedUvBreeze===true||Object.keys(mesh.userData).some(key=>key!=='name')||
      (sourceName!==undefined&&(typeof sourceName!=='string'||sourceName.replaceAll('.','')!==mesh.name))||mesh.customDepthMaterial||
      Object.hasOwn(mesh,'onBeforeRender')||mesh.material.transparent||!mesh.geometry.index)return
  }else if(!PILOT_NAME.test(mesh.name))return
  if(mesh.matrixWorld.determinant()<=0)return
  const region=garden21Edge?`${mesh.matrixWorld.elements[12]<0?'west':'east'}-${mesh.matrixWorld.elements[14]<0?'north':'south'}`:null
  const key=[mesh.geometry.uuid,mesh.material.uuid,mesh.castShadow,mesh.receiveShadow,mesh.layers.mask,mesh.renderOrder,
    ...(garden21Edge?[mesh.frustumCulled,false,region]:[])].join('|')
  if(!groups.has(key))groups.set(key,[])
  groups.get(key).push({mesh,region,parent:mesh.parent,index:mesh.parent.children.indexOf(mesh)})
 })
 for(const entries of groups.values()){
  if(entries.length<2)continue
  const first=entries[0].mesh,region=entries[0].region,batch=new T.InstancedMesh(first.geometry,first.material,entries.length)
  batch.name=garden21Edge?`Leaf_Batched_Garden21_Edge_${region}_${batches.length}`:
    first.name.startsWith('Leaf_')?'Leaf_Batched_Broadleaf':'Wood_Batched_ShrubSupport'
  batch.castShadow=first.castShadow;batch.receiveShadow=first.receiveShadow;batch.layers.mask=first.layers.mask;batch.renderOrder=first.renderOrder
  if(garden21Edge){
   batch.frustumCulled=first.frustumCulled
   batch.userData.cloudRootedUvBreeze=false
   batch.userData.cloudBatch={region,sourceNames:entries.map(({mesh})=>mesh.name),
    sourceUserData:entries.map(({mesh})=>({...mesh.userData}))}
  }
  const originals=entries.map(({mesh,parent,index})=>({mesh,parent,index}))
  let maxInstanceScale=0
  entries.forEach(({mesh},i)=>{
   const matrix=inverse.clone().multiply(mesh.matrixWorld)
   batch.setMatrixAt(i,matrix)
   maxInstanceScale=Math.max(maxInstanceScale,matrix.getMaxScaleOnAxis())
  })
  batch.instanceMatrix.needsUpdate=true;batch.computeBoundingBox();batch.computeBoundingSphere()
  // Ordinary foliage flex is at most .075 and breeze magnitude below 1.
  // Retain the prior .2 margin and grow it for any larger uniform instances.
  const windMargin=garden21Edge?Math.max(.2,.075*1.1*maxInstanceScale):.2
  batch.boundingBox.expandByScalar(windMargin);batch.boundingSphere.radius+=windMargin
  for(const {mesh}of entries)mesh.removeFromParent()
  root.add(batch);batches.push({batch,originals})
 }
 let disposed=false
 return {stats:{originalMeshes:batches.reduce((n,b)=>n+b.originals.length,0),batches:batches.length},dispose(){
  if(disposed)return;disposed=true
  const byParent=new Map()
  for(const {batch,originals}of batches){
   batch.removeFromParent();batch.dispose()
   for(const original of originals){
    if(!byParent.has(original.parent))byParent.set(original.parent,[])
    byParent.get(original.parent).push(original)
   }
  }
  for(const [parent,originals]of byParent){
   for(const {mesh,index}of originals.sort((a,b)=>a.index-b.index)){
    parent.add(mesh);parent.children.splice(parent.children.indexOf(mesh),1);parent.children.splice(index,0,mesh)
   }
  }
 }}
}
