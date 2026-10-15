import assert from 'node:assert/strict'
import test from 'node:test'
import {readFile} from 'node:fs/promises'
import * as T from 'three'
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js'
import {plantFlexibility,breezeStrength} from '../src/components/editorial-home/world/settlement/cloudBreeze.mjs'
import {createCloudSurfaceEffects,creekCoordinates,CREEK_CENTRE} from '../src/components/editorial-home/world/settlement/cloudSurfaceEffects.mjs'

test('connected blades keep roots fixed and never alter turf',()=>{
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute([0,0,0,.02,0,0,0,.4,0,2,3,0,2.02,3,0,2,3.2,0],3));g.setIndex([0,1,2,3,4,5])
  const flex=plantFlexibility(g)
  assert.deepEqual([flex[0],flex[1],flex[3],flex[4]],[0,0,0,0]);assert.ok(flex[2]>flex[5]&&flex[2]<=.075)
  const scene=new T.Group(),ground=new T.Mesh(g,new T.MeshStandardMaterial());ground.name='Grass';scene.add(ground)
  const before=ground.material.onBeforeCompile,effect=createCloudSurfaceEffects(scene)
  assert.equal(ground.material.onBeforeCompile,before);assert.equal(effect.stats.plantVertices,0)
  effect.dispose();g.dispose();ground.material.dispose()
})

test('creek length increases downstream and continues down the island fall',()=>{
  let previous=-1
  for(const [x,z] of CREEK_CENTRE){const c=creekCoordinates(x,z);assert.ok(c.along>previous);previous=c.along;assert.ok(Math.abs(c.across)<.07);assert.ok(Math.abs(Math.hypot(c.dx,c.dz)-1)<1e-10)}
  assert.ok(creekCoordinates(6.1,10.9,-3).along>creekCoordinates(6.1,10.9,-1).along)
})

test('authored curved ivy fixes its high attachment and lets its low tip move',()=>{
  const geometry=new T.BufferGeometry()
  geometry.setAttribute('position',new T.Float32BufferAttribute([0,.4,0,.02,.4,0,.12,.1,.1],3))
  geometry.setIndex([0,1,2])
  assert.throws(()=>plantFlexibility(geometry,true),/root-to-tip UVs/)
  geometry.setAttribute('uv',new T.Float32BufferAttribute([0,0,0,1,1,.5],2))
  const flex=plantFlexibility(geometry,true)
  assert.deepEqual([flex[0],flex[1]],[0,0]);assert.ok(flex[2]>.035&&flex[2]<=.075)
  const root=new T.Group(),plant=new T.Mesh(geometry,new T.MeshStandardMaterial());plant.name='Leaf_Understory';root.add(plant)
  const effect=createCloudSurfaceEffects(root)
  assert.deepEqual([...geometry.attributes.cloudFlex.array],[...flex])
  effect.dispose();geometry.dispose();plant.material.dispose()
})

function shader(material){const s={uniforms:{},vertexShader:T.ShaderLib.standard.vertexShader,fragmentShader:T.ShaderLib.standard.fragmentShader};material.onBeforeCompile(s);return s}
test('water and rooted plant shaders share a bounded clock, preserve depth alpha and dispose only owned resources',()=>{
  const scene=new T.Group(),g=new T.PlaneGeometry(.3,.4),map=new T.Texture(),mat=new T.MeshStandardMaterial({map,alphaTest:.5})
  const plant=new T.Mesh(g,mat);plant.name='Leaf';scene.add(plant)
  const water=new T.Mesh(new T.PlaneGeometry(1,1),new T.MeshPhysicalMaterial({transmission:.16,transparent:true}));water.name='Water_Stream';scene.add(water)
  const waterOriginal=water.geometry,waterColor=water.material.color.clone(),waterRoughness=water.material.roughness,waterOpacity=water.material.opacity
  const effect=createCloudSurfaceEffects(scene),s=shader(mat),w=shader(water.material),depth=plant.customDepthMaterial
  assert.equal(depth.map,map);assert.equal(depth.alphaTest,.5);assert.equal(water.material.transmission,.96)
  assert.equal(water.material.thickness,.22);assert.equal(water.material.ior,1.333)
  assert.equal(water.material.depthWrite,true)
  assert.equal(s.uniforms.uBreezeTime,w.uniforms.uBreezeTime)
  assert.match(s.vertexShader,/cloudFlex/);assert.match(w.fragmentShader,/vCreek.y-uBreezeTime\*\.40/)
  assert.match(w.fragmentShader,/channelCentre/);assert.match(w.fragmentShader,/waterGrazing/)
  assert.equal(water.material.transparent,false);assert.notEqual(water.geometry,waterOriginal)
  assert.deepEqual(water.geometry.attributes.position.array,waterOriginal.attributes.position.array)
  assert.equal(waterOriginal.getAttribute('cloudFlow'),undefined)
  let waterGeometryDisposals=0;water.geometry.addEventListener('dispose',()=>waterGeometryDisposals++)
  effect.update(4,.5);assert.equal(s.uniforms.uBreezeTime.value,4);assert.equal(s.uniforms.uBreezeStrength.value,breezeStrength(.5))
  effect.update(4,.5);assert.equal(w.uniforms.uBreezeTime.value,4)
  assert.throws(()=>effect.update(Infinity,.2),/Finite/)
  let textureDisposals=0,depthDisposals=0;map.addEventListener('dispose',()=>textureDisposals++);depth.addEventListener('dispose',()=>depthDisposals++)
  effect.dispose();effect.dispose();assert.equal(depthDisposals,1);assert.equal(textureDisposals,0);assert.equal(plant.customDepthMaterial,undefined)
  assert.equal(waterGeometryDisposals,1);assert.equal(water.geometry,waterOriginal)
  assert.equal(water.material.transmission,.16);assert.equal(water.material.opacity,waterOpacity);assert.equal(water.material.roughness,waterRoughness);assert.ok(water.material.color.equals(waterColor))
  assert.equal(water.material.thickness,0);assert.equal(water.material.ior,1.5);assert.equal(water.material.attenuationDistance,Infinity);assert.equal(water.material.attenuationColor.getHex(),0xffffff);assert.ok(water.material.transparent)
  g.dispose();mat.dispose();map.dispose();water.geometry.dispose();water.material.dispose()
})

async function dogAsset(){
  const b=await readFile(new URL('../public/world/blender/cloud-dog-v1.glb',import.meta.url)),loader=new GLTFLoader()
  loader.register(()=>({name:'CPU_smooth_dog_test_textures',loadTexture:async()=>new T.Texture()}))
  return loader.parseAsync(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength),'')
}
test('delivery runtime excludes the deferred creek experiment and optical isolation',async()=>{
  const directory=new URL('../src/components/editorial-home/world/settlement/',import.meta.url)
  const surface=await readFile(new URL('cloudSurfaceEffects.mjs',directory),'utf8')
  const scene=await readFile(new URL('createCloudSettlement.ts',directory),'utf8')
  assert.match(surface,/CLOUD_CREEK_REVISION='r12k-water-03'/)
  assert.doesNotMatch(surface,/cloudCreekOptics|reviewWater|vPebbleHeight/)
  assert.doesNotMatch(scene,/cloudReviewWater|cloudReviewTime/)
})
test('submerged bed is upward-facing, bounded, static, and owns its pebble resources',()=>{
  const points=new T.CatmullRomCurve3(CREEK_CENTRE.map(([x,z])=>new T.Vector3(x,0,z)),false,'catmullrom',.5).getPoints(240)
  const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(points.flatMap((p,i)=>[p.x,5-i*.02,p.z]),3))
  const root=new T.Group(),water=new T.Mesh(geometry,new T.MeshStandardMaterial());water.name='Water_Stream';root.add(water)
  const effect=createCloudSurfaceEffects(root),bed=root.getObjectByName('Cloud submerged gravel bed'),pebbles=root.getObjectByName('Cloud submerged stream pebbles')
  assert.ok(bed&&pebbles);assert.equal(pebbles.count,2585);assert.ok(pebbles.count<2600)
  assert.equal(pebbles.geometry.attributes.position.count/3,80,'Rounded pebbles retain the deliberate detail increase')
  assert.ok(pebbles.geometry.attributes.position.count/3*pebbles.count<208000)
  for(const mesh of [bed,pebbles]){
    const mineral=shader(mesh.material)
    assert.match(mineral.vertexShader,/mineralPoint=instanceMatrix\*mineralPoint/)
    assert.match(mineral.fragmentShader,/mineralNoise\(vWetMineral\*/)
    assert.doesNotMatch(mineral.fragmentShader,/uBreezeTime|uTime/,'Bed mineral detail must not flow with the water')
    assert.deepEqual(mineral.uniforms,{})
  }
  const colour=new T.Color()
  for(let i=0;i<pebbles.count;i++){
    pebbles.getColorAt(i,colour)
    assert.ok(colour.r>=colour.g&&colour.g>=colour.b,'Wet gravel uses a correlated mineral palette, not random pastel channels')
    assert.ok(colour.r<=.260001&&colour.b>=.07)
  }
  const n=bed.geometry.attributes.normal;for(let i=0;i<n.count;i++)assert.ok(n.getY(i)>.1,'Bed should face toward the water surface')
  const matrices=pebbles.instanceMatrix.array.slice();effect.update(100,.8);assert.deepEqual(pebbles.instanceMatrix.array,matrices)
  let disposed=0;pebbles.geometry.addEventListener('dispose',()=>disposed++)
  effect.dispose();effect.dispose();assert.equal(disposed,1);assert.deepEqual(root.children,[water]);geometry.dispose();water.material.dispose()
})
test('dog retains original smooth materials without fur geometry or material injection',async()=>{
  const source=await readFile(new URL('../src/components/editorial-home/world/settlement/cloudDog.ts',import.meta.url),'utf8')
  assert.doesNotMatch(source,/createCloudFur|onBeforeCompile|updateEnvironment/)
  assert.match(source,/return \{\.\.\.createCloudDogRig\(asset, resources\), assetSha256:/)
  const asset=await dogAsset(),meshes=[],materials=new Set(),geometries=new Set(),textures=new Set(),skeletons=new Set()
  asset.scene.traverse(node=>{
    assert.doesNotMatch(node.name,/Cloud fine fur/)
    if(!node.isMesh)return
    meshes.push(node);geometries.add(node.geometry)
    if(node.isSkinnedMesh)skeletons.add(node.skeleton)
    for(const material of Array.isArray(node.material)?node.material:[node.material]){
      materials.add(material)
      for(const value of Object.values(material))if(value?.isTexture)textures.add(value)
      // Original smooth ear material is named "ear fur" in Blender; the name
      // alone is not a strand layer. Reject the added runtime layer instead.
      assert.doesNotMatch(material.name,/Cloud fine fur|undercoat/i)
      assert.equal(material.onBeforeCompile,T.Material.prototype.onBeforeCompile)
    }
  })
  assert.equal(meshes.length,10);assert.equal(materials.size,10)
  assert.ok(asset.animations.some(clip=>clip.name==='sit'))
  assert.ok(asset.animations.some(clip=>clip.name==='walk'))
  for(const resource of [...geometries,...materials,...textures,...skeletons])resource.dispose()
})
