import {Box3,Matrix4,Quaternion,Ray,Vector3} from 'three'

/** Authored oriented boxes, shared by realtime framing and route regressions. */
export function createCloudCameraCollision(colliders){
  const boxes=colliders.filter(box=>!box.id?.startsWith('bridge-rail-')).map(box=>{
    const matrix=new Matrix4().compose(new Vector3(...box.position),new Quaternion().setFromAxisAngle(new Vector3(0,1,0),box.rotationY??0),new Vector3(1,1,1))
    const half=new Vector3(...box.halfExtents).addScalar(box.id?.startsWith('bridge-post-') ? .06 : .16)
    return {matrix,inverse:matrix.clone().invert(),box:new Box3(half.clone().negate(),half)}
  })
  // Traversal rails are deliberately solid barriers. Their empty panels are
  // not optical occluders: rebuild the two visible tubes from the same post
  // endpoints used by build_cloud_courtyard_v2.py (upper +.30, lower -.08).
  for(const side of [-1,1]){
    const posts=colliders.filter(box=>box.id?.startsWith(`bridge-post-${side}-`))
      .sort((a,b)=>Number(a.id.split('-').at(-1))-Number(b.id.split('-').at(-1)))
    for(let i=1;i<posts.length;i++)for(const [height,radius] of [[.30,.047],[-.08,.032]]){
      const a=new Vector3(...posts[i-1].position),b=new Vector3(...posts[i].position)
      a.y+=height;b.y+=height
      const delta=b.clone().sub(a),length=delta.length()
      if(length<.00001)continue
      const rotation=new Quaternion().setFromUnitVectors(new Vector3(0,1,0),delta.divideScalar(length))
      const matrix=new Matrix4().compose(a.add(b).multiplyScalar(.5),rotation,new Vector3(1,1,1))
      const half=new Vector3(radius+.06,length/2+.06,radius+.06)
      boxes.push({matrix,inverse:matrix.clone().invert(),box:new Box3(half.clone().negate(),half)})
    }
  }
  const ray=new Ray(),localRay=new Ray(),direction=new Vector3(),hit=new Vector3()
  return (target,desired)=>{
    direction.subVectors(desired,target)
    const length=direction.length()
    if(length<.00001)return desired.clone()
    direction.divideScalar(length);ray.set(target,direction)
    let nearest=length
    for(const item of boxes){
      localRay.copy(ray).applyMatrix4(item.inverse)
      if(localRay.intersectBox(item.box,hit)){
        hit.applyMatrix4(item.matrix)
        const distance=target.distanceTo(hit)
        if(distance>.05)nearest=Math.min(nearest,Math.max(.45,distance-.16))
      }
    }
    return target.clone().addScaledVector(direction,nearest)
  }
}
