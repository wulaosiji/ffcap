'use client'

import Image from 'next/image'
import Link from 'next/link'
import {useCallback,useEffect,useLayoutEffect,useRef,useState} from 'react'
import {ArrowDown,ArrowRight,ArrowUpRight,Pause,Play,RotateCcw,X,Bot,Volume2,VolumeX} from 'lucide-react'
import {useLang} from '@/context/LangContext'
import {LINKS} from '@/content/editorial.mjs'
import type {SettlementAPI,SettlementState,CloudPosterFrame} from './world/settlement/createCloudSettlement'
import {isCloudPosterCapture,cloudReviewCamera} from './world/settlement/cloudPosterCapture.mjs'
import {isCloudMotionReview} from './world/settlement/cloudMotionReview.mjs'
import {createCloudSceneRecorder,type CloudSceneClip} from './world/settlement/cloudSceneRecorder.mjs'
import type {CloudWeatherPhase} from './world/settlement/cloudWeather.mjs'
import type {CloudDestination} from './world/settlement/cloudLayout.mjs'
import {createCloudMusic,type CloudMusic} from './world/settlement/cloudMusic.mjs'
import desktopPoster from '../../../public/world/blender/cloud-courtyard-v2-poster-desktop.jpg'
import mobilePoster from '../../../public/world/blender/cloud-courtyard-v2-poster-mobile.jpg'

const ROOMS={
  agentic:{name:{zh:'协作书院',en:'Agentic studio'},topic:'AGENTIC AI',description:{zh:'从感知、推理到行动，探索智能体如何进入真实工作。',en:'From perception and reasoning to action. Explore agents at work.'}},
  physical:{name:{zh:'机械工坊',en:'Physical workshop'},topic:'PHYSICAL AI',description:{zh:'让感知与行动连接，在真实环境中探索机器人与具身智能。',en:'Connect perception with action. Explore robotics and embodied intelligence in the physical world.'}},
  entertainment:{name:{zh:'云上剧场',en:'Cloud theatre'},topic:'ENTERTAINMENT AI',description:{zh:'从创作到互动叙事，想象人与 AI 共同创造的下一种体验。',en:'From creation to interactive stories. Imagine the next experience made by people and AI.'}},
} as const

export function SettlementHero(){
  const {lang}=useLang(),zh=lang==='zh'
  const host=useRef<HTMLElement>(null),canvas=useRef<HTMLCanvasElement>(null),entry=useRef<HTMLButtonElement>(null),engine=useRef<SettlementAPI|null>(null)
  const visible=useRef(true),pausedRef=useRef(false),drag=useRef<{id:number;x:number;y:number}|null>(null)
  const music=useRef<CloudMusic|null>(null),musicEnabled=useRef(false)
  const [musicOn,setMusicOn]=useState(false),[musicBusy,setMusicBusy]=useState(false),[musicError,setMusicError]=useState(false)
  const [ready,setReady]=useState(false),[failed,setFailed]=useState(false),[still,setStill]=useState<boolean|null>(null),[exploring,setExploring]=useState(false),[paused,setPaused]=useState(false)
  const [localPreview,setLocalPreview]=useState(false),[weatherPreview,setWeatherPreview]=useState<CloudWeatherPhase|''>('')
  const [posterMode,setPosterMode]=useState(false),[posterFrame,setPosterFrame]=useState<CloudPosterFrame|null>(null),[posterError,setPosterError]=useState(false)
  const [reviewMode,setReviewMode]=useState(false)
  const [motionReviewMode,setMotionReviewMode]=useState(false),[motionRecording,setMotionRecording]=useState(false),[motionData,setMotionData]=useState<string|null>(null)
  const videoRecorder=useRef<ReturnType<typeof createCloudSceneRecorder>|null>(null)
  const [sceneClip,setSceneClip]=useState<CloudSceneClip|null>(null)
  const [destination,setDestination]=useState<CloudDestination>('agentic')
  const [state,setState]=useState<SettlementState>({phase:'hero',introProgress:0,assetRevision:'',characterRevision:'',characterKind:'robot',characterLoading:false,characterError:false,weather:'day',weatherTime:0,location:'commons',guiding:false,position:{x:-3,y:0,z:8},grounded:true,fps:0,drawCalls:0,triangles:0})
  const syncPause=useCallback(()=>{
    engine.current?.setPaused(pausedRef.current||!visible.current||document.hidden)
    void music.current?.setAudible(musicEnabled.current&&visible.current&&!document.hidden).then(playing=>{
      if(musicEnabled.current&&visible.current&&!document.hidden&&!playing){musicEnabled.current=false;setMusicOn(false);setMusicError(true)}
    })
  },[])
  const clearInput=useCallback(()=>{drag.current=null},[])
  useEffect(()=>{
    const media=matchMedia('(prefers-reduced-motion:reduce)'),connection=(navigator as Navigator&{connection?:{saveData?:boolean}}).connection
    setStill(media.matches||!!connection?.saveData)
    setLocalPreview(['localhost','127.0.0.1','[::1]'].includes(location.hostname))
    setPosterMode(isCloudPosterCapture(location.hostname,location.search))
    setReviewMode(!!cloudReviewCamera(location.hostname,location.search))
    setMotionReviewMode(isCloudMotionReview(location.hostname,location.search))
    const update=(e:MediaQueryListEvent)=>{setStill(e.matches||!!connection?.saveData);if(e.matches)setExploring(false)};media.addEventListener('change',update);return()=>media.removeEventListener('change',update)
  },[])
  useEffect(()=>{
    if(still!==false){setReady(false);return}
    let cancelled=false,world:SettlementAPI|undefined
    setFailed(false)
    import('./world/settlement/createCloudSettlement').then(async({createCloudSettlement})=>{
      if(cancelled||!canvas.current)return
      const result=await createCloudSettlement(canvas.current,{onState:s=>{if(!cancelled)setState(s)},onError:()=>{if(!cancelled){world?.dispose();engine.current=null;setFailed(true);setReady(false);setExploring(false)}}})
      if(cancelled){result.dispose();return}world=result;engine.current=result;setReady(true);syncPause()
    }).catch(()=>{if(!cancelled){setFailed(true);setReady(false)}})
    return()=>{cancelled=true;world?.dispose();engine.current=null}
  },[still,syncPause])
  useEffect(()=>{
    const observer=new IntersectionObserver(([item])=>{visible.current=item.isIntersecting;if(!item.isIntersecting)clearInput();syncPause()},{threshold:.03})
    if(host.current)observer.observe(host.current)
    const hide=()=>{if(document.hidden)clearInput();syncPause()}
    document.addEventListener('visibilitychange',hide);window.addEventListener('blur',clearInput)
    return()=>{observer.disconnect();document.removeEventListener('visibilitychange',hide);window.removeEventListener('blur',clearInput)}
  },[syncPause,clearInput])
  useEffect(()=>{pausedRef.current=paused;syncPause()},[paused,syncPause])
  useEffect(()=>{
    if(!motionReviewMode||!ready||posterMode||!canvas.current)return
    const recorder=createCloudSceneRecorder(canvas.current,{hostname:location.hostname,search:location.search,onChange:setSceneClip})
    videoRecorder.current=recorder
    return()=>{recorder.dispose();videoRecorder.current=null}
  },[motionReviewMode,ready,posterMode])
  // Commit the engine phase before the browser paints the changed entry UI.
  useLayoutEffect(()=>{engine.current?.setExploring(exploring);clearInput()},[exploring,ready,clearInput])
  useEffect(()=>{engine.current?.setWeatherPreview(weatherPreview||undefined)},[weatherPreview,ready])
  useEffect(()=>{music.current?.setScene(state.weather,state.location==='agentic')},[state.weather,state.location])
  useEffect(()=>()=>{musicEnabled.current=false;music.current?.dispose();music.current=null},[])
  useEffect(()=>{if(failed||still){musicEnabled.current=false;setMusicOn(false);void music.current?.setAudible(false)}},[failed,still])
  async function toggleMusic(){
    setMusicBusy(true);setMusicError(false)
    const enabled=!musicEnabled.current;musicEnabled.current=enabled
    try{
      if(!music.current){
        const Audio=window.AudioContext||(window as Window&{webkitAudioContext?:typeof AudioContext}).webkitAudioContext
        if(!Audio)throw new Error('Audio unavailable')
        music.current=createCloudMusic(new Audio());music.current.setScene(state.weather,state.location==='agentic')
      }
      const playing=await music.current.setAudible(enabled&&visible.current&&!document.hidden)
      if(enabled&&!playing){musicEnabled.current=false;setMusicError(true)}
      setMusicOn(musicEnabled.current)
    }catch{musicEnabled.current=false;setMusicOn(false);setMusicError(true)}
    finally{setMusicBusy(false)}
  }
  function enter(){setPaused(false);setExploring(true);host.current?.scrollIntoView({block:'start',behavior:'instant'});host.current?.focus({preventScroll:true})}
  function resume(){setPaused(false);if(exploring)host.current?.focus({preventScroll:true})}
  function exit(){setExploring(false);clearInput();requestAnimationFrame(()=>entry.current?.focus({preventScroll:true}))}
  const destinations=state.destinations??['agentic']
  const selectedDestination=destinations.includes(destination)?destination:destinations[0]??'agentic'
  const atDestination=state.location===selectedDestination||state.arrivedDestination===selectedDestination
  const atDoorstep=!!state.arrivedDestination&&!!state.doorstepDestinations?.includes(state.arrivedDestination)
  function guide(){pausedRef.current=false;setPaused(false);syncPause();clearInput();engine.current?.guide(atDestination,selectedDestination);host.current?.focus({preventScroll:true})}
  function capturePoster(){
    try{setPosterError(false);const frame=engine.current?.capturePoster();if(frame)setPosterFrame(frame)}
    catch{setPosterError(true)}
  }
  const CharacterIcon=Bot
  const room=Object.prototype.hasOwnProperty.call(ROOMS,state.location)?ROOMS[state.location as CloudDestination]:undefined
  const place=room?.name[lang]??(atDoorstep&&state.arrivedDestination?`${ROOMS[state.arrivedDestination].name[lang]} · ${zh?'门前':'Doorstep'}`:state.location==='bridge'?(zh?'溪流上的桥':'The crossing'):(zh?'云上的聚落':'The cloud settlement'))
  return <section id="top" ref={host} tabIndex={-1} className={`ed-settlement ${ready&&!still?'ed-settlement-ready':''} ${exploring?'ed-settlement-playing':''}`} aria-label={zh?'非凡资本 · 云上的聚落':'UniqueCapital · The cloud settlement'}
    data-navigation="guided" data-phase={state.phase} data-character-kind={state.characterKind} data-character-loading={state.characterLoading} data-rest-amount={(state.restAmount??0).toFixed(3)} data-intro-progress={state.introProgress.toFixed(3)} data-asset-revision={state.assetRevision} data-character-revision={state.characterRevision} data-weather={state.weather} data-weather-time={state.weatherTime.toFixed(1)} data-location={state.location} data-guiding={state.guiding} data-destinations={destinations.join(',')} data-arrived-destination={state.arrivedDestination??''} data-doorstep-destinations={state.doorstepDestinations?.join(',')??''} data-position={`${state.position.x.toFixed(2)},${state.position.y.toFixed(2)},${state.position.z.toFixed(2)}`} data-fps={state.fps} data-draw-calls={state.drawCalls} data-triangles={state.triangles}
    onKeyDown={e=>{if(exploring&&e.key==='Escape'){exit();return}if(!exploring||e.target!==e.currentTarget)return;if(['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright','shift'].includes(e.key.toLowerCase()))e.preventDefault()}}
    onBlur={e=>{if(!e.currentTarget.contains(e.relatedTarget))clearInput()}}>
    <picture className="ed-settlement-poster-frame"><source media="(max-aspect-ratio: 1/1)" srcSet={mobilePoster.src}/><Image src={desktopPoster} className="ed-settlement-poster" alt="" fill loading="eager" sizes="100vw"/></picture>
    <canvas ref={canvas} className="ed-settlement-canvas" aria-hidden="true"
      onPointerDown={e=>{if(!exploring||state.phase!=='explore')return;e.currentTarget.setPointerCapture(e.pointerId);drag.current={id:e.pointerId,x:e.clientX,y:e.clientY};host.current?.focus({preventScroll:true})}}
      onPointerMove={e=>{const d=drag.current;if(d&&d.id===e.pointerId){engine.current?.look(e.clientX-d.x,e.clientY-d.y);drag.current={...d,x:e.clientX,y:e.clientY}}else if(!exploring&&e.pointerType==='mouse'){const r=e.currentTarget.getBoundingClientRect();engine.current?.setPointer((e.clientX-r.left)/r.width*2-1,(e.clientY-r.top)/r.height*2-1)}}}
      onPointerUp={()=>{drag.current=null}} onPointerCancel={()=>{drag.current=null}} onLostPointerCapture={()=>{drag.current=null}}/>
    <div className="ed-settlement-vignette"/>
    <h1 className="sr-only">{zh?'非凡资本：研究 AI 的下一步，连接构建者。':'UniqueCapital: Research what comes next. Connect the builders.'}</h1>
    <a className="ed-settlement-browse" href="#research" onClick={()=>{if(exploring)exit()}}>{zh?'浏览官网':'Browse the website'}<ArrowDown size={15}/></a>
    {exploring&&<div className="ed-settlement-playbar"><span>{place}</span><button onClick={exit} aria-label={zh?'退出探索':'Exit exploration'}><X size={21}/></button></div>}
    {!exploring?<div className="ed-settlement-intro"><p>{zh?'让想象，走进真实。':'A world for what comes next.'}</p>
      {posterMode&&ready?<p>首帧已冻结 · 仅本地制作</p>:ready&&!still&&!failed?<button ref={entry} className="ed-settlement-enter" onClick={enter}>{zh?'进入世界':'Enter the world'}<ArrowUpRight size={18}/></button>:<div className="ed-settlement-loading" role="status">{failed?(zh?'场景暂不可用，可继续浏览官网':'Scene unavailable. You can still browse the website.'):still?(zh?'已按设备偏好减少动态效果':'Motion reduced to respect your device preferences'):(zh?'正在准备聚落…':'Preparing the settlement…')}</div>}
      <small>{zh?'跟随云岛向导，走进云上的研究庭院。':'Follow your island guide into a courtyard above the clouds.'}</small>
    </div>:state.phase!=='explore'?<div className="ed-settlement-reveal">
      <p role="status">{zh?'云上，有一个共同构建的世界。':'Above the clouds. A world built together.'}</p>
      <button onClick={()=>{setPaused(false);engine.current?.skipIntro();host.current?.focus({preventScroll:true})}}>{zh?'跳过，开始探索':'Skip to exploration'}<ArrowUpRight size={16}/></button>
    </div>:<>
      {room&&<aside className="ed-settlement-room"><p>{room.topic}</p><h2>{room.name[lang]}</h2><p>{room.description[lang]}</p><Link href="/research">{zh?'查看相关研究':'Explore the research'}<ArrowRight size={15}/></Link></aside>}
      <div className="ed-settlement-help" role="status">{state.characterLoading?(zh?'正在准备角色，完成后从庭院入口开始…':'Preparing your character at the courtyard entrance…'):state.characterError?(zh?'角色暂未加载成功，请重试。当前角色已保留。':'Character could not load. Your current character is retained; please retry.'):state.guideNotice?(zh?'导览暂时中断，请回到起点重试':'Tour interrupted. Return to the start to retry'):state.guiding?(zh?'正在跟随向导 · 拖动视角，沿途看看':'Following the guide · Drag to look around'):atDoorstep?(zh?'房间暂未开放 · 可跟随向导返回庭院':'This room is closed · Follow the guide back to the courtyard'):(zh?'跟随向导参观 · 拖动场景调整视角':'Follow the guide · Drag to look around')}</div>
      <div className="ed-settlement-actions">
        {destinations.length>1&&<label className="ed-settlement-destination"><span className="sr-only">{zh?'探索目的地':'Explore a destination'}</span><select value={selectedDestination} aria-label={zh?'探索目的地':'Explore a destination'} onChange={e=>{clearInput();engine.current?.cancelGuide();setDestination(e.target.value as CloudDestination)}}>{destinations.map(id=><option key={id} value={id}>{ROOMS[id].name[lang]}{state.doorstepDestinations?.includes(id)?(zh?' · 门前':' · Doorstep'):''}</option>)}</select></label>}
        <button onClick={guide} disabled={state.characterLoading}><CharacterIcon size={16}/>{atDestination?(zh?'走回庭院':'Walk back'):(zh?'跟随向导':'Follow guide')}</button>{state.guideNotice&&<button onClick={()=>{engine.current?.reset();host.current?.focus({preventScroll:true})}} aria-label={zh?'回到起点':'Return to start'}><RotateCcw size={17}/></button>}
      </div>
    </>}
    <div className="ed-settlement-bottom"><div><span>{zh?'云上的聚落':'THE CLOUD SETTLEMENT'}</span><small>{zh?'非凡资本 · 构建者的共同世界':'UNIQUECAPITAL · A WORLD FOR BUILDERS'}</small></div><div className="ed-settlement-utilities">
      {ready&&!still&&!posterMode&&<>
        <button onClick={toggleMusic} disabled={musicBusy} aria-pressed={musicOn} aria-label={musicOn?(zh?'关闭场景音乐':'Turn music off'):(zh?'开启场景音乐':'Turn music on')} title={musicOn?(zh?'关闭场景音乐':'Turn music off'):(zh?'开启场景音乐':'Turn music on')}>{musicOn?<Volume2 size={16}/>:<VolumeX size={16}/>}</button>
        <button onClick={()=>{if(paused)resume();else setPaused(true)}} aria-label={paused?(zh?'继续画面':'Resume visuals'):(zh?'暂停画面':'Pause visuals')} title={paused?(zh?'继续画面':'Resume visuals'):(zh?'暂停画面':'Pause visuals')}>{paused?<Play size={16}/>:<Pause size={16}/>}</button>
      </>}
    </div></div>
    {musicError&&<p className="ed-settlement-audio-error" role="status">{zh?'音乐暂不可用，请再次点击音乐开关':'Music unavailable. Tap the music control to retry.'}</p>}
    {localPreview&&ready&&!still&&!exploring&&!posterMode&&<details className="ed-settlement-weather-preview"><summary>{zh?'天气预览':'Weather preview'}</summary><label>{zh?'仅本地预览':'Local preview only'}<select aria-label={zh?'选择预览天气':'Preview weather'} value={weatherPreview} onChange={e=>setWeatherPreview(e.target.value as CloudWeatherPhase|'')}>
      <option value="">{zh?'自然变化':'Natural cycle'}</option><option value="sunrise">{zh?'日出':'Sunrise'}</option><option value="day">{zh?'晴日':'Daylight'}</option><option value="sunset">{zh?'黄昏':'Dusk'}</option><option value="night">{zh?'入夜':'Nightfall'}</option>
    </select></label></details>}
    {posterMode&&ready&&<aside className="ed-settlement-poster-tools" aria-label="本地首帧制作">
      <p>{reviewMode?'固定机位 · 白天 · 时间 0':'同源首帧 · 初始时间 0'}</p><button onClick={capturePoster}>{reviewMode?'导出复核画面':'导出同源首帧'}</button>
      {posterError&&<p role="status">导出失败，请检查本地场景。</p>}
      {posterFrame&&<><a download={posterFrame.review?'cloud-runtime-review.png':'cloud-runtime-poster-desktop.png'} href={posterFrame.dataUrl} data-asset-revision={posterFrame.assetRevision} data-character-revision={posterFrame.characterRevision} data-frame-time={posterFrame.time} data-review-view={posterFrame.review}>{posterFrame.review?'下载固定机位复核图':'下载实时首帧'} · {posterFrame.width} × {posterFrame.height}</a><Image src={posterFrame.dataUrl} alt={posterFrame.review?'网页固定机位复核画面':'网页实时渲染的首帧预览'} width={320} height={posterFrame.review?180:90} unoptimized/></>}
    </aside>}
    {motionReviewMode&&ready&&!posterMode&&<aside className="ed-settlement-poster-tools" aria-label="本地运动复核">
      <button onClick={()=>{setMotionData(null);setMotionRecording(engine.current?.startMotionReview()??false)}}>开始记录运动</button>
      <button disabled={!motionRecording} onClick={()=>{setMotionData(engine.current?.captureMotionReview()??null);setMotionRecording(false)}}>导出运动记录</button>
      <p>{motionRecording?'记录窗口已开启，最多 6000 帧':'仅本地：帧间隔与镜头位置，不是 GPU 耗时'}</p>
      {motionData&&<a download="cloud-motion-review.json" href={`data:application/json;charset=utf-8,${encodeURIComponent(motionData)}`}>下载运动复核数据</a>}
      {motionData&&<pre aria-label="本地帧耗时摘要" style={{whiteSpace:'pre-wrap',fontSize:10}}>{JSON.stringify(JSON.parse(motionData).summary,null,2)}</pre>}
      <button disabled={sceneClip?.status==='recording'||sceneClip?.status==='encoding'} onClick={()=>{setSceneClip(null);videoRecorder.current?.start()}}>录制场景短片</button>
      <button disabled={sceneClip?.status!=='recording'} onClick={()=>videoRecorder.current?.stop()}>结束场景录制</button>
      <p role="status">{sceneClip?.status==='recording'?'正在录制，最多 30 秒':sceneClip?.status==='encoding'?'正在整理录像…':sceneClip?.status==='error'?'录制失败，资源已释放':sceneClip?.status==='unsupported'?'当前浏览器不支持场景录制':'仅录制画布，无声音；性能记录请另行采样'}</p>
      {sceneClip?.dataUrl&&<a download="cloud-scene-review.webm" href={sceneClip.dataUrl} data-asset-revision={state.assetRevision} data-clip-bytes={sceneClip.bytes}>下载场景短片</a>}
    </aside>}
    {exploring&&paused&&<div className="ed-settlement-paused"><span>{zh?'探索已暂停':'Exploration paused'}</span><button onClick={resume}>{zh?'继续':'Resume'}<Play size={15}/></button></div>}
  </section>
}
