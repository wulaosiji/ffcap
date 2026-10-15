export type CloudMotionSample={elapsedMs:number;cpuSubmitMs:number;cpuUpdateMs?:number;cpuPhysicsMs?:number;time:number;phase:string;guiding:boolean;camera:number[];focus:number[];actor:number[];heading:number}
export function isCloudMotionReview(hostname:string,search:string):boolean
export function createCloudMotionReview(enabled:boolean):{
  start():boolean;readonly active:boolean;record(sample:CloudMotionSample):void;
  finish():{limit:number;capped:boolean;summary:Record<string,unknown>;samples:CloudMotionSample[]}|null;dispose():void
}
