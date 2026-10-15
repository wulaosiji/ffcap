import * as T from 'three'
import {BREEZE_GLSL,breezeStrength,plantFlexibility} from './cloudBreeze.mjs'
import {attachOutletCascade} from './cloudOutletCascade.mjs'

// Authored creek control points, in downstream order. UV length and tangent are
// derived once from the real water vertices, not a texture scrolling across land.
export const CREEK_CENTRE = [[6.4,-11.3],[8.7,-8.8],[9.5,-6.8],[9.2,-4.4],[9,-2.1],[7.2,-.4],[4.6,.5],[.4,1.7],[-2,3.7],[.9,5.5],[4.5,7.2],[6,9.5],[6.1,10.7]]
export const CLOUD_CREEK_REVISION='r12k-water-03'
// Fixed world-space mineral detail belongs to the bed, not to flowing water.
// These are owned materials; no authored material or geometry is overwritten.
function shadeWetMineral(material,sediment=false){
  material.onBeforeCompile=shader=>{
    shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vWetMineral;')
      .replace('#include <project_vertex>',`#include <project_vertex>
        vec4 mineralPoint=vec4(transformed,1.0);
        #ifdef USE_INSTANCING
          mineralPoint=instanceMatrix*mineralPoint;
        #endif
        vWetMineral=(modelMatrix*mineralPoint).xyz;`)
    shader.fragmentShader=shader.fragmentShader.replace('#include <common>',`#include <common>
      varying vec3 vWetMineral;
      float mineralHash(vec3 p){return fract(sin(dot(p,vec3(127.1,311.7,74.7)))*43758.5453);}
      float mineralNoise(vec3 p){
        vec3 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);
        return mix(mix(mix(mineralHash(i),mineralHash(i+vec3(1,0,0)),f.x),
          mix(mineralHash(i+vec3(0,1,0)),mineralHash(i+vec3(1,1,0)),f.x),f.y),
          mix(mix(mineralHash(i+vec3(0,0,1)),mineralHash(i+vec3(1,0,1)),f.x),
          mix(mineralHash(i+vec3(0,1,1)),mineralHash(i+vec3(1,1,1)),f.x),f.y),f.z);
      }`)
      .replace('#include <color_fragment>',`#include <color_fragment>
        float mineralBody=mineralNoise(vWetMineral*${sediment?'19.0':'35.0'});
        float mineralGrain=mineralNoise(vWetMineral*${sediment?'130.0':'210.0'});
        diffuseColor.rgb*=mix(${sediment?'0.46,1.25':'0.64,1.12'},mineralBody);
        diffuseColor.rgb*=mix(.82,1.08,mineralGrain);`)
      .replace('#include <roughnessmap_fragment>',`#include <roughnessmap_fragment>
        roughnessFactor=clamp(roughnessFactor+(mineralBody-.5)*.14,.28,.94);`)
  }
  material.customProgramCacheKey=()=>`${CLOUD_CREEK_REVISION}-mineral-${sediment}`
}
const curve = new T.CatmullRomCurve3(CREEK_CENTRE.map(([x,z])=>new T.Vector3(x,0,z)),false,'catmullrom',.5)
export function createCreekCoordinates(centre){
const samples=centre.map(([x,z])=>new T.Vector3(x,0,z)), lengths=[0]
for(let i=1;i<samples.length;i++)lengths[i]=lengths[i-1]+samples[i].distanceTo(samples[i-1])
return function coordinates(x,z,y=0) {
  let best=Infinity,along=0,across=0,dx=0,dz=1
  for(let i=1;i<samples.length;i++) {
    const a=samples[i-1],b=samples[i],sx=b.x-a.x,sz=b.z-a.z,len=Math.hypot(sx,sz)
    if(len<1e-8)continue
    const u=T.MathUtils.clamp(((x-a.x)*sx+(z-a.z)*sz)/(len*len),0,1)
    const px=x-a.x-u*sx,pz=z-a.z-u*sz,d=px*px+pz*pz
    if(d<best){best=d;along=lengths[i-1]+u*len;across=(px*sz-pz*sx)/len;dx=sx/len;dz=sz/len}
  }
  // The island edge falls along -Y, rather than looking like upward rain.
  if(z>10.6&&y<-.05)along+=Math.max(0,-y)*1.4
  return {along,across,dx,dz}
}
}
export const creekCoordinates=createCreekCoordinates(curve.getPoints(240).map(p=>[p.x,p.z]))

export function createCloudSurfaceEffects(root,{creekCentre}={}) {
  const coordinates=creekCentre?createCreekCoordinates(creekCentre):creekCoordinates
  const samples=creekCentre?creekCentre.map(([x,z])=>new T.Vector3(x,0,z)):curve.getPoints(240)
  const time={value:0},strength={value:breezeStrength(0)},patched=[],ownedDepth=[],ownedMeshes=[],ownedWaterGeometry=[],waterStates=[]
  const cascades=[]
  let creekMesh
  let disposed=false,plantVertices=0,waterVertices=0
  root.updateMatrixWorld(true)
  root.traverse(mesh=>{
    if(!(mesh instanceof T.Mesh))return
    const cascade=attachOutletCascade(mesh,time)
    if(cascade){cascades.push(cascade);waterVertices+=mesh.geometry.attributes.position.count;return}
    const materials=Array.isArray(mesh.material)?mesh.material:[mesh.material]
    const water=/^Water(?:_|$)/i.test(mesh.name)
    const plant=/^Leaf(?:_|$)/i.test(mesh.name)||materials.some(m=>/^fern_/i.test(m.name))
    if(!water&&!plant)return
    if(plant) {
      const rootedUV=mesh.userData.cloudRootedUvBreeze===true||/^Leaf(?:_Light)?_Understory$/.test(mesh.name)
      mesh.geometry.setAttribute('cloudFlex',new T.BufferAttribute(plantFlexibility(mesh.geometry,rootedUV),1));plantVertices+=mesh.geometry.attributes.position.count
      const inject=shader=>{
        shader.uniforms.uBreezeTime=time;shader.uniforms.uBreezeStrength=strength
        shader.vertexShader=shader.vertexShader.replace('#include <common>',`#include <common>\n${BREEZE_GLSL}\nattribute float cloudFlex;`)
          .replace('#include <project_vertex>',`mat4 plantMatrix=modelMatrix;
            #ifdef USE_INSTANCING
              plantMatrix=modelMatrix*instanceMatrix;
            #endif
            vec3 plantWorld=(plantMatrix*vec4(transformed,1.0)).xyz;
            vec3 wind=cloudBreeze(plantWorld)*cloudFlex;
            transformed += vec3(dot(wind,normalize(plantMatrix[0].xyz)),dot(wind,normalize(plantMatrix[1].xyz)),dot(wind,normalize(plantMatrix[2].xyz)));
            #include <project_vertex>`)
      }
      // Match the silhouette in the existing directional shadow pass.
      const depth=new T.MeshDepthMaterial({depthPacking:T.RGBADepthPacking,side:T.DoubleSide})
      depth.map=materials[0].map;depth.alphaMap=materials[0].alphaMap;depth.alphaTest=materials[0].alphaTest
      depth.onBeforeCompile=inject;depth.customProgramCacheKey=()=> 'cloud-plant-depth-r01'
      ownedDepth.push({mesh,depth,previous:mesh.customDepthMaterial});mesh.customDepthMaterial=depth
      for(const material of materials) {
        patched.push({material,compile:material.onBeforeCompile,key:material.customProgramCacheKey})
        material.onBeforeCompile=inject;material.customProgramCacheKey=()=> 'cloud-rooted-breeze-r01';material.needsUpdate=true
      }
    }
    if(water) {
      // Auxiliary trough/outlet planes must not replace the authored channel.
      // Keep the most detailed water surface regardless of traversal order.
      if(!creekMesh||mesh.geometry.attributes.position.count>creekMesh.geometry.attributes.position.count)creekMesh=mesh
      const originalGeometry=mesh.geometry
      mesh.geometry=originalGeometry.clone();ownedWaterGeometry.push({mesh,original:originalGeometry,geometry:mesh.geometry})
      const p=mesh.geometry.attributes.position,uv=new Float32Array(p.count*2),tangent=new Float32Array(p.count*2),v=new T.Vector3()
      for(let i=0;i<p.count;i++){
        v.fromBufferAttribute(p,i).applyMatrix4(mesh.matrixWorld)
        const c=coordinates(v.x,v.z,v.y);uv.set([c.across,c.along],i*2);tangent.set([c.dx,c.dz],i*2)
      }
      mesh.geometry.setAttribute('cloudFlow',new T.BufferAttribute(uv,2));mesh.geometry.setAttribute('cloudTangent',new T.BufferAttribute(tangent,2));waterVertices+=p.count
      for(const material of materials){
        patched.push({material,compile:material.onBeforeCompile,key:material.customProgramCacheKey})
        waterStates.push({material,color:material.color.clone(),roughness:material.roughness,metalness:material.metalness,opacity:material.opacity,depthWrite:material.depthWrite,transparent:material.transparent,envMapIntensity:material.envMapIntensity,transmission:material.transmission,thickness:material.thickness,ior:material.ior,attenuationColor:material.attenuationColor?.clone(),attenuationDistance:material.attenuationDistance})
        material.color.setRGB(.065,.115,.095)
        material.roughness=.14;material.metalness=0;material.opacity=1;material.depthWrite=false;material.transparent=true
        material.envMapIntensity=.85
        // The authored physical water refracts the actual opaque scene. This
        // deliberately pays for the transmission pass; do not also alpha-blend
        // an unrefracted bed over it. Standard materials keep the alpha fallback.
        if(material.isMeshPhysicalMaterial){
          material.color.setRGB(.72,.87,.81);material.roughness=.025
          material.transmission=.96;material.thickness=.22;material.ior=1.333
          material.attenuationColor.setRGB(.60,.78,.70);material.attenuationDistance=1.8
          material.transparent=false;material.depthWrite=true
        }
        material.onBeforeCompile=shader=>{
          shader.uniforms.uBreezeTime=time;shader.uniforms.uBreezeStrength=strength
          shader.vertexShader=shader.vertexShader.replace('#include <common>',`#include <common>\nattribute vec2 cloudFlow; attribute vec2 cloudTangent; varying vec2 vCreek; varying vec2 vCreekTangent;`)
            .replace('#include <begin_vertex>','#include <begin_vertex>\nvCreek=cloudFlow;vCreekTangent=cloudTangent;')
          shader.fragmentShader=shader.fragmentShader.replace('#include <common>',`#include <common>\nvarying vec2 vCreek;varying vec2 vCreekTangent;uniform float uBreezeTime;uniform float uBreezeStrength;`)
            .replace('#include <normal_fragment_maps>',`#include <normal_fragment_maps>
              float travel=vCreek.y-uBreezeTime*.40;
              float ripple=sin(travel*14.0+sin(vCreek.x*13.0+travel*2.4)*.75);
              float fine=sin(travel*29.0+vCreek.x*31.0)*.36;
              vec3 flowDirection=normalize(vec3(vCreekTangent.x,0.0,vCreekTangent.y));
              vec3 sideDirection=vec3(flowDirection.z,0.0,-flowDirection.x);
              vec3 perturb=flowDirection*(ripple+fine)*.13+sideDirection*cos(vCreek.x*22.0-travel*7.0)*.045;
              normal=normalize(normal+mat3(viewMatrix)*perturb*(.8+uBreezeStrength*.2));`)
            .replace('#include <color_fragment>',`#include <color_fragment>
              float flowPhase=vCreek.y-uBreezeTime*.40;
              float ribbons=sin(vCreek.x*33.0+sin(flowPhase*2.1)*1.3);
              float broken=sin(flowPhase*17.0+vCreek.x*7.0)*sin(flowPhase*4.3-vCreek.x*13.0);
              float edge=smoothstep(.22,.50,abs(vCreek.x));
              float foam=smoothstep(.88,.99,ribbons)*smoothstep(.22,.68,broken)*(.13+edge*.40);
              float channelCentre=1.0-smoothstep(.05,.65,abs(vCreek.x));
              diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.68,.78,.73),foam);
              diffuseColor.a=.20+.32*channelCentre*channelCentre+foam*.18;`)
            .replace('#include <opaque_fragment>',`float waterGrazing=pow(1.0-clamp(dot(normal,normalize(vViewPosition)),0.0,1.0),5.0);
              diffuseColor.a=clamp(diffuseColor.a+waterGrazing*.32,.10,.78);
              #include <opaque_fragment>`)
        }
        material.customProgramCacheKey=()=> CLOUD_CREEK_REVISION;material.needsUpdate=true
      }
    }
  })
  // A shallow, fixed pebble bed gives transparent water a real depth reference.
  // These stones follow the existing channel; they never collide with the guide.
  if(creekMesh&&creekMesh.geometry.attributes.position.count>100){
    const p=creekMesh.geometry.attributes.position,waterPositions=[]
    for(let i=0;i<p.count;i++)waterPositions.push(new T.Vector3().fromBufferAttribute(p,i).applyMatrix4(creekMesh.matrixWorld))
    const bed=[],faces=[],placements=[],matrix=new T.Matrix4(),q=new T.Quaternion(),scale=new T.Vector3(),v=new T.Vector3()
    let seed=9062026;const rng=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296}
    for(let i=1;i<samples.length-5;i++){
      const a=samples[i],b=samples[i+1],dx=b.x-a.x,dz=b.z-a.z,len=Math.hypot(dx,dz)
      if(len<1e-8)continue
      const closest=waterPositions.reduce((best,p)=>(p.x-a.x)**2+(p.z-a.z)**2<(best.x-a.x)**2+(best.z-a.z)**2?p:best)
      const y=closest.y-.25+.009*Math.sin(i*.47),off=.435+.028*Math.sin(i*.31)+.018*Math.sin(i*1.71),base=bed.length/3
      bed.push(a.x+dz/len*off,y,a.z-dx/len*off,a.x-dz/len*off,y,a.z+dx/len*off)
      if(base>=2)faces.push(base-2,base-1,base,base-1,base+1,base)
      for(let j=0;j<11;j++){
        const across=((j+rng())/11-.5)*off*1.9,along=rng(),r=.035+rng()*.045
        v.set(a.x+dx*along+dz/len*across,y+.025,a.z+dz*along-dx/len*across)
        q.setFromEuler(new T.Euler(rng()*.5,rng()*Math.PI,rng()*.5));scale.set(r,.025+rng()*.035,r*(.65+rng()*.6))
        // Correlated wet mineral colours: independent RGB channels produced
        // pastel pink/green pebbles that looked dry under the bright sky.
        const tone=.10+rng()*.16,warm=rng();rng()
        matrix.compose(v,q,scale);placements.push({matrix:matrix.clone(),color:new T.Color().setRGB(tone,tone*(.88+warm*.07),tone*(.71+warm*.16))})
      }
    }
    const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(bed,3));geometry.setIndex(faces);geometry.computeVertexNormals()
    const material=new T.MeshStandardMaterial({color:'#655d4e',roughness:.92,metalness:0})
    shadeWetMineral(material,true)
    const floor=new T.Mesh(geometry,material);floor.name='Cloud submerged gravel bed';floor.receiveShadow=true;root.add(floor);ownedMeshes.push(floor)
    const stones=new T.InstancedMesh(new T.IcosahedronGeometry(1,1),new T.MeshStandardMaterial({color:'#ffffff',roughness:.40,metalness:0}),placements.length)
    shadeWetMineral(stones.material)
    stones.name='Cloud submerged stream pebbles';stones.receiveShadow=true;stones.castShadow=false
    placements.forEach((p,i)=>{stones.setMatrixAt(i,p.matrix);stones.setColorAt(i,p.color)});stones.computeBoundingSphere();root.add(stones);ownedMeshes.push(stones)
  }
  return {
    stats:{plantVertices,waterVertices},
    update(seconds,wind=0){if(disposed)return;if(!Number.isFinite(seconds))throw new TypeError('Finite surface clock required');time.value=seconds;strength.value=breezeStrength(wind)},
    dispose(){if(disposed)return;disposed=true;for(const cascade of cascades)cascade.dispose();for(const item of patched){item.material.onBeforeCompile=item.compile;item.material.customProgramCacheKey=item.key;item.material.needsUpdate=true}for(const state of waterStates){const {material,color,...values}=state;material.color.copy(color);for(const [key,value] of Object.entries(values))if(value!==undefined){if(value?.isColor)material[key].copy(value);else material[key]=value}}for(const item of ownedWaterGeometry){item.mesh.geometry=item.original;item.geometry.dispose()}for(const item of ownedDepth){item.mesh.customDepthMaterial=item.previous;item.depth.dispose()}for(const mesh of ownedMeshes){mesh.removeFromParent();mesh.geometry.dispose();mesh.material.dispose();if(mesh.isInstancedMesh)mesh.dispose()}},
  }
}
