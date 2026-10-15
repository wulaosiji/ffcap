import {isCloudMotionReview} from './cloudMotionReview.mjs'
export const CLOUD_CLIP_LIMITS=Object.freeze({seconds:30,bytes:48*1024*1024,fps:30,bitsPerSecond:8000000})

/** Local canvas evidence only. Never opens a device, screen picker or network. */
export function createCloudSceneRecorder(canvas,{hostname,search,onChange},platform=globalThis){
 let recorder,stream,reader,timer,disposed=false,busy=false,generation=0
 const enabled=isCloudMotionReview(hostname,search)
 const emit=value=>{if(!disposed)onChange(value)}
 function release(){
  if(timer!==undefined)platform.clearTimeout(timer);timer=undefined
  stream?.getTracks().forEach(track=>track.stop());stream=undefined
 }
 function abort(){
  generation++;busy=false
  if(recorder){recorder.ondataavailable=null;recorder.onstop=null;recorder.onerror=null;if(recorder.state!=='inactive')try{recorder.stop()}catch{};recorder=undefined}
  if(reader){reader.onload=null;reader.onerror=null;if(reader.readyState===1)reader.abort();reader=undefined}
  release()
 }
 function fail(){abort();emit({status:'error'})}
 function stop(){if(!busy||!recorder||recorder.state==='inactive')return;try{recorder.stop()}catch{fail()}}
 return {
  start(){
   if(!enabled||disposed||busy)return false
   const Recorder=platform.MediaRecorder,Reader=platform.FileReader
   if(!Recorder||!Reader||!canvas?.captureStream){emit({status:'unsupported'});return false}
   const mimeType=['video/webm;codecs=vp9','video/webm;codecs=vp8','video/webm'].find(type=>Recorder.isTypeSupported(type))
   if(!mimeType){emit({status:'unsupported'});return false}
   try{
    busy=true;const token=++generation,chunks=[];let bytes=0
    stream=canvas.captureStream(CLOUD_CLIP_LIMITS.fps)
    recorder=new Recorder(stream,{mimeType,videoBitsPerSecond:CLOUD_CLIP_LIMITS.bitsPerSecond})
    recorder.ondataavailable=event=>{
     if(disposed||generation!==token||!event.data.size)return
     bytes+=event.data.size;if(bytes>CLOUD_CLIP_LIMITS.bytes){fail();return}chunks.push(event.data)
    }
    recorder.onerror=()=>{if(generation===token)fail()}
    recorder.onstop=()=>{
     if(disposed||generation!==token)return
     release();if(!bytes){fail();return}emit({status:'encoding'});reader=new Reader()
     reader.onerror=fail
     reader.onload=()=>{
      if(disposed||generation!==token)return
      const dataUrl=reader.result;reader=undefined;recorder=undefined;busy=false
      if(typeof dataUrl!=='string'||!dataUrl.startsWith('data:video/webm')){fail();return}
      emit({status:'ready',dataUrl,bytes,mimeType})
     }
     try{reader.readAsDataURL(new platform.Blob(chunks,{type:mimeType}))}catch{fail()}
    }
    recorder.start(500);timer=platform.setTimeout(stop,CLOUD_CLIP_LIMITS.seconds*1000)
    emit({status:'recording'});return true
   }catch{fail();return false}
  },
  stop,
  dispose(){disposed=true;abort()},
 }
}
