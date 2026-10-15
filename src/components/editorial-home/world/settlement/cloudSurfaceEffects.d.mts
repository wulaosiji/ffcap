import type {Object3D} from 'three'
export const CREEK_CENTRE:number[][]
export const CLOUD_CREEK_REVISION:string
export function creekCoordinates(x:number,z:number,y?:number):{along:number;across:number;dx:number;dz:number}
export function createCreekCoordinates(centre:number[][]):typeof creekCoordinates
export function createCloudSurfaceEffects(root:Object3D,options?:{creekCentre?:number[][]}):{stats:{plantVertices:number;waterVertices:number};update(seconds:number,wind?:number):void;dispose():void}
