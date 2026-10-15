import * as T from 'three'
import {createBlenderExplorer,loadOwnedGLB,resourceOwner,validateAuthoredScene} from './blenderAssets'
import {validateCloudLayout} from './cloudLayout.mjs'
import {createCloudDog} from './cloudDog'
import {createCloudRobot} from './cloudRobot'
import type {CloudCharacterKind} from './cloudCharacterProfile.mjs'
import {createCloudSurfaceEffects,CREEK_CENTRE} from './cloudSurfaceEffects.mjs'
import {createCloudGroundEffects} from './cloudGround.mjs'
import {createCloudCameraCollision} from './cloudCameraCollision.mjs'
import {batchCloudFoliage} from './cloudFoliageBatch.mjs'

/** One authored island owns its visible geometry, walking surfaces and camera bounds. */
export async function createCloudEnvironment(scene:T.Scene,mobile:boolean){
  const resources=resourceOwner()
  const previous={background:scene.background,environment:scene.environment,intensity:scene.environmentIntensity}
  const layoutPromise=fetch('/world/blender/cloud-courtyard-v2-layout.json',{cache:'no-store'}).then(async response=>{
    if(!response.ok)throw new Error(`Cloud layout failed: ${response.status}`)
    const layout=validateCloudLayout(await response.json())
    if(!layout.assetSha256)throw new Error('Cloud layout must identify its matching asset revision')
    return layout
  })
  const [modelResult,skyResult,layoutResult]=await Promise.allSettled([
    layoutPromise.then(layout=>loadOwnedGLB(`/world/blender/cloud-courtyard-v2.glb?v=${layout.assetSha256}`,resources,mobile,layout.assetSha256)),
    new T.TextureLoader().loadAsync('/world/cloud-sky-v2.webp').then(sky=>{resources.texture(sky);return sky}),
    layoutPromise,
  ])
  if(modelResult.status==='rejected'||skyResult.status==='rejected'||layoutResult.status==='rejected'){
    resources.dispose()
    throw [modelResult,skyResult,layoutResult].find((result):result is PromiseRejectedResult=>result.status==='rejected')!.reason
  }
  const asset=modelResult.value,sky=skyResult.value,layout=layoutResult.value
  let disposed=false,surfaces:ReturnType<typeof createCloudSurfaceEffects>|undefined,ground:ReturnType<typeof createCloudGroundEffects>|undefined
  let foliageBatch:ReturnType<typeof batchCloudFoliage>|undefined
  try{
    validateAuthoredScene(asset,'Cloud courtyard V2')
    const root=asset.scene;root.name='Cloud courtyard V2 — authored island'
    root.updateMatrixWorld(true)
    resources.configureTextures(mobile)
    root.traverse(node=>{
      if(!(node instanceof T.Mesh))return
      const water=/^Water(?:_|$)/i.test(node.name)
      const foliage=/^Leaf(?:_|$)/i.test(node.name)
      node.castShadow=!water&&!(mobile&&foliage)
      node.receiveShadow=!water
      for(const material of Array.isArray(node.material)?node.material:[node.material]){
        if(!(material instanceof T.MeshStandardMaterial))continue
        material.envMapIntensity=water?1:.65
      }
    })
    if(['93704b7377e7bf41324d678678e41cf1252568380138624e96abaa45ffbd4c8f',
      'd02c2f29a45a2517cdf7f3cb77a30d9669f261fa958e4a7d9800d1095240d7ec',
      '43721ec9d54fd73385ffe6e86581ddb1ae266f224d862c2c0de1a97bbb8c4f86'].includes(layout.assetSha256??'')){
      // These reviewed assets retain all 82 r54 edge-leaf nodes, including
      // the r56e losslessly textured and Draco-packed revision.
      foliageBatch=batchCloudFoliage(root,{garden21Edge:true})
    }else if(window.location.hostname==='127.0.0.1'&&new URLSearchParams(window.location.search).get('foliage-batch')==='1'
      &&layout.assetSha256==='47b607f3ca4ea50381e70ff70300006166963308ba035965b6cc888810c25f84')foliageBatch=batchCloudFoliage(root)
    surfaces=createCloudSurfaceEffects(root,{creekCentre:layout.creekCentre})
    ground=createCloudGroundEffects(root,{creek:layout.creekCentre??CREEK_CENTRE,
      guides:layout.guideRoutes?Object.values(layout.guideRoutes):[layout.guideToAgentic],pathWear:layout.groundPathWear??1})
    sky.colorSpace=T.SRGBColorSpace;sky.mapping=T.EquirectangularReflectionMapping
    scene.background=sky;scene.environment=sky;scene.environmentIntensity=.48
    scene.add(root)
    // Scan the resident static vertices once. Transforming each mesh's local
    // accessor box inflates rotated trees and makes the real island too small.
    const bounds=new T.Box3().setFromObject(root,true)
    const sphere=bounds.getBoundingSphere(new T.Sphere())
    if(!Number.isFinite(sphere.radius)||sphere.radius<=0)throw new Error('Cloud island has invalid bounds')
    const cameraDistance=createCloudCameraCollision(layout.colliders)
    return {
      root,layout,bounds,sphere,skyTexture:sky,
      update(time:number,wind=0){if(!disposed)surfaces?.update(time,wind)},
      cameraDistance,
      dispose(){
        if(disposed)return;disposed=true
        if(scene.background===sky)scene.background=previous.background
        if(scene.environment===sky){scene.environment=previous.environment;scene.environmentIntensity=previous.intensity}
        ground?.dispose();surfaces?.dispose();foliageBatch?.dispose();resources.dispose()
      },
    }
  }catch(error){
    if(scene.background===sky)scene.background=previous.background
    if(scene.environment===sky){scene.environment=previous.environment;scene.environmentIntensity=previous.intensity}
    ground?.dispose();surfaces?.dispose();foliageBatch?.dispose();resources.dispose();throw error
  }
}

/** The small manifest prevents a new scene from silently keeping a cached old character. */
export async function createCloudExplorer(mobile:boolean,kind:CloudCharacterKind='robot'){
  if(kind==='dog')return createCloudDog(mobile)
  if(kind==='robot')return createCloudRobot(!mobile)
  const response=await fetch('/world/blender/explorer-v2-asset.json',{cache:'no-store'})
  if(!response.ok)throw new Error(`Explorer manifest failed: ${response.status}`)
  const data=await response.json()
  if(data.schemaVersion!==1||typeof data.sha256!=='string'||!/^[a-f0-9]{64}$/.test(data.sha256)||!Number.isSafeInteger(data.bytes)||data.bytes<=0)throw new Error('Invalid explorer asset manifest')
  const explorer=await createBlenderExplorer(`/world/blender/explorer-v2.glb?v=${data.sha256}`,mobile,data.sha256)
  return {...explorer,assetSha256:data.sha256 as string}
}
