import {createExplorerCameraPose} from './cloudCamera.mjs'
import {CLOUD_ROBOT_PROFILE} from './cloudCharacterProfile.mjs'
export const CLOUD_POSTER_SIZE=Object.freeze({width:3840,height:1080})
const MOBILE_POSTER_SIZE=Object.freeze({width:804,height:1748})
export function cloudPosterSize(hostname,search){
  return isCloudPosterCapture(hostname,search)&&!cloudReviewCamera(hostname,search)
    &&new URLSearchParams(search).get('poster-mobile')==='1'?MOBILE_POSTER_SIZE:CLOUD_POSTER_SIZE
}
const BRIDGE_REVIEW=Object.freeze({name:'bridge',width:1280,height:720,fov:45,
  position:Object.freeze([2.4,1.9,6.9]),target:Object.freeze([.2,-.1,4.4])})
const entrance=createExplorerCameraPose([-3,.075,8],false,CLOUD_ROBOT_PROFILE.camera)
const ENTRANCE_REVIEW=Object.freeze({name:'entrance',width:1280,height:720,fov:53,
  position:Object.freeze(entrance.position),target:Object.freeze(entrance.target)})
const ACADEMY_VIEWS={
  'a-main':{name:'a-main',width:1440,height:960,fov:67.380135,position:[-5.7,2.25,.9],target:[-5.7,2.05,-2.7]},
  // Rear camera is 18 cm forward of the whitebox view to clear the real shelf.
  'a-reverse':{name:'a-reverse',width:1440,height:960,fov:67.380135,position:[-5.6,2.25,-3.1],target:[-5.7,2.1,1]},
  'a-west':{name:'a-west',width:1440,height:960,fov:57.22092,position:[-3.6,2.25,-1.3],target:[-8.8,2.1,-1.45]},
  'a-detail':{name:'a-detail',width:1440,height:960,fov:33.39849,position:[-4.05,1.7,-.85],target:[-5.3,1.15,-1.9]},
  academy:{name:'academy',width:1280,height:720,fov:53,position:[-3.9,2.3,5.2],target:[-5.7,1.95,-.5]},
  threshold:{name:'threshold',width:1280,height:720,fov:53,position:[-5.7,1.95,2.15],target:[-5.7,1.6,-2.5]},
  interior:{name:'interior',width:1280,height:720,fov:53,position:[-5.7,1.8,.45],target:[-5.5,1.55,-3.5]},
}
// The integrated garden uses new coordinates. Keep legacy bridge/room views
// unchanged, and pin new local-only review views independently of model bounds.
const GARDEN_VIEWS=Object.fromEntries(Object.entries({
  'g-overview':{position:[23,17,31],target:[0,-1,-1],fov:48},
  'g-aerial':{position:[18,28,25],target:[0,.5,-1],fov:48},
  'g-bridge':{position:[10.5,3.6,10],target:[6.3,.7,5.4],fov:58},
  'g-y':{position:[0,4.4,9.7],target:[0,1,0],fov:68},
  'g-agentic':{position:[-4.2,2.2,3.8],target:[-7.25,1.65,-.6],fov:61},
  'g-physical':{position:[3.2,2.3,2],target:[5.7,1.6,-2.5],fov:61},
  'g-north':{position:[-.4,3.6,-.2],target:[-.4,3.1,-6.6],fov:58},
}).map(([name,view])=>[name,Object.freeze({name,width:1440,height:960,...view,
  position:Object.freeze(view.position),target:Object.freeze(view.target)})]))

export function cloudReviewCamera(hostname,search){
  if(!isCloudPosterCapture(hostname,search))return null
  const view=new URLSearchParams(search).get('review-view')
  return view==='bridge'?BRIDGE_REVIEW:view==='entrance'?ENTRANCE_REVIEW:Object.hasOwn(ACADEMY_VIEWS,view)?ACADEMY_VIEWS[view]:Object.hasOwn(GARDEN_VIEWS,view)?GARDEN_VIEWS[view]:null
}

export function cloudReviewTime(hostname,search){
  const camera=cloudReviewCamera(hostname,search)
  if(!camera)return 0
  const raw=new URLSearchParams(search).get('review-time')
  if(raw===null||!/^\d+(?:\.\d+)?$/.test(raw))return 0
  const time=Number(raw)
  // A-room acceptance includes midnight (240s), within one authored day cycle.
  // Existing bridge/entrance diagnostic bounds remain unchanged.
  const limit=camera.name.startsWith('a-')?480:120
  return Number.isFinite(time)&&time>=0&&time<=limit?time:0
}

export function isCloudPosterCapture(hostname,search){
  return ['localhost','127.0.0.1','[::1]'].includes(hostname)
    &&new URLSearchParams(search).get('world-poster')==='1'
}

export function cloudReviewWater(hostname,search){
  if(cloudReviewCamera(hostname,search)?.name!=='bridge')return null
  const mode=new URLSearchParams(search).get('review-water')
  return ['bed-only','no-reflection'].includes(mode)?mode:null
}
