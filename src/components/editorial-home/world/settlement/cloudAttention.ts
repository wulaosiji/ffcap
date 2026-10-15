import * as T from 'three'

/** Additive attention over the authored pose. Restore before each mixer step. */
export function createCloudAttention(scene:T.Object3D,strength=1){
  const head=scene.getObjectByName('head')
  let desired={yaw:0,pitch:0,amount:0},yaw=0,pitch=0,applied=false
  const base=new T.Quaternion(),parentRotation=new T.Quaternion(),axis=new T.Vector3(),q=new T.Quaternion()
  return {
    set(value:{yaw:number;pitch:number;amount:number}){desired=value},
    restore(){if(head&&applied)head.quaternion.copy(base);applied=false},
    reset(){this.restore();yaw=pitch=0;desired={yaw:0,pitch:0,amount:0}},
    update(dt:number){
      if(!head)return
      yaw=T.MathUtils.damp(yaw,desired.yaw*strength,2,dt)
      pitch=T.MathUtils.damp(pitch,desired.pitch*strength,2,dt)
      base.copy(head.quaternion)
      head.parent?.updateWorldMatrix(true,false)
      parentRotation.copy(head.parent?.getWorldQuaternion(new T.Quaternion())??new T.Quaternion()).invert()
      axis.set(0,1,0).applyQuaternion(parentRotation)
      q.setFromAxisAngle(axis,yaw);head.quaternion.premultiply(q)
      axis.set(1,0,0).applyQuaternion(scene.getWorldQuaternion(new T.Quaternion())).applyQuaternion(parentRotation)
      q.setFromAxisAngle(axis,pitch);head.quaternion.premultiply(q);applied=true
    },
  }
}
