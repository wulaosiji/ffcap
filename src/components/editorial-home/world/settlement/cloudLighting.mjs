export const CLOUD_LIGHTING_REVISION='r12m-light-01'

/** Daylight has a clear key/fill hierarchy; night retains the reviewed baseline.
 * No exposure animation, additional light, or additional shadow map is needed.
 */
export function sampleCloudLightRig(weather,time=0){
  if(!Number.isFinite(time)||!Number.isFinite(weather.daylight)||!Number.isFinite(weather.cloudCover))throw new TypeError('Finite lighting inputs required')
  const day=Math.max(0,Math.min(1,weather.daylight)),cover=Math.max(0,Math.min(1,weather.cloudCover))
  return {
    sun:(.22+3.43*day)*(1-.12*cover),
    hemisphere:.70+.20*day,
    fill:.25-.09*day,
    environment:.20+.17*day,
    position:[-18-4*day+3*Math.sin(time*.003),14+9*day,20-6*day+2*Math.sin(time*.002)],
  }
}
