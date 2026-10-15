import test from 'node:test'
import assert from 'node:assert/strict'
import {isCloudPosterCapture,CLOUD_POSTER_SIZE,cloudPosterSize,cloudReviewCamera,cloudReviewTime,cloudReviewWater} from '../src/components/editorial-home/world/settlement/cloudPosterCapture.mjs'
import {createExplorerCameraPose} from '../src/components/editorial-home/world/settlement/cloudCamera.mjs'
import {CLOUD_ROBOT_PROFILE} from '../src/components/editorial-home/world/settlement/cloudCharacterProfile.mjs'

test('portrait authoring requires explicit local poster opt-in and preserves desktop and review frames',()=>{
  const q='?world-poster=1&poster-mobile=1'
  assert.deepEqual(cloudPosterSize('localhost',q),{width:804,height:1748})
  assert.ok(Object.isFrozen(cloudPosterSize('localhost',q)))
  for(const host of ['ffcap.cn','localhost.example.com'])assert.equal(cloudPosterSize(host,q),CLOUD_POSTER_SIZE)
  for(const query of ['','?poster-mobile=1','?world-poster=1','?world-poster=1&poster-mobile=true',q+'&review-view=bridge'])assert.equal(cloudPosterSize('localhost',query),CLOUD_POSTER_SIZE)
})

test('entrance review matches the actual robot shoulder without exposing optical isolation',()=>{
 const q='?world-poster=1&review-view=entrance',v=cloudReviewCamera('localhost',q),pose=createExplorerCameraPose([-3,.075,8],false,CLOUD_ROBOT_PROFILE.camera)
 assert.deepEqual(v.position,pose.position);assert.deepEqual(v.target,pose.target);assert.equal(v.fov,53)
 assert.ok(Object.isFrozen(v));assert.equal(cloudReviewCamera('ffcap.cn',q),null)
 assert.equal(cloudReviewWater('localhost',q+'&review-water=bed-only'),null)
 assert.equal(cloudReviewCamera('localhost','?review-view=entrance'),null)
})

test('optical isolation cannot affect normal visitors or production',()=>{
  for(const mode of ['bed-only','no-reflection']){
    const query='?world-poster=1&review-view=bridge&review-water='+mode
    assert.equal(cloudReviewWater('localhost',query),mode)
    assert.equal(cloudReviewWater('ffcap.cn',query),null)
    assert.equal(cloudReviewWater('localhost','?world-poster=1&review-water='+mode),null)
    assert.equal(cloudReviewWater('localhost','?review-view=bridge&review-water='+mode),null)
  }
  assert.equal(cloudReviewWater('localhost','?world-poster=1&review-view=bridge&review-water=arbitrary'),null)
})

test('only local fixed review cameras accept a finite bounded animation sample',()=>{
 for(const view of ['bridge','entrance']){
  const query='?world-poster=1&review-view='+view+'&review-time='
  for(const value of ['0','1.25','120'])assert.equal(cloudReviewTime('localhost',query+value),Number(value))
  for(const value of ['-1','121','NaN','Infinity','1e3','', '   '])assert.equal(cloudReviewTime('localhost',query+value),0)
  assert.equal(cloudReviewTime('ffcap.cn',query+'2'),0)
  assert.equal(cloudReviewTime('localhost','?world-poster=1&review-time=2'),0)
  assert.equal(cloudReviewTime('localhost','?review-view=bridge&review-time=2'),0)
 }
})

test('bridge review requires local poster opt-in and has immutable fixed framing',()=>{
  assert.equal(cloudReviewCamera('ffcap.cn','?world-poster=1&review-view=bridge'),null)
  assert.equal(cloudReviewCamera('127.0.0.1','?review-view=bridge'),null)
  assert.equal(cloudReviewCamera('localhost','?world-poster=1&review-view=arbitrary'),null)
  const view=cloudReviewCamera('localhost','?world-poster=1&review-view=bridge')
  assert.deepEqual(view.position,[2.4,1.9,6.9]);assert.deepEqual(view.target,[.2,-.1,4.4])
  assert.equal(view.width,1280);assert.equal(view.height,720);assert.equal(view.fov,45)
  assert.ok(Object.isFrozen(view)&&Object.isFrozen(view.position)&&Object.isFrozen(view.target))
})

test('frozen poster authoring requires both an exact loopback host and explicit opt-in',()=>{
  for(const host of ['localhost','127.0.0.1','[::1]']){
    assert.equal(isCloudPosterCapture(host,'?world-poster=1'),true)
    for(const query of ['','?world-poster=0','?world-poster=true','?x=world-poster=1'])assert.equal(isCloudPosterCapture(host,query),false)
  }
  for(const host of ['ffcap.cn','www.ffcap.cn','localhost.example.com','127.0.0.1.example.com'])assert.equal(isCloudPosterCapture(host,'?world-poster=1'),false)
  assert.deepEqual(CLOUD_POSTER_SIZE,{width:3840,height:1080})
})
