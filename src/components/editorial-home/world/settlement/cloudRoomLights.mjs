import * as T from 'three'
/** Existing lamps plus one optional window daylight. No volumetric beams. */
export function createCloudRoomLights(scene,fixtures,destinations){
 const entries=fixtures.filter(f=>destinations.some(id=>f.id.startsWith(`${id}-`))).map(f=>{
  const daylight=f.type==='window-daylight'
  const light=daylight?new T.SpotLight(f.color,80,7,Math.PI*.28,.6,2):new T.PointLight(f.color,6.5,6,2)
  light.name=f.id;light.position.set(...f.position)
  if(daylight){light.target.position.set(...f.target);scene.add(light.target);light.castShadow=true;light.shadow.mapSize.set(1024,1024);light.shadow.camera.near=.08;light.shadow.camera.far=7;light.shadow.bias=-.00015;light.shadow.normalBias=.012;light.shadow.autoUpdate=false}
  scene.add(light);return {light,daylight}
 })
 const lampDay=new T.Color('#ffe1ae'),lampNight=new T.Color('#ffd3a0'),windowDay=new T.Color('#fff0d4'),windowDusk=new T.Color('#ffce96')
 let disposed=false
 return {
  // Called once per scene frame: refresh moving robot/foliage shadows once,
  // then reuse the same map for additional composer/transmission renders.
  update(daylight){const d=Math.max(0,Math.min(1,Number.isFinite(daylight)?daylight:0));for(const entry of entries){const l=entry.light;if(entry.daylight){l.intensity=80*d*d;l.visible=d>.025;l.shadow.needsUpdate=l.visible;l.color.copy(windowDusk).lerp(windowDay,d)}else{l.intensity=6.5+5.5*(1-d);l.color.copy(lampDay).lerp(lampNight,1-d)}}},
  dispose(){if(disposed)return;disposed=true;for(const {light,daylight} of entries){if(daylight){scene.remove(light.target);light.shadow.map?.dispose();light.shadow.mapPass?.dispose()}scene.remove(light)}}
 }
}
