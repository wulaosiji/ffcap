import assert from 'node:assert/strict'
import test from 'node:test'
import {readFile} from 'node:fs/promises'
import {validateCloudLayout,cloudGuideRoute,cloudLocationAt,cloudGroundHeight} from '../src/components/editorial-home/world/settlement/cloudLayout.mjs'
import {createTraversal,FIXED_TIMESTEP} from '../src/components/editorial-home/world/settlement/physics.mjs'
import {CLOUD_DOG_PROFILE} from '../src/components/editorial-home/world/settlement/cloudCharacterProfile.mjs'

const destinations = ['agentic','physical','entertainment']
const floor = {id:'floor',vertices:[-12,0,-12,12,0,-12,12,0,12,-12,0,12],indices:[0,2,1,0,3,2]}
function fixture() {
  const agentic = [[0,5],[0,1],[-4,1],[-4,-4]]
  return {
    schemaVersion:2,coordinateSystem:'Y-up',spawn:[0,.04,8],
    locations:[
      {id:'agentic',center:[-4,.8,-4],halfExtents:[1.7,1.1,1.2],open:true},
      {id:'physical',center:[4,.8,-4],halfExtents:[1.7,1.1,1.2],open:true},
      {id:'entertainment',center:[0,.8,-8],halfExtents:[1.7,1.1,1.2],open:true},
    ],
    guideToAgentic:agentic,
    guideRoutes:{agentic,physical:[[0,5],[0,1],[4,1],[4,-4]],entertainment:[[0,5],[0,1],[0,-4],[0,-8]]},
    colliders:[],surfaces:[structuredClone(floor)],
    lights:destinations.map((id,i)=>({id:`${id}-pendant`,type:'warm-interior',position:[i*2,3,-4],color:'#ffd49a'})),
  }
}
const position = (point,y=.02) => ({x:point[0],y,z:point[1]})
const routeLength = route => route.slice(1).reduce((sum,p,i)=>sum+Math.hypot(p[0]-route[i][0],p[1]-route[i][1]),0)

test('schema 2 keeps legacy Agentic calls and accepts partial optional route maps',()=>{
  const layout=fixture(),spawn={x:0,y:.04,z:8}
  assert.equal(validateCloudLayout(layout),layout)
  const legacy=structuredClone(layout);delete legacy.guideRoutes;delete legacy.lights
  assert.equal(validateCloudLayout(legacy),legacy)
  assert.deepEqual(cloudGuideRoute(legacy,spawn),cloudGuideRoute(layout,spawn,false,'agentic'))
  const partial=structuredClone(layout);delete partial.guideRoutes.agentic
  assert.equal(validateCloudLayout(partial),partial)
  assert.deepEqual(cloudGuideRoute(partial,spawn),cloudGuideRoute(layout,spawn))
  for(const id of ['physical','entertainment'])assert.equal(cloudGuideRoute(legacy,spawn,false,id),null)
})

test('three destination routes share their real prefix without modifying input or returning aliases',()=>{
  const layout=fixture(),before=structuredClone(layout)
  for(const destination of destinations){
    const route=cloudGuideRoute(layout,{x:0,y:.02,z:8},false,destination)
    assert.deepEqual(route.slice(0,3),[[0,8],[0,5],[0,1]])
    assert.deepEqual(route.at(-1),layout.guideRoutes[destination].at(-1))
    assert.equal(cloudLocationAt(layout,position(route.at(-1))),destination)
    route[0][0]=999;route.at(-1)[0]=999
  }
  assert.deepEqual(layout,before)
})

test('every room-to-room route uses the shortest shared junction rather than returning to spawn',()=>{
  const layout=fixture()
  for(const from of destinations)for(const to of destinations){
    const p=position(layout.guideRoutes[from].at(-1))
    const route=cloudGuideRoute(layout,p,false,to)
    if(from===to){assert.deepEqual(route,[]);continue}
    assert.deepEqual(route.at(-1),layout.guideRoutes[to].at(-1))
    assert.ok(route.some(([x,z])=>x===0&&z===1),'Cross-room travel must use the authored common junction')
    assert.ok(route.every(([,z])=>z<=1),'No needless detour to the spawn or shared south approach')
    assert.equal(routeLength(route),18)
  }
})

test('all open rooms return to spawn, independent of the default destination',()=>{
  const layout=fixture()
  for(const from of destinations){
    const route=cloudGuideRoute(layout,position(layout.guideRoutes[from].at(-1)),true)
    assert.deepEqual(route.at(-1),[0,8])
    assert.ok(route.some(([x,z])=>x===0&&z===1))
  }
  layout.locations[0].open=false
  assert.ok(cloudGuideRoute(layout,position(layout.guideRoutes.physical.at(-1)),true),'Returning targets spawn, not a closed default Agentic room')
})

test('closed, missing-route and unknown rooms are ineligible as target or origin',()=>{
  for(const from of ['physical','entertainment'])for(const mode of ['closed','unrouted']){
    const layout=fixture(),origin=position(layout.guideRoutes[from].at(-1))
    if(mode==='closed')layout.locations.find(room=>room.id===from).open=false
    else delete layout.guideRoutes[from]
    assert.equal(cloudGuideRoute(layout,{x:0,y:.02,z:8},false,from),null)
    assert.equal(cloudGuideRoute(layout,origin,false,'agentic'),null)
    assert.equal(cloudGuideRoute(layout,origin,true),null)
  }
  const layout=fixture()
  assert.equal(cloudGuideRoute(layout,{x:0,y:.02,z:8},false,'bridge'),null)
  assert.equal(cloudGuideRoute(layout,null),null)
  assert.equal(cloudGuideRoute(layout,{x:NaN,y:.02,z:8}),null)
})

test('joining remains limited to 1.25 metres and the authored walkable height, including under a roof',()=>{
  const layout=fixture()
  assert.ok(cloudGuideRoute(layout,{x:1.25,y:.02,z:6}))
  assert.equal(cloudGuideRoute(layout,{x:1.250001,y:.02,z:6}),null)
  assert.equal(cloudGuideRoute(layout,{x:0,y:.551,z:6}),null)
  assert.equal(cloudGuideRoute(layout,{x:0,y:-.551,z:6}),null)
  const roof={...floor,vertices:floor.vertices.map((v,i)=>i%3===1?4:v)}
  layout.surfaces.push(roof)
  assert.ok(cloudGuideRoute(layout,{x:0,y:.02,z:6}))
  assert.equal(cloudGuideRoute(layout,{x:0,y:4.02,z:6}),null,'An overlapping roof is not the guide layer')
  for(const destination of destinations){
    const endpoint=layout.guideRoutes[destination].at(-1)
    assert.deepEqual(cloudGuideRoute(layout,position(endpoint),false,destination),[])
    assert.equal(cloudGuideRoute(layout,position(endpoint,4.02),false,destination),null)
  }
})

test('graph intersections require explicit shared coordinates, not a crossed line or approximate node',()=>{
  const layout=fixture()
  layout.guideRoutes.physical=[[0,5],[6,5],[6,-4],[4,-4]]
  const route=cloudGuideRoute(layout,position([-4,-4]),false,'physical')
  assert.ok(route.some(([x,z])=>x===0&&z===5),'The actual shared node is the south fork')
  assert.ok(route.some(([x,z])=>x===6&&z===5))
  assert.ok(!route.some(([x,z])=>x===4&&z===1),'Do not invent a crossed-path junction')
  layout.guideRoutes.physical=[[.00001,5],[6,5],[6,-4],[4,-4]]
  const approximate=cloudGuideRoute(layout,position([-4,-4]),false,'physical')
  assert.ok(approximate.some(([x,z])=>x===0&&z===8),'Near-equal authored nodes remain separate; only spawn is now shared')
})

test('a gap in actual walking surfaces cannot turn a complete waypoint list into a connected route',()=>{
  const layout=fixture()
  const strip=(near,far)=>({vertices:[-12,0,near,12,0,near,12,0,far,-12,0,far],indices:[0,2,1,0,3,2]})
  layout.surfaces=[strip(-12,2),strip(4,12)]
  for(const destination of destinations)assert.equal(cloudGuideRoute(layout,{x:0,y:.02,z:8},false,destination),null)
  assert.equal(cloudGuideRoute(layout,position([-4,-4]),true),null)
})

test('nearby valid endpoints do not admit a short connector across missing ground or a deep creek',()=>{
  const layout=fixture(),strip=(x0,x1,y=0)=>({vertices:[x0,y,-12,x1,y,-12,x1,y,12,x0,y,12],indices:[0,2,1,0,3,2]})
  layout.surfaces=[strip(-12,.3),strip(1,12)]
  assert.equal(cloudGuideRoute(layout,{x:1.2,y:.02,z:6}),null,'A .7 m unsupported gap exists between two level banks')
  layout.surfaces.push(strip(.3,1,-.6))
  assert.equal(cloudGuideRoute(layout,{x:1.2,y:.02,z:6}),null,'The creek bottom is not a safe same-level bridge')
  layout.surfaces=[strip(-12,12)]
  assert.ok(cloudGuideRoute(layout,{x:1.2,y:.02,z:6}),'The same connector is admitted once it has continuous support')
})

test('short connectors reject exact rotated-box crossings, including obstacles thinner than sample spacing',()=>{
  for(const rotationY of [0,.43,Math.PI/2]){
    const layout=fixture()
    layout.colliders=[{id:'thin-furniture',position:[.635,.6,6],halfExtents:[.009,.6,.7],rotationY}]
    assert.equal(cloudGuideRoute(layout,{x:1.2,y:.02,z:6}),null,`A rotated ${rotationY} box crosses the connection`)
  }
  const clear=fixture()
  clear.colliders=[{position:[.6,2,6],halfExtents:[.1,.2,.7]}]
  assert.ok(cloudGuideRoute(clear,{x:1.2,y:.02,z:6}),'An overhead lintel does not block the low standing corridor')
  clear.colliders=[{position:[.6,-.1,6],halfExtents:[.1,.1,.7]}]
  assert.ok(cloudGuideRoute(clear,{x:1.2,y:.02,z:6}),'The sampled walkable top is not mistaken for an obstacle')
})

test('short connectors preserve a real supported 18 cm riser without changing dog step limits',()=>{
  const layout=fixture(),strip=(x0,x1,y)=>({vertices:[x0,y,-12,x1,y,-12,x1,y,12,x0,y,12],indices:[0,2,1,0,3,2]})
  layout.surfaces=[strip(-12,.7,0),strip(.7,12,.18)]
  layout.colliders=[{id:'supported-riser',position:[1.1,.09,6],halfExtents:[.4,.09,.5]}]
  assert.ok(cloudGuideRoute(layout,{x:1.2,y:.196,z:6}),'The exported stair top supplies the same support as its collision box')
})

test('shortest routing handles a rejoined network cycle without looping or choosing the long branch',()=>{
  const layout=fixture()
  layout.guideRoutes.entertainment=[[0,5],[0,1],[-4,1],[-4,-4],[0,-4],[0,-8]]
  layout.guideRoutes.physical=[[0,5],[0,1],[0,-4],[4,-4]]
  const route=cloudGuideRoute(layout,{x:0,y:.02,z:8},false,'entertainment')
  assert.deepEqual(route,[[0,8],[0,5],[0,1],[0,-4],[0,-8]])
  assert.equal(routeLength(route),16)
})

test('optional routes and warm lights validate their actual data types and exact legacy agreement',()=>{
  for(const guideRoutes of [null,[],false,{bridge:[[0,1],[0,2]]},{physical:[]},{physical:[[0,1],[NaN,2]]}]){
    assert.throws(()=>validateCloudLayout({...fixture(),guideRoutes}),TypeError)
  }
  const changed=fixture();changed.guideRoutes.agentic=[[1,2],[2,3]]
  assert.throws(()=>validateCloudLayout(changed),/match.*guideToAgentic/)
  for(const light of [null,{id:'x',type:'point',position:[0,1,0],color:'#ffffff'},
    {id:'x',type:'warm-interior',position:[0,Infinity,0],color:'#ffffff'},
    {id:'x',type:'warm-interior',position:[0,1],color:'#ffffff'},
    {id:'x',type:'warm-interior',position:[0,1,0],color:'white'},
    {id:'x',type:'warm-interior',position:[0,1,0],color:0xffffff},
  ])assert.throws(()=>validateCloudLayout({...fixture(),lights:[light]}),TypeError)
  for(const lights of [null,{},Array(4).fill(fixture().lights[0]),Array(2).fill(fixture().lights[0])]){
    assert.throws(()=>validateCloudLayout({...fixture(),lights}),TypeError)
  }
  const badOpen=fixture();badOpen.locations[0].open='yes'
  assert.throws(()=>validateCloudLayout(badOpen),/open.*boolean/)
})

// Same accepted-heading easing, speed, waypoint radius and 2 s blocked guard as
// the controller. This drives real Rapier steps; it never teleports between legs.
function walk(body,route,label){
  assert.ok(route&&route.length,`${label}: no connected guide path at ${JSON.stringify(body.position)}`)
  let heading=body.step(0).heading,frames=0,maxStep=0,minY=Infinity,blocked=0
  for(const [x,z] of route){
    let reached=false
    for(let frame=0;frame<2400;frame++){
      const p=body.position,dx=x-p.x,dz=z-p.z,length=Math.hypot(dx,dz)
      if(length<.17){reached=true;blocked=0;break}
      const ix=dx/length*.64,iz=dz/length*.64,next=Math.atan2(-ix,-iz)
      const intended=heading+Math.atan2(Math.sin(next-heading),Math.cos(next-heading))*Math.min(1,FIXED_TIMESTEP*10)
      const result=body.step(FIXED_TIMESTEP,{x:ix,z:iz,heading:intended})
      heading=result.heading;frames++;minY=Math.min(minY,result.position.y)
      const moved=Math.hypot(result.position.x-p.x,result.position.z-p.z)
      maxStep=Math.max(maxStep,moved)
      blocked=moved<FIXED_TIMESTEP*.12?blocked+FIXED_TIMESTEP:0
      assert.ok(blocked<=2,`${label}: blocked toward [${x},${z}] at ${JSON.stringify(result.position)}`)
      assert.ok(result.position.y> -2,`${label}: fell off a walking surface at ${JSON.stringify(result.position)}`)
      assert.ok(moved<=CLOUD_DOG_PROFILE.walkSpeed*FIXED_TIMESTEP+.04,`${label}: unexpected position jump ${moved} toward [${x},${z}] from ${JSON.stringify(p)} to ${JSON.stringify(result.position)}`)
    }
    assert.ok(reached,`${label}: failed to reach [${x},${z}] at ${JSON.stringify(body.position)}`)
  }
  return {label,frames,maxStep,minY,end:body.position}
}

test('real dog physics reaches all three synthetic rooms, crosses all ordered room pairs, and returns without teleporting',async t=>{
  const layout=fixture(),body=await createTraversal({...layout,character:CLOUD_DOG_PROFILE})
  t.after(()=>body.dispose())
  for(let frame=0;frame<60;frame++)body.step(FIXED_TIMESTEP)
  for(const from of destinations){
    walk(body,cloudGuideRoute(layout,body.position,false,from),`spawn to ${from}`)
    assert.equal(cloudLocationAt(layout,body.position),from)
    for(const to of destinations.filter(id=>id!==from)){
      walk(body,cloudGuideRoute(layout,body.position,false,to),`${from} to ${to}`)
      assert.equal(cloudLocationAt(layout,body.position),to)
      walk(body,cloudGuideRoute(layout,body.position,false,from),`${to} to ${from}`)
      assert.equal(cloudLocationAt(layout,body.position),from)
    }
    walk(body,cloudGuideRoute(layout,body.position,true),`${from} to spawn`)
    assert.ok(Math.hypot(body.position.x-layout.spawn[0],body.position.z-layout.spawn[2])<.2)
  }
})

test('real dog collision continues to block furniture instead of the path function bypassing it',async t=>{
  const layout=fixture()
  layout.colliders.push({id:'table',position:[-4,.65,-2],halfExtents:[1.1,.65,.45]})
  const body=await createTraversal({...layout,character:CLOUD_DOG_PROFILE})
  t.after(()=>body.dispose())
  for(let frame=0;frame<60;frame++)body.step(FIXED_TIMESTEP)
  assert.throws(()=>walk(body,cloudGuideRoute(layout,body.position),'blocked fixture'),/blocked toward/)
  assert.ok(body.position.z> -1.3,'A guide waypoint must never make the long dog pass through a table')
})

test('actual authored layout supports every available dog room and cross-room return route',async t=>{
  // For an unpublished candidate, explicitly set CLOUD_GUIDE_LAYOUT_FILE to its
  // private layout. Default uses only checked-in/current public assets, never a
  // workstation-specific path. Missing or malformed explicit candidates fail.
  const input=process.env.CLOUD_GUIDE_LAYOUT_FILE??new URL('../public/world/blender/cloud-courtyard-v2-layout.json',import.meta.url)
  const layout=validateCloudLayout(JSON.parse(await readFile(input,'utf8')))
  const available=destinations.filter(id=>layout.locations.some(room=>room.id===id&&room.open!==false)
    && (layout.guideRoutes?.[id]??(id==='agentic'?layout.guideToAgentic:null))?.length>=2)
  assert.ok(available.includes('agentic'))
  if(process.env.CLOUD_GUIDE_LAYOUT_FILE){
    const expected=(process.env.CLOUD_GUIDE_EXPECT_DESTINATIONS??'agentic,physical,entertainment').split(',')
    assert.deepEqual(available,expected,'The candidate must expose exactly its explicitly approved destinations')
  }
  const body=await createTraversal({...layout,character:CLOUD_DOG_PROFILE}),results=[]
  t.after(()=>body.dispose())
  for(let frame=0;frame<60;frame++)body.step(FIXED_TIMESTEP)
  for(const from of available){
    results.push(walk(body,cloudGuideRoute(layout,body.position,false,from),`spawn to ${from}`))
    assert.equal(cloudLocationAt(layout,body.position),from)
    for(const to of available.filter(id=>id!==from)){
      results.push(walk(body,cloudGuideRoute(layout,body.position,false,to),`${from} to ${to}`))
      assert.equal(cloudLocationAt(layout,body.position),to)
      results.push(walk(body,cloudGuideRoute(layout,body.position,false,from),`${to} to ${from}`))
      assert.equal(cloudLocationAt(layout,body.position),from)
    }
    results.push(walk(body,cloudGuideRoute(layout,body.position,true),`${from} to spawn`))
    assert.ok(Math.hypot(body.position.x-layout.spawn[0],body.position.z-layout.spawn[2])<.2)
    assert.ok(Math.abs(body.position.y-cloudGroundHeight(layout,layout.spawn[0],layout.spawn[2],layout.spawn[1]+.55))<.12)
  }
  t.diagnostic(JSON.stringify({available,results}))
})

test('authored closed door colliders block the dog on a level test floor and are unavailable to the guide',async t=>{
  const input=process.env.CLOUD_GUIDE_LAYOUT_FILE??new URL('../public/world/blender/cloud-courtyard-v2-layout.json',import.meta.url)
  const layout=validateCloudLayout(JSON.parse(await readFile(input,'utf8')))
  for(const room of layout.locations.filter(room=>destinations.includes(room.id)&&room.open===false)){
    const gate=layout.colliders.find(box=>box.id===`${room.id}-closed-gate`)
    assert.ok(gate,`${room.id}: a closed label must have a real gate collider`)
    assert.equal(cloudGuideRoute(layout,{x:layout.spawn[0],y:layout.spawn[1],z:layout.spawn[2]},false,room.id),null)
    const floorY=gate.position[1]-gate.halfExtents[1]
    // Isolate the actual exported gate on level support: a surrounding stair or
    // slope must not make a missing/broken gate look solid. This is a gate test,
    // not a claim that the deferred room has a complete exterior access route.
    const support={...floor,vertices:floor.vertices.map((v,i)=>i%3===1?floorY:v)}
    const config={colliders:[gate],surfaces:[support],spawn:[gate.position[0],floorY+.03,gate.position[2]+.85],character:CLOUD_DOG_PROFILE}
    const body=await createTraversal(config)
    t.after(()=>body.dispose())
    for(let frame=0;frame<360;frame++)body.step(FIXED_TIMESTEP,{x:0,z:-.64,heading:0})
    assert.ok(body.position.z>gate.position[2]+gate.halfExtents[2]+.55,`${room.id}: dog penetrated the closed leaf at ${JSON.stringify(body.position)}`)
    assert.ok(Math.abs(body.position.x-gate.position[0])<.1,`${room.id}: test must exercise the centre of the gate`)
    const control=await createTraversal({...config,colliders:[]});t.after(()=>control.dispose())
    for(let frame=0;frame<180;frame++)control.step(FIXED_TIMESTEP,{x:0,z:-.64,heading:0})
    assert.ok(control.position.z<gate.position[2]-.5,`${room.id}: support alone must not prevent crossing`)
    t.diagnostic(JSON.stringify({closedRoom:room.id,position:body.position}))
  }
})
