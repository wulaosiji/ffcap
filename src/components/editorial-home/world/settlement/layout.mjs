/** Metres, Y up. These solids are shared by rendering and collision. */
export const SPAWN = [0, 0.03, 15]
export const GUIDE = [[0, 10], [0, 0], [-10, -4.5], [-10, -11], [-10, -14]]
export const ROOMS = [
  { id: 'agentic', name: 'Agentic AI', x: -10, y: 1.8, front: -10, width: 10.4, depth: 8, height: 4.5, open: true },
  { id: 'physical', name: 'Physical AI', x: 10.5, y: 3.2, front: -12, width: 10.4, depth: 8, height: 4.5, open: false },
  { id: 'entertainment', name: 'Entertainment AI', x: 1, y: 7.2, front: -29, width: 12, depth: 8, height: 4.8, open: false },
]
/** Decorative terrain is not traversable; matching bounded footprints prevent clipping. */
export const NEAR_CLIFFS = [
  { id:'west',x:-33,z:-29,width:16,depth:15,height:17 },
  { id:'east',x:22,z:-33,width:15,depth:14,height:20 },
  { id:'north',x:3,z:-43,width:18,depth:9,height:13 },
]
export const GARDENS = [
  { id:'agentic-west',x:-18.2,z:-14.9,width:5.3,depth:8.6,height:1.75 },
  { id:'agentic-back',x:-13.2,z:-20.7,width:17.5,depth:4.7,height:2.15 },
  { id:'physical-east',x:19.4,z:-17,width:6.3,depth:9,height:3.1 },
  { id:'physical-back',x:14,z:-22.6,width:17.6,depth:4.7,height:3.35 },
]
export function createSolids() {
  const boxes = []
  const add = (id, position, size, kind, visible = true) => boxes.push({id, position, halfExtents: size.map(n => n/2), kind, visible})
  add('near-ground', [0,-.6,23], [64,1.2,28], 'grass')
  add('far-ground', [0,-.2,-21], [64,2,44], 'grass')
  for (let i=0;i<20;i++) {
    const t=(i+1)/20, y=.8*t+.13*Math.sin(Math.PI*t), z=8.8-i*.4
    add(`bridge-${i}`,[0,y-.2,z],[4,.4,.41],'bridge')
    for(const side of [-1,1]) add(`bridge-rail-${i}-${side}`,[side*2.1,y+.55,z],[.18,1.1,.4],'rail',false)
  }
  for(const room of ROOMS) {
    const {x,y,front,width,depth,height,id}=room
    add(`${id}-foundation`,[x,(y+.8)/2-.1,front-depth/2],[width+.7,y-1,depth+.6],'stone')
    add(`${id}-floor`,[x,y-.10,front-depth/2],[width,.2,depth],'wood')
    add(`${id}-back`,[x,y+height/2,front-depth],[width,height,.45],'stone')
    for(const side of [-1,1]) {
      add(`${id}-side-${side}`,[x+side*width/2,y+height/2,front-depth/2],[.45,height,depth],'stone')
      add(`${id}-pier-${side}`,[x+side*(width/2-1.3),y+height/2,front],[2.6,height,.7],'stone')
    }
    add(`${id}-lintel`,[x,y+height-.25,front],[width,.8,.85],'stone')
    add(`${id}-roof`,[x,y+height+.15,front-depth/2],[width+.9,.3,depth+.9],'stone')
    const steps=Math.round((y-.8)/.2), tread=id==='agentic'?.75:.63
    for(let i=0;i<steps;i++) {
      const top=.8+(i+1)*.2
      add(`${id}-step-${i}`,[x,(top+.8)/2,front+(steps-i-.5)*tread],[4.6,top-.8,tread+.015],'stone')
    }
    if (!room.open) add(`${id}-work-boundary`,[x,y+.55,front+.13],[width-5.2,1.1,.13],'boundary',false)
  }
  add('agentic-table',[-10,2.2,-15.8],[3.2,.8,1.25],'table',false)
  add('agentic-shelf-left',[-14.55,3,-14],[.6,2.4,6],'table',false)
  add('agentic-shelf-back',[-10,3,-17.45],[8.7,2.4,.65],'table',false)
  for(const side of [-1,1])add(`agentic-open-door-${side}`,[-10+side*2.43,2.93,-9.28],[.12,2.26,1.35],'infrastructure',false)
  for(const garden of GARDENS)add(`garden-${garden.id}`,[garden.x,.8+garden.height/2,garden.z],[garden.width,garden.height,garden.depth],'infrastructure',false)
  for(const cliff of NEAR_CLIFFS){
    const {id,x,z,width,depth,height}=cliff
    // A stepped cross-shaped footprint follows the rounded cliff mass, rather than
    // a large rectangle that would block the clear corners around buildings.
    add(`cliff-${id}-core`,[x,height/2,z],[width*.86,height,depth*.86],'infrastructure',false)
    for(const side of [-1,1]){
      add(`cliff-${id}-x-${side}`,[x+side*width*.43,height*.4,z],[width*.31,height*.8,depth*.64],'infrastructure',false)
      add(`cliff-${id}-z-${side}`,[x,height*.4,z+side*depth*.43],[width*.64,height*.8,depth*.3],'infrastructure',false)
    }
  }
  // Matches the visible basalt retaining terrace behind the theatre approach.
  // The last approach steps are already above its 6.4 m top at the front edge.
  add('back-terrace-retaining',[1,3.2,-32.55],[14,6.4,10.4],'infrastructure',false)
  for(const x of [-31.7,31.7]) add(`edge-${x}`,[x,1,0],[.4,4,78],'boundary',false)
  add('back-edge',[0,4,-42.5],[64,10,.4],'boundary',false)
  add('front-edge',[0,1,36.8],[64,4,.4],'boundary',false)
  return boxes
}
export function locationAt(p) {
  const r=ROOMS[0]
  // Room state covers the interior, not merely the narrower entrance opening.
  const innerHalfWidth=r.width/2-.225
  if(p.x>r.x-innerHalfWidth && p.x<r.x+innerHalfWidth && p.z<r.front-.7 && p.z>r.front-r.depth+.5 && p.y>r.y-.4 && p.y<r.y+r.height) return 'agentic'
  if(Math.abs(p.x)<2.2 && p.z>1 && p.z<9) return 'bridge'
  return 'commons'
}

/** A guide follows known walkable paths; it never teleports an off-path visitor. */
export function buildGuideRoute(p, returning = false) {
  if (locationAt(p) === 'agentic') {
    if (!returning) return []
    const outside = [[-10,-11],[-10,-4.5],[0,0],[0,10],[0,15]]
    // The desk is solid. First clear its side before heading for the doorway,
    // including from the narrow but walkable aisle behind the desk.
    if (p.z < -14.85) {
      const side = p.x <= -10 ? -12.2 : -7.8
      return [[side,p.z],[side,-14.3],...outside]
    }
    return outside
  }
  if (p.z > 9.4 && Math.abs(p.x) < 31 && p.y > -.1 && p.y < .25) {
    return GUIDE.map(point => [...point])
  }
  return null
}
