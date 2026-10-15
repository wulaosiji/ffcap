import type {Vector3} from 'three'
export function createCloudFollowCamera(resolveCollision:(target:Vector3,desired:Vector3)=>Vector3):{
  reset():void
  update(position:Vector3,focus:Vector3,target:Vector3,desired:Vector3,dt:number):void
}
