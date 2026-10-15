import * as T from 'three'
import type {GLTF} from 'three/addons/loaders/GLTFLoader.js'
import {loadOwnedGLB,resourceOwner,validateAuthoredScene} from './blenderAssets'
import {CLOUD_ROBOT_PROFILE} from './cloudCharacterProfile.mjs'
import {sampleRobotTrack} from './cloudRobotMotion.mjs'
import type {DogGroundSampler} from './cloudDog'

/** Authored joints + instanced original tread geometry; no visual proxy robot. */
export function createCloudRobotRig(asset:GLTF,resources=resourceOwner()){
  try{return assemble(asset,resources)}catch(error){resources.dispose();throw error}
}
function assemble(asset:GLTF,resources:ReturnType<typeof resourceOwner>){
  validateAuthoredScene(asset,'Cloud robot')
  const authored=asset.scene.getObjectByName('CloudRobot')
  const metadata=authored?.userData.cloudRobot
  if(!authored||metadata?.schemaVersion!==2||metadata.trackCount!==1||metadata.linkCount!==48)throw new Error('Invalid full-width robot articulation metadata')
  const required=(name:string)=>{const node=asset.scene.getObjectByName(name);if(!node)throw new Error(`Missing robot joint ${name}`);return node}
  const head=required('RobotHead'),eyes=required('RobotEyes'),arms=[required('RobotArm_L'),required('RobotArm_R')]
  const root=new T.Group(),tilt=new T.Group();root.name='Cloud island tracked explorer';root.add(tilt);tilt.add(asset.scene)
  resources.object(root)
  root.updateMatrixWorld(true)
  const links:{side:number;index:number;object:T.Object3D}[]=[]
  authored.traverse(node=>{
    const match=/^TrackLink_C_(\d+)$/.exec(node.name)
    if(match)links.push({side:0,index:Number(match[1]),object:node})
    if(node instanceof T.Mesh){node.castShadow=true;node.receiveShadow=true}
  })
  if(links.length!==48)throw new Error('Robot requires one complete full-width 48-link track')
  const batches=new Map<string,{mesh:T.InstancedMesh;items:{side:number;index:number;local:T.Matrix4}[]}>()
  // Instancing reduces submissions, not geometry detail. Each authored link is retained.
  for(const link of links){
    link.object.updateWorldMatrix(true,true)
    const inverse=link.object.matrixWorld.clone().invert()
    link.object.traverse(node=>{
      if(!(node instanceof T.Mesh))return
      const material=node.material,key=node.geometry.uuid+':'+(Array.isArray(material)?material.map(m=>m.uuid).join(','):material.uuid)
      let batch=batches.get(key)
      if(!batch){
        const mesh=new T.InstancedMesh(node.geometry,material,48);mesh.name='Instanced authored full-width tread';mesh.castShadow=true;mesh.receiveShadow=true;mesh.frustumCulled=false
        authored.add(mesh);resources.object(mesh);batch={mesh,items:[]};batches.set(key,batch)
      }
      batch.items.push({side:link.side,index:link.index,local:inverse.clone().multiply(node.matrixWorld)})
    })
    link.object.visible=false
  }
  for(const batch of batches.values())batch.mesh.count=batch.items.length
  const wheels=([0,1] as const).flatMap(side=>[0,1,2,3].map(i=>({side,node:required(`RobotWheel_${side===0?'L':'R'}_${i}`),radius:i<2?.087:.05})))
  let sampler:DogGroundSampler|undefined,disposed=false,previous:T.Vector3|undefined
  let left=0,right=0,headYaw=0,headPitch=0,attention={yaw:0,pitch:0,amount:0},clock=0
  const position=new T.Vector3(),matrix=new T.Matrix4(),quaternion=new T.Quaternion(),unit=new T.Vector3(1,1,1),axis=new T.Vector3(1,0,0)
  function tracks(){
    for(const {mesh,items} of batches.values()){
      items.forEach((item,i)=>{
        // The lower belt travels backward relative to the advancing chassis,
        // cancelling world translation at the ground contact instead of doubling it.
        const pose=sampleRobotTrack(item.index*metadata.trackLength/48-left)
        position.set(0,pose.height,-pose.forward)
        quaternion.setFromAxisAngle(axis,pose.angle)
        matrix.compose(position,quaternion,unit).multiply(item.local);mesh.setMatrixAt(i,matrix)
      });mesh.instanceMatrix.needsUpdate=true
    }
    for(const wheel of wheels)wheel.node.rotation.x=-left/wheel.radius
  }
  tracks()
  return {
    root,
    setGroundSampler(value?:DogGroundSampler){sampler=value},
    setAttention(value:{yaw:number;pitch:number;amount:number}){attention=value},
    resetPose(){previous=undefined;left=right=clock=headYaw=headPitch=0;head.rotation.set(0,0,0);eyes.rotation.set(0,0,0);tilt.rotation.set(0,0,0);tilt.position.y=0;tracks()},
    update(dt:number,motion:{speed:number;grounded:boolean;turn:number}){
      if(disposed||!Number.isFinite(dt)||dt<=0)return
      const step=Math.min(dt,.1);clock+=step
      const current=root.position,heading=root.rotation.y
      const distance=previous?Math.hypot(current.x-previous.x,current.z-previous.z):0
      if(distance<.5){
        // One unified belt: no imaginary left/right differential or idle spinning.
        left+=distance;right=left
      }
      previous=(previous??new T.Vector3()).copy(current)
      tracks()
      // Supported fore/aft contact samples drive chassis pitch, not walking bounce.
      if(sampler&&motion.grounded){
        const forward=new T.Vector3(-Math.sin(heading),0,-Math.cos(heading))
        const a=current.clone().addScaledVector(forward,.18),b=current.clone().addScaledVector(forward,-.18)
        const front=sampler(a.x,a.z,current.y+.4,.9),back=sampler(b.x,b.z,current.y+.4,.9)
        if(front&&back)tilt.rotation.x=T.MathUtils.damp(tilt.rotation.x,T.MathUtils.clamp(Math.atan2(front.height-back.height,.36),-.28,.28),7,step)
      }
      headYaw=T.MathUtils.damp(headYaw,attention.yaw*.72,2,step)
      headPitch=T.MathUtils.damp(headPitch,attention.pitch,2,step)
      head.rotation.y=headYaw;head.rotation.x=headPitch
      // The optics acquire a target before the heavier head follows.
      eyes.rotation.y=T.MathUtils.damp(eyes.rotation.y,T.MathUtils.clamp(attention.yaw-headYaw,-.08,.08),5,step)
      eyes.rotation.x=T.MathUtils.damp(eyes.rotation.x,attention.pitch-headPitch,5,step)
      const armRest=motion.speed<.04?Math.sin(clock*.52)*.016:0
      arms[0].rotation.x=T.MathUtils.damp(arms[0].rotation.x,armRest,2,step)
      arms[1].rotation.x=T.MathUtils.damp(arms[1].rotation.x,-armRest*.6,2,step)
    },
    inspectMotion(){return {left,right,headYaw,headPitch,links:links.length}},
    dispose(){if(disposed)return;disposed=true;sampler=undefined;resources.dispose()},
  }
}

export async function createCloudRobot(highQuality=true){
  const response=await fetch(CLOUD_ROBOT_PROFILE.manifestUrl,{cache:'no-store'})
  if(!response.ok)throw new Error(`Robot manifest failed: ${response.status}`)
  const manifest=await response.json()
  if(manifest.schemaVersion!==1||!/^[a-f0-9]{64}$/.test(manifest.sha256)||!Number.isSafeInteger(manifest.bytes)||manifest.bytes<=0)throw new Error('Invalid robot manifest')
  const resources=resourceOwner()
  try{
    const asset=await loadOwnedGLB(`${CLOUD_ROBOT_PROFILE.glbUrl}?v=${manifest.sha256}`,resources,!highQuality,manifest.sha256)
    resources.configureTextures(!highQuality)
    return {...createCloudRobotRig(asset,resources),assetSha256:manifest.sha256 as string}
  }catch(error){resources.dispose();throw error}
}
