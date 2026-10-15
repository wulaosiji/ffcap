export const CLOUD_LIGHTING_REVISION:string
export function sampleCloudLightRig(weather:{daylight:number;cloudCover:number},time?:number):{
  sun:number;hemisphere:number;fill:number;environment:number;position:[number,number,number]
}
