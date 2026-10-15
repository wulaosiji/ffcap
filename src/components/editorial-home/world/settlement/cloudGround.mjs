import * as T from 'three'

export const CLOUD_GROUND_REVISION='r12h-ground-04'
const clamp=T.MathUtils.clamp,smooth=T.MathUtils.smoothstep
function distanceToLine(p,points,dimensions){
  let result=Infinity
  for(let i=1;i<points.length;i++){
    const a=points[i-1],b=points[i]
    let dot=0,length=0
    for(const k of dimensions){dot+=(p[k]-a[k])*(b[k]-a[k]);length+=(b[k]-a[k])**2}
    const t=clamp(dot/Math.max(1e-12,length),0,1)
    let squared=0
    for(const k of dimensions)squared+=(p[k]-a[k]-(b[k]-a[k])*t)**2
    result=Math.min(result,Math.sqrt(squared))
  }
  return result
}

/** Metre-space habitat fields, not procedural displacement or new walk rules. */
export function sampleGroundHabitat(position,{creek=[],guide=[],guides=[guide],pathWear=1}={}){
  if(position.length!==3||!position.every(Number.isFinite))throw new TypeError('Finite ground position required')
  if(!Number.isFinite(pathWear)||pathWear<0||pathWear>1)throw new TypeError('Ground path wear must be between 0 and 1')
  const [x,y,z]=position
  const lowGround=1-smooth(Math.abs(y-.15),.8,1.7)
  const roots=(1-smooth(Math.hypot(x+8.7,z-3.2),.35,2.55))*lowGround
  const wet=1-smooth(distanceToLine(position,creek,[0,1,2]),.45,1.30)
  const wear=(1-smooth(Math.min(...guides.map(route=>distanceToLine([x,z],route,[0,1]))),.45,1.35))*lowGround*pathWear
  return [roots,wet,wear]
}

const fragment=/* glsl */`
varying vec3 vGroundWorld;
varying vec3 vGroundHabitat;
float cloudGroundHash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float cloudGroundNoise(vec2 p){
  vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);
  return mix(mix(cloudGroundHash(i),cloudGroundHash(i+vec2(1.,0.)),f.x),
    mix(cloudGroundHash(i+vec2(0.,1.)),cloudGroundHash(i+vec2(1.,1.)),f.x),f.y);
}
`

/** Retains authored triangles/maps; owns static ground shading and bounded grit. */
export function createCloudGroundEffects(root,{creek=[],guide=[],guides=[guide],pathWear=1}={}){
  if(!Number.isFinite(pathWear)||pathWear<0||pathWear>1)throw new TypeError('Ground path wear must be between 0 and 1')
  const water=[],p=new T.Vector3(),patched=[],owned=[],seen=new Set(),stonePlacements=[],roomFloors=[]
  let disposed=false,vertices=0
  root.updateMatrixWorld(true)
  root.traverse(mesh=>{
    if(mesh.isMesh&&/continuous floor/i.test(mesh.name+' '+(mesh.parent?.name??'')))roomFloors.push(new T.Box3().setFromObject(mesh,true))
  })
  root.traverse(mesh=>{
    if(!mesh.isMesh||!/^Water(?:_|$)/.test(mesh.name))return
    const positions=mesh.geometry.getAttribute('position')
    for(let i=0;i<positions.count;i++){p.fromBufferAttribute(positions,i).applyMatrix4(mesh.matrixWorld);water.push(p.toArray())}
  })
  const wetLine=creek.map(([x,z])=>{
    let distance=Infinity,height=0
    for(const v of water){const d=(x-v[0])**2+(z-v[2])**2;if(d<distance-1e-8||Math.abs(d-distance)<1e-8&&v[1]>height){distance=d;height=v[1]}}
    return [x,height,z]
  })
  root.traverse(mesh=>{
    // Multi-material glTF terrain is a named group with per-material child
    // meshes. Patch its meadow primitive only, never limestone or creek rock.
    const meadowChild=mesh.parent?.name==='Grass'&&!Array.isArray(mesh.material)&&/^Meadow ground(?:\.|$)/.test(mesh.material?.name??'')
    if(!mesh.isMesh||(mesh.name!=='Grass'&&!meadowChild))return
    const positions=mesh.geometry.getAttribute('position'),values=new Float32Array(positions.count*3)
    for(let i=0;i<positions.count;i++){
      p.fromBufferAttribute(positions,i).applyMatrix4(mesh.matrixWorld)
      values.set(sampleGroundHabitat(p.toArray(),{creek:water.length?wetLine:[],guides,pathWear}),i*3)
    }
    // Own the added GPU attribute through a geometry clone. Deleting an
    // attribute before the original geometry's disposal can strand its buffer.
    const original=mesh.geometry,geometry=original.clone()
    geometry.setAttribute('cloudHabitat',new T.BufferAttribute(values,3));mesh.geometry=geometry
    owned.push({mesh,original,geometry});vertices+=positions.count
    for(const material of Array.isArray(mesh.material)?mesh.material:[mesh.material]){
      if(!material.isMeshStandardMaterial||seen.has(material))continue
      seen.add(material);patched.push({material,compile:material.onBeforeCompile,key:material.customProgramCacheKey})
      material.onBeforeCompile=shader=>{
        shader.vertexShader=shader.vertexShader.replace('#include <common>',`#include <common>\nattribute vec3 cloudHabitat;varying vec3 vGroundWorld;varying vec3 vGroundHabitat;`)
          .replace('#include <project_vertex>',`vGroundWorld=(modelMatrix*vec4(transformed,1.0)).xyz;vGroundHabitat=cloudHabitat;\n#include <project_vertex>`)
        shader.fragmentShader=shader.fragmentShader.replace('#include <common>',`#include <common>\n${fragment}`)
          .replace('#include <color_fragment>',`#include <color_fragment>
            float groundPatch=cloudGroundNoise(vGroundWorld.xz*.85+vec2(3.2,8.7));
            float groundClods=cloudGroundNoise(vGroundWorld.xz*9.5);
            float groundFine=cloudGroundNoise(vGroundWorld.xz*58.0);
            float groundDetail=1.0-smoothstep(.35,1.1,length(fwidth(vGroundWorld.xz))*58.0);
            float groundSoil=smoothstep(.30,.74,(vGroundHabitat.x*1.12+vGroundHabitat.z*.94)*(.65+groundPatch*.42)+groundClods*.19);
            vec3 groundGrass=diffuseColor.rgb*mix(vec3(.73,.85,.69),vec3(1.06,1.0,.83),groundPatch);
            vec3 groundEarth=mix(vec3(.054,.035,.016),vec3(.13,.096,.052),groundClods);
            groundEarth*=.87+groundFine*.26*groundDetail;
            diffuseColor.rgb=mix(groundGrass,groundEarth,groundSoil*.88);
            diffuseColor.rgb=mix(diffuseColor.rgb,diffuseColor.rgb*vec3(.64,.78,.62),vGroundHabitat.y*.62);
          `)
          .replace('#include <roughnessmap_fragment>',`#include <roughnessmap_fragment>
            roughnessFactor=mix(roughnessFactor,.94,groundSoil)*(1.0-vGroundHabitat.y*.14);`)
          .replace('#include <normal_fragment_maps>',`#include <normal_fragment_maps>
            // Stationary sub-centimetre shading relief, not floor displacement.
            float groundRelief=(groundClods*.003+groundFine*.001*groundDetail)*(.3+groundSoil*.7);
            vec3 groundDx=dFdx(-vViewPosition),groundDy=dFdy(-vViewPosition);
            vec3 groundR1=cross(groundDy,normal),groundR2=cross(normal,groundDx);
            float groundDet=dot(groundDx,groundR1)*faceDirection;
            vec3 groundGradient=sign(groundDet)*(dFdx(groundRelief)*groundR1+dFdy(groundRelief)*groundR2);
            if(abs(groundDet)>1e-10)normal=normalize(abs(groundDet)*normal-groundGradient);`)
      }
      material.customProgramCacheKey=()=>CLOUD_GROUND_REVISION;material.needsUpdate=true
    }
    const indices=original.index,triangles=[],a=new T.Vector3(),b=new T.Vector3(),c=new T.Vector3(),cross=new T.Vector3()
    let area=0,seed=12060904
    const rng=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296}
    if(indices)for(let i=0;i<indices.count;i+=3){
      a.fromBufferAttribute(positions,indices.getX(i)).applyMatrix4(mesh.matrixWorld)
      b.fromBufferAttribute(positions,indices.getX(i+1)).applyMatrix4(mesh.matrixWorld)
      c.fromBufferAttribute(positions,indices.getX(i+2)).applyMatrix4(mesh.matrixWorld)
      cross.crossVectors(b.clone().sub(a),c.clone().sub(a))
      const size=cross.length()*.5
      // Authored turf uses reversed winding on some horizontal patches. Slope
      // is independent of winding; restrict to the lower turf, not its normal sign.
      if(size<1e-7||Math.min(a.y,b.y,c.y)>1.05||Math.abs(cross.y)/Math.max(1e-12,cross.length())<.78)continue
      area+=size;triangles.push({a:a.clone(),b:b.clone(),c:c.clone(),area})
    }
    for(let attempt=0;attempt<12000&&stonePlacements.length<360&&triangles.length;attempt++){
      const pick=rng()*area;let low=0,high=triangles.length-1
      while(low<high){const mid=(low+high)>>1;if(triangles[mid].area<pick)low=mid+1;else high=mid}
      const triangle=triangles[low],u=Math.sqrt(rng()),v=rng()
      p.copy(triangle.a).multiplyScalar(1-u).addScaledVector(triangle.b,u*(1-v)).addScaledVector(triangle.c,u*v)
      if(roomFloors.some(box=>p.x>=box.min.x-.05&&p.x<=box.max.x+.05&&p.z>=box.min.z-.05&&p.z<=box.max.z+.05))continue
      const habitat=sampleGroundHabitat(p.toArray(),{creek:water.length?wetLine:[],guides,pathWear})
      // Keep at least 0.9m from the centreline: tiny decoration never replaces
      // the stable visible/physical corridor, even where turf lies under paving.
      if(p.y>1.05||guides.some(route=>distanceToLine([p.x,p.z],route,[0,1])<.9)||Math.max(habitat[0],habitat[1],habitat[2])<.2)continue
      if(rng()>Math.max(habitat[0],habitat[1]*.7,habitat[2]*.8))continue
      const radius=.017+rng()*.026,height=.009+rng()*.014
      p.y+=height*.65
      root.worldToLocal(p)
      stonePlacements.push({position:p.clone(),radius,height,angle:rng()*Math.PI*2,tone:rng()})
    }
  })
  let stones
  if(stonePlacements.length){
    stones=new T.InstancedMesh(new T.IcosahedronGeometry(1,1),new T.MeshStandardMaterial({color:'#ffffff',roughness:.91}),stonePlacements.length)
    stones.name='Cloud rooted garden grit';stones.receiveShadow=true;stones.castShadow=true
    const matrix=new T.Matrix4(),rotation=new T.Quaternion(),scale=new T.Vector3(),color=new T.Color()
    stonePlacements.forEach((s,i)=>{
      rotation.setFromAxisAngle(new T.Vector3(0,1,0),s.angle);scale.set(s.radius,s.height,s.radius*.73)
      matrix.compose(s.position,rotation,scale);stones.setMatrixAt(i,matrix)
      color.setRGB(.10+s.tone*.12,.085+s.tone*.10,.055+s.tone*.08);stones.setColorAt(i,color)
    })
    stones.computeBoundingSphere();root.add(stones)
  }
  return {stats:{vertices,materials:patched.length,stones:stonePlacements.length},dispose(){
    if(disposed)return;disposed=true
    for(const item of patched){item.material.onBeforeCompile=item.compile;item.material.customProgramCacheKey=item.key;item.material.needsUpdate=true}
    for(const item of owned){item.mesh.geometry=item.original;item.geometry.dispose()}
    if(stones){stones.removeFromParent();stones.geometry.dispose();stones.material.dispose();stones.dispose()}
  }}
}
