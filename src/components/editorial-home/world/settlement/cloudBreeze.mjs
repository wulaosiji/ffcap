// One world-space breeze for rooted grass and foliage. Seconds come
// from the settlement's pause/visibility-aware clock, never Date.now or a timer.
export const BREEZE_GLSL = /* glsl */ `
uniform float uBreezeTime;
uniform float uBreezeStrength;
vec3 cloudBreeze(vec3 world) {
  float angle = .72 + .16 * sin(uBreezeTime * .047);
  vec2 direction = vec2(cos(angle), sin(angle));
  float phase = dot(world.xz, direction) * .83 - uBreezeTime * 1.35;
  float gust = .56 + .23 * sin(phase) + .12 * sin(phase * .47 + uBreezeTime * .21);
  float flutter = sin(phase * 3.1 + world.y * 2.7) * .07;
  return vec3(direction.x, 0.0, direction.y) * (gust + flutter) * uBreezeStrength;
}`

export function breezeStrength(weatherWind) {
  if (!Number.isFinite(weatherWind)) throw new TypeError('Breeze needs finite weather')
  return .42 + Math.max(0, Math.min(1, weatherWind)) * .58
}

/** Connected blades retain a fixed root. The turf mesh is never passed here. */
export function plantFlexibility(geometry,rootedUV=false) {
  const p = geometry.getAttribute('position'), index = geometry.index
  if (!p || !index) throw new TypeError('Plants need indexed authored geometry')
  const uv=rootedUV?geometry.getAttribute('uv'):undefined
  if(rootedUV&&(!uv||uv.count!==p.count))throw new TypeError('Authored plants need continuous root-to-tip UVs')
  const parent = new Int32Array(p.count)
  for (let i = 0; i < p.count; i++) parent[i] = i
  const find = n => {while (parent[n] !== n) {parent[n] = parent[parent[n]]; n = parent[n]} return n}
  const union = (a,b) => {a=find(a); b=find(b); if(a!==b)parent[b]=a}
  for (let i=0; i<index.count; i+=3) {union(index.getX(i),index.getX(i+1));union(index.getX(i),index.getX(i+2))}
  const lower = new Float32Array(p.count).fill(Infinity), upper = new Float32Array(p.count).fill(-Infinity)
  for (let i=0;i<p.count;i++){const r=find(i),y=p.getY(i);lower[r]=Math.min(lower[r],y);upper[r]=Math.max(upper[r],y)}
  const flex = new Float32Array(p.count)
  for (let i=0;i<p.count;i++) {
    const r=find(i),height=upper[r]-lower[r]
    // New curved blades mark the real attachment in U. Lowest-Y inference is
    // wrong for hanging ivy and would pin its tip while moving the root.
    const tip=uv?Math.max(0,Math.min(1,uv.getX(i))):height>.004?Math.max(0,Math.min(1,(p.getY(i)-lower[r])/height)):0
    // Tall crowns move less than thin meadow blades; no whole-tree translation.
    flex[i]=tip*tip*Math.min(.075,Math.max(.018,height*.16))
  }
  return flex
}
