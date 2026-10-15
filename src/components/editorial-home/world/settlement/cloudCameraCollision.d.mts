import type {Vector3} from 'three'
export function createCloudCameraCollision(colliders:readonly {
  id?:string;position:readonly number[];halfExtents:readonly number[];rotationY?:number
}[]):(target:Vector3,desired:Vector3)=>Vector3
