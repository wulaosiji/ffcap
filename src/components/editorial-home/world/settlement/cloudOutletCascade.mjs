import * as T from 'three'

// Dedicated material for the new authored outlet, never the old creek/trough.
export function attachOutletCascade(mesh,time){
  if(mesh.name==='Garden21_Reused_Outlet_Fall')return attachGarden21Outlet(mesh,time)
  if(mesh.name!=='Water_Outlet_Cascade')return null
  const original=mesh.material,box=new T.Box3().setFromObject(mesh)
  const height=box.max.y-box.min.y,width=box.max.x-box.min.x
  if(height<.01||width<.01)return null
  const material=new T.MeshStandardMaterial({color:'#abc8c7',roughness:.24,metalness:0,transparent:true,depthWrite:false,side:T.DoubleSide})
  material.name='Cloud outlet falling water r01'
  material.onBeforeCompile=shader=>{
    shader.uniforms.uCascadeTime=time
    shader.uniforms.uCascadeBounds={value:new T.Vector4(box.min.x,width,box.max.y,height)}
    shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vCascadeWorld;')
      .replace('#include <project_vertex>','#include <project_vertex>\nvCascadeWorld=(modelMatrix*vec4(transformed,1.0)).xyz;')
    shader.fragmentShader=shader.fragmentShader.replace('#include <common>','#include <common>\nvarying vec3 vCascadeWorld;uniform vec4 uCascadeBounds;uniform float uCascadeTime;')
      .replace('#include <color_fragment>',`#include <color_fragment>
        float crossFlow=clamp((vCascadeWorld.x-uCascadeBounds.x)/uCascadeBounds.y,0.0,1.0);
        float descent=clamp((uCascadeBounds.z-vCascadeWorld.y)/uCascadeBounds.w,0.0,1.0);
        float phase=descent*15.0-uCascadeTime*1.6;
        float strands=.5+.5*sin(crossFlow*37.0+sin(crossFlow*11.0+phase*.17)*1.7);
        float breakup=.5+.5*sin(phase*2.3+crossFlow*2.7);
        float feather=smoothstep(0.0,.10,crossFlow)*(1.0-smoothstep(.90,1.0,crossFlow));
        float tail=1.0-smoothstep(.67+.09*strands,1.0,descent);
        diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.92,.96,.95),strands*breakup*.10);
        diffuseColor.a=(.43+.08*strands+.04*breakup)*feather*tail;`)
  }
  material.customProgramCacheKey=()=> 'cloud-outlet-cascade-r01'
  mesh.material=material
  let disposed=false
  return {dispose(){if(disposed)return;disposed=true;mesh.material=original;material.dispose()}}
}

// The reused garden outlet is a set of narrow source ribbons. A material alone
// cannot fill the gaps between them, so add one light curtain on their actual
// path. This is visual-only: the authored water, shoreline and colliders stay put.
function makeGarden21Curtain(geometry){
  const box=new T.Box3().setFromBufferAttribute(geometry.attributes.position)
  const width=box.max.x-box.min.x,height=box.max.y-box.min.y
  if(width<.2||height<1)return null
  const columns=12,rows=24,positions=[],indices=[]
  const centre=(box.min.x+box.max.x)/2
  const vertices=geometry.attributes.position
  let topZ=0,bottomZ=0,topCount=0,bottomCount=0
  for(let i=0;i<vertices.count;i++){
    const y=vertices.getY(i),z=vertices.getZ(i)
    if(y>box.max.y-height*.045){topZ+=z;topCount++}
    if(y<box.min.y+height*.045){bottomZ+=z;bottomCount++}
  }
  if(!topCount||!bottomCount)return null
  topZ/=topCount;bottomZ/=bottomCount
  for(let row=0;row<=rows;row++){
    const descent=row/rows
    const bend=(1-Math.exp(-3.2*descent))/(1-Math.exp(-3.2))
    const z=topZ+(bottomZ-topZ)*bend
    const halfWidth=width*.49*(1-.22*descent-.10*Math.sin(Math.PI*descent))
    for(let column=0;column<=columns;column++){
      const across=column/columns*2-1
      positions.push(centre+across*halfWidth,box.max.y-height*descent,
        z+.012*Math.sin(across*5+descent*7)*Math.sin(Math.PI*descent))
      if(row&&column){
        const a=(row-1)*(columns+1)+column-1,b=a+columns+1
        indices.push(a,b,a+1,a+1,b,b+1)
      }
    }
  }
  const curtain=new T.BufferGeometry()
  curtain.setAttribute('position',new T.Float32BufferAttribute(positions,3))
  curtain.setIndex(indices)
  curtain.computeVertexNormals()
  return curtain
}

function attachGarden21Outlet(mesh,time){
  const geometry=makeGarden21Curtain(mesh.geometry)
  if(!geometry)return null
  const original=mesh.material,originalOrder=mesh.renderOrder,originalShadow=mesh.castShadow
  const box=new T.Box3().setFromObject(mesh)
  const bounds={value:new T.Vector4(box.min.x,box.max.x-box.min.x,box.max.y,box.max.y-box.min.y)}
  const material=(sheet)=>{
    const result=sheet
      ?new T.MeshBasicMaterial({color:'#bfd7cf',transparent:true,depthWrite:false,side:T.DoubleSide})
      :new T.MeshStandardMaterial({color:'#b8d3ca',roughness:.33,metalness:0,transparent:true,depthWrite:false,side:T.DoubleSide})
    result.name=sheet?'Cloud garden outlet soft water curtain':'Cloud garden outlet reused ribbons'
    result.onBeforeCompile=shader=>{
      shader.uniforms.uCascadeTime=time
      shader.uniforms.uCascadeBounds=bounds
      shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vCascadeWorld;')
        .replace('#include <project_vertex>','#include <project_vertex>\nvCascadeWorld=(modelMatrix*vec4(transformed,1.0)).xyz;')
      shader.fragmentShader=shader.fragmentShader.replace('#include <common>','#include <common>\nvarying vec3 vCascadeWorld;uniform vec4 uCascadeBounds;uniform float uCascadeTime;')
        .replace('#include <color_fragment>',`#include <color_fragment>
          float across=clamp((vCascadeWorld.x-uCascadeBounds.x)/uCascadeBounds.y,0.0,1.0);
          float descent=clamp((uCascadeBounds.z-vCascadeWorld.y)/uCascadeBounds.w,0.0,1.0);
          float folded=.5+.5*sin(across*18.0+sin(descent*8.0-uCascadeTime*.8)*.8);
          float broken=.5+.5*sin(across*39.0+descent*25.0-uCascadeTime*2.1+sin(across*9.0)*1.7);
          float froth=smoothstep(.54,.88,folded)*smoothstep(.25,.72,broken);
          ${sheet?`
            float feather=smoothstep(.01,.13,across)*(1.0-smoothstep(.87,.99,across));
            float tail=1.0-smoothstep(.43,.91,descent);
            diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.96,.98,.95),.12+.30*froth);
            diffuseColor.a=feather*tail*(.22+.11*folded+.09*froth);`
          :`
            diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.97,.98,.95),.18+.24*froth);
            diffuseColor.a=(.18+.12*froth)*(1.0-smoothstep(.52,.98,descent)*.72);`}`)
    }
    result.customProgramCacheKey=()=>sheet?'cloud-garden-outlet-curtain-r02':'cloud-garden-outlet-ribbons-r02'
    return result
  }
  const ribbonMaterial=material(false),sheetMaterial=material(true)
  const curtain=new T.Mesh(geometry,sheetMaterial)
  curtain.name='Cloud garden outlet soft water curtain'
  curtain.castShadow=false;curtain.receiveShadow=false;curtain.renderOrder=originalOrder+1
  mesh.material=ribbonMaterial;mesh.renderOrder=originalOrder+2;mesh.castShadow=false;mesh.add(curtain)
  let disposed=false
  return {dispose(){
    if(disposed)return
    disposed=true
    mesh.remove(curtain);mesh.material=original;mesh.renderOrder=originalOrder;mesh.castShadow=originalShadow
    geometry.dispose();sheetMaterial.dispose();ribbonMaterial.dispose()
  }}
}
