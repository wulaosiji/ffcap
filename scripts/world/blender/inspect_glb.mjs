/** Explicit validation of authored GLB files. Does not run in the existing test suite.
 * node scripts/world/blender/inspect_glb.mjs public/world/blender/explorer-v1.glb --character
 * node scripts/world/blender/inspect_glb.mjs public/world/blender/courtyard-v1.glb --environment
 */
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { createRequire } from 'node:module'
import { runInNewContext } from 'node:vm'
import { Matrix4, Quaternion, Vector3 } from 'three'

const dimensions = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4, MAT2: 4, MAT3: 9, MAT4: 16 }
const components = {
  5120: [1, 'getInt8'], 5121: [1, 'getUint8'], 5122: [2, 'getInt16'],
  5123: [2, 'getUint16'], 5125: [4, 'getUint32'], 5126: [4, 'getFloat32'],
}

export function parseGLB(bytes) {
  if (bytes.length < 20 || bytes.readUInt32LE(0) !== 0x46546c67) throw new Error('Not a binary glTF file')
  if (bytes.readUInt32LE(4) !== 2 || bytes.readUInt32LE(8) !== bytes.length) throw new Error('GLB version or declared length is invalid')
  let json, binary, offset = 12
  while (offset < bytes.length) {
    if (offset + 8 > bytes.length) throw new Error('Incomplete GLB chunk header')
    const length = bytes.readUInt32LE(offset), type = bytes.readUInt32LE(offset + 4)
    if (length % 4 !== 0 || offset + length + 8 > bytes.length) throw new Error('Incomplete or unaligned GLB chunk')
    const chunk = bytes.subarray(offset + 8, offset + length + 8)
    if (type === 0x4e4f534a) json = JSON.parse(chunk.toString('utf8').replace(/\0+$/, ''))
    if (type === 0x004e4942) binary = chunk
    offset += length + 8
  }
  if (!json || !binary) throw new Error('GLB must contain JSON and an embedded binary chunk')
  return { json, binary }
}

function readAccessor(asset, accessorIndex) {
  const { json, binary } = asset, accessor = json.accessors?.[accessorIndex]
  if (!accessor) throw new Error(`Missing accessor ${accessorIndex}`)
  if (asset.decodedAccessors?.has(accessorIndex)) {
    const { array, width } = asset.decodedAccessors.get(accessorIndex)
    return Array.from({ length: array.length / width }, (_, index) => Array.from(array.subarray(index * width, (index + 1) * width)))
  }
  if (accessor.sparse) throw new Error(`Sparse accessor ${accessorIndex} is not supported by this authored-asset validator`)
  const view = json.bufferViews?.[accessor.bufferView]
  if (!view || (view.buffer ?? 0) !== 0) throw new Error(`Accessor ${accessorIndex} must use the embedded buffer`)
  const [size, method] = components[accessor.componentType] || []
  const width = dimensions[accessor.type]
  if (!size || !width) throw new Error(`Accessor ${accessorIndex} has unsupported components`)
  const stride = view.byteStride || size * width, start = (view.byteOffset || 0) + (accessor.byteOffset || 0)
  const end = start + Math.max(0, accessor.count - 1) * stride + size * width
  if (end > binary.length) throw new Error(`Accessor ${accessorIndex} is outside its buffer`)
  const data = new DataView(binary.buffer, binary.byteOffset, binary.byteLength)
  return Array.from({ length: accessor.count }, (_, index) => Array.from({ length: width }, (_, component) => data[method](start + index * stride + component * size, true)))
}

/** Decode with the exact official WASM shipped to the browser, without network. */
export async function decodeDracoAccessors(bytes) {
  const asset = parseGLB(bytes), decodedAccessors = new Map()
  const primitives = (asset.json.meshes || []).flatMap(mesh => mesh.primitives || []).filter(primitive => primitive.extensions?.KHR_draco_mesh_compression)
  if (!primitives.length) return decodedAccessors
  const decoderRoot = new URL('../../../public/world/blender/draco/', import.meta.url)
  const [wrapper, wasmBinary] = await Promise.all([readFile(new URL('draco_wasm_wrapper.js', decoderRoot), 'utf8'), readFile(new URL('draco_decoder.wasm', decoderRoot))])
  const scope = { module: { exports: {} }, exports: {}, require: createRequire(import.meta.url), process, console, Buffer, WebAssembly, TextDecoder, setTimeout, clearTimeout, __dirname: new URL('.', decoderRoot).pathname }
  // The upstream file is a UMD distribution. Run it unchanged in its own CommonJS
  // context, then provide the embedded WASM bytes so it cannot fetch a dependency.
  runInNewContext(wrapper, scope, { filename: 'official-draco-wasm-wrapper.js' })
  const draco = await scope.module.exports({ wasmBinary })
  for (const primitive of primitives) {
    const extension = primitive.extensions.KHR_draco_mesh_compression
    const view = asset.json.bufferViews?.[extension.bufferView]
    if (!view || (view.buffer ?? 0) !== 0) throw new Error('Draco must use the embedded GLB buffer')
    const source = new Int8Array(asset.binary.buffer, asset.binary.byteOffset + (view.byteOffset || 0), view.byteLength)
    const decoder = new draco.Decoder(), mesh = new draco.Mesh()
    try {
      if (decoder.GetEncodedGeometryType(source) !== draco.TRIANGULAR_MESH) throw new Error('Draco primitive must contain a triangle mesh')
      const status = decoder.DecodeArrayToMesh(source, source.byteLength, mesh)
      if (!status.ok() || !mesh.ptr) throw new Error(`Draco decode failed: ${status.error_msg()}`)
      for (const [semantic, uniqueId] of Object.entries(extension.attributes)) {
        const accessorIndex = primitive.attributes[semantic], accessor = asset.json.accessors[accessorIndex]
        const attribute = decoder.GetAttributeByUniqueId(mesh, uniqueId)
        if (!attribute?.ptr) throw new Error(`Draco attribute ${semantic} is missing`)
        const width = attribute.num_components(), count = mesh.num_points(), byteLength = count * width * 4
        if (accessor.count !== count || dimensions[accessor.type] !== width) throw new Error(`Draco ${semantic} shape differs from its glTF accessor`)
        const pointer = draco._malloc(byteLength)
        try {
          if (!decoder.GetAttributeDataArrayForAllPoints(mesh, attribute, draco.DT_FLOAT32, byteLength, pointer)) throw new Error(`Cannot decode Draco ${semantic}`)
          const array = new Float32Array(draco.HEAPF32.buffer, pointer, count * width).slice()
          if (!array.every(Number.isFinite)) throw new Error(`Draco ${semantic} contains non-finite values`)
          decodedAccessors.set(accessorIndex, { array, width })
        } finally { draco._free(pointer) }
      }
      if (primitive.indices !== undefined) {
        const count = mesh.num_faces() * 3, pointer = draco._malloc(count * 4)
        try {
          decoder.GetTrianglesUInt32Array(mesh, count * 4, pointer)
          const array = new Uint32Array(draco.HEAPF32.buffer, pointer, count).slice()
          if (array.some(index => index >= mesh.num_points())) throw new Error('Draco triangle references a missing vertex')
          if (asset.json.accessors[primitive.indices].count !== count) throw new Error('Draco triangle count differs from its glTF accessor')
          decodedAccessors.set(primitive.indices, { array, width: 1 })
        } finally { draco._free(pointer) }
      }
    } finally { draco.destroy(mesh); draco.destroy(decoder) }
  }
  return decodedAccessors
}

export function inspectGLB(bytes, kind = 'generic', decodedAccessors = new Map(), {environmentTriangleBudget = 350000} = {}) {
  if (!Number.isSafeInteger(environmentTriangleBudget) || environmentTriangleBudget <= 0) throw new Error('Environment triangle budget must be an explicit positive integer')
  const asset = parseGLB(bytes), { json } = asset
  asset.decodedAccessors = decodedAccessors
  const errors = [], warnings = [], nodes = json.nodes || [], skins = json.skins || []
  const external = [...(json.buffers || []), ...(json.images || [])].map(item => item.uri).filter(Boolean)
  if (external.length) errors.push('Runtime GLB must embed all buffers and textures; URI dependencies were found')
  if ((json.cameras || []).length || json.extensions?.KHR_lights_punctual?.lights?.length) errors.push('Authored GLB must not contain cameras or lighting')
  if ((json.extensionsRequired || []).some(name => ['EXT_meshopt_compression', 'KHR_texture_basisu'].includes(name))) errors.push('Runtime asset requires a decoder that the current loader has not installed')
  if ((json.extensionsRequired || []).includes('KHR_draco_mesh_compression') && !decodedAccessors.size) throw new Error('Draco geometry must be actually decoded before validation')
  let checkedFloatValues = 0
  const binaryView = new DataView(asset.binary.buffer, asset.binary.byteOffset, asset.binary.byteLength)
  for (const [index, accessor] of (json.accessors || []).entries()) {
    if (decodedAccessors.has(index)) { checkedFloatValues += decodedAccessors.get(index).array.length; continue }
    if (accessor.componentType !== 5126) continue
    const view = json.bufferViews?.[accessor.bufferView], width = dimensions[accessor.type]
    if (!view || !width || accessor.sparse) throw new Error(`Float accessor ${index} must be a supported embedded accessor`)
    const start = (view.byteOffset || 0) + (accessor.byteOffset || 0), stride = view.byteStride || width * 4
    const end = start + Math.max(0, accessor.count - 1) * stride + width * 4
    if (end > asset.binary.length || end > (view.byteOffset || 0) + view.byteLength) throw new Error(`Float accessor ${index} is outside its buffer`)
    for (let row = 0; row < accessor.count; row++) for (let column = 0; column < width; column++) {
      if (!Number.isFinite(binaryView.getFloat32(start + row * stride + column * 4, true))) throw new Error(`Accessor ${index} contains a non-finite float`)
      checkedFloatValues++
    }
  }
  const matrices = [], parents = new Map()
  nodes.forEach((node, parent) => (node.children || []).forEach(child => parents.set(child, parent)))
  const worldMatrix = (index, visiting = new Set()) => {
    if (matrices[index]) return matrices[index]
    if (visiting.has(index)) throw new Error('GLB node hierarchy contains a cycle')
    visiting.add(index)
    const node = nodes[index]
    if (!node) throw new Error(`GLB references missing node ${index}`)
    const matrix = node.matrix ? new Matrix4().fromArray(node.matrix) : new Matrix4().compose(new Vector3(...(node.translation || [0, 0, 0])), new Quaternion(...(node.rotation || [0, 0, 0, 1])), new Vector3(...(node.scale || [1, 1, 1])))
    if (parents.has(index)) matrix.premultiply(worldMatrix(parents.get(index), visiting))
    visiting.delete(index); matrices[index] = matrix
    return matrix
  }
  const bounds = { min: [Infinity, Infinity, Infinity], max: [-Infinity, -Infinity, -Infinity] }
  let triangles = 0, meshNodes = 0, skinnedMeshNodes = 0, materialSlots = 0, vertices = 0
  const point = new Vector3(), skinSummary = []
  nodes.forEach((node, nodeIndex) => {
    if (node.mesh === undefined) return
    meshNodes++
    const mesh = json.meshes?.[node.mesh]
    if (!mesh) throw new Error(`Node ${nodeIndex} references missing mesh ${node.mesh}`)
    if (node.skin !== undefined) {
      skinnedMeshNodes++
      const skin = skins[node.skin]
      if (!skin?.joints?.length) errors.push(`Node ${node.name || nodeIndex} has no valid skeleton joints`)
      skinSummary.push({ node: node.name || nodeIndex, joints: skin?.joints?.length || 0 })
    }
    for (const primitive of mesh.primitives || []) {
      const positions = readAccessor(asset, primitive.attributes?.POSITION)
      vertices += positions.length; materialSlots++
      const count = primitive.indices === undefined ? positions.length : json.accessors?.[primitive.indices]?.count
      if ((primitive.mode ?? 4) !== 4) errors.push(`Mesh ${mesh.name || node.mesh} must use triangle primitives`)
      if (!Number.isFinite(count) || count % 3) errors.push(`Mesh ${mesh.name || node.mesh} has an invalid triangle count`)
      else triangles += count / 3
      if (node.skin !== undefined) {
        if (primitive.attributes?.JOINTS_0 === undefined || primitive.attributes?.WEIGHTS_0 === undefined) errors.push(`Skinned primitive ${mesh.name || node.mesh} lacks joints or weights`)
        else {
          const weights = readAccessor(asset, primitive.attributes.WEIGHTS_0)
          const joints = readAccessor(asset, primitive.attributes.JOINTS_0)
          const jointCount = skins[node.skin]?.joints?.length || 0
          const invalidJoint = joints.some(row => row.some(value => value < 0 || value >= jointCount))
          if (invalidJoint) errors.push(`Skinned primitive ${mesh.name || node.mesh} references invalid joints`)
          // Blender exports float weights; integer-normalized accessors need their
          // normalization before comparing the sum and are reported separately.
          if (json.accessors[primitive.attributes.WEIGHTS_0].componentType === 5126 && weights.some(row => Math.abs(row.reduce((sum, value) => sum + value, 0) - 1) > .015)) errors.push(`Skinned primitive ${mesh.name || node.mesh} has unnormalized skin weights`)
        }
      }
      for (const position of positions) {
        point.fromArray(position).applyMatrix4(worldMatrix(nodeIndex))
        if (![point.x, point.y, point.z].every(Number.isFinite)) throw new Error('Non-finite vertex found')
        point.toArray().forEach((value, axis) => { bounds.min[axis] = Math.min(bounds.min[axis], value); bounds.max[axis] = Math.max(bounds.max[axis], value) })
      }
    }
  })
  const animations = (json.animations || []).map(animation => {
    let duration = 0
    const rootTravel = []
    for (const sampler of animation.samplers || []) {
      const times = readAccessor(asset, sampler.input).flat()
      duration = Math.max(duration, ...times)
    }
    for (const channel of animation.channels || []) {
      const { node: index, path } = channel.target || {}, node = nodes[index]
      if (!node || path !== 'translation' || (parents.has(index) && !/^(Explorer|Armature|CloudDog|root)$/i.test(node.name || ''))) continue
      const values = readAccessor(asset, animation.samplers[channel.sampler].output)
      const matrix = parents.has(index) ? worldMatrix(parents.get(index)) : new Matrix4()
      const points = values.map(value => new Vector3(...value).applyMatrix4(matrix))
      const travel = Math.hypot(Math.max(...points.map(value => value.x)) - Math.min(...points.map(value => value.x)), Math.max(...points.map(value => value.z)) - Math.min(...points.map(value => value.z)))
      rootTravel.push({ node: node.name || index, horizontalMetres: Number(travel.toFixed(5)) })
      if (['character','dog'].includes(kind) && travel > .015) errors.push(`Animation ${animation.name} moves the outer root horizontally`)
    }
    return { name: animation.name || '', duration: Number(duration.toFixed(4)), channels: animation.channels?.length || 0, rootTravel }
  })
  if (!meshNodes) errors.push('GLB has no mesh nodes')
  if (kind === 'character' || kind === 'dog') {
    if (!skinnedMeshNodes) errors.push('Character must include a genuinely skinned mesh')
    for (const name of ['idle', 'walk', 'run']) if (!animations.some(animation => animation.name.toLowerCase().split(/[|:]/).pop().trim() === name && animation.duration > 0 && animation.channels > 0)) errors.push(`Character is missing its ${name} animation`)
    const triangleBudget = kind === 'dog' ? 55000 : 65000
    if (triangles > triangleBudget) errors.push(`Character exceeds ${triangleBudget} triangle budget (${triangles})`)
    if ((json.materials || []).length > 12) errors.push('Character exceeds 12 material budget')
    if (bounds.min[1] < -.05 || bounds.min[1] > .06) errors.push(`Character feet must begin at y=0 (measured ${bounds.min[1].toFixed(4)})`)
    if (kind === 'character' && (bounds.max[1] < 1.5 || bounds.max[1] > 2.05)) errors.push(`Character height is outside the intended human scale (${bounds.max[1].toFixed(4)})`)
    if (kind === 'dog') {
      if (bounds.max[1] < .6 || bounds.max[1] > .9) errors.push(`Dog ear height is outside the approved medium scale (${bounds.max[1].toFixed(4)})`)
      if (bounds.max[2]-bounds.min[2] < .8 || bounds.max[2]-bounds.min[2] > 1.6) errors.push('Dog nose-to-tail length is outside the intended natural proportions')
      if (bytes.length > 8*1024*1024) errors.push('Dog exceeds 8 MiB transfer budget')
      if (!skins.some(skin => skin.joints?.length >= 24 && skin.joints.length <= 48)) errors.push('Dog requires a complete, bounded quadruped skeleton (24-48 joints)')
    }
    warnings.push('Forward direction and animated sole contact still require a rendered visual walk-through')
  }
  if (kind === 'environment' && triangles > environmentTriangleBudget) errors.push(`Environment exceeds ${environmentTriangleBudget} triangle budget (${triangles})`)
  return {
    kind, bytes: bytes.length, meshes: meshNodes, triangles, vertices, materials: (json.materials || []).length,
    ...(kind === 'environment' ? {environmentTriangleBudget} : {}),
    materialSlots, textures: (json.textures || []).length, skinnedMeshes: skinnedMeshNodes, skins: skinSummary,
    bounds: { min: bounds.min.map(value => Number(value.toFixed(5))), max: bounds.max.map(value => Number(value.toFixed(5))) },
    animations, decodedAccessors: decodedAccessors.size, checkedFloatValues, externalDependencies: external, errors, warnings, valid: errors.length === 0,
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const args = process.argv.slice(2), target = args.find(arg => !arg.startsWith('--'))
  if (!target) {
    console.error('Usage: node scripts/world/blender/inspect_glb.mjs MODEL.glb [--character|--dog|--environment]')
    process.exitCode = 1
  } else {
    try {
      const bytes = await readFile(target), decoded = await decodeDracoAccessors(bytes)
      const result = inspectGLB(bytes, args.includes('--dog') ? 'dog' : args.includes('--character') ? 'character' : args.includes('--environment') ? 'environment' : 'generic', decoded)
      console.log(JSON.stringify({ file: resolve(target), ...result }, null, 2))
      if (!result.valid) process.exitCode = 1
    } catch (error) {
      console.error(JSON.stringify({ file: resolve(target), valid: false, error: error.message }, null, 2))
      process.exitCode = 1
    }
  }
}
