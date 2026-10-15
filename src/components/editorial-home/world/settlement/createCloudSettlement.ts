import * as T from 'three'
import {createCloudRoomLights} from './cloudRoomLights.mjs'
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js'
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js'
import {GTAOPass} from 'three/addons/postprocessing/GTAOPass.js'
import {OutputPass} from 'three/addons/postprocessing/OutputPass.js'
import {SMAAPass} from 'three/addons/postprocessing/SMAAPass.js'
import {createCloudEnvironment,createCloudExplorer} from './cloudAssets'
import {createTraversal} from './physics.mjs'
import {createCloudGuideNavigation,cloudGuideDestinations,cloudLocationAt,type CloudDestination} from './cloudLayout.mjs'
import {CLOUD_INTRO_SECONDS,createCloudCameraPath,createIslandOverview} from './cloudCamera.mjs'
import {sampleCloudWeather,type CloudWeatherPhase,type CloudWeatherState} from './cloudWeather.mjs'
import {createCloudAtmosphere} from './cloudAtmosphere'
import {CLOUD_ROBOT_PROFILE,CLOUD_CHARACTER_PROFILES,type CloudCharacterKind} from './cloudCharacterProfile.mjs'
import {createEntranceSelection} from './cloudEntranceSelection.mjs'
import {sampleCloudPresence} from './cloudPresence.mjs'
import {createCloudFollowCamera} from './cloudFollowCamera.mjs'
import {cloudBridgeCameraLift} from './cloudGuideFraming.mjs'
import {cloudPosterSize,isCloudPosterCapture,cloudReviewCamera,cloudReviewTime} from './cloudPosterCapture.mjs'
import {sampleCloudLightRig} from './cloudLighting.mjs'
import {cloudRenderQuality} from './cloudRenderQuality.mjs'
import {createCloudMotionReview,isCloudMotionReview} from './cloudMotionReview.mjs'
import {isCloudAcademyStudy,cloudAcademyInterior,cloudAcademyTravel} from './cloudAcademyStudy.mjs'
import {createCloudAcademyArt} from './cloudAcademyArt'

export type CloudPhase='hero'|'reveal'|'explore'
export type CloudPosterFrame={dataUrl:string;width:number;height:number;assetRevision:string;characterRevision:string;time:number;review?:import('./cloudPosterCapture.mjs').CloudReviewView}
export type SettlementState={phase:CloudPhase;introProgress:number;assetRevision:string;characterRevision:string;characterKind:CloudCharacterKind;characterLoading:boolean;characterError:boolean;restAmount?:number;weather:CloudWeatherPhase;weatherTime:number;location:string;destinations?:CloudDestination[];arrivedDestination?:CloudDestination;doorstepDestinations?:CloudDestination[];guiding:boolean;guideNotice?:'return-to-start'|'path-blocked';position:{x:number;y:number;z:number};grounded:boolean;fps:number;drawCalls:number;triangles:number}
export type SettlementAPI={startMotionReview():boolean;captureMotionReview():string|null;capturePoster():CloudPosterFrame;setPaused(value:boolean):void;setExploring(value:boolean):void;selectCharacter(kind:CloudCharacterKind):Promise<boolean>;skipIntro():void;setWeatherPreview(value?:CloudWeatherPhase):void;look(dx:number,dy:number):void;setPointer(x:number,y:number):void;guide(returning?:boolean,destination?:CloudDestination):void;cancelGuide():void;reset():void;dispose():void}

/** The full island reveal and traversal share the same real scene and character. */
export async function createCloudSettlement(canvas:HTMLCanvasElement,options:{onState?:(s:SettlementState)=>void;onError?:()=>void}={}):Promise<SettlementAPI>{
  const posterCapture=isCloudPosterCapture(window.location.hostname,window.location.search)
  const reviewCamera=cloudReviewCamera(window.location.hostname,window.location.search)
  const academyReview=reviewCamera?.name.startsWith('a-')??false
  const reviewSampleTime=academyReview?cloudReviewTime(window.location.hostname,window.location.search):0
  const academyStudy=isCloudAcademyStudy(window.location.hostname,window.location.search)
  // The authoring export is a desktop frame even when its control panel is narrow.
  const mobile=!posterCapture&&window.matchMedia('(max-width:760px),(pointer:coarse)').matches
  const reducedMotion=window.matchMedia('(prefers-reduced-motion:reduce)').matches
  let character=CLOUD_ROBOT_PROFILE,cameraProfile=character.camera,characterLoading=false,characterError=false
  const renderer=new T.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'})
  const quality=cloudRenderQuality(window.location.hostname,window.location.search,devicePixelRatio)
  const motionReview=createCloudMotionReview(isCloudMotionReview(window.location.hostname,window.location.search))
  renderer.setPixelRatio(quality.pixelRatio);renderer.outputColorSpace=T.SRGBColorSpace
  renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=.95
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFShadowMap
  renderer.shadowMap.autoUpdate=false
  const scene=new T.Scene();scene.fog=new T.Fog('#c5d4d0',90,235)
  const camera=new T.PerspectiveCamera(53,1,.075,420)
  const hemisphere=new T.HemisphereLight('#dfeaf0','#626a43',1.25);scene.add(hemisphere)
  const fill=new T.DirectionalLight('#d3e6ee',.35);fill.position.set(18,12,8);scene.add(fill)
  const sun=new T.DirectionalLight('#ffe7bc',2.75);sun.position.set(-18,30,20);sun.castShadow=true
  sun.name='Cloud sun key';fill.name='Cloud cool fill';hemisphere.name='Cloud sky bounce'
  sun.shadow.mapSize.set(2048,2048)
  sun.shadow.radius=2.25
  Object.assign(sun.shadow.camera,{left:-20,right:20,top:20,bottom:-20,near:1,far:85})
  sun.shadow.bias=-.00025;sun.shadow.normalBias=.035;sun.target.position.set(0,0,-2);scene.add(sun,sun.target)
  const loaded=await Promise.allSettled([createCloudEnvironment(scene,false),createCloudExplorer(false,'robot')])
  if(loaded[0].status==='rejected'||loaded[1].status==='rejected'){
    for(const item of loaded)if(item.status==='fulfilled')item.value.dispose()
    renderer.dispose();scene.clear();throw loaded.find((item):item is PromiseRejectedResult=>item.status==='rejected')!.reason
  }
  const environment=loaded[0].value,layout=environment.layout
  const navigation=createCloudGuideNavigation(layout),planGuide=navigation.route
  // The reviewed candidate carries its material treatment with its exact asset.
  // Diagnostic query overrides remain loopback-only; older public assets are unchanged.
  const authoredWallTreatment=['47b607f3ca4ea50381e70ff70300006166963308ba035965b6cc888810c25f84',
    'c2ce5e8b5319429f14abb63a8911150b1035dd44c0177a09617fa2c14b80a30d'].includes(layout.assetSha256??'')?'clean':null
  const wallReview=window.location.hostname==='127.0.0.1'
    ?new URLSearchParams(window.location.search).get('wall-review')??authoredWallTreatment??(
      ['f28ef8e41656f894565005f4bc193ad70478cefea0ea2ca62f69f86a42e8f073',
       '6bc48ee0f31261ddbc6e9bfcdd4963e82ccebc77fdcb7851c69249b4533929e2',
       'bbdbf09f67f914a1a223fb72624ec23b1a351ef89526436a92ecdf35bda7518b',
       '44893f1f076da97b1f1e78275f3d1125957156417d28455ebcb2640d9d66c734'].includes(layout.assetSha256??'')?'clean':null
    ):authoredWallTreatment
  if(wallReview==='no-shadow')sun.castShadow=false
  if(wallReview==='balanced'){sun.shadow.bias=-.0006;sun.shadow.normalBias=.06}
  if(wallReview==='front-shadow'||wallReview==='clean')scene.traverse(object=>{
    if(!(object instanceof T.Mesh))return
    for(const material of Array.isArray(object.material)?object.material:[object.material]){
      if(material instanceof T.MeshStandardMaterial&&/limestone/i.test(material.name)){
        material.shadowSide=T.FrontSide;material.needsUpdate=true
      }
    }
  })
  if(wallReview==='no-normal'||wallReview==='no-texture')scene.traverse(object=>{
    if(!(object instanceof T.Mesh))return
    for(const material of Array.isArray(object.material)?object.material:[object.material]){
      if(material instanceof T.MeshStandardMaterial&&/limestone/i.test(material.name)){
        material.normalScale.set(0,0)
        if(wallReview==='no-texture'){material.map=null;material.normalMap=null;material.needsUpdate=true}
      }
    }
  })
  let explorer=loaded[1].value
  scene.add(explorer.root)
  const studio=layout.locations.find(place=>place.id==='agentic')!
  const bridge=layout.locations.find(place=>place.id==='bridge')
  const destinations=cloudGuideDestinations(layout)
  const doorstepDestinations=destinations.filter(id=>id==='entertainment'&&layout.guideAccess?.entertainment==='doorstep')
  const interiorDestinations=destinations.filter(id=>layout.locations.some(place=>place.id===id&&place.open!==false))
  // One short-range, shadowless light per authored open room. Old layouts keep
  // their original studio fixture; no global glow, beam or extra shadow passes.
  const authoredLights=layout.lights??[{id:'agentic-pendant',type:'warm-interior' as const,
    position:[studio.center[0],studio.center[1]+.8,studio.center[2]-.25] as [number,number,number],color:'#ffe1ae'}]
  const roomLights=createCloudRoomLights(scene,authoredLights,interiorDestinations)
  let traversal:Awaited<ReturnType<typeof createTraversal>>
  try{traversal=await createTraversal({colliders:layout.colliders,surfaces:layout.surfaces,spawn:layout.spawn,character})}
  catch(error){roomLights.dispose();explorer.dispose();environment.dispose();renderer.dispose();scene.clear();throw error}
  explorer.root.position.set(...layout.spawn)
  if('setGroundSampler' in explorer)explorer.setGroundSampler(traversal.sampleGround)
  if('setResting' in explorer)explorer.setResting(true,true)
  let composer:EffectComposer|null=null,atmosphere:ReturnType<typeof createCloudAtmosphere>|undefined
  let ao:GTAOPass|undefined,output:OutputPass|undefined,smaa:SMAAPass|undefined
  try{
    composer=new EffectComposer(renderer)
    if(quality.samples){composer.renderTarget1.samples=quality.samples;composer.renderTarget2.samples=quality.samples}
    if(composer){
      composer.addPass(new RenderPass(scene,camera));ao=new GTAOPass(scene,camera,1,1)
      ao.updateGtaoMaterial({radius:.7,thickness:.45,distanceFallOff:.75,samples:8,scale:.9});ao.blendIntensity=.75
      composer.addPass(ao)
      // Both reviewed Garden21 shells retain authored shadows and materials;
      // full-resolution GTAO added a frame without fixed-view benefit on r54.
      // Keep earlier assets unchanged and preserve the local AO override.
      const reviewedGardenWithoutGtao=['93704b7377e7bf41324d678678e41cf1252568380138624e96abaa45ffbd4c8f',
        'd02c2f29a45a2517cdf7f3cb77a30d9669f261fa958e4a7d9800d1095240d7ec',
        '43721ec9d54fd73385ffe6e86581ddb1ae266f224d862c2c0de1a97bbb8c4f86'].includes(layout.assetSha256??'')
      if(wallReview==='no-ao'||reviewedGardenWithoutGtao&&wallReview!=='ao')ao.enabled=false
      if(wallReview==='balanced'){
        ao.updateGtaoMaterial({radius:.45,thickness:.08,distanceFallOff:.75,samples:16,scale:1})
        ao.blendIntensity=.5
      }
      if(wallReview==='clean'){
        ao.updateGtaoMaterial({radius:.45,thickness:.08,distanceFallOff:.75,samples:8,scale:1})
        ao.blendIntensity=.5
      }
      if(quality.aa==='smaa'){smaa=new SMAAPass();composer.addPass(smaa)}
      output=new OutputPass();composer.addPass(output)
    }
    atmosphere=createCloudAtmosphere(scene,{mobile:false,skyTexture:environment.skyTexture})
  }catch(error){
    roomLights.dispose();atmosphere?.dispose();smaa?.dispose();ao?.dispose();output?.dispose();composer?.dispose();traversal.dispose();explorer.dispose();environment.dispose();sun.shadow.map?.dispose();renderer.dispose();scene.clear();throw error
  }
  renderer.info.autoReset=false
  const academyArt=academyStudy?createCloudAcademyArt(environment.root,scene):undefined
  function render(){
    renderer.info.reset()
    // Wind, characters and light have already advanced for this frame. Refresh
    // its shadow once; the colour and AO passes then share the same exact map.
    // Paused refreshes and poster captures use this entry point as well.
    renderer.shadowMap.needsUpdate=true
    if(composer)composer.render();else renderer.render(scene,camera)
  }
  let disposed=false,failed=false,paused=posterCapture,frameID=0,lastTime=0,time=reviewSampleTime,lastReport=0,frames=0,reportTime=0,fps=0
  let phase:CloudPhase='hero',introTime=0,introProgress=0
  const weatherSeed=reviewCamera?0:Math.floor(Date.now()/86400000)
  let weatherPreview:CloudWeatherPhase|undefined=reviewCamera&&!academyReview?'day':undefined,weather=sampleCloudWeather(time,{seed:weatherSeed})
  let weatherBlend:{from:CloudWeatherState;started:number}|undefined
  const daySun=new T.Color('#ffe7bc'),nightSun=new T.Color('#9bbbef'),dawnSun=new T.Color('#f3b786'),duskSun=new T.Color('#eca070')
  const daySky=new T.Color('#dfeaf0'),dawnSky=new T.Color('#e5c4b0'),duskSky=new T.Color('#bab3d2')
  const dayFog=new T.Color('#c5d4d0'),nightFog=new T.Color('#344258'),dawnFog=new T.Color('#c6b7a4'),duskFog=new T.Color('#9b8c9f')
  const groundDay=new T.Color('#626a43'),groundNight=new T.Color('#353c45'),lampDay=new T.Color('#ffe1ae'),lampNight=new T.Color('#ffd3a0')
  function updateWeather(){
    const next=sampleCloudWeather(time,{seed:weatherSeed,preview:weatherPreview})
    weather={...next}
    if(weatherBlend){
      const blend=T.MathUtils.smoothstep(time-weatherBlend.started,0,3)
      for(const key of ['daylight','sunrise','sunset','stars','wind','cloudCover','haze'] as const)weather[key]=T.MathUtils.lerp(weatherBlend.from[key],next[key],blend)
      if(blend>=1)weatherBlend=undefined
    }
    // Cloud cover only softens sunlight a little: no storm, sudden dimming,
    // moving spotlight or extra shadow pass. The existing sun moves slowly.
    const rig=sampleCloudLightRig(weather,time)
    sun.intensity=rig.sun
    sun.color.copy(nightSun).lerp(daySun,weather.daylight).lerp(dawnSun,weather.sunrise*.72).lerp(duskSun,weather.sunset*.68)
    sun.position.fromArray(rig.position)
    hemisphere.intensity=rig.hemisphere
    hemisphere.color.copy(nightSun).lerp(daySky,weather.daylight).lerp(dawnSky,weather.sunrise*.25).lerp(duskSky,weather.sunset*.3)
    hemisphere.groundColor.copy(groundNight).lerp(groundDay,weather.daylight)
    fill.intensity=rig.fill
    scene.environmentIntensity=rig.environment
    // The same quiet daylight cycle reaches every furnished space.
    roomLights.update(weather.daylight)
    const fog=scene.fog as T.Fog
    fog.color.copy(nightFog).lerp(dayFog,weather.daylight).lerp(dawnFog,weather.sunrise*.34).lerp(duskFog,weather.sunset*.34)
    fog.near=T.MathUtils.lerp(92,65,weather.haze);fog.far=T.MathUtils.lerp(245,195,weather.haze)
    atmosphere?.update(time,weather,camera.position)
    environment.update(time,weather.wind)
    academyArt?.update(camera.position,weather.daylight)
  }
  let yaw=cameraProfile.yaw,pitch=cameraProfile.pitch,targetPointerX=0,targetPointerY=0,pointerX=0,pointerY=0,heading=0,velocity=0
  let route:number[][]=[],routeIndex=0,guiding=false,grounded=false,blockedTime=0
  let idleTime=0,lastManual=-Infinity
  let followHeight=layout.spawn[1],followAhead=0
  const followCamera=createCloudFollowCamera(environment.cameraDistance)
  let guideNotice:SettlementState['guideNotice']
  const heroPosition=new T.Vector3(),heroTarget=new T.Vector3(),target=new T.Vector3(),desired=new T.Vector3(),smoothTarget=new T.Vector3(),oldPos=new T.Vector3()
  let introPath:ReturnType<typeof createCloudCameraPath>
  function configureCamera(preserveActivePath=false){
    const source=createIslandOverview({center:environment.sphere.center.toArray(),halfExtents:environment.bounds.getSize(new T.Vector3()).multiplyScalar(.5).toArray(),aspect:camera.aspect,fov:camera.fov})
    heroPosition.fromArray(source.position);heroTarget.fromArray(source.target)
    if(!preserveActivePath)introPath=createCloudCameraPath({heroPosition:heroPosition.toArray(),heroTarget:heroTarget.toArray(),spawn:layout.spawn,mobile,cameraProfile})
  }
  function report(){
    // Arrival is a guide endpoint, never an assertion that a closed room is open.
    // Reuse the resident's prepared graph rather than re-scanning terrain per frame.
    const arrivedDestination=phase==='explore'&&!guiding?destinations.find(id=>navigation.arrived(traversal.position,id)):undefined
    options.onState?.({phase,introProgress,assetRevision:layout.assetSha256!,characterRevision:explorer.assetSha256,characterKind:character.kind,characterLoading,characterError,restAmount:'inspectGrounding' in explorer?explorer.inspectGrounding().restAmount:0,weather:weather.phase,weatherTime:time,location:cloudLocationAt(layout,traversal.position),destinations,arrivedDestination,doorstepDestinations,guiding,guideNotice,position:traversal.position,grounded,fps,drawCalls:renderer.info.render.calls,triangles:renderer.info.render.triangles})
  }
  function stop(){cancelAnimationFrame(frameID);frameID=0;lastTime=0;frames=0;reportTime=0}
  function schedule(){if(!disposed&&!paused&&!failed&&!document.hidden&&!frameID)frameID=requestAnimationFrame(frame)}
  function clearMovement(){guiding=false;blockedTime=0}
  function refreshPausedView(){
    if(!paused||disposed||failed)return
    if(reviewCamera){camera.position.fromArray(reviewCamera.position);smoothTarget.fromArray(reviewCamera.target)}
    try{camera.lookAt(smoothTarget);updateWeather();render()}catch{failed=true;stop();options.onError?.()}
  }
  function finishIntro(){
    followCamera.reset()
    phase='explore';introProgress=1;clearMovement();yaw=cameraProfile.yaw;pitch=cameraProfile.pitch
    followHeight=traversal.position.y;followAhead=0
    const pose=introPath.sample(1);camera.position.fromArray(pose.position);smoothTarget.fromArray(pose.target);refreshPausedView();report()
  }
  function reset(){
    followCamera.reset()
    idleTime=0;lastManual=-Infinity
    followHeight=layout.spawn[1];followAhead=0
    traversal.teleport(layout.spawn);clearMovement();guideNotice=undefined;heading=0;velocity=0;explorer.root.position.set(...layout.spawn);explorer.root.rotation.y=0;explorer.root.visible=true
    if('resetPose' in explorer)explorer.resetPose()
    if('setResting' in explorer)explorer.setResting(true,true)
    if(phase==='explore'){camera.position.fromArray(introPath.shoulder);smoothTarget.set(layout.spawn[0],layout.spawn[1]+cameraProfile.targetHeight,layout.spawn[2]);yaw=cameraProfile.yaw;pitch=cameraProfile.pitch}
    refreshPausedView();report()
  }
  const selection=createEntranceSelection({
    allowedKinds:['robot'],
    phase:()=>phase,
    async prepare(kind){
      const profile=CLOUD_CHARACTER_PROFILES[kind]
      const results=await Promise.allSettled([createCloudExplorer(false,kind),createTraversal({colliders:layout.colliders,surfaces:layout.surfaces,spawn:layout.spawn,character:profile})])
      if(results[0].status==='rejected'||results[1].status==='rejected'){
        for(const result of results)if(result.status==='fulfilled')result.value.dispose()
        throw new Error('Character could not be prepared')
      }
      const actor=results[0].value,body=results[1].value
      try{
        if('setGroundSampler' in actor)actor.setGroundSampler(body.sampleGround)
        if('setResting' in actor)actor.setResting(true,true)
      }catch(error){actor.dispose();body.dispose();throw error}
      return {actor,body,profile,dispose(){actor.dispose();body.dispose()}}
    },
    commit(candidate){
      const oldActor=explorer,oldBody=traversal
      explorer=candidate.actor;traversal=candidate.body;character=candidate.profile;cameraProfile=character.camera
      scene.add(explorer.root);configureCamera();reset();oldActor.dispose();oldBody.dispose()
    },
    onBusy(value){characterLoading=value;if(value)characterError=false;report()},
    onError(){characterError=true;report()},
  })
  function frame(now:number){
    try{advanceFrame(now)}catch{failed=true;stop();options.onError?.()}
  }
  function advanceFrame(now:number){
    frameID=0;if(disposed||paused||failed||document.hidden)return
    const updateStarted=motionReview.active?performance.now():0
    const elapsed=lastTime?Math.max(0,(now-lastTime)/1000):0,dt=lastTime?Math.min(elapsed,.06):1/60
    lastTime=now;time+=dt
    const p=traversal.position;oldPos.set(p.x,p.y,p.z)
    // Translation belongs exclusively to the authored guide. Looking around
    // never changes the world-space route or creates manual movement intent.
    let ix=0,iz=0
    if('setResting' in explorer)explorer.setResting(!guiding&&velocity<.035)
    const readyToWalk=!('isReadyToWalk' in explorer)||explorer.isReadyToWalk()
    if(guiding&&phase==='explore'&&readyToWalk&&!characterLoading){
      // Consuming a reached node is bookkeeping, not a stop command. Continue
      // toward the next authored node in this frame; only final arrival stops.
      // Physical turning/collision remain authoritative and the route is unchanged.
      while(routeIndex<route.length&&Math.hypot(route[routeIndex][0]-p.x,route[routeIndex][1]-p.z)<.17){routeIndex++;blockedTime=0}
      if(routeIndex>=route.length){guiding=false;report()}
      else{
        const waypoint=route[routeIndex],dx=waypoint[0]-p.x,dz=waypoint[1]-p.z,length=Math.hypot(dx,dz)
        const pace=academyStudy?cloudAcademyTravel(p.x,p.z):1
        ix=dx/length*.64*pace;iz=dz/length*.64*pace
      }
    }
    const previousHeading=heading
    let intendedHeading=heading
    if(Math.hypot(ix,iz)>.001){
      const next=Math.atan2(-ix,-iz)
      intendedHeading+=Math.atan2(Math.sin(next-heading),Math.cos(next-heading))*Math.min(1,dt*10)
    }
    const physicsStarted=motionReview.active?performance.now():0
    const result=traversal.step(dt,{x:ix,z:iz,run:false,heading:intendedHeading});grounded=result.grounded
    const cpuPhysicsMs=motionReview.active?performance.now()-physicsStarted:0
    heading=result.heading
    if(result.position.y<environment.bounds.min.y-3||!Number.isFinite(result.position.y))reset()
    const np=traversal.position;explorer.root.position.set(np.x,np.y,np.z)
    const moveDistance=Math.hypot(np.x-oldPos.x,np.z-oldPos.z)
    if(guiding&&Math.hypot(ix,iz)>.1){
      blockedTime=moveDistance<dt*.12?blockedTime+dt:0
      if(blockedTime>2){guiding=false;guideNotice='path-blocked';report()}
    }
    velocity=T.MathUtils.damp(velocity,Math.min(character.runSpeed,moveDistance/Math.max(dt,.001)),10,dt)
    idleTime=phase==='explore'&&!guiding&&velocity<.035?idleTime+dt:0
    const presence=sampleCloudPresence(idleTime,{x:np.x,z:np.z,heading,manualSeconds:time-lastManual,reducedMotion})
    if('setAttention' in explorer)explorer.setAttention(presence)
    explorer.root.rotation.y=heading;explorer.update(dt,{speed:velocity,grounded,turn:(heading-previousHeading)/Math.max(dt,.001)})
    pointerX=T.MathUtils.damp(pointerX,targetPointerX,3,dt);pointerY=T.MathUtils.damp(pointerY,targetPointerY,3,dt)
    if(phase==='reveal'){
      introTime+=dt;introProgress=Math.min(1,introTime/CLOUD_INTRO_SECONDS)
      const pose=introPath.sample(introProgress);camera.position.fromArray(pose.position);smoothTarget.fromArray(pose.target)
      explorer.root.visible=true
      if(introProgress>=1)finishIntro()
    }else if(phase==='explore'){
      if(guiding&&time-lastManual>12&&!reducedMotion){
        // Guided travel is a staged shot, not a free-play chase camera. Keep
        // the courtyard-facing axis on both legs: following the actor's 180°
        // return turn would sweep the boom through the bridge handrail.
        const angle=cameraProfile.yaw-yaw
        yaw+=Math.atan2(Math.sin(angle),Math.cos(angle))*(1-Math.exp(-dt*.65))
      }
      // The physical body follows every paving/step contact; the camera floats
      // above those small height changes instead of inheriting the footfall.
      followHeight=T.MathUtils.damp(followHeight,np.y,5,dt)
      followAhead=T.MathUtils.damp(followAhead,guiding?Math.min(.35,velocity*.23):0,3,dt)
      target.set(np.x-Math.sin(heading)*followAhead,followHeight+cameraProfile.targetHeight,np.z-Math.cos(heading)*followAhead)
      const inside=academyStudy?cloudAcademyInterior(np.x,np.z):0
      const distance=T.MathUtils.lerp(mobile?cameraProfile.distanceMobile:cameraProfile.distanceDesktop,1.55,inside)+presence.cameraDolly*(1-inside)
      const framingYaw=yaw+presence.cameraYaw*(1-inside)
      // At the threshold let the room, not the robot's back, occupy the frame.
      // The existing collision-aware spring still owns every camera movement.
      target.x-=inside*.25;target.y+=inside*.45;target.z-=inside*.85
      desired.set(np.x+Math.sin(framingYaw)*distance,followHeight+cameraProfile.baseHeight+Math.sin(pitch)*distance,np.z+Math.cos(framingYaw)*distance)
      desired.x+=inside*.70;desired.y+=inside*.40
      desired.y+=cloudBridgeCameraLift(np,bridge)
      followCamera.update(camera.position,smoothTarget,target,desired,dt)
      explorer.root.visible=camera.position.distanceTo(target)>.7
    }else{
      desired.copy(heroPosition);desired.x+=pointerX*.22;desired.y-=pointerY*.1
      camera.position.lerp(desired,1-Math.exp(-dt*2));smoothTarget.lerp(heroTarget,1-Math.exp(-dt*2));explorer.root.visible=true
    }
    camera.lookAt(smoothTarget);updateWeather()
    const reviewStarted=motionReview.active?performance.now():0
    try{render()}catch{failed=true;stop();options.onError?.();return}
    if(motionReview.active)motionReview.record({elapsedMs:elapsed*1000,cpuSubmitMs:performance.now()-reviewStarted,cpuUpdateMs:reviewStarted-updateStarted,cpuPhysicsMs,time,phase,guiding,
      camera:camera.position.toArray(),focus:smoothTarget.toArray(),actor:[np.x,np.y,np.z],heading})
    if(elapsed>0){frames++;reportTime+=elapsed;if(reportTime>=1){fps=Math.round(frames/reportTime);frames=0;reportTime=0}}
    if(time-lastReport>.2){lastReport=time;report()}
    schedule()
  }
  function resize(){
    if(disposed)return
    const w=Math.max(1,canvas.clientWidth),h=Math.max(1,canvas.clientHeight)
    // Reframe an idle overview, but never replace the active shot under the
    // viewer during rotation/resizing. The existing world-space path stays safe
    // and continuous; the new overview is used the next time the hero is shown.
    renderer.setSize(w,h,false);composer?.setSize(w,h);camera.aspect=w/h;camera.fov=w<h?58:53;camera.updateProjectionMatrix();configureCamera(phase==='reveal')
    if(phase==='hero'){camera.position.copy(heroPosition);smoothTarget.copy(heroTarget)}
    if(reviewCamera){camera.fov=reviewCamera.fov;camera.updateProjectionMatrix();camera.position.fromArray(reviewCamera.position);smoothTarget.fromArray(reviewCamera.target)}
    if(phase==='reveal'){const pose=introPath.sample(introProgress);camera.position.fromArray(pose.position);smoothTarget.fromArray(pose.target)}
    camera.lookAt(smoothTarget);refreshPausedView();schedule()
  }
  const resizeObserver=new ResizeObserver(resize);resizeObserver.observe(canvas)
  const visibility=()=>{if(document.hidden)stop();else schedule()}
  const contextLost=(e:Event)=>{e.preventDefault();failed=true;stop();options.onError?.()}
  document.addEventListener('visibilitychange',visibility);canvas.addEventListener('webglcontextlost',contextLost)
  resize();report()
  return {
    startMotionReview(){return motionReview.start()},
    captureMotionReview(){
      const review=motionReview.finish();if(!review)return null
      return JSON.stringify({version:1,assetRevision:layout.assetSha256,characterRevision:explorer.assetSha256,quality,
        viewport:[canvas.clientWidth,canvas.clientHeight],drawing:[canvas.width,canvas.height],weather:weather.phase,
        resources:{geometries:renderer.info.memory.geometries,textures:renderer.info.memory.textures,programs:renderer.info.programs?.length??0,
          drawCalls:renderer.info.render.calls,renderedTriangles:renderer.info.render.triangles,measurement:'renderer object counts; not GPU bytes'},
        timing:'elapsedMs is rendered-frame callback interval; cpuSubmitMs is CPU submission, not GPU time; pause gaps excluded by scheduler',...review})
    },
    capturePoster(){
      if(!posterCapture||disposed||failed||phase!=='hero')throw new Error('Open the local frozen poster view first')
      const pixelRatio=renderer.getPixelRatio(),{width,height}=reviewCamera??cloudPosterSize(window.location.hostname,window.location.search)
      try{
        renderer.setPixelRatio(1);renderer.setSize(width,height,false);composer?.setPixelRatio(1);composer?.setSize(width,height)
        camera.aspect=width/height;camera.fov=width<height?58:53;camera.updateProjectionMatrix();configureCamera()
        camera.position.copy(heroPosition);smoothTarget.copy(heroTarget);camera.lookAt(smoothTarget)
        if(reviewCamera){camera.fov=reviewCamera.fov;camera.updateProjectionMatrix();camera.position.fromArray(reviewCamera.position);smoothTarget.fromArray(reviewCamera.target);camera.lookAt(smoothTarget)}
        updateWeather();render()
        return {dataUrl:canvas.toDataURL('image/png'),width,height,assetRevision:layout.assetSha256!,characterRevision:explorer.assetSha256,time,...(reviewCamera?{review:reviewCamera.name}:{})}
      }finally{
        renderer.setPixelRatio(pixelRatio);composer?.setPixelRatio(pixelRatio);resize()
      }
    },
    setPaused(value){paused=posterCapture||value;if(paused)stop();else schedule()},
    setExploring(value){
      if(posterCapture&&value)return
      clearMovement()
      if(!value){selection.cancel();phase='hero';introTime=introProgress=0;camera.position.copy(heroPosition);smoothTarget.copy(heroTarget);reset()}
      else if(phase==='hero'){
        if(reducedMotion)finishIntro()
        else{
          phase='reveal';introTime=introProgress=0
          // Continue the actual visible shot, including damped pointer parallax.
          // Rebuilding from the nominal overview introduces a small first-frame snap.
          introPath=createCloudCameraPath({heroPosition:camera.position.toArray(),heroTarget:smoothTarget.toArray(),spawn:layout.spawn,mobile,cameraProfile})
        }
      }
      report()
    },
    skipIntro(){if(phase==='reveal')finishIntro()},
    setWeatherPreview(value){
      if(reviewCamera)return
      if(disposed||failed||value!==undefined&&!['day','sunrise','sunset','night'].includes(value))return
      if(!['localhost','127.0.0.1','[::1]'].includes(window.location.hostname))return
      if(value===weatherPreview)return
      weatherBlend={from:{...weather},started:time};weatherPreview=value
      if(paused){weatherBlend=undefined;updateWeather();refreshPausedView();report()}
    },
    selectCharacter(kind){return selection.select(kind)},
    look(dx,dy){if(phase!=='explore'||paused||disposed||failed)return;lastManual=time;yaw-=T.MathUtils.clamp(dx,-100,100)*.004;pitch=T.MathUtils.clamp(pitch+dy*.003,-.06,.9)},
    setPointer(x,y){if(paused||disposed||failed)return;targetPointerX=T.MathUtils.clamp(x,-1,1);targetPointerY=T.MathUtils.clamp(y,-1,1)},
    guide(returning=false,destination='agentic'){
      if(phase!=='explore'||paused||disposed||failed||characterLoading)return
      const next=planGuide(traversal.position,returning,destination)
      guideNotice=next===null?'return-to-start':undefined;route=next??[];routeIndex=0;blockedTime=0;guiding=route.length>0;report()
    },
    cancelGuide(){if(disposed||failed)return;clearMovement();guideNotice=undefined;report()},
    reset,
    dispose(){
      if(disposed)return;disposed=true;selection.dispose();stop();resizeObserver.disconnect();document.removeEventListener('visibilitychange',visibility);canvas.removeEventListener('webglcontextlost',contextLost)
      roomLights.dispose();motionReview.dispose();traversal.dispose();atmosphere?.dispose();explorer.dispose();academyArt?.dispose();environment.dispose();smaa?.dispose();ao?.dispose();output?.dispose();composer?.dispose();sun.shadow.map?.dispose();renderer.renderLists.dispose();renderer.dispose();scene.environment=null;scene.clear()
    },
  }
}
