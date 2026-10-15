import * as T from 'three'

/** Local art trial over retained assets. Spatial masks avoid editing other rooms
 * even though the Blender export merges objects by material. No geometry changes.
 */
export function createCloudAcademyArt(root:T.Object3D,scene:T.Scene){
  const strength={value:0}
  const restores:Array<()=>void>=[]
  const seen=new Set<T.MeshStandardMaterial>()
  root.traverse(node=>{
    if(!(node instanceof T.Mesh))return
    for(const material of Array.isArray(node.material)?node.material:[node.material]){
      if(!(material instanceof T.MeshStandardMaterial)||seen.has(material))continue
      const name=material.name
      const kind=/limestone/i.test(name)?'stone':/Oiled oak/.test(name)?'oak':/Meadow ground|Leaves /.test(name)?'green':/Ivory paper/.test(name)?'paper':/iron|brass/i.test(name)?'metal':null
      if(!kind)continue
      seen.add(material)
      const compile=material.onBeforeCompile,key=material.customProgramCacheKey
      material.onBeforeCompile=(shader,renderer)=>{
        compile.call(material,shader,renderer)
        shader.uniforms.academyStrength=strength
        shader.vertexShader='varying vec3 vAcademyWorld;\n'+shader.vertexShader
        shader.vertexShader=shader.vertexShader.replace('#include <project_vertex>','vAcademyWorld=(modelMatrix*vec4(transformed,1.0)).xyz;\n#include <project_vertex>')
        shader.fragmentShader='varying vec3 vAcademyWorld;\nuniform float academyStrength;\n'+shader.fragmentShader
        const mask=`
          float academyZone=(1.0-smoothstep(3.0,5.0,abs(vAcademyWorld.x+5.7)))
            *smoothstep(-5.0,-3.9,vAcademyWorld.z)*(1.0-smoothstep(3.0,5.4,vAcademyWorld.z))
            *smoothstep(0.0,0.4,vAcademyWorld.y)*(1.0-smoothstep(4.15,4.8,vAcademyWorld.y))*academyStrength;
          float academyInside=academyZone*(1.0-smoothstep(0.75,1.4,vAcademyWorld.z));
        `
        const color=kind==='green'?`diffuseColor.rgb=mix(diffuseColor.rgb,vec3(0.12,0.20,0.075)*(.80+.35*dot(diffuseColor.rgb,vec3(.2126,.7152,.0722))),academyZone*.55);`
          :kind==='stone'?`diffuseColor.rgb=mix(diffuseColor.rgb,diffuseColor.rgb*vec3(1.08,1.045,.985),academyZone);`
          :kind==='oak'?`diffuseColor.rgb=mix(diffuseColor.rgb,mix(diffuseColor.rgb,diffuse*.19,.42)*vec3(1.16,1.14,1.10),academyInside);`
          :kind==='paper'?`diffuseColor.rgb*=1.0-academyZone*.18*(1.0-academyInside);`:''
        shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>','#include <map_fragment>\n'+mask+color)
        const rough=kind==='oak'?'0.52':kind==='metal'?'0.32':kind==='stone'?'0.88':null
        if(rough)shader.fragmentShader=shader.fragmentShader.replace('#include <roughnessmap_fragment>',`#include <roughnessmap_fragment>\nroughnessFactor=mix(roughnessFactor,${rough},academyInside*.75);`)
        if(kind==='stone')shader.fragmentShader=shader.fragmentShader.replace('#include <normal_fragment_maps>','#include <normal_fragment_maps>\nnormal=normalize(mix(normal,nonPerturbedNormal,academyZone*.55));')
        // Only reduce the room's ambient wash, leaving direct window/fixture
        // lighting and moving robot illumination physically responsive.
        shader.fragmentShader=shader.fragmentShader.replace('#include <lights_fragment_end>','#include <lights_fragment_end>\nreflectedLight.indirectDiffuse*=1.0-academyInside*.20;')
      }
      material.customProgramCacheKey=()=>key.call(material)+'-r14-academy-02-'+kind
      material.needsUpdate=true
      restores.push(()=>{material.onBeforeCompile=compile;material.customProgramCacheKey=key;material.needsUpdate=true})
    }
  })
  // Existing west window at x=-8.8, z=-.2. One bounded, shadowed key, not a
  // global sun replacement or emissive floor decal. Ceiling/walls occlude it.
  const windowLight=new T.SpotLight('#ffe2b4',0,8,.53,.55,2)
  windowLight.name='Academy west-window study'
  windowLight.position.set(-9.35,3.15,-.2)
  windowLight.target.position.set(-5.1,.58,-1.2)
  windowLight.castShadow=true;windowLight.shadow.mapSize.set(1024,1024)
  windowLight.shadow.bias=-.00015;windowLight.shadow.normalBias=.018
  windowLight.shadow.camera.near=.15;windowLight.shadow.camera.far=8
  scene.add(windowLight,windowLight.target)
  const roomCenter=new T.Vector3(-5.7,1.8,0)
  let disposed=false
  return {
    update(camera:T.Vector3,daylight:number){
      if(disposed)return
      const distance=camera.distanceTo(roomCenter)
      strength.value=1-T.MathUtils.smoothstep(distance,12,23)
      windowLight.intensity=24*Math.max(0,Math.min(1,daylight))*strength.value
      windowLight.visible=windowLight.intensity>.001
    },
    dispose(){if(disposed)return;disposed=true;for(const restore of restores)restore();windowLight.removeFromParent();windowLight.target.removeFromParent();windowLight.shadow.map?.dispose();windowLight.dispose()},
  }
}
