import {readFile} from 'node:fs/promises'
import {pathToFileURL} from 'node:url'

const distance=(a,b)=>Math.hypot(...a.map((value,i)=>value-b[i]))
const percentile=(values,p)=>{if(!values.length)return null;const sorted=[...values].sort((a,b)=>a-b);return sorted[Math.min(sorted.length-1,Math.floor((sorted.length-1)*p))]}
export function analyzeCloudMotion(review){
  if(review.version!==1||!Array.isArray(review.samples))throw new Error('Expected version 1 motion review')
  const groups={}
  for(let i=0;i<review.samples.length;i++){
    const s=review.samples[i],key=`${s.phase}/${s.guiding?'guided':'idle'}`
    if(!Number.isFinite(s.elapsedMs)||s.elapsedMs<=0)continue
    const group=groups[key]??={frames:0,intervals:[],cpu:[],over33ms:0,over50ms:0,maxCameraStepM:0,maxCameraSpeedMps:0,worstStep:null}
    group.frames++;group.intervals.push(s.elapsedMs);group.cpu.push(s.cpuSubmitMs)
    if(s.elapsedMs>33.34)group.over33ms++
    if(s.elapsedMs>50)group.over50ms++
    const previous=review.samples[i-1]
    // Entry/exit are explicit shot transitions, not tracking jitter samples.
    if(previous&&previous.phase===s.phase&&previous.guiding===s.guiding){
      const step=distance(s.camera,previous.camera),speed=step*1000/s.elapsedMs
      if(step>group.maxCameraStepM){group.maxCameraStepM=step;group.worstStep={index:i,time:s.time,elapsedMs:s.elapsedMs,actor:s.actor,camera:s.camera}}
      group.maxCameraSpeedMps=Math.max(group.maxCameraSpeedMps,speed)
    }
  }
  return {assetRevision:review.assetRevision,characterRevision:review.characterRevision,quality:review.quality,viewport:review.viewport,drawing:review.drawing,capped:review.capped,
    timing:'Frame callback intervals, not GPU time. Camera step alone does not prove jitter; inspect the associated shot.',
    groups:Object.fromEntries(Object.entries(groups).map(([key,g])=>[key,{frames:g.frames,p50Ms:percentile(g.intervals,.5),p95Ms:percentile(g.intervals,.95),p99Ms:percentile(g.intervals,.99),cpuSubmitP95Ms:percentile(g.cpu,.95),over33ms:g.over33ms,over50ms:g.over50ms,maxCameraStepM:g.maxCameraStepM,maxCameraSpeedMps:g.maxCameraSpeedMps,worstStep:g.worstStep}]))}
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
  if(!process.argv[2])throw new Error('Usage: node scripts/world/analyze-cloud-motion.mjs <local-review.json>')
  console.log(JSON.stringify(analyzeCloudMotion(JSON.parse(await readFile(process.argv[2],'utf8'))),null,2))
}
