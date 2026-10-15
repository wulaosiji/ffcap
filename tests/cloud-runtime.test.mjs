import assert from 'node:assert/strict'
import test from 'node:test'
import {createTraversal,FIXED_TIMESTEP,WALK_SPEED} from '../src/components/editorial-home/world/settlement/physics.mjs'
import {validateCloudLayout,cloudGroundHeight,cloudGuideRoute,cloudLocationAt} from '../src/components/editorial-home/world/settlement/cloudLayout.mjs'
import {createCloudCameraPath,createIslandOverview,fitIslandDistance,fitIslandBoxDistance} from '../src/components/editorial-home/world/settlement/cloudCamera.mjs'
import {Vector3} from 'three'

const floor={id:'floor',vertices:[-6,0,-6,6,0,-6,6,0,6,-6,0,6],indices:[0,2,1,0,3,2]}
const layout={schemaVersion:2,coordinateSystem:'Y-up',spawn:[0,.04,5],locations:[{id:'agentic',center:[-3,.8,-3],halfExtents:[1,1,1]}],guideToAgentic:[[0,3],[-1,1],[-3,-1],[-3,-3]],colliders:[],surfaces:[floor]}

test('cloud manifest requires actual valid surfaces and the complete authoring contract',()=>{
  assert.equal(validateCloudLayout(layout),layout)
  assert.throws(()=>validateCloudLayout({...layout,coordinateSystem:'Z-up'}),/Y-up/)
  assert.throws(()=>validateCloudLayout({...layout,surfaces:[]}),/surfaces/)
  assert.throws(()=>validateCloudLayout({...layout,surfaces:[{...floor,indices:[0,1,99]}]}),/indices/)
  assert.throws(()=>validateCloudLayout({...layout,locations:[...layout.locations,...layout.locations]}),/unique/)
})

test('triangular floor-height probe interpolates surfaces without a hardcoded landscape',()=>{
  const slope={vertices:[-2,0,-2,2,2,-2,2,2,2,-2,0,2],indices:[0,2,1,0,3,2]}
  assert.equal(cloudGroundHeight({surfaces:[slope]},0,0),1)
  assert.equal(cloudGroundHeight({surfaces:[slope]},-1,0),.5)
  assert.equal(cloudGroundHeight({surfaces:[slope]},20,20),-Infinity)
  const roof={...floor,vertices:floor.vertices.map((v,i)=>i%3===1?4:v)}
  assert.equal(cloudGroundHeight({surfaces:[floor,roof]},0,0),4)
  assert.equal(cloudGroundHeight({surfaces:[floor,roof]},0,0,.55),0)
})

test('guide joins nearby real path, supports reverse and rejects a different floor',()=>{
  const route=cloudGuideRoute(layout,{x:.3,y:.02,z:4})
  assert.deepEqual(route.at(-1),[-3,-3])
  assert.deepEqual(route[0],[0,4])
  assert.equal(cloudGuideRoute(layout,{x:4,y:.02,z:4}),null)
  assert.equal(cloudGuideRoute(layout,{x:0,y:4,z:4}),null)
  assert.deepEqual(cloudGuideRoute(layout,{x:-3,y:.02,z:-3},true).at(-1),[0,5])
  const roof={...floor,vertices:floor.vertices.map((v,i)=>i%3===1?4:v)}
  assert.deepEqual(cloudGuideRoute({...layout,surfaces:[floor,roof]},{x:-3,y:.02,z:-3},true).at(-1),[0,5])
  assert.equal(cloudLocationAt(layout,{x:-3,y:.02,z:-3}),'agentic')
  assert.equal(cloudLocationAt({...layout,locations:[{...layout.locations[0],open:false}]},{x:-3,y:.02,z:-3}),'commons')
})

test('Rapier walks on actual triangle mesh without any hidden flat box',async t=>{
  const traversal=await createTraversal({colliders:[],surfaces:[floor],spawn:[0,2,0]})
  t.after(()=>traversal.dispose())
  for(let i=0;i<120;i++)traversal.step(FIXED_TIMESTEP)
  assert.ok(traversal.position.y>=0&&traversal.position.y<.035)
  for(let i=0;i<60;i++)traversal.step(FIXED_TIMESTEP,{x:.5,z:.5})
  // Triangle-edge contacts shorten some fixed steps; still require at least
  // 80% of the requested travel and reject sideways drift or excess speed.
  const requested = .5 * WALK_SPEED
  assert.ok(traversal.position.x>requested*.8&&traversal.position.x<=requested+.01)
  assert.ok(Math.abs(traversal.position.x-traversal.position.z)<.02)
  assert.ok(traversal.position.y>=0&&traversal.position.y<.035)
})

test('triangle ramp changes physical height and invalid surface data fails early',async t=>{
  const ramp={vertices:[-4,0,-3,4,2,-3,4,2,3,-4,0,3],indices:[0,2,1,0,3,2]}
  const traversal=await createTraversal({colliders:[],surfaces:[ramp],spawn:[-2,.6,0]})
  t.after(()=>traversal.dispose())
  for(let i=0;i<80;i++)traversal.step(FIXED_TIMESTEP,{x:.5,z:0})
  // Rapier projects the controller's horizontal movement and -1 m/s grounded
  // downward intent onto this 1:4 slope. Uphill horizontal speed is therefore
  // (vx + slope * vy) / (1 + slope²), not the unconstrained flat-floor speed.
  const projectedX = -2 + (WALK_SPEED*.5-.25)/(1+.25**2)*(80*FIXED_TIMESTEP)
  assert.ok(Math.abs(traversal.position.x-projectedX)<.14)
  assert.ok(Math.abs(traversal.position.y-(traversal.position.x+4)/4)<.04)
  await assert.rejects(createTraversal({colliders:[],spawn:[0,0,0],surfaces:[{...floor,indices:[0,1,-1]}]}),/indices/)
  await assert.rejects(createTraversal({colliders:[],spawn:[0,0,0],surfaces:[{...floor,vertices:[NaN,0,0]}]}),/vertices/)
})

test('entry starts at the full-island overview and spirals inward to the exact character shoulder',()=>{
  const overview=createIslandOverview({center:[0,-2,-1],halfExtents:[12.3,10.4,12.9],aspect:1.6})
  const source={heroPosition:overview.position,heroTarget:overview.target,spawn:[-3,.04,8]}
  const path=createCloudCameraPath(source)
  assert.deepEqual(path.sample(0).position,source.heroPosition)
  path.sample(1).position.forEach((v,i)=>assert.ok(Math.abs(v-path.shoulder[i])<1e-9))
  path.sample(1).target.forEach((v,i)=>assert.ok(Math.abs(v-[-3,1.36,8][i])<1e-9))
  let previous=Infinity,previousAngle,winding=0
  for(let i=0;i<=100;i++){
    const pose=path.sample(i/100),dx=pose.position[0]-source.heroTarget[0],dz=pose.position[2]-source.heroTarget[2]
    const distance=Math.hypot(dx,dz),angle=Math.atan2(dx,dz)
    assert.ok(distance<=previous+1e-9,'the spiral radius must never expand')
    if(previousAngle!==undefined)winding+=Math.atan2(Math.sin(angle-previousAngle),Math.cos(angle-previousAngle))
    previousAngle=angle
    previous=distance
  }
  assert.ok(Math.abs(winding)>=Math.PI*2,'complete a full island revolution before aligning the shoulder')
  assert.ok(fitIslandDistance(15,.46)>fitIslandDistance(15,1.6)*1.8)
  for(let i=0;i<=100;i++)assert.ok([...path.sample(i/100).position,...path.sample(i/100).target].every(Number.isFinite))
  assert.deepEqual(path.sample(NaN),path.sample(0))
})

test('tight island framing retains every corner on portrait and landscape screens',()=>{
  const half=[12.3,10.4,12.9],front=new Vector3(.46,.18,1).normalize()
  const right=new Vector3(0,1,0).cross(front).normalize(),up=front.clone().cross(right).normalize()
  for(const aspect of [.46,1,1.6,2.1]){
    const distance=fitIslandBoxDistance(half,aspect,front.toArray()),tanV=Math.tan(53*Math.PI/360)
    assert.ok(distance<fitIslandDistance(Math.hypot(...half),aspect))
    for(const x of [-1,1])for(const y of [-1,1])for(const z of [-1,1]){
      const point=new Vector3(x*half[0],y*half[1],z*half[2]),depth=distance-point.dot(front)
      assert.ok(depth>0)
      assert.ok(Math.abs(point.dot(right))/(depth*tanV*aspect)<=1/1.10+1e-9)
      assert.ok(Math.abs(point.dot(up))/(depth*tanV)<=1/1.10+1e-9)
    }
  }
})
