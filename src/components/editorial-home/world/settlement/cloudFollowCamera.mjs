import {Vector3} from 'three'

/** Smooth ordinary travel; only a real obstruction may shorten the camera arm.
 * Distance to a moving target is not evidence of a wall. Collision is checked
 * again on the interpolated position so easing cannot take a shortcut through it.
 */
export function createCloudFollowCamera(resolveCollision){
  const safeDesired=new Vector3(),raised=new Vector3()
  let lift=0
  return {
    reset(){lift=0},
    update(position,focus,target,desired,dt){
      const step=Math.max(0,Math.min(.06,Number.isFinite(dt)?dt:0))
      focus.lerp(target,1-Math.exp(-step*5))
      safeDesired.copy(resolveCollision(focus,desired))
      // Keep the subject readable near a low rail: prefer the smallest clear
      // elevated shoulder, rather than pushing straight into the character.
      const baseLength=focus.distanceTo(desired)
      let wantedLift=0,bestReach=focus.distanceTo(safeDesired)
      if(bestReach<baseLength*.86){
        for(const candidateLift of [.25,.5,.85,1.2,1.65]){
          raised.copy(desired);raised.y+=candidateLift
          const resolved=resolveCollision(focus,raised)
          const reach=focus.distanceTo(resolved)
          // Compare horizontal-equivalent reach; lifting alone must not count
          // as clearance if a tall wall still blocks the same fraction.
          const usable=reach/Math.max(.001,focus.distanceTo(raised))*baseLength
          if(usable>bestReach+.12){wantedLift=candidateLift;bestReach=usable}
          if(usable>=baseLength*.94)break
        }
      }
      lift+=(wantedLift-lift)*(1-Math.exp(-step*(wantedLift>lift?4:1.4)))
      raised.copy(desired);raised.y+=lift
      safeDesired.copy(resolveCollision(focus,raised))
      position.lerp(safeDesired,1-Math.exp(-step*3.5))
      position.copy(resolveCollision(focus,position))
    },
  }
}
