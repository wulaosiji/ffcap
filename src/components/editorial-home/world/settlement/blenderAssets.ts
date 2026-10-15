import * as T from 'three'
import {cloudAssetDigest} from './cloudAssetDigest.mjs'
import {createCloudAttention} from './cloudAttention'
import { GLTFLoader, type GLTF } from 'three/addons/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js'
import { createSolids } from './layout.mjs'
import type { ExplorerMotion } from './explorer'

type Solid = { id: string; position: number[]; halfExtents: number[]; kind: string; visible: boolean }
type MotionName = 'idle' | 'walk' | 'run'

/** Each load owns its resources; no global cache or shared disposal ownership. */
export function resourceOwner() {
  const geometries = new Set<T.BufferGeometry>()
  const materials = new Set<T.Material>()
  const textures = new Set<T.Texture>()
  const skeletons = new Set<T.Skeleton>()
  const instances = new Set<T.InstancedMesh>()
  const roots = new Set<T.Object3D>()
  let disposed = false

  const material = (value: T.Material) => {
    materials.add(value)
    for (const member of Object.values(value)) if (member instanceof T.Texture) textures.add(member)
  }
  const object = (value: T.Object3D) => {
    roots.add(value)
    value.traverse(node => {
      if (node instanceof T.Mesh) {
        geometries.add(node.geometry)
        for (const item of Array.isArray(node.material) ? node.material : [node.material]) material(item)
      }
      // A GLTF mesh dependency can resolve before its node binds the skeleton.
      if (node instanceof T.SkinnedMesh && node.skeleton) skeletons.add(node.skeleton)
      if (node instanceof T.InstancedMesh) instances.add(node)
    })
  }
  return {
    material,
    object,
    texture(value: T.Texture) { textures.add(value) },
    configureTextures(mobile: boolean) { textures.forEach(value => { value.anisotropy = mobile ? 2 : 4 }) },
    dispose() {
      if (disposed) return
      disposed = true
      const bitmaps = new Set<ImageBitmap>()
      for (const texture of textures) {
        const image: unknown = texture.source.data
        if (typeof ImageBitmap !== 'undefined' && image instanceof ImageBitmap) bitmaps.add(image)
        texture.dispose()
      }
      // GLTFLoader's ImageBitmapLoader retains CPU-side images after Texture.dispose.
      bitmaps.forEach(bitmap => bitmap.close())
      instances.forEach(instance => instance.dispose())
      skeletons.forEach(skeleton => skeleton.dispose())
      geometries.forEach(geometry => geometry.dispose())
      materials.forEach(value => value.dispose())
      roots.forEach(root => { root.removeFromParent(); root.clear() })
      roots.clear(); instances.clear(); skeletons.clear(); geometries.clear(); materials.clear(); textures.clear()
    },
  }
}

type Resources = ReturnType<typeof resourceOwner>

/** Register dependencies while parsing, so a late failed sibling does not leak them. */
export async function loadOwnedGLB(url: string, resources: Resources, mobile = false, expectedSha256?: string): Promise<GLTF> {
  const pending: Promise<unknown>[] = []
  const loader = new GLTFLoader()
  const draco = new DRACOLoader()
    .setDecoderPath({ js: '/world/blender/draco/draco_wasm_wrapper.js', wasm: '/world/blender/draco/draco_decoder.wasm' })
    .setWorkerLimit(mobile ? 1 : 2)
  loader.setDRACOLoader(draco)
  loader.register(parser => ({
    name: 'FFCAP_resource_ownership',
    beforeRoot() {
      for (const [type, collection, register] of [
        ['texture', 'textures', (value: T.Texture) => resources.texture(value)],
        ['material', 'materials', (value: T.Material) => resources.material(value)],
        ['mesh', 'meshes', (value: T.Object3D) => resources.object(value)],
      ] as const) {
        for (let index = 0; index < (parser.json[collection]?.length || 0); index++) {
          const dependency = parser.getDependency(type, index).then(register)
          // Attach a rejection handler immediately; the returned settlement below
          // still propagates the original error after all owned loads have settled.
          pending.push(dependency)
          dependency.catch(() => undefined)
        }
      }
      return null
    },
  }))
  try {
    let asset: GLTF
    if (expectedSha256) {
      const response = await fetch(url)
      if (!response.ok) throw new Error(`Model download failed: ${response.status}`)
      const bytes = await response.arrayBuffer()
      const hash = await cloudAssetDigest(bytes)
      if (hash !== expectedSha256) throw new Error('Model revision does not match its layout manifest')
      // An export may replace its file just as a visitor loads it. Verify bytes,
      // not only the URL, before combining new geometry and physical surfaces.
      asset = await loader.parseAsync(bytes, new URL('.', new URL(url, window.location.href)).href)
    } else asset = await loader.loadAsync(url)
    for (const scene of asset.scenes) resources.object(scene)
    resources.object(asset.scene)
    const settled = await Promise.allSettled(pending)
    const failure = settled.find((entry): entry is PromiseRejectedResult => entry.status === 'rejected')
    if (failure) throw failure.reason
    return asset
  } catch (error) {
    await Promise.allSettled(pending)
    throw error
  } finally {
    // Geometry is resident after parse; no decoder worker needs to remain alive.
    draco.dispose()
  }
}

export function validateAuthoredScene(asset: GLTF, kind: string) {
  let meshes = 0
  asset.scene.traverse(node => {
    if (node instanceof T.Camera || node instanceof T.Light) throw new Error(`${kind} must not contain its own camera or lighting`)
    if (node instanceof T.Mesh) meshes++
  })
  if (!meshes) throw new Error(`${kind} has no renderable geometry`)
}

/** Blender geometry uses the existing, independently tested traversal coordinates. */
export async function createBlenderEnvironment(scene: T.Scene, mobile: boolean) {
  const resources = resourceOwner()
  const skyLoader = new T.TextureLoader()
  const skyPromise = skyLoader.loadAsync('/world/cloud-sky-v2.webp').then(sky => { resources.texture(sky); return sky })
  const [modelResult, skyResult] = await Promise.allSettled([
    loadOwnedGLB('/world/blender/courtyard-v1-draco.glb', resources, mobile), skyPromise,
  ])
  if (modelResult.status === 'rejected' || skyResult.status === 'rejected') {
    resources.dispose()
    throw modelResult.status === 'rejected' ? modelResult.reason : (skyResult as PromiseRejectedResult).reason
  }
  const asset = modelResult.value, sky = skyResult.value
  const previous = { background: scene.background, environment: scene.environment, intensity: scene.environmentIntensity }
  let disposed = false
  try {
    validateAuthoredScene(asset, 'Blender courtyard')
    const root = asset.scene
    root.name = 'Blender research settlement'
    resources.configureTextures(mobile)
    const waters: { mesh: T.Mesh; base: Float32Array; inverse: T.Matrix4 }[] = []
    const waterClock = { value: 0 }
    root.updateMatrixWorld(true)
    root.traverse(node => {
      if (!(node instanceof T.Mesh)) return
      const water = /^Water(?:_|$)/i.test(node.name)
      const material = Array.isArray(node.material) ? node.material : [node.material]
      node.castShadow = !water && !(mobile && material.some(value => value.alphaTest > 0))
      node.receiveShadow = !water
      if (water) {
        // Small moving surface normals catch the existing sky reflection. This
        // is a visual stream surface, not a fluid simulation or an extra render.
        for (const value of material) if (value instanceof T.MeshStandardMaterial) {
          value.roughness = .15; value.metalness = .28; value.envMapIntensity = 1.1
          value.onBeforeCompile = shader => {
            shader.uniforms.uSettlementWaterTime = waterClock
            shader.vertexShader = shader.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vSettlementWater;')
              .replace('#include <begin_vertex>', '#include <begin_vertex>\nvSettlementWater = (modelMatrix * vec4(position, 1.0)).xyz;')
            shader.fragmentShader = shader.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vSettlementWater;\nuniform float uSettlementWaterTime;')
              .replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>
                vec3 waterNormal = normalize(vec3(
                  -cos(vSettlementWater.x * 1.2 + uSettlementWaterTime * .72) * .0432,
                  1.0,
                  -cos(vSettlementWater.z * 2.4 + uSettlementWaterTime * .95) * .0432));
                normal = normalize(mat3(viewMatrix) * waterNormal);`)
          }
          value.customProgramCacheKey = () => 'settlement-stream-v1'
        }
        const position = node.geometry.getAttribute('position')
        // Exported meshes can retain Blender's local axes. Apply Y-up wave motion
        // in world space and transform back, rather than assuming local Y is up.
        waters.push({ mesh: node, base: Float32Array.from(position.array), inverse: node.matrixWorld.clone().invert() })
        position.setUsage(T.DynamicDrawUsage)
      }
    })
    sky.colorSpace = T.SRGBColorSpace
    sky.mapping = T.EquirectangularReflectionMapping
    scene.background = sky; scene.environment = sky; scene.environmentIntensity = .38
    scene.add(root)
    const solids = createSolids() as Solid[]
    const cameraBoxes = solids.filter(solid => solid.kind !== 'grass' && solid.kind !== 'rail').map(solid => {
      const centre = new T.Vector3(...solid.position as [number, number, number])
      const extent = new T.Vector3(...solid.halfExtents as [number, number, number]).addScalar(.22)
      return new T.Box3(centre.clone().sub(extent), centre.clone().add(extent))
    })
    const ray = new T.Ray(), direction = new T.Vector3(), hit = new T.Vector3(), wavePoint = new T.Vector3()
    return {
      solids,
      update(time: number) {
        if (disposed || !Number.isFinite(time)) return
        waterClock.value = time
        for (const { mesh, base, inverse } of waters) {
          if (!mesh.visible) continue
          const position = mesh.geometry.getAttribute('position')
          for (let index = 0; index < position.count; index++) {
            wavePoint.fromArray(base, index * 3).applyMatrix4(mesh.matrixWorld)
            wavePoint.y += Math.sin(wavePoint.x * 1.2 + time * .72) * .036 + Math.sin(wavePoint.z * 2.4 + time * .95) * .018
            wavePoint.applyMatrix4(inverse)
            position.setXYZ(index, wavePoint.x, wavePoint.y, wavePoint.z)
          }
          position.needsUpdate = true
        }
      },
      setAuthoredWaterVisible(visible: boolean) {
        if (!disposed) waters.forEach(({ mesh }) => { mesh.visible = visible })
      },
      cameraDistance(target: T.Vector3, desired: T.Vector3) {
        direction.subVectors(desired, target)
        const length = direction.length()
        if (length < .00001) return desired.clone()
        direction.divideScalar(length)
        ray.set(target, direction)
        let nearest = length
        for (const box of cameraBoxes) {
          if (ray.intersectBox(box, hit)) {
            const distance = target.distanceTo(hit)
            if (distance > .05) nearest = Math.min(nearest, Math.max(.5, distance - .2))
          }
        }
        return target.clone().addScaledVector(direction, nearest)
      },
      dispose() {
        if (disposed) return
        disposed = true
        if (scene.background === sky) scene.background = previous.background
        if (scene.environment === sky) { scene.environment = previous.environment; scene.environmentIntensity = previous.intensity }
        waters.length = 0
        resources.dispose()
      },
    }
  } catch (error) {
    if (scene.background === sky) scene.background = previous.background
    if (scene.environment === sky) { scene.environment = previous.environment; scene.environmentIntensity = previous.intensity }
    resources.dispose()
    throw error
  }
}

/** Animation owns the authored rig only. Traversal owns position, heading and gravity. */
export async function createBlenderExplorer(url = '/world/blender/explorer-v1.glb', mobile = false, expectedSha256?: string) {
  const resources = resourceOwner()
  let mixer: T.AnimationMixer | undefined
  let asset: GLTF | undefined
  try {
    asset = await loadOwnedGLB(url, resources, mobile, expectedSha256)
    resources.configureTextures(mobile)
    validateAuthoredScene(asset, 'Blender explorer')
    let skinCount = 0
    asset.scene.traverse(node => {
      if (node instanceof T.SkinnedMesh) skinCount++
      if (node instanceof T.Mesh) { node.castShadow = true; node.receiveShadow = true }
    })
    if (!skinCount) throw new Error('Blender explorer requires a skinned character')
    const clips = new Map(asset.animations.map(clip => [clip.name.toLowerCase().split(/[|:]/).pop()!.trim(), clip]))
    for (const name of ['idle', 'walk', 'run'] as const) {
      const clip = clips.get(name)
      if (!clip || clip.duration <= 0 || !clip.tracks.length) throw new Error(`Blender explorer is missing the ${name} animation`)
    }
    // Keep an outer transform for physical position and heading. Root animation
    // bindings cannot write over those world-space values.
    const root = new T.Group(); root.name = 'Original Blender explorer'; root.add(asset.scene)
    resources.object(root)
    mixer = new T.AnimationMixer(asset.scene)
    const animationMixer = mixer
    const attention=createCloudAttention(asset.scene)
    const actions = Object.fromEntries((['idle', 'walk', 'run'] as const).map(name => [name, animationMixer.clipAction(clips.get(name)!).setLoop(T.LoopRepeat, Infinity)])) as Record<MotionName, T.AnimationAction>
    let current: MotionName = 'idle', disposed = false
    actions.idle.play()
    return {
      root,
      setAttention:attention.set,
      update(dt: number, motion: ExplorerMotion) {
        if (disposed || !Number.isFinite(dt) || dt <= 0) return
        const step = Math.min(dt, .1)
        const speed = Number.isFinite(motion.speed) ? Math.max(0, motion.speed) : 0
        let next: MotionName
        if (!motion.grounded || speed < (current === 'idle' ? .14 : .08)) next = 'idle'
        else next = speed > (current === 'run' ? 3.1 : 3.6) ? 'run' : 'walk'
        if (next !== current) {
          const previous = actions[current], target = actions[next]
          target.reset().setEffectiveWeight(1).play()
          if (current !== 'idle' && next !== 'idle') target.time = previous.time / previous.getClip().duration * target.getClip().duration
          previous.crossFadeTo(target, .2, false)
          current = next
        }
        actions.idle.setEffectiveTimeScale(1)
        // Original clips are authored at 1.7 m/s and 3.2 m/s respectively.
        actions.walk.setEffectiveTimeScale(T.MathUtils.clamp(speed / 1.7, .25, 1.9))
        actions.run.setEffectiveTimeScale(T.MathUtils.clamp(speed / 3.2, .55, 1.8))
        attention.restore();animationMixer.update(step);attention.update(step)
      },
      dispose() {
        if (disposed) return
        disposed = true
        animationMixer.stopAllAction()
        animationMixer.uncacheRoot(asset!.scene)
        resources.dispose()
      },
    }
  } catch (error) {
    mixer?.stopAllAction()
    if (asset) mixer?.uncacheRoot(asset.scene)
    resources.dispose()
    throw error
  }
}
