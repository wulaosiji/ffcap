import assert from 'node:assert/strict'
import test from 'node:test'
import * as T from 'three'
import {createCloudGroundEffects,sampleGroundHabitat,CLOUD_GROUND_REVISION} from '../src/components/editorial-home/world/settlement/cloudGround.mjs'

test('grit is deterministic, bounded, grounded, outside the guide and completely disposed',()=>{
  const root=new T.Group();root.position.set(1,0,2);root.scale.z=-1
  const geometry=new T.PlaneGeometry(12,12,12,12);geometry.rotateX(-Math.PI/2)
  const grass=new T.Mesh(geometry,new T.MeshStandardMaterial());grass.name='Grass';root.add(grass)
  const options={guide:[[0,-20],[0,20]]},effect=createCloudGroundEffects(root,options)
  const stones=root.getObjectByName('Cloud rooted garden grit')
  assert.ok(stones);assert.ok(stones.count>0&&stones.count<=360)
  assert.equal(effect.stats.stones,stones.count)
  assert.equal(stones.geometry.attributes.position.count/3,80)
  const matrix=new T.Matrix4(),position=new T.Vector3(),rotation=new T.Quaternion(),scale=new T.Vector3()
  root.updateMatrixWorld(true)
  for(let i=0;i<stones.count;i++){
    stones.getMatrixAt(i,matrix);matrix.decompose(position,rotation,scale)
    position.applyMatrix4(stones.matrixWorld)
    assert.ok(Math.abs(position.x)>=.9-1e-6)
    assert.ok(scale.x>=.017-1e-6&&scale.x<=.043+1e-6)
    assert.ok(scale.y>=.009-1e-6&&scale.y<=.023+1e-6)
    assert.ok(Math.abs(position.y-scale.y*.65)<1e-6)
  }
  const transforms=stones.instanceMatrix.array.slice();let disposals=0
  for(const resource of [stones,stones.geometry,stones.material])resource.addEventListener('dispose',()=>disposals++)
  effect.dispose();effect.dispose();assert.equal(disposals,3);assert.equal(root.children.length,1)
  const again=createCloudGroundEffects(root,options)
  assert.deepEqual(root.getObjectByName('Cloud rooted garden grit').instanceMatrix.array,transforms)
  again.dispose();geometry.dispose();grass.material.dispose()
})

test('habitat responds to real creek height, tree roots and the lower guide, not roofs',()=>{
  const options={creek:[[0,2,0],[0,2,4]],guide:[[-3,8],[-3,3]]}
  assert.equal(sampleGroundHabitat([-8.7,.15,3.2],options)[0],1)
  assert.equal(sampleGroundHabitat([-8.7,4,3.2],options)[0],0)
  assert.equal(sampleGroundHabitat([.4,2,2],options)[1],1)
  assert.equal(sampleGroundHabitat([.4,6,2],options)[1],0)
  assert.equal(sampleGroundHabitat([-3,.1,6],options)[2],1)
  assert.equal(sampleGroundHabitat([-3,4,6],options)[2],0)
  for(let x=-12;x<12;x+=.4)for(let z=-12;z<12;z+=.4){
    const values=sampleGroundHabitat([x,.15,z],options)
    assert.ok(values.every(v=>Number.isFinite(v)&&v>=0&&v<=1))
    assert.deepEqual(values,sampleGroundHabitat([x,.15,z],options))
  }
  assert.throws(()=>sampleGroundHabitat([NaN,0,0]),/Finite/)
})

test('ground layers preserve geometry, positions, original maps and restore owned state only',()=>{
  const root=new T.Group(),geometry=new T.PlaneGeometry(3,3,3,3),map=new T.Texture(),material=new T.MeshStandardMaterial({map})
  geometry.rotateX(-Math.PI/2)
  const mesh=new T.Mesh(geometry,material);mesh.name='Grass';root.add(mesh)
  const building=new T.Mesh(new T.BoxGeometry(),new T.MeshStandardMaterial());building.name='Limestone';root.add(building)
  const vertices=geometry.attributes.position.array.slice(),indices=geometry.index.array.slice(),compile=material.onBeforeCompile,key=material.customProgramCacheKey,other=building.material.onBeforeCompile
  let disposed=0;map.addEventListener('dispose',()=>disposed++);geometry.addEventListener('dispose',()=>disposed++)
  const result=createCloudGroundEffects(root,{guide:[[0,0],[0,3]]})
  assert.equal(result.stats.vertices,16);assert.equal(result.stats.materials,1)
  assert.deepEqual(geometry.attributes.position.array,vertices);assert.deepEqual(geometry.index.array,indices)
  assert.equal(material.map,map);assert.equal(building.material.onBeforeCompile,other)
  const shader={vertexShader:T.ShaderLib.standard.vertexShader,fragmentShader:T.ShaderLib.standard.fragmentShader}
  material.onBeforeCompile(shader)
  assert.match(shader.vertexShader,/vGroundWorld=/);assert.doesNotMatch(shader.vertexShader,/transformed\s*[+*-]=/)
  assert.match(shader.fragmentShader,/groundSoil/);assert.match(shader.fragmentShader,/roughnessFactor=/)
  assert.match(shader.fragmentShader,/fwidth\(vGroundWorld/);assert.doesNotMatch(shader.fragmentShader,/\b(?:uBreezeTime|Date|time)\b/)
  assert.equal(material.customProgramCacheKey(),CLOUD_GROUND_REVISION)
  const owned=mesh.geometry;let ownedDisposals=0;owned.addEventListener('dispose',()=>ownedDisposals++)
  assert.notEqual(owned,geometry);assert.ok(owned.getAttribute('cloudHabitat'))
  result.dispose();result.dispose();assert.equal(disposed,0);assert.equal(ownedDisposals,1);assert.equal(mesh.geometry,geometry)
  assert.equal(material.onBeforeCompile,compile);assert.equal(material.customProgramCacheKey,key)
  assert.equal(geometry.getAttribute('cloudHabitat'),undefined)
  geometry.dispose();material.dispose();map.dispose();building.geometry.dispose();building.material.dispose()
})

test('water height is sampled from transformed authored water rather than a flat projected river',()=>{
  const root=new T.Group(),water=new T.Mesh(new T.PlaneGeometry(4,4),new T.MeshStandardMaterial())
  water.name='Water_Stream';water.geometry.rotateX(-Math.PI/2);water.position.y=4;root.add(water)
  const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute([0,4,0,0,0,0],3))
  const grass=new T.Mesh(geometry,new T.MeshStandardMaterial());grass.name='Grass';root.add(grass)
  const effect=createCloudGroundEffects(root,{creek:[[0,-2],[0,2]]})
  const habitat=grass.geometry.getAttribute('cloudHabitat')
  assert.equal(habitat.getY(0),1);assert.equal(habitat.getY(1),0)
  effect.dispose();geometry.dispose();grass.material.dispose();water.geometry.dispose();water.material.dispose()
})
