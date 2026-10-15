export const CLOUD_POSTER_SIZE:Readonly<{width:3840;height:1080}>
export function cloudPosterSize(hostname:string,search:string):Readonly<{width:number;height:number}>
export function isCloudPosterCapture(hostname:string,search:string):boolean
export function cloudReviewTime(hostname:string,search:string):number
export function cloudReviewWater(hostname:string,search:string):'bed-only'|'no-reflection'|null
export type CloudReviewView='bridge'|'entrance'|'academy'|'threshold'|'interior'|'a-main'|'a-reverse'|'a-west'|'a-detail'|'g-overview'|'g-aerial'|'g-bridge'|'g-y'|'g-agentic'|'g-physical'|'g-north'
export function cloudReviewCamera(hostname:string,search:string):Readonly<{name:CloudReviewView;width:number;height:number;fov:number;position:readonly number[];target:readonly number[]}>|null
