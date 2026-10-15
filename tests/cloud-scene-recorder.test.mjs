import test from 'node:test'
import assert from 'node:assert/strict'
import {createCloudSceneRecorder,CLOUD_CLIP_LIMITS} from '../src/components/editorial-home/world/settlement/cloudSceneRecorder.mjs'

function fixture(hostname='localhost',search='?render-review=1'){
 const state={events:[],captures:0,stopped:0,timers:new Map(),recorder:null,reader:null}
 class Recorder{
  static isTypeSupported(type){return type==='video/webm;codecs=vp9'}
  constructor(stream,options){this.state='inactive';state.recorder=this;state.options=options}
  start(){this.state='recording'}
  stop(){this.state='inactive';this.onstop?.()}
  data(size){this.ondataavailable?.({data:new Blob([new Uint8Array(size)])})}
 }
 class Reader{
  constructor(){this.readyState=0;state.reader=this}
  readAsDataURL(blob){this.readyState=1;state.blob=blob}
  complete(){this.readyState=2;this.result='data:video/webm;base64,AQID';this.onload?.()}
  abort(){this.readyState=2;state.aborted=true}
 }
 const platform={MediaRecorder:Recorder,FileReader:Reader,Blob,setTimeout(fn,ms){state.timers.set(1,{fn,ms});return 1},clearTimeout(id){state.timers.delete(id)}}
 const canvas={captureStream(fps){state.captures++;state.fps=fps;return {getTracks:()=>[{stop(){state.stopped++}}]}}}
 const api=createCloudSceneRecorder(canvas,{hostname,search,onChange:v=>state.events.push(v)},platform)
 return {api,state,platform}
}
test('scene recording is exact-loopback opt-in only, never starts capture publicly',()=>{
 for(const [host,query] of [['ffcap.cn','?render-review=1'],['localhost.example.com','?render-review=1'],['localhost','']]){
  const {api,state}=fixture(host,query);assert.equal(api.start(),false);assert.equal(state.captures,0);assert.deepEqual(state.events,[])
 }
})
test('bounded canvas clip releases tracks and timer, and rejects concurrent recording',()=>{
 const {api,state}=fixture();assert.equal(api.start(),true);assert.equal(api.start(),false)
 assert.equal(state.fps,30);assert.equal(state.timers.get(1).ms,30000)
 assert.equal(state.options.videoBitsPerSecond,8000000)
 state.recorder.data(3);api.stop();assert.equal(state.stopped,1);assert.equal(state.timers.size,0)
 assert.equal(state.events.at(-1).status,'encoding');assert.equal(api.start(),false)
 state.reader.complete();assert.deepEqual(state.events.at(-1),{status:'ready',dataUrl:'data:video/webm;base64,AQID',bytes:3,mimeType:'video/webm;codecs=vp9'})
 assert.equal(api.start(),true);api.dispose();assert.equal(state.stopped,2);assert.equal(api.start(),false)
})
test('clip ceiling, empty output and unsupported encoders fail without leaving tracks',()=>{
 const oversized=fixture();oversized.api.start()
 oversized.state.recorder.ondataavailable({data:{size:CLOUD_CLIP_LIMITS.bytes+1}})
 assert.equal(oversized.state.events.at(-1).status,'error');assert.equal(oversized.state.stopped,1);assert.equal(oversized.state.timers.size,0)
 const empty=fixture();empty.api.start();empty.api.stop();assert.equal(empty.state.events.at(-1).status,'error');assert.equal(empty.state.stopped,1)
 const unsupported=fixture();unsupported.platform.MediaRecorder=undefined;assert.equal(unsupported.api.start(),false);assert.equal(unsupported.state.captures,0)
})
test('automatic stop and unmount while reading do not publish stale data',()=>{
 const {api,state}=fixture();api.start();state.recorder.data(10);state.timers.get(1).fn()
 assert.equal(state.stopped,1);const count=state.events.length;api.dispose();state.reader.complete()
 assert.equal(state.aborted,true);assert.equal(state.events.length,count)
})
test('constructor and reader errors clean up owned capture resources',()=>{
 const broken=fixture();broken.platform.MediaRecorder=class{static isTypeSupported(){return true}constructor(){throw Error('encoder')}}
 assert.equal(broken.api.start(),false);assert.equal(broken.state.stopped,1)
 const read=fixture();read.api.start();read.state.recorder.data(3);read.api.stop();read.state.reader.onerror()
 assert.equal(read.state.events.at(-1).status,'error');assert.equal(read.state.stopped,1)
})
