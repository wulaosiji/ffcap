import assert from 'node:assert/strict'
import {readFile} from 'node:fs/promises'
import test from 'node:test'
import ts from 'typescript'
import * as T from 'three'
import {sampleCloudWeather} from '../src/components/editorial-home/world/settlement/cloudWeather.mjs'

// Execute the actual TypeScript module with its actual Three import.
// Compilation is in memory; no copied implementation, emitted file or browser
// mocks. These assertions cover scene/resources, not GPU shader compilation.
const atmosphereURL = new URL('../src/components/editorial-home/world/settlement/cloudAtmosphere.ts', import.meta.url)
const source = await readFile(atmosphereURL, 'utf8')
const compiled = ts.transpileModule(source, {
  compilerOptions: {target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022},
  reportDiagnostics: true,
})
assert.equal(compiled.diagnostics.filter(item => item.category === ts.DiagnosticCategory.Error).length, 0)
const moduleSource = compiled.outputText.replace(/from (['"])(three|\.\/cloudWeather\.mjs)\1/g, (_, quote, specifier) =>
  `from ${JSON.stringify(specifier === 'three' ? import.meta.resolve('three') : new URL(specifier, atmosphereURL).href)}`)
const {createCloudAtmosphere} = await import(`data:text/javascript;base64,${Buffer.from(moduleSource).toString('base64')}`)

const fields = {
  daylight: 'uDaylight', sunrise: 'uSunrise', sunset: 'uSunset', stars: 'uStars',
  wind: 'uWind', cloudCover: 'uCloudCover', haze: 'uHaze',
}
const phases = ['day', 'sunrise', 'sunset', 'night']

function fixture(t, options = {}) {
  const scene = new T.Scene(), skyTexture = new T.Texture()
  scene.background = skyTexture; scene.environment = skyTexture
  scene.fog = new T.Fog('#cad7e5', 100, 350)
  const atmosphere = createCloudAtmosphere(scene, {mobile: false, skyTexture, ...options})
  t.after(() => {atmosphere.dispose(); skyTexture.dispose()})
  return {scene, skyTexture, atmosphere, sky: scene.children[0]}
}

function snapshot({sky}) {
  const uniforms = Object.fromEntries(Object.entries(sky.material.uniforms)
    .filter(([name]) => name !== 'uSky').map(([name, uniform]) => [name, uniform.value]))
  return {uniforms, position: sky.position.toArray(), visible: sky.visible}
}

test('desktop and mobile allocate exactly one real sky draw object and no particle geometry', t => {
  for (const mobile of [false, true]) {
    const {scene, sky, atmosphere} = fixture(t, {mobile})
    assert.equal(scene.children.length, 1)
    assert.ok(sky instanceof T.Mesh)
    assert.ok(sky.geometry instanceof T.SphereGeometry)
    assert.equal(sky.geometry.parameters.radius, 320)
    assert.equal(sky.geometry.parameters.widthSegments, mobile ? 32 : 48)
    assert.equal(sky.geometry.parameters.heightSegments, mobile ? 20 : 28)
    assert.equal(sky.geometry.isInstancedBufferGeometry, undefined)
    assert.ok(Object.values(sky.geometry.attributes).every(attribute => !attribute.isInstancedBufferAttribute))
    assert.equal(sky.frustumCulled, false)
    assert.equal(sky.visible, true)
    assert.equal(sky.renderOrder, -1000)
    const geometry = sky.geometry, material = sky.material
    for (let time = 0; time <= 1000; time += 10) atmosphere.update(time, sampleCloudWeather(time), new T.Vector3(1, 3, 12))
    assert.deepEqual(scene.children, [sky])
    assert.equal(sky.geometry, geometry)
    assert.equal(sky.material, material)
  }
})

test('opaque sky uses only its borrowed panorama and new continuous weather uniforms', t => {
  const {sky, skyTexture} = fixture(t), material = sky.material
  assert.ok(material instanceof T.ShaderMaterial)
  assert.equal(material.uniforms.uSky.value, skyTexture)
  assert.deepEqual(Object.keys(material.uniforms).sort(), ['uSky', 'uTime', 'uCloudDrift', ...Object.values(fields)].sort())
  assert.equal(material.side, T.BackSide)
  assert.equal(material.transparent, false)
  assert.equal(material.depthTest, false)
  assert.equal(material.depthWrite, false)
  assert.equal(material.fog, false)
  assert.match(material.vertexShader, /gl_Position\.z = gl_Position\.w/)
  // Both moving layers use two taps of the same borrowed texture; no new pass.
  assert.equal((material.fragmentShader.match(/textureGrad\(uSky,/g) ?? []).length, 2)
  assert.match(material.fragmentShader,/panorama = samplePanorama\(driftUv\)/)
  assert.match(material.fragmentShader,/highPanorama = samplePanorama\(highUv\)/)
  assert.match(material.fragmentShader,/1\.0 - smoothstep\(0\.0, \.055, edgeDistance\)/)
  assert.match(material.fragmentShader,/dx\.x -= floor\(dx\.x \+ \.5\)/)
  assert.match(material.fragmentShader,/dy\.x -= floor\(dy\.x \+ \.5\)/)
  assert.doesNotMatch(material.fragmentShader,/texture2D\(uSky,/)
  assert.equal((material.fragmentShader.match(/uniform sampler2D/g) ?? []).length, 1)
  for (const name of Object.values(fields)) {
    assert.ok((material.fragmentShader.match(new RegExp('\\b' + name + '\\b', 'g')) ?? []).length >= 2,
      `${name} must affect the shader, not merely exist as a uniform`)
  }
  assert.match(material.fragmentShader, /starField\(skyUv\)/, 'star locations use world directions, not the drifting cloud UV')
  assert.doesNotMatch(material.fragmentShader, /uPhase|if\s*\([^)]*phase/, 'phases are smooth inputs, not abrupt shader switches')
})

test('rain, meteor and roof resources are removed, not merely hidden or set to zero', t => {
  const {sky} = fixture(t)
  assert.doesNotMatch(source, /rainShelters|precipitationExposure|uStorm|uMeteor|uExposure|uShelter|CLOUD_METEOR|rainVertex|rainFragment|meteorTravel/i)
  assert.doesNotMatch(source, /InstancedBufferGeometry|InstancedBufferAttribute|new T\.(?:Points|Line|LineSegments|InstancedMesh)\b/)
  assert.equal((source.match(/new T\.Mesh\(/g) ?? []).length, 1)
  assert.equal((source.match(/new T\.ShaderMaterial\(/g) ?? []).length, 1)
  assert.doesNotMatch(sky.material.fragmentShader, /meteor|rain|storm|shelter/i)
})

test('invalid texture fails before changing the scene or adding objects', () => {
  const scene = new T.Scene(), original = new T.Color('#eeeeee')
  scene.background = original
  for (const skyTexture of [null, undefined, {}, false]) {
    assert.throws(() => createCloudAtmosphere(scene, {mobile: false, skyTexture}), TypeError)
    assert.equal(scene.background, original)
    assert.equal(scene.children.length, 0)
  }
})

test('update copies the camera, clamps every intensity, and retains unwrapped cloud drift', t => {
  const {atmosphere, sky} = fixture(t), camera = new T.Vector3(10, 5, -4)
  const weather = sampleCloudWeather(9), uniforms = sky.material.uniforms
  for (const amount of [-2, .42, 3]) {
    const next = {...weather, cloudDrift: 12.75}
    for (const field of Object.keys(fields)) next[field] = amount
    atmosphere.update(9, next, camera)
    for (const uniform of Object.values(fields)) assert.equal(uniforms[uniform].value, Math.min(1, Math.max(0, amount)))
    assert.equal(uniforms.uCloudDrift.value, 12.75)
    assert.equal(uniforms.uTime.value, 9)
  }
  assert.deepEqual(sky.position.toArray(), [10, 5, -4])
  camera.set(999, 999, 999)
  assert.deepEqual(sky.position.toArray(), [10, 5, -4])
})

test('non-finite or missing input rejects atomically without changing scene state', t => {
  const item = fixture(t), weather = sampleCloudWeather(9, {preview: 'sunset'}), camera = new T.Vector3(1, 2, 3)
  item.atmosphere.update(9, weather, camera)
  const expected = snapshot(item)
  const reject = (time, nextWeather, position) => {
    assert.throws(() => item.atmosphere.update(time, nextWeather, position), /requires finite/)
    assert.deepEqual(snapshot(item), expected)
  }
  for (const bad of [NaN, Infinity, -Infinity, undefined]) {
    reject(bad, weather, camera)
    for (const field of [...Object.keys(fields), 'cloudDrift']) reject(10, {...weather, [field]: bad}, camera)
    for (const field of ['x', 'y', 'z']) {
      const invalidCamera = camera.clone(); invalidCamera[field] = bad
      reject(10, weather, invalidCamera)
    }
  }
  reject(10, null, camera); reject(10, undefined, camera)
  reject(10, weather, null); reject(10, weather, undefined)
})

test('only four supported phase labels are accepted, but labels cannot hard-switch the shader', t => {
  const item = fixture(t), weather = sampleCloudWeather(9), camera = new T.Vector3(1, 2, 3)
  item.atmosphere.update(9, weather, camera)
  const expected = snapshot(item)
  for (const phase of phases) {
    item.atmosphere.update(9, {...weather, phase}, camera)
    assert.deepEqual(snapshot(item), expected)
  }
  for (const phase of ['storm', 'meteor', '', null, undefined]) {
    assert.throws(() => item.atmosphere.update(10, {...weather, phase}, camera), /supported daylight phase/)
    assert.deepEqual(snapshot(item), expected)
  }
})

test('paused supplied time never advances internally and finite seeks use the exact shared clock', async t => {
  const item = fixture(t), {atmosphere, sky} = item, camera = new T.Vector3(1, 3, 12)
  const time = 142.75, weather = sampleCloudWeather(time, {preview: 'night'})
  atmosphere.update(time, weather, camera)
  const expected = snapshot(item), geometry = sky.geometry, positions = geometry.getAttribute('position').array
  for (let i = 0; i < 20; i++) atmosphere.update(time, weather, camera)
  await new Promise(resolve => setTimeout(resolve, 15))
  assert.deepEqual(snapshot(item), expected, 'wall time and repeated paused renders must not animate the scene clock')
  assert.equal(sky.geometry, geometry)
  assert.equal(geometry.getAttribute('position').array, positions)
  for (const seek of [0, .01, 480, 961.25, -5]) {
    atmosphere.update(seek, {...weather, cloudDrift: 52.5}, camera)
    assert.equal(sky.material.uniforms.uTime.value, seek)
    assert.equal(sky.material.uniforms.uCloudDrift.value, 52.5)
  }
})

test('recreated scenes are deterministic for the same supplied weather and camera', t => {
  const first = fixture(t), second = fixture(t), camera = new T.Vector3(-10, 5, 13)
  for (const preview of phases) {
    const weather = sampleCloudWeather(832.5, {preview})
    first.atmosphere.update(832.5, weather, camera)
    second.atmosphere.update(832.5, weather, camera)
    assert.deepEqual(snapshot(first), snapshot(second))
    assert.deepEqual(first.sky.geometry.getAttribute('position').array, second.sky.geometry.getAttribute('position').array)
  }
})

test('real scheduler previews and long-running cycle snapshots map exactly to the new shader contract', t => {
  const {atmosphere, sky} = fixture(t), camera = new T.Vector3(1, 3, 12)
  for (const preview of [undefined, ...phases]) {
    for (let time = 0; time <= 1920; time += 15) {
      const weather = sampleCloudWeather(time, {preview})
      atmosphere.update(time, weather, camera)
      for (const [field, uniform] of Object.entries(fields)) {
        assert.equal(sky.material.uniforms[uniform].value, weather[field], `${preview ?? 'auto'} ${time}s ${field}`)
        assert.ok(weather[field] >= 0 && weather[field] <= 1)
      }
      assert.equal(sky.material.uniforms.uCloudDrift.value, weather.cloudDrift)
      assert.equal(sky.material.uniforms.uTime.value, time)
    }
  }
})

test('dispose frees only owned resources once and restores the borrowed background without mutating it', t => {
  const {scene, atmosphere, sky, skyTexture} = fixture(t)
  const fog = scene.fog, environment = scene.environment, sentinel = new T.Group()
  scene.add(sentinel)
  const originalVersion = skyTexture.version, originalMapping = skyTexture.mapping, originalColorSpace = skyTexture.colorSpace
  const resources = [sky.geometry, sky.material], released = [0, 0]
  resources.forEach((resource, i) => resource.addEventListener('dispose', () => released[i]++))
  let borrowedReleased = 0
  skyTexture.addEventListener('dispose', () => borrowedReleased++)
  atmosphere.update(9, sampleCloudWeather(9, {preview: 'sunrise'}), new T.Vector3(3, 4, 5))
  atmosphere.dispose(); atmosphere.dispose()
  assert.deepEqual(released, [1, 1])
  assert.equal(borrowedReleased, 0)
  assert.deepEqual(scene.children, [sentinel])
  assert.equal(scene.background, skyTexture)
  assert.equal(scene.environment, environment)
  assert.equal(scene.fog, fog)
  assert.equal(skyTexture.version, originalVersion)
  assert.equal(skyTexture.mapping, originalMapping)
  assert.equal(skyTexture.colorSpace, originalColorSpace)
  const expected = snapshot({sky})
  assert.doesNotThrow(() => atmosphere.update(NaN, {}, null))
  assert.deepEqual(snapshot({sky}), expected)
  assert.deepEqual(released, [1, 1])
})

test('dispose preserves a replacement background installed by another scene owner', t => {
  const {scene, atmosphere} = fixture(t), replacement = new T.Color('#334455')
  scene.background = replacement
  atmosphere.dispose()
  assert.equal(scene.background, replacement)
})
