import test from 'node:test'
import assert from 'node:assert/strict'
import {analyzeCloudMotion} from '../scripts/world/analyze-cloud-motion.mjs'
test('frame summaries exclude reset gaps and explicit shot transitions',()=>{
  const row=(time,phase,x,elapsedMs=20)=>({time,phase,guiding:false,camera:[x,1,0],actor:[0,0,0],elapsedMs,cpuSubmitMs:2})
  const output=analyzeCloudMotion({version:1,samples:[row(0,'hero',0,0),row(.02,'hero',.01),row(.04,'explore',10),row(.06,'explore',10.01)]})
  assert.equal(output.groups['hero/idle'].frames,1)
  assert.ok(output.groups['explore/idle'].maxCameraStepM<.011,'10m explicit entry cut is not classified as tracking jitter')
  assert.equal(output.groups['explore/idle'].p95Ms,20)
  assert.equal(output.groups['explore/idle'].cpuSubmitP95Ms,2)
  assert.throws(()=>analyzeCloudMotion({version:0,samples:[]}))
})
