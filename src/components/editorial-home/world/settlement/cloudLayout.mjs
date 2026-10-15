/** V2 source-of-truth is the layout exported beside the actual Blender mesh. */
function vector(value, size, name) {
  if (!Array.isArray(value) || value.length !== size || !value.every(n => Number.isFinite(n) && Math.abs(n) < 10000)) {
    throw new TypeError(`${name} must be a finite ${size}-vector`)
  }
}

const destinations = ['agentic', 'physical', 'entertainment']
const distance2D = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1])
const pointKey = point => `${point[0]},${point[1]}`

function validateRoute(route, name) {
  if (!Array.isArray(route) || route.length < 2) throw new TypeError(`${name} must contain at least two waypoints`)
  for (const point of route) vector(point, 2, `${name} waypoint`)
}

function roomLocalPoint(place, x, z) {
  const dx=x-place.center[0], dz=z-place.center[2]
  const cos=Math.cos(place.rotationY??0), sin=Math.sin(place.rotationY??0)
  return [cos*dx-sin*dz, sin*dx+cos*dz]
}

function roomContainsXZ(place, x, z) {
  const [localX,localZ]=roomLocalPoint(place,x,z)
  return Math.abs(localX)<place.halfExtents[0] && Math.abs(localZ)<place.halfExtents[2]
}

function roomContains(place, p) {
  return Math.abs(p.y-place.center[1])<place.halfExtents[1] && roomContainsXZ(place,p.x,p.z)
}

export function validateCloudLayout(data) {
  if (!data || data.schemaVersion !== 2 || data.coordinateSystem !== 'Y-up') throw new TypeError('Expected cloud layout schema 2 / Y-up')
  if (data.assetSha256 !== undefined && (typeof data.assetSha256 !== 'string' || !/^[a-f0-9]{64}$/.test(data.assetSha256))) throw new TypeError('Invalid cloud asset revision')
  if(data.groundPathWear!==undefined&&(!Number.isFinite(data.groundPathWear)||data.groundPathWear<0||data.groundPathWear>1))throw new TypeError('groundPathWear must be between 0 and 1')
  vector(data.spawn, 3, 'spawn')
  if(data.creekCentre!==undefined){
    if(!Array.isArray(data.creekCentre)||data.creekCentre.length<2||data.creekCentre.length>512)throw new TypeError('Bounded creek centre polyline required')
    for(const point of data.creekCentre)vector(point,2,'creek centre point')
  }
  for (const key of ['locations', 'guideToAgentic', 'colliders', 'surfaces']) {
    if (!Array.isArray(data[key])) throw new TypeError(`${key} must be an array`)
  }
  if (!data.surfaces.length) throw new TypeError('Authored walking surfaces are required')
  if (data.guideToAgentic.length < 2) throw new TypeError('A complete Agentic route is required')
  const ids = new Set()
  for (const place of data.locations) {
    if (!place || typeof place.id !== 'string' || ids.has(place.id)) throw new TypeError('Location ids must be unique strings')
    ids.add(place.id)
    vector(place.center, 3, 'location.center'); vector(place.halfExtents, 3, 'location.halfExtents')
    if (place.halfExtents.some(n => n <= 0)) throw new TypeError('Location halfExtents must be positive')
    if (place.open !== undefined && typeof place.open !== 'boolean') throw new TypeError('Location open must be boolean')
    if (place.rotationY !== undefined && !Number.isFinite(place.rotationY)) throw new TypeError('Location rotation must be finite')
  }
  if (!ids.has('agentic')) throw new TypeError('Agentic location is required')
  for (const point of data.guideToAgentic) vector(point, 2, 'guide waypoint')
  if (data.guideRoutes !== undefined) {
    if (!data.guideRoutes || typeof data.guideRoutes !== 'object' || Array.isArray(data.guideRoutes)) throw new TypeError('guideRoutes must be a destination map')
    for (const [destination, route] of Object.entries(data.guideRoutes)) {
      if (!destinations.includes(destination) || !ids.has(destination)) throw new TypeError('Guide destination must reference a known room')
      validateRoute(route, `guideRoutes.${destination}`)
    }
    if (data.guideRoutes.agentic && JSON.stringify(data.guideRoutes.agentic) !== JSON.stringify(data.guideToAgentic)) {
      throw new TypeError('guideRoutes.agentic must match the legacy guideToAgentic route')
    }
  }
  if (data.guideAccess !== undefined) {
    if (!data.guideAccess || typeof data.guideAccess!=='object' || Array.isArray(data.guideAccess)) throw new TypeError('guideAccess must be an optional destination map')
    for (const [destination,access] of Object.entries(data.guideAccess)) {
      const room=data.locations.find(place=>place.id===destination),route=data.guideRoutes?.[destination]
      if (destination!=='entertainment' || access!=='doorstep' || room?.open!==false || !Array.isArray(route) || route.length<2) throw new TypeError('Doorstep access requires the closed Entertainment room and an authored route')
      const endpoint=route.at(-1)
      if (roomContainsXZ(room,...endpoint)) throw new TypeError('A doorstep guide must stop outside the closed room')
    }
  }
  if (data.lights !== undefined) {
    if (!Array.isArray(data.lights) || data.lights.length > 3) throw new TypeError('lights must contain at most three interior lights')
    if (data.lights.filter(light=>light?.type==='window-daylight').length>1) throw new TypeError('Only one window daylight shadow is supported')
    const lightIds = new Set()
    for (const light of data.lights) {
      if (!light || typeof light.id !== 'string' || !light.id.length || lightIds.has(light.id)) throw new TypeError('Light ids must be unique nonempty strings')
      lightIds.add(light.id)
      if (!['warm-interior','window-daylight'].includes(light.type)) throw new TypeError('Unsupported interior light type')
      if (light.type==='window-daylight') {
        vector(light.target,3,'light.target');vector(light.position,3,'light.position')
        if(Math.hypot(...light.target.map((v,i)=>v-light.position[i]))<.1)throw new TypeError('Window light target must differ from source')
      }
      vector(light.position, 3, 'light.position')
      if (typeof light.color !== 'string' || !/^#[a-f\d]{6}$/i.test(light.color)) throw new TypeError('Light color must be a six-digit hex color')
    }
  }
  for (const box of data.colliders) {
    vector(box.position, 3, 'collider.position'); vector(box.halfExtents, 3, 'collider.halfExtents')
    if (box.halfExtents.some(n => n <= 0)) throw new TypeError('Collider halfExtents must be positive')
    if (box.rotationY !== undefined && !Number.isFinite(box.rotationY)) throw new TypeError('Collider rotation must be finite')
  }
  for (const surface of data.surfaces) {
    if (!Array.isArray(surface.vertices) || surface.vertices.length < 9 || surface.vertices.length % 3 || !surface.vertices.every(Number.isFinite)) throw new TypeError('Invalid surface vertices')
    const count = surface.vertices.length / 3
    if (!Array.isArray(surface.indices) || surface.indices.length < 3 || surface.indices.length % 3 || !surface.indices.every(n => Number.isInteger(n) && n >= 0 && n < count)) throw new TypeError('Invalid surface triangle indices')
  }
  if (data.cameras) for (const camera of Object.values(data.cameras)) {
    vector(camera.position, 3, 'camera.position'); vector(camera.target, 3, 'camera.target')
  }
  return data
}

export function cloudLocationAt(layout, p) {
  // Interior locations take priority over the broad common area or bridge.
  for (const place of layout.locations) {
    if (place.open === false || place.id === 'commons') continue
    if (roomContains(place,p)) return place.id
  }
  return 'commons'
}

/** Highest authored triangular surface at this x/z, for offline checks only. */
export function cloudGroundHeight(layout, x, z, maximumY = Infinity) {
  let highest = -Infinity
  for (const { vertices: v, indices } of layout.surfaces) for (let n = 0; n < indices.length; n += 3) {
    const a = indices[n] * 3, b = indices[n + 1] * 3, c = indices[n + 2] * 3
    const denominator = (v[b + 2] - v[c + 2]) * (v[a] - v[c]) + (v[c] - v[b]) * (v[a + 2] - v[c + 2])
    if (Math.abs(denominator) < 1e-9) continue
    const u = ((v[b + 2] - v[c + 2]) * (x - v[c]) + (v[c] - v[b]) * (z - v[c + 2])) / denominator
    const w = ((v[c + 2] - v[a + 2]) * (x - v[c]) + (v[a] - v[c]) * (z - v[c + 2])) / denominator
    const t = 1 - u - w
    if (u >= -1e-6 && w >= -1e-6 && t >= -1e-6) {
      const height = u * v[a + 1] + w * v[b + 1] + t * v[c + 1]
      if (height <= maximumY) highest = Math.max(highest, height)
    }
  }
  return highest
}

function roomRoute(layout, destination) {
  const room = layout.locations.find(place => place.id === destination)
  const route = layout.guideRoutes?.[destination] ?? (destination === 'agentic' ? layout.guideToAgentic : undefined)
  if (!room || !Array.isArray(route) || route.length<2) return null
  if (room.open!==false) return route
  return destination==='entertainment' && layout.guideAccess?.[destination]==='doorstep'
    && !roomContainsXZ(room,...route.at(-1)) ? route : null
}

/** Guided destinations are not the list of open or illuminated interiors. */
export function cloudGuideDestinations(layout) {
  return destinations.filter(destination=>roomRoute(layout,destination)!==null)
}

function forbiddenGuideOrigin(layout,p) {
  return layout.locations.some(place=>destinations.includes(place.id) && roomContains(place,p)
    && (place.open===false || !roomRoute(layout,place.id)))
}

/** Explicit coincident nodes join; nearby/crossing lines do not create shortcuts. */
function guideGraph(layout) {
  const nodes = new Map(), edges = new Map(), goals = new Map()
  const spawn = [layout.spawn[0], layout.spawn[2]], start = pointKey(spawn)
  const spawnHeight = cloudGroundHeight(layout, ...spawn, layout.spawn[1] + .55)
  if (!Number.isFinite(spawnHeight)) return {nodes, edges, goals, start}
  const node = (point, height) => {
    const key = pointKey(point)
    if (!nodes.has(key)) nodes.set(key, {point, height, neighbors: new Map()})
    return key
  }
  node(spawn, spawnHeight)
  for (const destination of destinations) {
    const route = roomRoute(layout, destination)
    if (!route) continue
    let from = start, complete = true
    for (const point of route) {
      const previous = nodes.get(from), to = pointKey(point), length = distance2D(previous.point, point)
      if (length < 1e-8) continue
      const key = [from, to].sort().join('|')
      if (!edges.has(key)) {
        // Anchor heights to the spawn's walkable layer, not the caller's y. A
        // roof over the same x/z must never become a second apparent guide path.
        const count = Math.ceil(length / .25), levels = [previous.height]
        for (let step = 1; step <= count; step++) {
          const t = step / count, x = previous.point[0] + (point[0] - previous.point[0]) * t
          const z = previous.point[1] + (point[1] - previous.point[1]) * t
          const height = cloudGroundHeight(layout, x, z, levels.at(-1) + .55)
          if (!Number.isFinite(height) || Math.abs(height - levels.at(-1)) > .55) {complete = false; break}
          levels.push(height)
        }
        if (!complete || (nodes.has(to) && Math.abs(nodes.get(to).height - levels.at(-1)) > .55)) {complete = false; break}
        node(point, levels.at(-1))
        const edge = {a: from, b: to, length, levels}
        edges.set(key, edge)
        previous.neighbors.set(to, length); nodes.get(to).neighbors.set(from, length)
      }
      from = to
    }
    if (complete) goals.set(destination, from)
  }
  return {nodes, edges, goals, start}
}

function shortestPaths(nodes, target) {
  const distances = new Map([[target, 0]]), next = new Map(), pending = new Set(nodes.keys())
  while (pending.size) {
    let closest, length = Infinity
    for (const key of pending) if ((distances.get(key) ?? Infinity) < length) {closest = key; length = distances.get(key)}
    if (closest === undefined) break
    pending.delete(closest)
    for (const [neighbor, edgeLength] of nodes.get(closest).neighbors) {
      const candidate = length + edgeLength
      if (candidate < (distances.get(neighbor) ?? Infinity) - 1e-9) {
        distances.set(neighbor, candidate); next.set(neighbor, closest)
      }
    }
  }
  return {distances, next}
}

function crossesSolidBox(a, b, fromFloor, toFloor, box) {
  // A box whose top is the sampled walking surface is a supported riser, not
  // furniture. Check the low standing band only; Rapier retains responsibility
  // for the full body, overhead clearance, foot contacts and turning sweep.
  const top = box.position[1] + box.halfExtents[1], bottom = box.position[1] - box.halfExtents[1]
  if (top <= Math.max(fromFloor, toFloor) + .04 || bottom >= Math.min(fromFloor, toFloor) + .8) return false
  const cos = Math.cos(box.rotationY ?? 0), sin = Math.sin(box.rotationY ?? 0)
  const local = point => {
    const x = point[0] - box.position[0], z = point[1] - box.position[2]
    return [cos * x - sin * z, sin * x + cos * z]
  }
  const start = local(a), finish = local(b), half = [box.halfExtents[0], box.halfExtents[2]]
  let enter = 0, exit = 1
  for (let axis = 0; axis < 2; axis++) {
    const delta = finish[axis] - start[axis]
    if (Math.abs(delta) < 1e-10) {
      if (Math.abs(start[axis]) > half[axis]) return false
    } else {
      const first = (-half[axis] - start[axis]) / delta, second = (half[axis] - start[axis]) / delta
      enter = Math.max(enter, Math.min(first, second)); exit = Math.min(exit, Math.max(first, second))
      if (enter > exit) return false
    }
  }
  return true
}

/** Conservative admission check, not another character controller or detour. */
function supportedConnection(layout, p, point, actorFloor, joinFloor) {
  const count = Math.max(1, Math.ceil(Math.hypot(p.x - point[0], p.z - point[1]) / .1))
  let previous = [p.x, p.z], previousFloor = actorFloor
  for (let step = 1; step <= count; step++) {
    const t = step / count, current = [p.x + (point[0] - p.x) * t, p.z + (point[1] - p.z) * t]
    const expected = actorFloor + (joinFloor - actorFloor) * t
    const floor = cloudGroundHeight(layout, ...current, expected + .24)
    // Two banks can individually be close to the road yet have a deep creek or
    // missing support between them. Never admit that connector from endpoints
    // alone. This tightens admission only; it cannot raise physical step limits.
    if (!Number.isFinite(floor) || Math.abs(floor - expected) > .24 || Math.abs(floor - previousFloor) > .21) return false
    for (const box of layout.colliders) if (crossesSolidBox(previous, current, previousFloor, floor, box)) return false
    previous = current; previousFloor = floor
  }
  return true
}

/** Walk only the nearest documented segment; return points, never move a body. */
export function cloudGuideRoute(layout, p, returning = false, destination = 'agentic') {
  return resolveGuideRoute(layout,p,returning,destination)
}

/** Offline single-use arrival check. Resident scenes should reuse navigation. */
export function cloudGuideArrival(layout,p,destination) {
  return resolveGuideArrival(layout,p,destination)
}

/** One graph for route admission and cheap arrival checks in one resident scene.
 * Recreate after changing its authored layout; no cross-scene/global cache.
 */
export function createCloudGuideNavigation(layout) {
  const graph=guideGraph(layout)
  return {
    route:(p,returning=false,destination='agentic')=>resolveGuideRoute(layout,p,returning,destination,graph),
    arrived:(p,destination)=>resolveGuideArrival(layout,p,destination,graph),
  }
}

/** One planner per resident, unchanged authored layout; no cross-scene cache.
 * Recreate after a layout change. Editor callers can retain cloudGuideRoute.
 * Actor-to-path grounding is still checked on every request.
 */
export function createCloudGuidePlanner(layout) {
  return createCloudGuideNavigation(layout).route
}

function resolveGuideArrival(layout,p,destination,preparedGraph) {
  if (!p || ![p.x,p.y,p.z].every(Number.isFinite) || !destinations.includes(destination)
    || !roomRoute(layout,destination) || forbiddenGuideOrigin(layout,p)) return false
  const graph=preparedGraph??guideGraph(layout),goal=graph.nodes.get(graph.goals.get(destination))
  // The height is anchored to spawn through authored support samples, never
  // selected with the caller's y. Same-XZ roofs cannot count as arrival.
  return !!goal && distance2D([p.x,p.z],goal.point)<=.20 && Math.abs(p.y-goal.height)<=.24
}

function resolveGuideRoute(layout,p,returning,destination,preparedGraph) {
  if (!p || ![p.x, p.y, p.z].every(Number.isFinite) || !destinations.includes(destination)) return null
  if (!returning && !roomRoute(layout, destination)) return null
  // cloudLocationAt intentionally hides closed rooms; guide eligibility must
  // still reject an actor physically inside one (or inside an un-routed room).
  if (forbiddenGuideOrigin(layout,p)) return null

  const graph=preparedGraph??guideGraph(layout)
  const {nodes, edges, goals, start} = graph
  const target = returning ? start : goals.get(destination)
  if (!nodes.has(target)) return null
  const {distances, next} = shortestPaths(nodes, target)
  let nearest
  for (const edge of edges.values()) {
    const a = nodes.get(edge.a).point, b = nodes.get(edge.b).point, dx = b[0] - a[0], dz = b[1] - a[1]
    const t = Math.max(0, Math.min(1, ((p.x - a[0]) * dx + (p.z - a[1]) * dz) / edge.length ** 2))
    const point = [a[0] + t * dx, a[1] + t * dz], distance = Math.hypot(p.x - point[0], p.z - point[1])
    if (distance > 1.25 || (nearest && distance > nearest.distance + 1e-8)) continue
    const index = Math.min(edge.levels.length - 2, Math.floor(t * (edge.levels.length - 1)))
    const expected = Math.max(edge.levels[index], edge.levels[index + 1])
    const floor = cloudGroundHeight(layout, ...point, expected + .10)
    if (!Number.isFinite(floor) || Math.abs(floor - p.y) > .55) continue
    const actorFloor = cloudGroundHeight(layout, p.x, p.z, floor + .55)
    if (!Number.isFinite(actorFloor) || Math.abs(actorFloor - p.y) > .55) continue
    if (!supportedConnection(layout, p, point, actorFloor, floor)) continue
    const viaA = t * edge.length + (distances.get(edge.a) ?? Infinity)
    const viaB = (1 - t) * edge.length + (distances.get(edge.b) ?? Infinity)
    const cost = Math.min(viaA, viaB)
    if (!Number.isFinite(cost)) continue
    if (!nearest || distance < nearest.distance - 1e-8 || cost < nearest.cost) {
      nearest = {distance, point, cost, via: viaA <= viaB ? edge.a : edge.b}
    }
  }
  if (!nearest) return null
  if (!returning && (cloudLocationAt(layout, p) === destination
    || layout.guideAccess?.[destination]==='doorstep' && resolveGuideArrival(layout,p,destination,graph))) return []
  const result = [nearest.point]
  for (let key = nearest.via; key !== undefined; key = next.get(key)) {
    const point = nodes.get(key).point
    if (distance2D(result.at(-1), point) > 1e-8) result.push(point)
    if (key === target) break
  }
  return result.map(point => [...point])
}
