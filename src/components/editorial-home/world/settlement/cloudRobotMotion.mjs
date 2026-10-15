/** Metre-based continuous tread motion, shared by render and numerical tests. */
export function sampleRobotTrack(distance, span=.18, radius=.105, center=.12) {
  if(![distance,span,radius,center].every(Number.isFinite)||span<=0||radius<=0)throw new TypeError('Invalid track dimensions')
  const length=4*span+2*Math.PI*radius
  let d=((distance%length)+length)%length
  if(d<2*span)return {forward:-span+d,height:center-radius,angle:0,length}
  d-=2*span
  if(d<Math.PI*radius){const a=-Math.PI/2+d/radius;return {forward:span+radius*Math.cos(a),height:center+radius*Math.sin(a),angle:a+Math.PI/2,length}}
  d-=Math.PI*radius
  if(d<2*span)return {forward:span-d,height:center+radius,angle:Math.PI,length}
  const a=Math.PI/2+(d-2*span)/radius
  return {forward:-span+radius*Math.cos(a),height:center+radius*Math.sin(a),angle:a+Math.PI/2,length}
}

export function robotTrackTravel(distance,headingDelta,gauge=.58){
  if(![distance,headingDelta,gauge].every(Number.isFinite)||gauge<=0)throw new TypeError('Invalid robot travel')
  // Heading is Three Y rotation. Positive rotation turns the -Z facing left.
  return {left:distance-headingDelta*gauge/2,right:distance+headingDelta*gauge/2}
}
