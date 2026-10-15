import type {WorldVector} from './physics.mjs'
export const CLOUD_INTRO_SECONDS:number;
export function fitIslandDistance(radius:number,aspect:number,fov?:number):number;
export function fitIslandBoxDistance(halfExtents:WorldVector,aspect:number,direction:WorldVector,fov?:number):number;
export function createIslandOverview(config:{center:WorldVector;halfExtents:WorldVector;aspect:number;fov?:number}):{position:number[];target:number[]};
export type ExplorerCameraProfile={targetHeight:number;baseHeight:number;distanceDesktop:number;distanceMobile:number;yaw:number;pitch:number};
export function createExplorerCameraPose(spawn:WorldVector,mobile?:boolean,profile?:ExplorerCameraProfile):{position:number[];target:number[]};
export function createCloudCameraPath(config:{heroPosition:WorldVector;heroTarget:WorldVector;spawn:WorldVector;mobile?:boolean;cameraProfile?:ExplorerCameraProfile}):{
  shoulder:number[];
  sample(progress:number):{position:number[];target:number[]};
};
