import * as THREE from 'three'
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'
import { SEGMENT_COUNT, SEGMENT_LENGTH, RECYCLE_Z, PORTAL_Z, bounded, crossedPortal, sectionTopic, wrapSegmentZ } from './math.mjs'

export type WorldProgress = { distance: number; discoveries: number; topic: number }
export type WorldAPI = {
  setPaused: (paused: boolean) => void
  setExploring: (exploring: boolean) => void
  setDirection: (direction: -1 | 0 | 1) => void
  setPointer: (x: number, y: number) => void
  setTopic: (topic: 0 | 1 | 2) => void
  dispose: () => void
}
type WorldOptions = {
  onProgress?: (state: WorldProgress) => void
  onReady?: () => void
  onError?: () => void
}
type Segment = { root: THREE.Group; ordinal: number; topic: number; sculptures: THREE.Group[]; floaters: THREE.InstancedMesh; shadowMeshes: THREE.Mesh[] }

const PALETTES = [
  { air: '#929fa5', stone: '#969c93', accent: '#8d759f' },
  { air: '#a5a797', stone: '#a6a08f', accent: '#ac947c' },
  { air: '#a89faa', stone: '#a69b9e', accent: '#ba839e' },
]

/** An infinite architectural promenade. The scene owns no UI or global input. */
export function createWorld(canvas: HTMLCanvasElement, options: WorldOptions = {}): WorldAPI {
  const mobile = window.matchMedia('(max-width: 760px), (pointer: coarse)').matches
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance' })
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 0.9
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, mobile ? 1 : 1.5))
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFShadowMap

  const scene = new THREE.Scene()
  scene.background = new THREE.Color(PALETTES[0].air)
  scene.fog = new THREE.FogExp2(PALETTES[0].air, 0.0082)
  const camera = new THREE.PerspectiveCamera(mobile ? 66 : 58, 1, 0.15, 280)
  camera.position.set(0, 3.3, 11)
  const geometries = new Set<THREE.BufferGeometry>()
  const materials = new Set<THREE.Material>()
  const textures = new Set<THREE.Texture>()
  const geometry = <T extends THREE.BufferGeometry>(value: T): T => { geometries.add(value); return value }
  const material = <T extends THREE.Material>(value: T): T => { materials.add(value); return value }

  // A generated studio environment gives metal real reflections without downloads.
  const room = new RoomEnvironment()
  const pmrem = new THREE.PMREMGenerator(renderer)
  let environment: THREE.WebGLRenderTarget | undefined
  try {
    environment = pmrem.fromScene(room, 0.025)
    scene.environment = environment.texture
    scene.environmentIntensity = 0.55
  } catch {
    // The remaining scene uses low-metalness materials if environment creation fails.
    scene.environment = null
  } finally {
    room.traverse(object => { if (object instanceof THREE.InstancedMesh) object.dispose() })
    room.dispose()
    pmrem.dispose()
  }

  const skyLight = new THREE.HemisphereLight('#dce7ec', '#626657', 1.4)
  const sun = new THREE.DirectionalLight('#fff0d5', 3.4)
  sun.position.set(-38, 52, 18)
  sun.target.position.set(0, 0, -30)
  sun.castShadow = true
  sun.shadow.mapSize.set(mobile ? 1024 : 2048, mobile ? 1024 : 2048)
  Object.assign(sun.shadow.camera, { left: -34, right: 34, top: 38, bottom: -38, near: 1, far: 150 })
  sun.shadow.camera.updateProjectionMatrix()
  sun.shadow.normalBias = 0.035
  sun.shadow.bias = -0.00012
  sun.shadow.radius = 3
  const fillLight = new THREE.DirectionalLight('#d9e6ed', 0.45)
  fillLight.position.set(35, 14, -65)
  scene.add(skyLight, sun, sun.target, fillLight)

  const noiseBytes = new Uint8Array(128 * 128 * 4)
  let noiseSeed = 8417
  for (let i = 0; i < noiseBytes.length; i += 4) {
    noiseSeed = (Math.imul(noiseSeed, 1664525) + 1013904223) >>> 0
    const value = 118 + (noiseSeed % 85)
    noiseBytes.set([value, value, value, 255], i)
  }
  const concreteBump = new THREE.DataTexture(noiseBytes, 128, 128, THREE.RGBAFormat)
  concreteBump.wrapS = concreteBump.wrapT = THREE.RepeatWrapping
  concreteBump.repeat.set(9, 9)
  concreteBump.magFilter = THREE.LinearFilter
  concreteBump.needsUpdate = true
  textures.add(concreteBump)

  const concrete = material(new THREE.MeshStandardMaterial({ color: '#9b9c93', roughness: 0.9, metalness: 0, bumpMap: concreteBump, bumpScale: 0.06 }))
  const paleStone = material(new THREE.MeshStandardMaterial({ color: '#b4b1a7', roughness: 0.8, metalness: 0, bumpMap: concreteBump, bumpScale: 0.035 }))
  const floorMaterial = material(new THREE.MeshStandardMaterial({ color: PALETTES[0].stone, roughness: 0.92, metalness: 0, bumpMap: concreteBump, bumpScale: 0.018 }))
  const metal = material(new THREE.MeshStandardMaterial({ color: '#bdc4c4', roughness: 0.29, metalness: scene.environment ? 0.72 : 0.05, envMapIntensity: 0.95 }))
  const darkMetal = material(new THREE.MeshStandardMaterial({ color: '#626861', roughness: 0.36, metalness: scene.environment ? 0.52 : 0 }))
  const accents = PALETTES.map(p => material(new THREE.MeshStandardMaterial({ color: p.accent, roughness: 0.43, metalness: scene.environment ? 0.36 : 0 })))

  const unitBox = geometry(new THREE.BoxGeometry(1, 1, 1))
  const softCube = geometry(new RoundedBoxGeometry(1, 1, 1, 3, 0.07))
  const cylinder = geometry(new THREE.CylinderGeometry(1, 1, 1, 20))
  const ring = geometry(new THREE.TorusGeometry(2.4, 0.17, 12, 80))
  const ringSmall = geometry(new THREE.TorusGeometry(1.78, 0.23, 14, 72))
  const baseGeometry = geometry(new THREE.CylinderGeometry(3.6, 3.75, 0.48, 64))
  const outer = new THREE.Shape()
  outer.absarc(0, 0, 10.35, 0, Math.PI * 2, false)
  const opening = new THREE.Path()
  opening.absarc(0, 0, 8.65, 0, Math.PI * 2, true)
  outer.holes.push(opening)
  const archGeometry = geometry(new THREE.ExtrudeGeometry(outer, { depth: 2.7, bevelEnabled: true, bevelThickness: 0.1, bevelSize: 0.12, bevelSegments: 2, curveSegments: 80 }))
  archGeometry.translate(0, 8.65, -1.35)

  class InfinityCurve extends THREE.Curve<THREE.Vector3> {
    constructor() { super() }
    getPoint(t: number, target = new THREE.Vector3()) {
      const angle = t * Math.PI * 2
      const sin = Math.sin(angle)
      const denominator = 1 + sin * sin
      return target.set(3.6 * Math.cos(angle) / denominator, 3.4 * sin * Math.cos(angle) / denominator, 0.65 * sin)
    }
  }
  const infinityGeometry = geometry(new THREE.TubeGeometry(new InfinityCurve(), 160, 0.34, 16, true))
  const matrixObject = new THREE.Object3D()
  const up = new THREE.Vector3(0, 1, 0)
  const vector = new THREE.Vector3()
  const mesh = (g: THREE.BufferGeometry, m: THREE.Material, parent: THREE.Group | THREE.Scene, x = 0, y = 0, z = 0) => {
    const result = new THREE.Mesh(g, m)
    result.position.set(x, y, z)
    result.receiveShadow = true
    parent.add(result)
    return result
  }
  const place = (instance: THREE.InstancedMesh, i: number, position: THREE.Vector3, scale: THREE.Vector3, rotation?: THREE.Euler) => {
    matrixObject.position.copy(position)
    matrixObject.scale.copy(scale)
    matrixObject.rotation.copy(rotation || new THREE.Euler())
    matrixObject.updateMatrix()
    instance.setMatrixAt(i, matrixObject.matrix)
  }
  const connect = (instance: THREE.InstancedMesh, i: number, start: THREE.Vector3, end: THREE.Vector3, radius: number) => {
    vector.subVectors(end, start)
    matrixObject.position.copy(start).add(end).multiplyScalar(0.5)
    matrixObject.scale.set(radius, vector.length(), radius)
    matrixObject.quaternion.setFromUnitVectors(up, vector.normalize())
    matrixObject.updateMatrix()
    instance.setMatrixAt(i, matrixObject.matrix)
  }

  const ground = mesh(geometry(new THREE.PlaneGeometry(700, 700)), floorMaterial, scene, 0, -0.18, -120)
  ground.rotation.x = -Math.PI / 2

  function buildAgentic() {
    const group = new THREE.Group()
    const positions = [new THREE.Vector3(-2.05, 2.05, 0), new THREE.Vector3(0, 3.45, 0.65), new THREE.Vector3(2.1, 2.8, -0.3), new THREE.Vector3(-0.5, 5.3, -0.45), new THREE.Vector3(1.6, 4.8, 0.75)]
    const nodes = new THREE.InstancedMesh(softCube, accents[0], positions.length)
    positions.forEach((p, i) => place(nodes, i, p, new THREE.Vector3(i === 1 ? 1.35 : 0.85, i === 1 ? 1.35 : 0.85, i === 1 ? 1.35 : 0.85), new THREE.Euler(0.2, 0.35 + i * 0.3, 0.1)))
    nodes.instanceMatrix.needsUpdate = true
    const edges = [[0, 1], [1, 2], [1, 3], [2, 4], [3, 4], [0, 3]]
    const connections = new THREE.InstancedMesh(cylinder, metal, edges.length)
    edges.forEach(([a, b], i) => connect(connections, i, positions[a], positions[b], 0.065))
    connections.instanceMatrix.needsUpdate = true
    group.add(nodes, connections)
    return group
  }

  function buildPhysical() {
    const group = new THREE.Group()
    const outerRing = mesh(ring, metal, group, 0, 3.35, 0)
    outerRing.rotation.y = 0.18
    const innerRing = mesh(ringSmall, accents[1], group, 0, 3.35, 0)
    innerRing.rotation.y = 1.16
    const teeth = new THREE.InstancedMesh(unitBox, darkMetal, 24)
    for (let i = 0; i < 24; i++) {
      const angle = i * Math.PI / 12
      place(teeth, i, new THREE.Vector3(Math.cos(angle) * 2.45, Math.sin(angle) * 2.45 + 3.35, 0), new THREE.Vector3(0.23, 0.4, 0.37), new THREE.Euler(0, 0, angle - Math.PI / 2))
    }
    const struts = new THREE.InstancedMesh(cylinder, metal, 3)
    connect(struts, 0, new THREE.Vector3(-1.55, 0.45, 0), new THREE.Vector3(-1.55, 3.35, 0), 0.14)
    connect(struts, 1, new THREE.Vector3(1.55, 0.45, 0), new THREE.Vector3(1.55, 3.35, 0), 0.14)
    connect(struts, 2, new THREE.Vector3(-2.6, 3.35, 0), new THREE.Vector3(2.6, 3.35, 0), 0.2)
    const core = mesh(softCube, darkMetal, group, 0, 3.35, 0)
    core.scale.set(0.9, 1.4, 1)
    teeth.instanceMatrix.needsUpdate = struts.instanceMatrix.needsUpdate = true
    group.add(teeth, struts)
    return group
  }

  function buildEntertainment() {
    const group = new THREE.Group()
    const knot = mesh(infinityGeometry, accents[2], group, 0, 3.7, 0)
    knot.rotation.z = -0.12
    return group
  }

  const segments: Segment[] = []
  for (let i = 0; i < SEGMENT_COUNT; i++) {
    const root = new THREE.Group()
    root.position.z = 20 - i * SEGMENT_LENGTH
    const arch = mesh(archGeometry, concrete, root)
    arch.rotation.y = i % 2 ? 0.025 : -0.025
    const walk = mesh(unitBox, paleStone, root, 0, -0.06, -SEGMENT_LENGTH / 2)
    walk.scale.set(17, 0.16, SEGMENT_LENGTH)
    const masses = new THREE.InstancedMesh(unitBox, concrete, 4)
    const massHeights = [11, 17, 8, 13]
    for (let j = 0; j < 4; j++) {
      const side = j % 2 ? 1 : -1
      const height = massHeights[(j + i) % massHeights.length]
      place(masses, j, new THREE.Vector3(side * (19 + j * 1.5), height / 2 - 0.12, -13 - Math.floor(j / 2) * 21), new THREE.Vector3(7 + j, height, 13 + j * 2))
    }
    masses.instanceMatrix.needsUpdate = true
    masses.receiveShadow = true
    root.add(masses)
    const pedestal = mesh(baseGeometry, paleStone, root, 8.6, 0.3, -16)
    pedestal.scale.x = 0.85
    const sculptures = [buildAgentic(), buildPhysical(), buildEntertainment()]
    sculptures.forEach(sculpture => { sculpture.position.set(8.6, 0.56, -16); root.add(sculpture) })
    const floaters = new THREE.InstancedMesh(softCube, metal, 2)
    floaters.instanceMatrix.setUsage(THREE.DynamicDrawUsage)
    floaters.frustumCulled = false
    root.add(floaters)
    scene.add(root)
    const shadowMeshes: THREE.Mesh[] = []
    root.traverse(object => { if (object instanceof THREE.Mesh && object !== walk) { object.receiveShadow = true; shadowMeshes.push(object) } })
    const ordinal = i - 1
    const topic = sectionTopic(ordinal)
    sculptures.forEach((s, index) => { s.visible = index === topic })
    segments.push({ root, ordinal, topic, sculptures, floaters, shadowMeshes })
  }

  let disposed = false
  let paused = false
  let exploring = false
  let direction = 0
  let topicOffset = 0
  let selectedPalette = 0
  let targetX = 0
  let targetPointerX = 0
  let targetPointerY = 0
  let pointerX = 0
  let pointerY = 0
  let distance = 0
  let discoveries = 0
  let elapsed = 0
  let speed = 3
  let lastTime = 0
  let lastReport = -1
  let ready = false
  let frameId = 0
  let failed = false
  const airTarget = new THREE.Color(PALETTES[0].air)
  const stoneTarget = new THREE.Color(PALETTES[0].stone)
  const lookTarget = new THREE.Vector3()
  const floaterPosition = new THREE.Vector3()
  const floaterScale = new THREE.Vector3()
  const floaterRotation = new THREE.Euler()

  const nearestSegment = () => segments.filter(s => s.root.position.z <= PORTAL_Z).sort((a, b) => b.root.position.z - a.root.position.z)[0] || segments[0]
  const report = () => { if (!disposed) options.onProgress?.({ distance: Math.floor(distance), discoveries, topic: nearestSegment().topic }) }
  function applyTheme(segment: Segment) {
    segment.topic = sectionTopic(segment.ordinal, topicOffset)
    segment.sculptures.forEach((sculpture, index) => { sculpture.visible = index === segment.topic })
  }
  function stop() {
    if (frameId) window.cancelAnimationFrame(frameId)
    frameId = 0
    lastTime = 0
  }
  function fail() {
    if (failed || disposed) return
    failed = true
    disposeWorld()
    options.onError?.()
  }
  function schedule() {
    if (!disposed && !paused && !failed && !document.hidden && !frameId) frameId = window.requestAnimationFrame(frame)
  }
  function renderPausedFrame() {
    if (!paused || disposed || failed || document.hidden) return
    const rect = canvas.getBoundingClientRect()
    if (!rect.width || !rect.height || rect.bottom <= 0 || rect.top >= window.innerHeight || rect.right <= 0 || rect.left >= window.innerWidth) return
    // A resize or deliberate topic change can repaint a paused scene once.
    // Neither simulation time nor the recurring animation loop is advanced.
    try { renderer.render(scene, camera) } catch { fail() }
  }
  function resize() {
    if (disposed) return
    const rect = canvas.getBoundingClientRect()
    const width = Math.max(1, Math.round(rect.width))
    const height = Math.max(1, Math.round(rect.height))
    const pixelRatio = Math.min(window.devicePixelRatio || 1, mobile || width <= 760 ? 1 : 1.5)
    if (renderer.getPixelRatio() !== pixelRatio) renderer.setPixelRatio(pixelRatio)
    renderer.setSize(width, height, false)
    camera.aspect = width / height
    camera.fov = width < height ? 66 : 58
    camera.updateProjectionMatrix()
    renderPausedFrame()
    schedule()
  }
  function frame(time: number) {
    frameId = 0
    if (disposed || paused || failed || document.hidden) { lastTime = 0; return }
    const dt = lastTime ? Math.min((time - lastTime) / 1000, 0.05) : 0
    lastTime = time
    elapsed += dt
    speed = THREE.MathUtils.damp(speed, exploring ? 6 : 3, 2, dt)
    const travel = speed * dt
    distance += travel
    for (const segment of segments) {
      const previousZ = segment.root.position.z
      const nextZ = previousZ + travel
      if (crossedPortal(previousZ, nextZ, exploring)) discoveries++
      segment.root.position.z = wrapSegmentZ(nextZ)
      if (nextZ > RECYCLE_Z) { segment.ordinal += SEGMENT_COUNT; applyTheme(segment) }
      const near = segment.root.position.z > -58 && segment.root.position.z < 38
      segment.shadowMeshes.forEach(object => { object.castShadow = near })
      segment.sculptures[segment.topic].rotation.y = Math.sin(elapsed * 0.1 + segment.ordinal * 0.65) * 0.32
      for (let j = 0; j < 2; j++) {
        const phase = elapsed * 0.28 + segment.ordinal + j * 2
        floaterPosition.set(-8.1 - j * 2.1, 5.5 + j * 2.6 + Math.sin(phase) * 0.4, -17 - j * 7)
        floaterScale.setScalar(j ? 0.9 : 1.4)
        floaterRotation.set(0.25 + phase * 0.04, phase * 0.12, 0.15)
        place(segment.floaters, j, floaterPosition, floaterScale, floaterRotation)
      }
      segment.floaters.instanceMatrix.needsUpdate = true
    }
    targetX = exploring ? bounded(targetX + direction * dt * 4.2, -4.3, 4.3) : THREE.MathUtils.damp(targetX, Math.sin(elapsed * 0.075) * 0.7, 0.6, dt)
    pointerX = THREE.MathUtils.damp(pointerX, targetPointerX, 3, dt)
    pointerY = THREE.MathUtils.damp(pointerY, targetPointerY, 3, dt)
    camera.position.x = THREE.MathUtils.damp(camera.position.x, targetX + pointerX * 0.5, 3, dt)
    camera.position.y = 3.3 + Math.sin(elapsed * 0.65) * 0.035
    lookTarget.set(camera.position.x * 0.65 + pointerX * 1.6, 4.25 - pointerY * 1.8, -70)
    camera.lookAt(lookTarget)
    const mix = 1 - Math.exp(-dt * 0.5)
    ;(scene.background as THREE.Color).lerp(airTarget, mix)
    ;(scene.fog as THREE.FogExp2).color.copy(scene.background as THREE.Color)
    floorMaterial.color.lerp(stoneTarget, mix)
    try {
      renderer.render(scene, camera)
      if (!ready) { ready = true; options.onReady?.() }
    } catch { fail(); return }
    if (elapsed - lastReport >= 0.5) { lastReport = elapsed; report() }
    schedule()
  }

  const resizeObserver = new ResizeObserver(resize)
  resizeObserver.observe(canvas)
  const onVisibility = () => { if (document.hidden) stop(); else schedule() }
  const onContextLost = (event: Event) => { event.preventDefault(); fail() }
  document.addEventListener('visibilitychange', onVisibility)
  canvas.addEventListener('webglcontextlost', onContextLost)
  resize()

  function disposeWorld() {
    if (disposed) return
    disposed = true
    stop()
    resizeObserver.disconnect()
    document.removeEventListener('visibilitychange', onVisibility)
    canvas.removeEventListener('webglcontextlost', onContextLost)
    scene.traverse(object => { if (object instanceof THREE.InstancedMesh) object.dispose() })
    geometries.forEach(value => value.dispose())
    materials.forEach(value => value.dispose())
    textures.forEach(value => value.dispose())
    environment?.dispose()
    environment = undefined
    sun.shadow.map?.dispose()
    renderer.renderLists.dispose()
    renderer.dispose()
    scene.environment = null
    scene.clear()
    segments.length = 0
    geometries.clear()
    materials.clear()
    textures.clear()
  }

  return {
    setPaused(value) { paused = value; if (value) stop(); else schedule() },
    setExploring(value) { exploring = value; direction = 0 },
    setDirection(value) { direction = bounded(value, -1, 1) },
    setPointer(x, y) { targetPointerX = bounded(x, -1, 1); targetPointerY = bounded(y, -1, 1) },
    setTopic(value) {
      if (disposed || !Number.isInteger(value) || value < 0 || value > 2) return
      selectedPalette = value
      topicOffset = value - nearestSegment().ordinal
      segments.forEach(applyTheme)
      airTarget.set(PALETTES[selectedPalette].air)
      stoneTarget.set(PALETTES[selectedPalette].stone)
      if (paused) {
        ;(scene.background as THREE.Color).copy(airTarget)
        ;(scene.fog as THREE.FogExp2).color.copy(airTarget)
        floorMaterial.color.copy(stoneTarget)
        renderPausedFrame()
      }
      report()
    },
    dispose: disposeWorld,
  }
}
