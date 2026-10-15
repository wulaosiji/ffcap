export type CloudSceneClip={status:'recording'|'encoding'|'ready'|'error'|'unsupported';dataUrl?:string;bytes?:number;mimeType?:string}
export const CLOUD_CLIP_LIMITS:Readonly<{seconds:number;bytes:number;fps:number;bitsPerSecond:number}>
export function createCloudSceneRecorder(canvas:HTMLCanvasElement,options:{hostname:string;search:string;onChange:(clip:CloudSceneClip)=>void}):{start():boolean;stop():void;dispose():void}
