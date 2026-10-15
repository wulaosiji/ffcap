/** A gentle crane over the bridge, with zero offset at the entrance/room.
 * Anticipate the narrow crossing spatially; reactive collision alone reacts
 * too late once a low rail is already immediately behind the character.
 */
export function cloudBridgeCameraLift(position,bridge){
  if(!bridge)return 0
  const x=(position.x-bridge.center[0])/(bridge.halfExtents[0]+1)
  const z=(position.z-bridge.center[2])/(bridge.halfExtents[2]+1.4)
  const t=Math.max(0,Math.min(1,(Math.hypot(x,z)-.4)/.8))
  return 2.2*(1-t*t*(3-2*t))
}
