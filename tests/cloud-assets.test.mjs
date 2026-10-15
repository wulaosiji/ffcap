import assert from 'node:assert/strict'
import test from 'node:test'
import {readFile} from 'node:fs/promises'
import {createHash} from 'node:crypto'
import {BufferAttribute,BufferGeometry,DoubleSide,Group,Mesh,MeshBasicMaterial,MeshStandardMaterial,Matrix4,Raycaster,Vector3} from 'three'
import {createCloudGroundEffects} from '../src/components/editorial-home/world/settlement/cloudGround.mjs'
import {CREEK_CENTRE,createCloudSurfaceEffects} from '../src/components/editorial-home/world/settlement/cloudSurfaceEffects.mjs'
import {decodeDracoAccessors,inspectGLB,parseGLB} from '../scripts/world/blender/inspect_glb.mjs'
import {createTraversal,FIXED_TIMESTEP} from '../src/components/editorial-home/world/settlement/physics.mjs'
import {validateCloudLayout,cloudGuideRoute,cloudLocationAt} from '../src/components/editorial-home/world/settlement/cloudLayout.mjs'

const url=name=>new URL(`../public/world/blender/${name}`,import.meta.url)
// A private candidate must pass the identical real-geometry and route checks
// before promotion; choosing the input never changes an assertion or threshold.
const source=Promise.all([readFile(process.env.CLOUD_ENV_GLB??url('cloud-courtyard-v2.glb')),readFile(process.env.CLOUD_ENV_LAYOUT??url('cloud-courtyard-v2-layout.json'),'utf8')]).then(async([bytes,text])=>({bytes,...parseGLB(bytes),decoded:await decodeDracoAccessors(bytes),layout:validateCloudLayout(JSON.parse(text))}))

test('real decoded courtyard receives grounded grit outside the guide, within a fixed cost',async()=>{
  const {json,decoded,layout}=await source,root=new Group(),resources=[]
  const objects=json.nodes.map(node=>{
    const object=new Group()
    if(node.matrix){object.matrix.fromArray(node.matrix);object.matrixAutoUpdate=false}
    else{if(node.translation)object.position.fromArray(node.translation);if(node.rotation)object.quaternion.fromArray(node.rotation);if(node.scale)object.scale.fromArray(node.scale)}
    if(node.mesh!==undefined){const authored=json.meshes[node.mesh]
      if(authored.name==='Grass'||authored.name.startsWith('Water')||authored.name.startsWith('Creek_Bank_'))for(const primitive of authored.primitives){
        const geometry=new BufferGeometry(),material=new MeshStandardMaterial({side:DoubleSide})
        geometry.setAttribute('position',new BufferAttribute(decoded.get(primitive.attributes.POSITION).array,3))
        geometry.setIndex(new BufferAttribute(decoded.get(primitive.indices).array,1))
        const mesh=new Mesh(geometry,material);mesh.name=authored.name;object.add(mesh);resources.push(geometry,material)
      }
    }
    return object
  })
  json.nodes.forEach((node,index)=>(node.children||[]).forEach(child=>objects[index].add(objects[child])))
  for(const index of json.scenes[json.scene||0].nodes)root.add(objects[index])
  const effect=createCloudGroundEffects(root,{creek:CREEK_CENTRE,guide:layout.guideToAgentic})
  try{
    const stones=root.getObjectByName('Cloud rooted garden grit'),grass=root.getObjectByName('Grass')
    assert.ok(stones?.count>0&&stones.count<=360,'Real authored turf must receive decoration')
    assert.equal(effect.stats.stones,stones.count)
    root.updateMatrixWorld(true)
    const bankNames=['Creek_Bank_Soil','Creek_Bank_Stone']
    if((process.env.CLOUD_ENV_GLB??'').includes('r12l-bank-'))for(const name of bankNames)assert.ok(root.getObjectByName(name),'Private bank candidate must contain its real added mesh')
    for(const name of bankNames){
      const bank=root.getObjectByName(name)
      if(!bank)continue
      const point=new Vector3(),positions=bank.geometry.attributes.position,route=[layout.spawn.filter((_v,i)=>i!==1),...layout.guideToAgentic]
      let clearance=Infinity
      for(let i=0;i<positions.count;i++){
        point.fromBufferAttribute(positions,i).applyMatrix4(bank.matrixWorld)
        for(let j=1;j<route.length;j++){
          const a=route[j-1],b=route[j],dx=b[0]-a[0],dz=b[1]-a[1],length=dx*dx+dz*dz
          const u=length?Math.max(0,Math.min(1,((point.x-a[0])*dx+(point.z-a[1])*dz)/length)):0
          clearance=Math.min(clearance,Math.hypot(point.x-a[0]-u*dx,point.z-a[1]-u*dz))
        }
      }
      assert.ok(clearance>1.049,'Every actual new bank vertex must clear the full guided corridor')
      console.log(JSON.stringify({bank:name,vertices:positions.count,minimumGuideClearance:clearance}))
    }
    const matrix=new Matrix4(),p=new Vector3(),ray=new Raycaster(),down=new Vector3(0,-1,0)
    let minimum=Infinity
    for(let i=0;i<stones.count;i++){
      stones.getMatrixAt(i,matrix);p.setFromMatrixPosition(matrix).applyMatrix4(stones.matrixWorld)
      for(let j=1;j<layout.guideToAgentic.length;j++){
        const a=layout.guideToAgentic[j-1],b=layout.guideToAgentic[j],dx=b[0]-a[0],dz=b[1]-a[1]
        const u=Math.max(0,Math.min(1,((p.x-a[0])*dx+(p.z-a[1])*dz)/Math.max(1e-12,dx*dx+dz*dz)))
        minimum=Math.min(minimum,Math.hypot(p.x-a[0]-u*dx,p.z-a[1]-u*dz))
      }
      ray.set(p,down);ray.far=.03
      assert.ok(ray.intersectObject(grass,false).length,'Every stone centre must lie immediately above real turf')
    }
    assert.ok(minimum>=.89999)
    console.log(JSON.stringify({groundVertices:effect.stats.vertices,stones:stones.count,instancedTriangles:stones.count*80,minimumGuideDistance:minimum}))
    const waterEffect=createCloudSurfaceEffects(root)
    try{
      root.updateMatrixWorld(true)
      const bed=root.getObjectByName('Cloud submerged gravel bed'),water=root.getObjectByName('Water_Stream')
      assert.ok(bed&&water)
      for(const [x,z] of [[7.2,-.4],[.4,1.7],[.9,5.5],[4.5,7.2]]){
        ray.set(new Vector3(x,30,z),down);ray.far=60
        const top=ray.intersectObject(water,false)[0]?.point.y,base=ray.intersectObject(bed,false)[0]?.point.y,turf=ray.intersectObject(grass,false)[0]?.point.y
        assert.ok(Number.isFinite(top)&&Number.isFinite(base)&&Number.isFinite(turf))
        assert.ok(top-base>.18&&top-base<.32,'Visible creek bed must stay submerged at shallow depth')
        assert.ok(base>turf+.005,'Foreground gravel must not be hidden below authored turf')
      }
    }finally{waterEffect.dispose()}
  }finally{effect.dispose();resources.forEach(resource=>resource.dispose())}
})

test('V2 island genuinely decodes, has a deep foundation and stays inside its explicitly selected rendering budget',async()=>{
  const environmentTriangleBudget=Number(process.env.CLOUD_ENV_TRIANGLE_BUDGET??350000)
  assert.ok(Number.isSafeInteger(environmentTriangleBudget)&&environmentTriangleBudget>0)
  const {bytes,decoded,layout}=await source,result=inspectGLB(bytes,'environment',decoded,{environmentTriangleBudget})
  assert.equal(result.environmentTriangleBudget,environmentTriangleBudget)
  assert.deepEqual(result.errors,[])
  assert.equal(layout.assetSha256,createHash('sha256').update(bytes).digest('hex'),'The collision manifest must identify the exact GLB')
  assert.ok(result.decodedAccessors>0)
  assert.ok(result.bounds.min[1]<-10,'A thin plane is not the approved floating island')
  assert.ok(result.bounds.max[1]>8)
  assert.ok(result.bounds.max[0]-result.bounds.min[0]<30,'Keep the detailed courtyard compact')
  for(const id of ['agentic','physical','entertainment','bridge'])assert.ok(layout.locations.some(place=>place.id===id))
})

test('current guided courtyard opens only Agentic and keeps deferred interiors out of routes and lighting',async()=>{
  const {layout}=await source
  assert.deepEqual(layout.locations.filter(room=>['agentic','physical','entertainment'].includes(room.id)&&room.open!==false).map(room=>room.id),['agentic'])
  assert.deepEqual(Object.keys(layout.guideRoutes),['agentic'])
  assert.deepEqual(layout.lights.map(light=>light.id),['agentic-pendant'])
  for(const id of ['physical','entertainment']){
    const gate=layout.colliders.find(box=>box.id===`${id}-closed-gate`)
    assert.ok(gate&&gate.halfExtents[1]*2>=3,'Deferred doors must be full-height, not waist-high barriers')
    assert.ok(!layout.colliders.some(box=>box.id.startsWith(`${id}-open-door-`)))
  }
})

test('V2 explorer has complete original clothing geometry, a valid anatomical rig and all three motions',async()=>{
  const bytes=await readFile(url('explorer-v2.glb')),decoded=await decodeDracoAccessors(bytes)
  const result=inspectGLB(bytes,'character',decoded)
  const manifest=JSON.parse(await readFile(url('explorer-v2-asset.json'),'utf8'))
  assert.equal(manifest.schemaVersion,1)
  assert.equal(manifest.sha256,createHash('sha256').update(bytes).digest('hex'))
  assert.equal(manifest.bytes,bytes.length)
  assert.deepEqual(result.errors,[])
  assert.ok(result.skinnedMeshes>=1)
  assert.ok(Math.abs(result.bounds.min[1])<.01)
  assert.ok(Math.abs(result.bounds.max[1]-1.74)<.015)
  assert.deepEqual(result.animations.map(item=>item.name).sort(),['idle','run','walk'])
})

test('the actual V2 bridge and doorway permit a complete guided walk and return without teleportation',async t=>{
  const {layout}=await source,traversal=await createTraversal(layout)
  t.after(()=>traversal.dispose())
  for(let i=0;i<60;i++)traversal.step(FIXED_TIMESTEP)
  assert.ok(Math.abs(traversal.position.y-layout.spawn[1])<.12)
  const walk=route=>{
    assert.ok(route&&route.length,'The current physical position must join the documented route')
    for(const [x,z] of route){
      let reached=false
      for(let frame=0;frame<800;frame++){
        const p=traversal.position,dx=x-p.x,dz=z-p.z,distance=Math.hypot(dx,dz)
        if(distance<.17){reached=true;break}
        const result=traversal.step(FIXED_TIMESTEP,{x:dx/distance*.64,z:dz/distance*.64})
        assert.ok(result.position.y>-.5,`Fell off guide at ${JSON.stringify(result.position)}`)
      }
      assert.ok(reached,`Blocked on route to ${x},${z} at ${JSON.stringify(traversal.position)}`)
    }
  }
  walk(cloudGuideRoute(layout,traversal.position))
  assert.equal(cloudLocationAt(layout,traversal.position),'agentic')
  walk(cloudGuideRoute(layout,traversal.position,true))
  assert.ok(Math.hypot(traversal.position.x-layout.spawn[0],traversal.position.z-layout.spawn[2])<.2)
})

test('V2 collision floor samples correspond to actual decoded visible GLB geometry',async t=>{
  const {json,decoded,layout}=await source,material=new MeshBasicMaterial({side:DoubleSide}),root=new Group(),meshes=[],geometries=[]
  const objects=json.nodes.map(node=>{
    const object=new Group()
    if(node.matrix){object.matrix.fromArray(node.matrix);object.matrixAutoUpdate=false}
    else{if(node.translation)object.position.fromArray(node.translation);if(node.rotation)object.quaternion.fromArray(node.rotation);if(node.scale)object.scale.fromArray(node.scale)}
    if(node.mesh!==undefined)for(const primitive of json.meshes[node.mesh].primitives){
      const positions=decoded.get(primitive.attributes.POSITION),indices=decoded.get(primitive.indices)
      assert.ok(positions&&indices,'The browser decoder must resolve every environment primitive')
      const geometry=new BufferGeometry();geometry.setAttribute('position',new BufferAttribute(positions.array,3));geometry.setIndex(new BufferAttribute(indices.array,1))
      const mesh=new Mesh(geometry,material);mesh.name=json.meshes[node.mesh].name;object.add(mesh);meshes.push(mesh);geometries.push(geometry)
    }
    return object
  })
  json.nodes.forEach((node,index)=>(node.children||[]).forEach(child=>objects[index].add(objects[child])))
  for(const index of json.scenes[json.scene||0].nodes)root.add(objects[index])
  root.updateMatrixWorld(true)
  t.after(()=>{geometries.forEach(g=>g.dispose());material.dispose();root.clear()})
  const ray=new Raycaster(),down=new Vector3(0,-1,0)
  const masonry=meshes.filter(mesh=>/^Bridge_Masonry_(Light|Shade)$/.test(mesh.name))
  if(/r12(?:o-bridge|p-wood)-/.test(process.env.CLOUD_ENV_GLB??''))assert.equal(masonry.length,2,'Bridge and subsequent wood candidates must retain both actual masonry meshes')
  if(masonry.length){
    const bridge=layout.surfaces.find(s=>s.id==='curved-low-stone-bridge'),sides=[[],[]]
    for(let i=0;i<bridge.vertices.length;i+=6)for(let side=0;side<2;side++)sides[side].push(bridge.vertices.slice(i+side*3,i+side*3+3))
    // Measure against actual deck edges, not the nearest centreline station:
    // on the inside of this curved bridge the latter lies far along the bend.
    const point=new Vector3();let clearance=Infinity,maxEdgeOffset=0,minSignedOffset=Infinity,total=0,worst
    for(const mesh of masonry){const positions=mesh.geometry.attributes.position
      for(let i=0;i<positions.count;i++){
        point.fromBufferAttribute(positions,i).applyMatrix4(mesh.matrixWorld)
        let nearest=Infinity,deck,signed
        for(let side=0;side<2;side++)for(let j=1;j<sides[side].length;j++){
          const a=sides[side][j-1],b=sides[side][j],dx=b[0]-a[0],dz=b[2]-a[2]
          const u=Math.max(0,Math.min(1,((point.x-a[0])*dx+(point.z-a[2])*dz)/(dx*dx+dz*dz)))
          const distance=Math.hypot(point.x-a[0]-dx*u,point.z-a[2]-dz*u)
          if(distance<nearest){
            nearest=distance;deck=a[1]+(b[1]-a[1])*u
            const otherA=sides[1-side][j-1],otherB=sides[1-side][j]
            const nx=a[0]+dx*u-otherA[0]-(otherB[0]-otherA[0])*u,nz=a[2]+dz*u-otherA[2]-(otherB[2]-otherA[2])*u
            signed=((point.x-a[0]-dx*u)*nx+(point.z-a[2]-dz*u)*nz)/Math.hypot(nx,nz)
          }
        }
        if(deck-point.y<clearance)worst={point:point.toArray(),deck,nearest,mesh:mesh.name}
        clearance=Math.min(clearance,deck-point.y);maxEdgeOffset=Math.max(maxEdgeOffset,nearest);minSignedOffset=Math.min(minSignedOffset,signed);total++
      }
    }
    console.log(JSON.stringify({bridgeMasonryVertices:total,minimumDeckClearance:clearance,maxEdgeOffset,minSignedOffset,worst}))
    assert.ok(clearance>.075,`Every actual beveled masonry vertex stays below the walking deck: ${clearance}`)
    assert.ok(maxEdgeOffset<.10&&minSignedOffset>-.004,`Masonry hugs the actual exterior deck edge: ${maxEdgeOffset}, ${minSignedOffset}`)
  }
  // Ray-test both closed leaves at three heights against the decoded GLB. A
  // collider-only gate would otherwise pass physical tests while remaining open.
  for(const gate of layout.colliders.filter(box=>box.id?.endsWith('-closed-gate'))){
    const bottom=gate.position[1]-gate.halfExtents[1],front=gate.position[2]+gate.halfExtents[2]
    for(const dx of [-.25,.25])for(const dy of [.5,1.5,2.3]){
      ray.set(new Vector3(gate.position[0]+dx,bottom+dy,front+.4),new Vector3(0,0,-1));ray.far=.8
      assert.ok(ray.intersectObjects(meshes,false).some(hit=>Math.abs(hit.point.z-front)<.035),`${gate.id}: no visible wooden leaf at ${dx},${dy}`)
    }
  }
  // Check triangle interiors on the authored bridge and every room floor. Decorative
  // grass is not counted as support; select the decoded surface closest to it.
  for(const surface of layout.surfaces.filter(s=>/curved-low-stone-bridge|^(agentic|physical|entertainment)-floor$/.test(s.id))){
    const {vertices:v,indices}=surface
    for(let n=0;n<indices.length;n+=6){
      const ids=indices.slice(n,n+3).map(i=>i*3)
      const x=ids.reduce((sum,i)=>sum+v[i],0)/3,y=ids.reduce((sum,i)=>sum+v[i+1],0)/3,z=ids.reduce((sum,i)=>sum+v[i+2],0)/3
      ray.set(new Vector3(x,y+.12,z),down);ray.far=.24
      const hits=ray.intersectObjects(meshes,false)
      assert.ok(hits.some(hit=>Math.abs(hit.point.y-y)<.035),`${surface.id}: collision has no matching visible support at ${x},${y},${z}`)
    }
  }
})
