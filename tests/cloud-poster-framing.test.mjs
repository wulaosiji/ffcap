import test from 'node:test'
import assert from 'node:assert/strict'
import {PerspectiveCamera,Vector3} from 'three'
import {createIslandOverview} from '../src/components/editorial-home/world/settlement/cloudCamera.mjs'

const bounds={center:[0,-1,-.5],halfExtents:[12,11.2,12.4]}
function camera(aspect){
  const pose=createIslandOverview({...bounds,aspect,fov:53})
  const cam=new PerspectiveCamera(53,aspect,.075,420)
  cam.position.fromArray(pose.position);cam.lookAt(new Vector3(...pose.target));cam.updateMatrixWorld()
  return cam
}

test('height-locked desktop poster and WebGL project the same landmarks from square to 32:9',()=>{
  const imageWidth=3840,imageHeight=1080,posterCamera=camera(imageWidth/imageHeight)
  const landmarks=[[-8.7,0,3.2],[-5.7,3,-2],[0,-12,0],[10,4,-7],[0,9,-9],[0,0,10]]
  for(const [width,height] of [[1000,1000],[1200,900],[1600,1000],[1280,720],[1920,1080],[2560,1080],[3840,1080]]){
    const live=camera(width/height),scale=Math.max(width/imageWidth,height/imageHeight)
    for(const point of landmarks){
      const a=new Vector3(...point).project(posterCamera),b=new Vector3(...point).project(live)
      const imageX=(a.x+1)*imageWidth/2*scale+(width-imageWidth*scale)/2
      const imageY=(1-a.y)*imageHeight/2*scale+(height-imageHeight*scale)/2
      assert.ok(Math.abs(imageX-(b.x+1)*width/2)<.00001)
      assert.ok(Math.abs(imageY-(1-b.y)*height/2)<.00001)
    }
  }
})

test('the old 16:10 cover image reproduces the reported zoom on 16:9',()=>{
  const scale=Math.max(1280/1600,720/1000)
  assert.ok(1000*scale/720>1.10,'Original cover crop enlarged vertical framing by over ten percent')
})
