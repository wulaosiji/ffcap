import test from 'node:test'
import assert from 'node:assert/strict'
import {createCloudMotionReview,isCloudMotionReview} from '../src/components/editorial-home/world/settlement/cloudMotionReview.mjs'
const sample=()=>({elapsedMs:16.67,cpuSubmitMs:3,time:1,phase:'explore',guiding:true,camera:[0,2,4],focus:[0,1,0],actor:[0,0,0],heading:0})
test('motion review is explicit and exact-loopback only',()=>{
  for(const host of ['localhost','127.0.0.1','[::1]'])assert.ok(isCloudMotionReview(host,'?render-review=1'))
  for(const host of ['ffcap.cn','localhost.example.com','192.168.1.1'])assert.equal(isCloudMotionReview(host,'?render-review=1'),false)
  assert.equal(isCloudMotionReview('localhost','?render-review=true'),false)
  const disabled=createCloudMotionReview(false);assert.equal(disabled.start(),false);disabled.record(sample());assert.equal(disabled.finish(),null)
})
test('motion data owns copies, rejects invalid times and stops at a fixed ceiling',()=>{
  const review=createCloudMotionReview(true),s=sample();review.start();review.record(s);s.camera[0]=99
  review.record({...sample(),elapsedMs:NaN})
  for(let i=0;i<6100;i++)review.record(sample())
  assert.equal(review.active,false)
  const output=review.finish();assert.equal(output.samples.length,6000);assert.equal(output.capped,true);assert.equal(output.samples[0].camera[0],0)
  output.samples[0].camera[0]=88;assert.equal(review.finish().samples[0].camera[0],0)
  review.start();assert.equal(review.finish().samples.length,0)
  review.dispose();assert.equal(review.start(),false);assert.equal(review.finish(),null)
})
