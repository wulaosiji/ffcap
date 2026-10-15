const smooth=(a,b,x)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t)}
export function isCloudAcademyStudy(host,search){
  return ['localhost','127.0.0.1','[::1]'].includes(host)&&new URLSearchParams(search).get('courtyard-study')==='1'
}
/** Continuous doorway weighting, bounded to the actual Agentic room. */
export function cloudAcademyInterior(x,z){
  if(!Number.isFinite(x)||!Number.isFinite(z))return 0
  return (1-smooth(2.55,3.15,Math.abs(x+5.7)))*(1-smooth(-.6,1.65,z))*smooth(-4.4,-3.8,z)
}
export function cloudAcademyTravel(x,z){
  return 1-.22*cloudAcademyInterior(x,z)
}
