import * as T from 'three'
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js'
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js'
import {GTAOPass} from 'three/addons/postprocessing/GTAOPass.js'
import {OutputPass} from 'three/addons/postprocessing/OutputPass.js'
import {createBlenderEnvironment,createBlenderExplorer} from './blenderAssets'
import {createDressing} from './dressing'
import {createTraversal} from './physics.mjs'
import {SPAWN,buildGuideRoute,locationAt} from './layout.mjs'

export type SettlementState={location:string;guiding:boolean;guideNotice?:'return-to-start';position:{x:number;y:number;z:number};grounded:boolean;fps:number;drawCalls:number;triangles:number}
export type SettlementAPI={setPaused(value:boolean):void;setExploring(value:boolean):void;setInput(x:number,z:number,run?:boolean):void;look(dx:number,dy:number):void;setPointer(x:number,y:number):void;guide(returning?:boolean):void;reset():void;dispose():void}
export async function createSettlement(canvas:HTMLCanvasElement,options:{onState?:(s:SettlementState)=>void;onError?:()=>void}={}):Promise<SettlementAPI>{
  const mobile=window.matchMedia('(max-width:760px),(pointer:coarse)').matches
  const renderer=new T.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'})
  renderer.setPixelRatio(Math.min(devicePixelRatio||1,mobile?1:1.5));renderer.outputColorSpace=T.SRGBColorSpace
  renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=.97
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFShadowMap
  const scene=new T.Scene();scene.fog=new T.Fog('#c4d6d7',48,165)
  const camera=new T.PerspectiveCamera(53,1,.09,360)
  const hemi=new T.HemisphereLight('#e3eff4','#67764d',1.15);scene.add(hemi)
  const fill=new T.DirectionalLight('#c5e1ef',.3);fill.position.set(18,15,15);scene.add(fill)
  const sun=new T.DirectionalLight('#ffe4b5',3.1);sun.position.set(-22,37,24);sun.castShadow=true
  sun.shadow.mapSize.set(mobile?1024:2048,mobile?1024:2048);sun.shadow.camera.left=-37;sun.shadow.camera.right=37;sun.shadow.camera.top=36;sun.shadow.camera.bottom=-32;sun.shadow.camera.near=1;sun.shadow.camera.far=100;sun.shadow.bias=-.00035;sun.shadow.normalBias=.04
  sun.target.position.set(0,0,-3);scene.add(sun,sun.target)
  // Await every owner, including late successes, before cleaning up a failed
  // startup. Loading does not silently fall back to the old prototype geometry.
  const assets=await Promise.allSettled([createBlenderEnvironment(scene,mobile),createDressing(scene,mobile),createBlenderExplorer()])
  if(assets[0].status==='rejected'||assets[1].status==='rejected'||assets[2].status==='rejected'){
    for(const asset of assets)if(asset.status==='fulfilled')asset.value.dispose()
    renderer.dispose();scene.clear()
    throw assets.find((asset):asset is PromiseRejectedResult=>asset.status==='rejected')!.reason
  }
  const environment=assets[0].value,dressing=assets[1].value,explorer=assets[2].value
  scene.add(explorer.root)
  let traversal:Awaited<ReturnType<typeof createTraversal>>
  try{traversal=await createTraversal({colliders:[...environment.solids.map(s=>({position:s.position as [number,number,number],halfExtents:s.halfExtents as [number,number,number]})),...dressing.colliders],spawn:SPAWN as [number,number,number]})}catch(error){dressing.dispose();environment.dispose();explorer.dispose();renderer.dispose();throw error}
  explorer.root.position.set(...SPAWN as [number,number,number])
  const composer=mobile?null:new EffectComposer(renderer)
  let ao:GTAOPass|undefined,output:OutputPass|undefined
  if(composer){composer.addPass(new RenderPass(scene,camera));ao=new GTAOPass(scene,camera,1,1);ao.updateGtaoMaterial({radius:1.15,thickness:.8,distanceFallOff:.7,samples:8,scale:.9});ao.blendIntensity=.7;composer.addPass(ao);output=new OutputPass();composer.addPass(output)}
  renderer.info.autoReset=false
  function render(){renderer.info.reset();if(composer)composer.render();else renderer.render(scene,camera)}
  let disposed=false,failed=false,paused=false,exploring=false,frameID=0,lastTime=0,time=0,lastReport=0,frames=0,reportTime=0,fps=0
  let yaw=.05,pitch=.30,targetPointerX=0,targetPointerY=0,pointerX=0,pointerY=0,heading=0,velocity=0
  let input={x:0,z:0,run:false},route:number[][]=[],routeIndex=0,guiding=false,grounded=true
  let guideNotice:SettlementState['guideNotice']
  const target=new T.Vector3(),desired=new T.Vector3(),smoothTarget=new T.Vector3(0,3,-9),oldPos=new T.Vector3()
  camera.position.set(3.4,3.6,25);camera.lookAt(smoothTarget)
  function report(){const p=traversal.position;options.onState?.({location:locationAt(p),guiding,guideNotice,position:p,grounded,fps,drawCalls:renderer.info.render.calls,triangles:renderer.info.render.triangles})}
  function stop(){cancelAnimationFrame(frameID);frameID=0;lastTime=0;frames=0;reportTime=0}
  function schedule(){if(!disposed&&!paused&&!failed&&!document.hidden&&!frameID)frameID=requestAnimationFrame(frame)}
  function frame(now:number){
    frameID=0;if(disposed||paused||failed||document.hidden)return
    const elapsed=lastTime?Math.max(0,(now-lastTime)/1000):0
    const dt=lastTime?Math.min(elapsed,.06):1/60;lastTime=now;time+=dt
    const p=traversal.position;oldPos.set(p.x,p.y,p.z)
    let ix=exploring?input.x:0,iz=exploring?input.z:0,run=input.run
    if(guiding&&exploring){
      const waypoint=route[routeIndex],dx=waypoint[0]-p.x,dz=waypoint[1]-p.z,length=Math.hypot(dx,dz)
      if(length<.19){routeIndex++;ix=iz=0;if(routeIndex>=route.length){guiding=false;report()}}
      else{ix=dx/length*.72;iz=dz/length*.72;run=false}
    }else{const x=ix;ix=x*Math.cos(yaw)+iz*Math.sin(yaw);iz=-x*Math.sin(yaw)+iz*Math.cos(yaw)}
    const result=traversal.step(dt,{x:ix,z:iz,run});grounded=result.grounded
    if(result.position.y<-.9||!Number.isFinite(result.position.y))reset()
    const np=traversal.position
    explorer.root.position.set(np.x,np.y,np.z)
    const moveDistance=Math.hypot(np.x-oldPos.x,np.z-oldPos.z)
    velocity=T.MathUtils.damp(velocity,Math.min(5.3,moveDistance/Math.max(dt,.001)),10,dt)
    const prevHeading=heading
    if(moveDistance>.0005){const nextHeading=Math.atan2(-(np.x-oldPos.x),-(np.z-oldPos.z));const delta=Math.atan2(Math.sin(nextHeading-heading),Math.cos(nextHeading-heading));heading+=delta*Math.min(1,dt*10)}
    explorer.root.rotation.y=heading
    explorer.update(dt,{speed:velocity,grounded,turn:(heading-prevHeading)/Math.max(dt,.001)})
    environment.update(time)
    pointerX=T.MathUtils.damp(pointerX,targetPointerX,3,dt);pointerY=T.MathUtils.damp(pointerY,targetPointerY,3,dt)
    if(exploring){
      target.set(np.x,np.y+1.32,np.z)
      const distance=mobile?5.7:5.4
      desired.set(np.x+Math.sin(yaw)*distance,np.y+1.5+Math.sin(pitch)*distance,np.z+Math.cos(yaw)*distance)
      desired.copy(environment.cameraDistance(target,desired));camera.position.lerp(desired,1-Math.exp(-dt*7));smoothTarget.lerp(target,1-Math.exp(-dt*10))
      explorer.root.visible=camera.position.distanceTo(target)>.7
    }else{
      explorer.root.visible=true
      const portrait=canvas.clientWidth<canvas.clientHeight
      desired.set(portrait?1:3.4+pointerX*.35,portrait?12:3.6-pointerY*.12,portrait?48:25)
      camera.position.lerp(desired,1-Math.exp(-dt*2));target.set(portrait?0:-.5,portrait?3.2:3,portrait?-8:-12);smoothTarget.lerp(target,1-Math.exp(-dt*2))
    }
    camera.lookAt(smoothTarget)
    try{render()}catch{failed=true;stop();options.onError?.();return}
    if(elapsed>0){frames++;reportTime+=elapsed;if(reportTime>=1){fps=Math.round(frames/reportTime);frames=0;reportTime=0}}
    if(time-lastReport>.22){lastReport=time;report()}
    schedule()
  }
  function resize(){if(disposed)return;const w=Math.max(1,canvas.clientWidth),h=Math.max(1,canvas.clientHeight);renderer.setSize(w,h,false);composer?.setSize(w,h);camera.aspect=w/h;camera.fov=w<h?62:53;camera.updateProjectionMatrix();if(paused)render();schedule()}
  const resizeObserver=new ResizeObserver(resize);resizeObserver.observe(canvas)
  const visibility=()=>{if(document.hidden){input={x:0,z:0,run:false};stop()}else schedule()}
  const contextLost=(e:Event)=>{e.preventDefault();failed=true;stop();options.onError?.()}
  document.addEventListener('visibilitychange',visibility);canvas.addEventListener('webglcontextlost',contextLost)
  function reset(){traversal.teleport(SPAWN as [number,number,number]);input={x:0,z:0,run:false};guiding=false;guideNotice=undefined;heading=0;velocity=0;report()}
  resize()
  return {
    setPaused(value){paused=value;if(value){input={x:0,z:0,run:false};stop()}else schedule()},
    setExploring(value){exploring=value;input={x:0,z:0,run:false};if(!value){guiding=false;reset()}report()},
    setInput(x,z,run=false){input={x:T.MathUtils.clamp(x,-1,1),z:T.MathUtils.clamp(z,-1,1),run};if(x||z){guiding=false;guideNotice=undefined}},
    look(dx,dy){if(!exploring)return;yaw-=T.MathUtils.clamp(dx,-100,100)*.004;pitch=T.MathUtils.clamp(pitch+dy*.003,-.06,.9)},
    setPointer(x,y){targetPointerX=T.MathUtils.clamp(x,-1,1);targetPointerY=T.MathUtils.clamp(y,-1,1)},
    guide(returning=false){
      input={x:0,z:0,run:false};exploring=true
      const nextRoute=buildGuideRoute(traversal.position,returning)
      guideNotice=nextRoute===null?'return-to-start':undefined
      route=nextRoute??[];routeIndex=0;guiding=route.length>0;report()
    },
    reset,
    dispose(){if(disposed)return;disposed=true;stop();resizeObserver.disconnect();document.removeEventListener('visibilitychange',visibility);canvas.removeEventListener('webglcontextlost',contextLost);traversal.dispose();explorer.dispose();dressing.dispose();environment.dispose();ao?.dispose();output?.dispose();composer?.dispose();sun.shadow.map?.dispose();renderer.renderLists.dispose();renderer.dispose();scene.environment=null;scene.clear()},
  }
}
