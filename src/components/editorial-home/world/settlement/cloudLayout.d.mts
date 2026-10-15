import type { CollisionBox, CollisionSurface, WorldVector } from './physics.mjs'
export type CloudDestination = 'agentic' | 'physical' | 'entertainment';
export interface CloudLayout {
  schemaVersion: 2;
  coordinateSystem: 'Y-up';
  assetSha256?: string;
  creekCentre?: [number,number][];
  /** Visual soil wear only; 0 keeps guided terrain green without changing navigation. */
  groundPathWear?: number;
  spawn: WorldVector;
  locations: {id:string; center:WorldVector; halfExtents:WorldVector; open?:boolean; rotationY?:number}[];
  guideToAgentic: [number,number][];
  /** Every route begins at implicit spawn; shared junctions use exact coordinates. */
  guideRoutes?: Partial<Record<CloudDestination,[number,number][]>>;
  /** Explicit local doorfront visit; does not open the Entertainment interior. */
  guideAccess?: {entertainment?: 'doorstep'};
  lights?: {id:string; type:'warm-interior'|'window-daylight'; position:WorldVector; color:string; target?:WorldVector}[];
  colliders: (CollisionBox & {id?:string})[];
  surfaces: CollisionSurface[];
  cameras?: Record<string,{position:WorldVector;target:WorldVector}>;
}
export function validateCloudLayout(data:unknown): CloudLayout;
export function cloudLocationAt(layout:CloudLayout,p:{x:number;y:number;z:number}):string;
export function cloudGroundHeight(layout:CloudLayout,x:number,z:number,maximumY?:number):number;
export function cloudGuideRoute(layout:CloudLayout,p:{x:number;y:number;z:number},returning?:boolean,destination?:CloudDestination):[number,number][]|null;
export function cloudGuideDestinations(layout:CloudLayout):CloudDestination[];
/** Offline one-shot check; the goal's support layer is anchored to spawn. */
export function cloudGuideArrival(layout:CloudLayout,p:{x:number;y:number;z:number},destination:CloudDestination):boolean;
export interface CloudGuideNavigation {
  route(p:{x:number;y:number;z:number},returning?:boolean,destination?:CloudDestination):[number,number][]|null;
  arrived(p:{x:number;y:number;z:number},destination:CloudDestination):boolean;
}
/** Recreate when the authored layout changes. Both operations share one graph. */
export function createCloudGuideNavigation(layout:CloudLayout):CloudGuideNavigation;
/** Recreate when the resident authored layout changes. */
export function createCloudGuidePlanner(layout:CloudLayout):(p:{x:number;y:number;z:number},returning?:boolean,destination?:CloudDestination)=>[number,number][]|null;
