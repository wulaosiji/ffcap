const clamp=(x,a,b)=>Math.max(a,Math.min(b,x))
const smooth=x=>{x=clamp(x,0,1);return x*x*(3-2*x)}
/** Sparse observation beats. Explicit visual pause stops the caller's simulation clock. */
export function sampleCloudPresence(idleSeconds,{x,z,heading=0,manualSeconds=Infinity,reducedMotion=false}={}){
  if(reducedMotion||idleSeconds<6)return {yaw:0,pitch:0,amount:0,cameraYaw:0,cameraDolly:0,target:'rest'}
  const cycle=Math.floor((idleSeconds-6)/24),t=(idleSeconds-6)%24
  const amount=smooth(t/2.6)*(1-smooth((t-7)/3))
  // Courtyard tree / crossing; in the studio look toward the open doorway instead.
  const target=z<1?[-5.7,2.3]:cycle%2===0?[1.3,4.2]:[-.6,-1.4]
  const desired=Math.atan2(-(target[0]-x),-(target[1]-z))
  const angle=clamp(Math.atan2(Math.sin(desired-heading),Math.cos(desired-heading)),-.42,.42)
  const yaw=angle*amount
  const cameraAmount=manualSeconds>12?smooth((t-2)/5)*(1-smooth((t-12)/7)):0
  return {yaw,pitch:(cycle%2===0?.06:-.08)*amount,amount,cameraYaw:cameraAmount?Math.sign(angle||1)*.17*cameraAmount:0,cameraDolly:-.16*cameraAmount,target:z<1?'doorway':cycle%2===0?'creek':'tree'}
}
