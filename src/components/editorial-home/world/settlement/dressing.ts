import * as T from 'three'
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js'

/** Reviewed CC0 geometry and scanned material details, self-hosted with provenance. */
export async function createDressing(scene:T.Scene,mobile:boolean){
  const root=new T.Group();root.name='Natural rock and fern details';scene.add(root)
  const loader=new GLTFLoader(),resources=new Set<T.BufferGeometry>(),materials=new Set<T.Material>(),textures=new Set<T.Texture>()
  const register=(object:T.Object3D)=>object.traverse(o=>{if(o instanceof T.Mesh){resources.add(o.geometry);for(const m of Array.isArray(o.material)?o.material:[o.material]){materials.add(m);for(const v of Object.values(m))if(v instanceof T.Texture)textures.add(v)}}})
  let disposed=false
  const dispose=()=>{if(disposed)return;disposed=true;root.traverse(o=>{if(o instanceof T.InstancedMesh)o.dispose()});root.removeFromParent();resources.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());root.clear();resources.clear();materials.clear();textures.clear()}
  const load=async(url:string)=>{const gltf=await loader.loadAsync(url);for(const assetScene of gltf.scenes)register(assetScene);register(gltf.scene);return gltf}
  try{
  // Settle both loads before releasing ownership, including a late success after
  // its sibling has failed. Promise.all would reject before that asset is owned.
  const [rockResult,fernsResult]=await Promise.allSettled([load('/world/models/boulder-01-mobile.glb'),load('/world/models/fern-02.glb')])
  if(rockResult.status==='rejected')throw rockResult.reason
  if(fernsResult.status==='rejected')throw fernsResult.reason
  const rock=rockResult.value,ferns=fernsResult.value
  const colliders:{position:[number,number,number];halfExtents:[number,number,number]}[]=[]
  const rocks=mobile?[[-5,17,1.4],[4.9,12.7,1.1]]:[[-5,17,1.4],[4.9,12.7,1.1],[-16.8,-7,.9],[17.2,-11,1.3]]
  for(const [x,z,s]of rocks){const obj=rock.scene.clone(true),baseY=z>9?0:.8;obj.scale.setScalar(s);const box=new T.Box3().setFromObject(obj),size=box.getSize(new T.Vector3()),center=box.getCenter(new T.Vector3());obj.position.set(x-center.x,baseY-box.min.y-.12,z-center.z);root.add(obj);obj.traverse(o=>{if(o instanceof T.Mesh){o.castShadow=true;o.receiveShadow=true}});colliders.push({position:[x,baseY+size.y/2-.12,z],halfExtents:[size.x*.39,size.y/2,size.z*.39]})}
  const variants:T.Mesh[]=[];ferns.scene.traverse(o=>{if(o instanceof T.Mesh)variants.push(o)})
  const positions=[[-3.8,14],[-4.5,15],[-3.6,17],[-4.5,19],[-4,21],[3.7,13],[4.1,15],[4.5,17],[3.6,19],[4.2,23],[-6.5,13],[-7,16],[7,14],[7.5,18],[-17,-7],[-16.5,-9],[-16,-11],[-15.9,-5],[-5,-8],[-4.5,-10],[-5,-12],[16.4,-9],[16.5,-12],[17,-15],[-18,-19],[19,-20]]
  for(let v=0;v<variants.length;v++){
    const source=variants[v],geo=source.geometry.clone();resources.add(geo);geo.computeBoundingBox();const box=geo.boundingBox!,center=box.getCenter(new T.Vector3());geo.translate(-center.x,-box.min.y,-center.z)
    const points=positions.filter((_,i)=>i%variants.length===v).slice(0,mobile?3:99),mesh=new T.InstancedMesh(geo,source.material,points.length)
    const matrix=new T.Matrix4(),q=new T.Quaternion()
    for(let i=0;i<points.length;i++){const [x,z]=points[i],s=.7+(i%3)*.2;q.setFromAxisAngle(new T.Vector3(0,1,0),i*2.37+v);matrix.compose(new T.Vector3(x,z>9?0:.8,z),q,new T.Vector3(s,s,s));mesh.setMatrixAt(i,matrix)}
    mesh.receiveShadow=true;mesh.castShadow=false;root.add(mesh)
  }
  return{colliders,dispose}
  }catch(error){dispose();throw error}
}
