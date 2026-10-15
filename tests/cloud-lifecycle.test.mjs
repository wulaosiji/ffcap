import assert from 'node:assert/strict'
import test from 'node:test'
import {readFile} from 'node:fs/promises'
import ts from 'typescript'
import * as T from 'three'
import {createCloudCameraPath, createExplorerCameraPose, createIslandOverview} from '../src/components/editorial-home/world/settlement/cloudCamera.mjs'
import {CLOUD_ROBOT_PROFILE} from '../src/components/editorial-home/world/settlement/cloudCharacterProfile.mjs'

// Execute the actual settlement controller, transpiling only in memory. The
// platform, GPU renderer, loaders, physics and dog are explicit test doubles.
// This is lifecycle/control-flow evidence, NOT browser, visual, IK or physics QA.
const sourceURL = new URL('../src/components/editorial-home/world/settlement/createCloudSettlement.ts', import.meta.url)
const moduleText = ts.transpileModule(await readFile(sourceURL, 'utf8'), {
  compilerOptions: {target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022},
}).outputText
const dataURL = text => `data:text/javascript;base64,${Buffer.from(text).toString('base64')}`
const slot = '__ffcapCloudLifecycleHarness'
let revision = 0

async function harness(t, {hostname = 'localhost', search = '', layout: layoutOverride = {}} = {}) {
  const events = [], renders = [], reports = [], weatherSamples = [], weatherUpdates = [], pending = new Map(), observers = [], documentListeners = new Map()
  const saved = new Map()
  let nextFrame = 0, now = 0, api, errors = 0, fault
  const state = {events, renders, weatherSamples, weatherUpdates, movementInputs: [], check(name) {if (fault === name) throw new Error(`injected ${name} failure`)}}
  function install(name, value) {
    saved.set(name, Object.getOwnPropertyDescriptor(globalThis, name))
    Object.defineProperty(globalThis, name, {value, configurable: true, writable: true})
  }
  const canvas = {clientWidth: 960, clientHeight: 600, listeners: new Map(),
    toDataURL(type) {state.check('export'); events.push(`canvas.export:${type}`);return 'data:image/png;base64,cG9zdGVy'},
    addEventListener(name, fn) {this.listeners.set(name, fn)}, removeEventListener(name) {this.listeners.delete(name)}}
  const document = {hidden: false,
    addEventListener(name, fn) {documentListeners.set(name, fn)}, removeEventListener(name) {documentListeners.delete(name)}}
  install(slot, state)
  install('window', {matchMedia: query => ({matches: query.includes('pointer:coarse')}), location: {hostname,search}})
  install('document', document)
  install('devicePixelRatio', 1)
  install('requestAnimationFrame', fn => {pending.set(++nextFrame, fn); return nextFrame})
  install('cancelAnimationFrame', id => {pending.delete(id)})
  install('ResizeObserver', class {
    constructor(fn) {this.fn = fn; observers.push(this)}
    observe() {}
    disconnect() {events.push('observer.dispose')}
  })
  t.after(() => {
    try {api?.dispose()} finally {
      for (const [name, descriptor] of saved) {
        if (descriptor) Object.defineProperty(globalThis, name, descriptor)
        else Reflect.deleteProperty(globalThis, name)
      }
    }
  })
  const spawn = [-3, .075, 8]
  const bounds = new T.Box3(new T.Vector3(-11.56, -12.25, -12.87), new T.Vector3(11.81, 9.87, 11.75))
  state.environment = {
    root: new T.Group(), bounds, sphere: bounds.getBoundingSphere(new T.Sphere()), skyTexture: new T.Texture(),
    layout: {spawn, assetSha256: 'a'.repeat(64), colliders: [], surfaces: [], guideToAgentic: [[-3, 7], [-3, 6]],
      locations: [{id: 'agentic', center: [-5.7, 2.4, -1.45], halfExtents: [3, 2, 2.5], open: true}], ...layoutOverride},
    update() {state.check('environment')}, cameraDistance(_target, desired) {return desired.clone()},
    dispose() {events.push('environment.dispose')},
  }
  state.explorer = {
    root: new T.Group(), assetSha256: 'b'.repeat(64),
    update() {state.check('explorer'); events.push('explorer.update')},
    setGroundSampler() {}, resetPose() {events.push('explorer.resetPose')},
    dispose() {events.push('explorer.dispose')},
  }
  let position = {x: spawn[0], y: spawn[1], z: spawn[2]}
  state.traversal = {
    get position() {return {...position}},
    step(_dt, input) {state.check('physics'); state.movementInputs.push({...input}); return {position: {...position}, grounded: true, heading: input.heading ?? 0}},
    teleport(value) {events.push('physics.teleport'); position = {x: value[0], y: value[1], z: value[2]}},
    sampleGround() {return {height: spawn[1], normal: {x: 0, y: 1, z: 0}}},
    dispose() {events.push('physics.dispose')},
  }
  const control = `globalThis[${JSON.stringify(slot)}]`
  const doubles = new Map([
    ['three/addons/postprocessing/EffectComposer.js',dataURL(`export class EffectComposer{constructor(renderer){this.renderer=renderer;this.passes=[];this.renderTarget1={samples:0};this.renderTarget2={samples:0};${control}.composer=this}addPass(pass){this.passes.push(pass)}setSize(){}setPixelRatio(){}render(){const p=this.passes[0];this.renderer.render(p.scene,p.camera)}dispose(){${control}.events.push('composer.dispose')}}`)],
    ['three/addons/postprocessing/RenderPass.js',dataURL(`export class RenderPass{constructor(scene,camera){this.scene=scene;this.camera=camera}}`)],
    ['three/addons/postprocessing/GTAOPass.js',dataURL(`export class GTAOPass{updateGtaoMaterial(){}dispose(){}}`)],
    ['three/addons/postprocessing/OutputPass.js',dataURL(`export class OutputPass{dispose(){}}`)],
    ['three/addons/postprocessing/SMAAPass.js',dataURL(`export class SMAAPass{dispose(){${control}.events.push('smaa.dispose')}}`)],
    ['three', dataURL(`export * from ${JSON.stringify(import.meta.resolve('three'))};
      export class WebGLRenderer {
        constructor(){this.shadowMap={};this.info={autoReset:true,reset(){},memory:{geometries:2,textures:3},programs:[{}],render:{calls:1,triangles:1}};this.renderLists={dispose(){}};}
        setPixelRatio(value){this.pixelRatio=value;} getPixelRatio(){return this.pixelRatio;} setSize(width,height){${control}.size=[width,height];}
        render(scene,camera){
          const h=${control};h.check('render');h.events.push('renderer.render');
          const lights=[];scene.traverse(object=>{if(object.isLight)lights.push({name:object.name,type:object.type,intensity:object.intensity,color:object.color.toArray(),groundColor:object.groundColor?.toArray(),position:object.position.toArray()});});
          const lighting={lights,environmentIntensity:scene.environmentIntensity,fog:{color:scene.fog.color.toArray(),near:scene.fog.near,far:scene.fog.far}};
          h.renders.push({position:camera.position.toArray(),quaternion:camera.quaternion.toArray(),aspect:camera.aspect,lighting});
        }
        dispose(){${control}.events.push('renderer.dispose');}
      }`)],
    ['./cloudAssets', dataURL(`export async function createCloudEnvironment(_scene,mobile){${control}.environmentMobile=mobile;return ${control}.environment;} export async function createCloudExplorer(){return ${control}.explorer;}`)],
    ['./physics.mjs', dataURL(`export async function createTraversal(){return ${control}.traversal;}`)],
    ['./cloudWeather.mjs', dataURL(`
      export * from ${JSON.stringify(new URL('./cloudWeather.mjs', sourceURL).href)};
      import {sampleCloudWeather as sample} from ${JSON.stringify(new URL('./cloudWeather.mjs', sourceURL).href)};
      export function sampleCloudWeather(time,options){const result=sample(time,options);${control}.weatherSamples.push({time,options:{...options},weather:{...result}});return result;}
    `)],
    ['./cloudAtmosphere', dataURL(`export function createCloudAtmosphere(){return {update(time,weather){const h=${control};h.check('atmosphere');h.weatherUpdates.push({time,weather:{...weather}});},dispose(){${control}.events.push('atmosphere.dispose');}};}`)],
  ])
  let executable = moduleText.replace(/(from\s+['"])([^'"]+)(['"])/g, (_all, a, specifier, c) => {
    const resolved = doubles.get(specifier) ?? (specifier.startsWith('.') ? new URL(specifier, sourceURL).href : import.meta.resolve(specifier))
    return `${a}${resolved}${c}`
  })
  executable += `\n// independent controller module ${++revision}\n`
  const {createCloudSettlement} = await import(dataURL(executable))
  api = await createCloudSettlement(canvas, {onState: value => reports.push(value), onError: () => {errors++; api?.dispose()}})
  return {
    api, state, events, renders, reports, weatherSamples, weatherUpdates, canvas, bounds, spawn,
    get errors() {return errors}, get pendingCount() {return pending.size},
    fail(name) {fault = name},
    advance(count = 1) {
      for (let i = 0; i < count; i++) {
        const item = pending.entries().next().value
        assert.ok(item, 'expected an active animation frame')
        pending.delete(item[0]); now += 1000 / 60; item[1](now)
      }
    },
    elapse(milliseconds) {now += milliseconds},
    setHidden(value) {document.hidden = value; documentListeners.get('visibilitychange')?.()},
    resize(width, height) {canvas.clientWidth = width; canvas.clientHeight = height; observers[0].fn()},
  }
}

test('visitor runtime refuses retained human and dog selection without replacing the guide',async t=>{
  const h=await harness(t)
  h.api.setExploring(true);h.api.skipIntro()
  const before=h.events.filter(e=>e==='physics.teleport').length
  for(const kind of ['human','dog'])assert.equal(await h.api.selectCharacter(kind),false)
  assert.equal(h.events.filter(e=>e==='physics.teleport').length,before)
  assert.equal(h.reports.at(-1).characterKind,'robot')
})

test('intermediate waypoints continue movement in the same frame and final arrival still stops',async t=>{
  const h=await harness(t,{layout:{surfaces:[{vertices:[-20,.075,-20,20,.075,-20,20,.075,20,-20,.075,20],indices:[0,2,1,0,3,2]}]}})
  h.api.setExploring(true);h.api.skipIntro();h.state.traversal.teleport([-3,.075,7]);h.api.guide()
  assert.equal(h.reports.at(-1).guiding,true,'test must first admit a real supported guide route')
  h.advance()
  assert.ok(h.state.movementInputs.at(-1).z<-.6,'an intermediate node must not inject one idle frame')
  h.state.traversal.teleport([-3,.075,6]);h.advance()
  assert.equal(h.state.movementInputs.at(-1).z,0,'the final destination must stop')
  h.advance(20);assert.equal(h.reports.at(-1).guiding,false)
})

test('motion review records rendered camera samples without exposing public capture or pause catch-up',async t=>{
  const h=await harness(t,{hostname:'localhost',search:'?render-review=1'})
  assert.equal(h.api.startMotionReview(),true);h.advance(3)
  h.api.setPaused(true);h.elapse(90000);h.api.setPaused(false);h.advance(2)
  const review=JSON.parse(h.api.captureMotionReview())
  assert.equal(review.samples.length,5)
  assert.ok(review.samples.every(s=>s.elapsedMs<17&&s.cpuSubmitMs>=0))
  assert.deepEqual(review.samples.at(-1).camera,h.renders.at(-1).position)
  assert.deepEqual(review.resources,{geometries:2,textures:3,programs:1,drawCalls:1,renderedTriangles:1,measurement:'renderer object counts; not GPU bytes'})
  h.api.dispose();assert.equal(h.api.startMotionReview(),false);assert.equal(h.api.captureMotionReview(),null)
})

test('desktop poster authoring does not inherit narrow-panel rendering settings',async t=>{
  const h=await harness(t,{search:'?world-poster=1&review-view=bridge'})
  assert.equal(h.state.environmentMobile,false)
})

test('ordinary narrow-screen environment keeps the existing full-detail asset setting',async t=>{
  const h=await harness(t)
  assert.equal(h.state.environmentMobile,false)
})

test('public motion capture stays disabled even with diagnostic query',async t=>{
  const h=await harness(t,{hostname:'ffcap.cn',search:'?render-review=1'})
  assert.equal(h.api.startMotionReview(),false);h.advance(2);assert.equal(h.api.captureMotionReview(),null)
})

test('AA passes own their lifecycle and public requests keep the approved default',async t=>{
  for(const [hostname,search,mode] of [
    ['localhost','?render-aa=smaa','smaa'],
    ['127.0.0.1','?render-aa=msaa4','msaa4'],
    ['ffcap.cn','?render-aa=smaa&render-dpr=2','msaa4'],
  ])await t.test(mode,async t=>{
    const h=await harness(t,{hostname,search}),composer=h.state.composer
    assert.equal(composer.renderTarget1.samples,mode==='msaa4'?4:0)
    assert.equal(composer.renderTarget2.samples,mode==='msaa4'?4:0)
    assert.deepEqual(composer.passes.map(p=>p.constructor.name),mode==='smaa'?['RenderPass','GTAOPass','SMAAPass','OutputPass']:['RenderPass','GTAOPass','OutputPass'])
    h.api.dispose();h.api.dispose()
    assert.equal(h.events.filter(e=>e==='smaa.dispose').length,mode==='smaa'?1:0)
    assert.equal(h.events.filter(e=>e==='composer.dispose').length,1)
  })
})

function close(actual, expected, message) {
  assert.equal(actual.length, expected.length)
  assert.ok(actual.every((value, index) => Math.abs(value - expected[index]) < 1e-8), `${message}: ${actual} versus ${expected}`)
}

const weatherPhases = ['day', 'sunrise', 'sunset', 'night']
const weatherStrengths = ['daylight', 'sunrise', 'sunset', 'stars', 'wind', 'cloudCover', 'haze']
function assertQuietWeather(weather) {
  assert.deepEqual(Object.keys(weather).sort(), ['phase', ...weatherStrengths, 'cloudDrift'].sort())
  assert.ok(weatherPhases.includes(weather.phase), `unexpected weather phase ${weather.phase}`)
  for (const field of weatherStrengths) {
    assert.ok(Number.isFinite(weather[field]) && weather[field] >= 0 && weather[field] <= 1, `${field} must remain finite and bounded`)
  }
  assert.ok(Number.isFinite(weather.cloudDrift), 'cloud drift must remain a finite, unwrapped motion phase')
}

function assertFiniteLighting(lighting) {
  for (const type of ['DirectionalLight', 'HemisphereLight', 'PointLight']) {
    assert.ok(lighting.lights.some(light => light.type === type), `${type} must be present in the rendered scene`)
  }
  for (const light of lighting.lights) {
    assert.ok(Number.isFinite(light.intensity) && light.intensity >= 0, `${light.type} intensity must stay finite and nonnegative`)
    assert.ok([...light.color, ...(light.groundColor ?? []), ...light.position].every(Number.isFinite), `${light.type} color and position must stay finite`)
  }
  assert.ok(Number.isFinite(lighting.environmentIntensity) && lighting.environmentIntensity >= 0)
  assert.ok(lighting.fog.color.every(Number.isFinite))
  assert.ok(Number.isFinite(lighting.fog.near) && Number.isFinite(lighting.fog.far) && lighting.fog.far > lighting.fog.near)
}

test('local poster capture stays frozen, exports the actual render and restores framing', async t => {
  const h=await harness(t,{search:'?world-poster=1'})
  assert.equal(h.pendingCount,0)
  const initial=h.renders.at(-1)
  h.api.setPaused(false);h.api.setExploring(true);h.api.setPointer(1,1)
  assert.equal(h.pendingCount,0)
  assert.equal(h.reports.at(-1).phase,'hero')
  const frame=h.api.capturePoster()
  assert.equal(frame.time,0);assert.equal(frame.width,3840);assert.equal(frame.height,1080)
  assert.equal(frame.dataUrl,'data:image/png;base64,cG9zdGVy')
  assert.equal(frame.assetRevision,'a'.repeat(64))
  assert.equal(frame.characterRevision,'b'.repeat(64))
  assert.equal(h.renders.at(-2).aspect,32/9)
  assert.deepEqual(h.state.size,[960,600])
  assert.deepEqual(h.renders.at(-1),initial)
  assert.equal(h.pendingCount,0)
  h.fail('export');assert.throws(()=>h.api.capturePoster(),/export failure/)
  assert.deepEqual(h.state.size,[960,600]);assert.equal(h.pendingCount,0)
})

test('portrait export retains full assets and restores the original viewport', async t => {
  const h=await harness(t,{search:'?world-poster=1&poster-mobile=1'})
  const initial=h.renders.at(-1)
  const frame=h.api.capturePoster()
  assert.equal(frame.width,804);assert.equal(frame.height,1748);assert.equal(frame.time,0)
  assert.equal(h.renders.at(-2).aspect,804/1748)
  assert.deepEqual(h.renders.at(-1),initial)
  assert.deepEqual(h.state.size,[960,600]);assert.equal(h.pendingCount,0)
})

test('production and ordinary local pages cannot export a poster', async t => {
  const h=await harness(t,{hostname:'ffcap.cn',search:'?world-poster=1'})
  assert.throws(()=>h.api.capturePoster(),/local frozen poster/)
  assert.ok(h.pendingCount>0)
})

test('bridge review is a frozen local camera and cannot change visitor framing', async t => {
  const h=await harness(t,{search:'?world-poster=1&review-view=bridge'})
  close(h.renders.at(-1).position,[2.4,1.9,6.9],'fixed bridge camera')
  h.api.setWeatherPreview('night');h.api.setPaused(false);h.api.setExploring(true)
  h.api.setPointer(1,1);h.resize(1200,800)
  const frame=h.api.capturePoster()
  assert.equal(frame.review,'bridge');assert.equal(frame.time,0)
  assert.equal(frame.width,1280);assert.equal(frame.height,720)
  assert.equal(h.renders.at(-2).aspect,16/9)
  close(h.renders.at(-1).position,[2.4,1.9,6.9],'restored review camera')
  assert.equal(h.weatherSamples.at(-1).options.preview,'day')
  assert.equal(h.pendingCount,0)
})

test('legacy layout exposes only its actual studio and keeps one warm light', async t => {
  const h = await harness(t)
  h.advance()
  assert.deepEqual(h.reports.at(-1).destinations, ['agentic'])
  assert.equal(h.renders.at(-1).lighting.lights.filter(light => light.type === 'PointLight').length, 1)
})

test('changing a pending destination can cancel the old guide without moving or teleporting the dog', async t => {
  const h = await harness(t, {layout: {surfaces: [{vertices: [-12,.075,-12,12,.075,-12,12,.075,12,-12,.075,12], indices: [0,2,1,0,3,2]}]}})
  h.api.setExploring(true); h.api.skipIntro(); h.api.guide()
  assert.equal(h.reports.at(-1).guiding, true)
  const before = {...h.reports.at(-1).position}, teleports = h.events.filter(event => event === 'physics.teleport').length
  h.api.cancelGuide()
  assert.equal(h.reports.at(-1).guiding, false)
  assert.deepEqual(h.reports.at(-1).position, before)
  assert.equal(h.events.filter(event => event === 'physics.teleport').length, teleports)
})

test('guided-only controller exposes no manual input and camera look cannot move the dog or steer the guide', async t => {
  const h = await harness(t, {layout: {surfaces: [{vertices: [-12,.075,-12,12,.075,-12,12,.075,12,-12,.075,12], indices: [0,2,1,0,3,2]}]}})
  assert.equal('setInput' in h.api, false)
  h.api.setExploring(true); h.api.skipIntro(); h.advance(3)
  h.api.look(60,20); h.advance(3)
  assert.ok(h.state.movementInputs.every(input=>input.x===0&&input.z===0&&!input.run))
  h.api.guide(); h.advance(3)
  const before=h.state.movementInputs.at(-1)
  assert.ok(Math.hypot(before.x,before.z)>.6)
  h.api.look(-90,20); h.advance()
  const after=h.state.movementInputs.at(-1)
  assert.equal(after.x,before.x);assert.equal(after.z,before.z);assert.equal(after.run,false)
  h.api.setPaused(true)
  const count=h.state.movementInputs.length
  h.elapse(10000);assert.equal(h.state.movementInputs.length,count)
  h.api.setPaused(false);h.advance()
  assert.equal(h.state.movementInputs.at(-1).z,before.z,'Resume preserves the authored guide')
  h.api.cancelGuide();h.advance(3)
  assert.equal(h.state.movementInputs.at(-1).x,0);assert.equal(h.state.movementInputs.at(-1).z,0)
})

test('three open rooms expose their routes and illuminate their real fixtures through the quiet night cycle', async t => {
  const ids = ['agentic', 'physical', 'entertainment']
  const fixtures = ids.map((id, index) => ({id: `${id}-pendant`, type: 'warm-interior', position: [index * 5, index + 3, -2], color: '#ffe1ae'}))
  const h = await harness(t, {layout: {
    locations: ids.map((id, index) => ({id, open: true, center: [index * 5, index + 2, -2], halfExtents: [3, 2, 2]})),
    guideRoutes: Object.fromEntries(ids.map(id => [id, [[-3, 7], [-3, 6]]])), lights: fixtures,
  }})
  h.advance()
  assert.deepEqual(h.reports.at(-1).destinations, ids)
  const daylight = h.renders.at(-1).lighting.lights.filter(light => light.type === 'PointLight')
  assert.equal(daylight.length, 3)
  for (let index = 0; index < 3; index++) close(daylight[index].position, fixtures[index].position, 'authored fixture position')
  h.api.setPaused(true); h.api.setWeatherPreview('night')
  const night = h.renders.at(-1).lighting
  assertFiniteLighting(night)
  assert.equal(h.pendingCount, 0)
  const lamps = night.lights.filter(light => light.type === 'PointLight')
  assert.equal(lamps.length, 3)
  assert.ok(lamps.every((light, index) => light.intensity > daylight[index].intensity))
})

test('closed rooms and missing routes are not advertised or lit as usable spaces', async t => {
  const h = await harness(t, {layout: {
    locations: [
      {id: 'agentic', open: true, center: [-5.7, 2.4, -1.45], halfExtents: [3, 2, 2.5]},
      {id: 'physical', open: false, center: [5, 3, -2], halfExtents: [3, 2, 2]},
      {id: 'entertainment', open: true, center: [0, 6, -9], halfExtents: [3, 2, 2]},
    ],
    guideRoutes: {physical: [[-3, 7], [5, -2]]},
    lights: ['agentic', 'physical', 'entertainment'].map(id => ({id: `${id}-pendant`, type: 'warm-interior', position: [0, 3, 0], color: '#ffe1ae'})),
  }})
  h.advance()
  assert.deepEqual(h.reports.at(-1).destinations, ['agentic'])
  assert.equal(h.renders.at(-1).lighting.lights.filter(light => light.type === 'PointLight').length, 1)
  h.api.setExploring(true); h.api.skipIntro(); h.api.setPaused(true)
  h.api.guide(false, 'physical')
  assert.equal(h.reports.at(-1).guiding, false)
  assert.equal(h.pendingCount, 0)
})

test('reset calls the dog pose reset after teleport and before rendering a paused view', async t => {
  const h = await harness(t)
  h.api.setExploring(true); h.api.skipIntro(); h.advance()
  h.api.setPaused(true); h.events.length = 0
  h.api.reset()
  assert.deepEqual(h.events.filter(value => /teleport|resetPose|renderer.render/.test(value)), ['physics.teleport', 'explorer.resetPose', 'renderer.render'])
  assert.equal(h.pendingCount, 0)
  close(h.state.explorer.root.position.toArray(), h.spawn, 'reset physical visual origin')
  assert.equal(h.state.explorer.root.rotation.y, 0)
})

test('paused look and pointer inputs cannot alter the resumed camera or subsequent overview', async t => {
  const h = await harness(t)
  h.api.setExploring(true); h.api.skipIntro(); h.advance()
  const pose = h.renders.at(-1)
  h.api.setPaused(true)
  h.api.look(100, 100); h.api.setPointer(1, -1)
  assert.equal(h.pendingCount, 0)
  h.api.setPaused(false); h.advance()
  close(h.renders.at(-1).position, pose.position, 'paused look must not alter yaw/pitch')
  close(h.renders.at(-1).quaternion, pose.quaternion, 'paused look must not rotate the resumed view')
  h.api.setExploring(false); h.advance()
  const overview = createIslandOverview({center: h.bounds.getCenter(new T.Vector3()).toArray(), halfExtents: h.bounds.getSize(new T.Vector3()).multiplyScalar(.5).toArray(), aspect: 1.6, fov: 53})
  close(h.renders.at(-1).position, overview.position, 'paused pointer must not leave latent hero parallax')
})

for (const fault of ['physics', 'explorer', 'environment', 'atmosphere', 'render']) {
  test(`${fault} failure reaches onError, stops RAF and lets the host dispose every owned resource once`, async t => {
    const h = await harness(t)
    h.fail(fault)
    assert.doesNotThrow(() => h.advance())
    assert.equal(h.errors, 1)
    assert.equal(h.pendingCount, 0)
    for (const name of ['physics.dispose', 'explorer.dispose', 'environment.dispose', 'atmosphere.dispose', 'renderer.dispose']) {
      assert.equal(h.events.filter(value => value === name).length, 1, name)
    }
    h.api.setPaused(false); h.api.look(50, 50); h.api.setPointer(1, 1); h.api.dispose()
    assert.equal(h.pendingCount, 0)
    assert.equal(h.errors, 1)
    assert.equal(h.events.filter(value => value === 'renderer.dispose').length, 1)
  })
}

test('rotation during the reveal retains the current world-space path and reframes only the next overview', async t => {
  const h = await harness(t)
  const settings = {center: h.bounds.getCenter(new T.Vector3()).toArray(), halfExtents: h.bounds.getSize(new T.Vector3()).multiplyScalar(.5).toArray()}
  const overview = createIslandOverview({...settings, aspect: 1.6, fov: 53})
  const originalPath = createCloudCameraPath({heroPosition: overview.position, heroTarget: overview.target, spawn: h.spawn, mobile: true, cameraProfile: CLOUD_ROBOT_PROFILE.camera})
  h.api.setExploring(true); h.advance(240)
  const before = h.renders.at(-1)
  h.api.setPaused(true); h.resize(400, 860)
  close(h.renders.at(-1).position, before.position, 'resize must not jump to the newly framed path')
  close(h.renders.at(-1).quaternion, before.quaternion, 'resize must not change the current world-space gaze')
  h.api.setPaused(false); h.advance()
  close(h.renders.at(-1).position, originalPath.sample(241 / 60 / 16).position, 'continue the same original path after resize')
  h.api.skipIntro(); h.advance()
  close(h.renders.at(-1).position, createExplorerCameraPose(h.spawn, true, CLOUD_ROBOT_PROFILE.camera).position, 'skip must retain the default robot free-camera endpoint')
  h.api.setPaused(true); h.api.setExploring(false)
  const nextOverview = createIslandOverview({...settings, aspect: 400 / 860, fov: 58})
  close(h.renders.at(-1).position, nextOverview.position, 'return to hero must use the new aspect framing')
})

test('paused localhost preview accepts sunset without advancing the scene or cloud clock', async t => {
  const h = await harness(t)
  h.advance(30); h.api.setPaused(true)
  const before = h.weatherUpdates.at(-1)
  h.api.setWeatherPreview('sunset')
  const after = h.weatherUpdates.at(-1)
  assertQuietWeather(after.weather)
  assert.equal(after.time, before.time)
  assert.equal(after.weather.cloudDrift, before.weather.cloudDrift)
  assert.equal(after.weather.phase, 'sunset')
  assert.equal(after.weather.sunset, 1)
  assert.equal(after.weather.sunrise, 0)
  assert.equal(h.reports.at(-1).weather, 'sunset')
  assert.equal(h.reports.at(-1).weatherTime, before.time)
  assert.equal(h.pendingCount, 0)
})

test('controller rejects removed and unknown weather previews before sampling or rendering', async t => {
  const h = await harness(t)
  h.api.setPaused(true); h.api.setWeatherPreview('sunset')
  const before = {samples: h.weatherSamples.length, updates: h.weatherUpdates.length, renders: h.renders.length, reports: h.reports.length}
  // These intentionally bypass the TypeScript union, as ordinary JS callers can.
  for (const rejected of ['storm', 'meteor', 'rain', '', null, 42]) {
    assert.doesNotThrow(() => h.api.setWeatherPreview(rejected))
    assert.deepEqual({samples: h.weatherSamples.length, updates: h.weatherUpdates.length, renders: h.renders.length, reports: h.reports.length}, before)
  }
  assert.equal(h.weatherUpdates.at(-1).weather.phase, 'sunset')
  h.api.setWeatherPreview(undefined)
  assert.equal(h.weatherSamples.at(-1).options.preview, undefined, 'undefined exits local preview')
  assert.equal(h.weatherUpdates.at(-1).weather.phase, 'day', 'automatic clock still starts in daytime')
  assertQuietWeather(h.weatherUpdates.at(-1).weather)
  assert.equal(h.pendingCount, 0)
})

test('sunset preview cross-fades every quiet-weather strength over three active seconds without rewinding clouds', async t => {
  const h = await harness(t)
  h.advance(30)
  const before = h.weatherUpdates.at(-1)
  h.api.setWeatherPreview('sunset'); h.advance(90)
  const halfway = h.weatherUpdates.at(-1), sampled = h.weatherSamples.at(-1).weather
  const mix = T.MathUtils.smoothstep(halfway.time - before.time, 0, 3)
  assert.ok(mix > .49 && mix < .51, 'halfway preview must still be in the transition')
  assertQuietWeather(halfway.weather)
  assert.equal(halfway.weather.phase, 'sunset')
  for (const field of weatherStrengths) {
    const expected = T.MathUtils.lerp(before.weather[field], sampled[field], mix)
    assert.ok(Math.abs(halfway.weather[field] - expected) < 1e-10, `${field} must use the common preview blend`)
  }
  for (const rendered of h.renders) assertFiniteLighting(rendered.lighting)
  assert.equal(halfway.weather.cloudDrift, sampled.cloudDrift, 'cloud positions use the uninterrupted clock, not a preview cross-fade')
  assert.ok(halfway.weather.cloudDrift > before.weather.cloudDrift)
  h.advance(100)
  assert.deepEqual(h.weatherUpdates.at(-1).weather, h.weatherSamples.at(-1).weather, 'completed preview uses the real sampler directly')
})

for (const suspension of ['paused', 'hidden']) {
  test(`${suspension} scene freezes the day/night blend and resumes without wall-clock catch-up`, async t => {
    const h = await harness(t)
    h.advance(20); h.api.setWeatherPreview('sunset'); h.advance(30)
    const before = h.weatherUpdates.at(-1)
    const beforeLighting = h.renders.at(-1).lighting
    const suspend = value => suspension === 'paused' ? h.api.setPaused(value) : h.setHidden(value)
    suspend(true)
    assert.equal(h.pendingCount, 0)
    h.elapse(60_000)
    assert.deepEqual(h.weatherUpdates.at(-1), before, 'inactive wall time cannot advance weather')
    assert.deepEqual(h.renders.at(-1).lighting, beforeLighting, 'inactive wall time cannot alter scene lights')
    if (suspension === 'paused') {
      h.resize(800, 600)
      assert.deepEqual(h.weatherUpdates.at(-1), before, 'paused resize redraws exactly the frozen blend')
      assert.deepEqual(h.renders.at(-1).lighting, beforeLighting, 'paused resize preserves sun, hemisphere, room light and fog')
      assert.equal(h.pendingCount, 0)
    }
    suspend(false); h.advance()
    const resumed = h.weatherUpdates.at(-1)
    assert.ok(Math.abs(resumed.time - before.time - 1 / 60) < 1e-10)
    assertQuietWeather(resumed.weather)
    assertFiniteLighting(h.renders.at(-1).lighting)
    assert.ok(resumed.weather.sunset > before.weather.sunset && resumed.weather.sunset < before.weather.sunset + .02)
    assert.ok(resumed.weather.cloudDrift > before.weather.cloudDrift && resumed.weather.cloudDrift < before.weather.cloudDrift + .001)
  })
}

test('all four quiet phases render finite existing lights, with a more visible room lamp at night', async t => {
  const h = await harness(t)
  h.advance(); h.api.setPaused(true)
  const phases = new Map()
  for (const phase of weatherPhases) {
    h.api.setWeatherPreview(phase)
    const lighting = h.renders.at(-1).lighting
    assertQuietWeather(h.weatherUpdates.at(-1).weather)
    assertFiniteLighting(lighting)
    assert.equal(h.weatherUpdates.at(-1).weather.phase, phase)
    assert.equal(lighting.lights.filter(light => light.type === 'PointLight').length, 1, 'night lighting reuses the one authored room lamp')
    phases.set(phase, lighting)
  }
  const light = (phase, type) => phases.get(phase).lights.find(item => item.type === type)
  assert.ok(light('night', 'PointLight').intensity > light('day', 'PointLight').intensity, 'the room lamp grows more visible after sunset')
  assert.ok(light('night', 'HemisphereLight').intensity < light('day', 'HemisphereLight').intensity, 'night preserves the intended ambient dimming')
  // There are two directional lights. Inspect the actual key, not whichever
  // fill happens to be inserted first in scene order.
  const key=phase=>phases.get(phase).lights.find(item=>item.name==='Cloud sun key')
  const fill=phase=>phases.get(phase).lights.find(item=>item.name==='Cloud cool fill')
  assert.ok(key('night').intensity<key('day').intensity)
  assert.ok(fill('day').intensity<fill('night').intensity,'Reduced day fill preserves modelling while keeping reviewed night readability')
})

test('weather preview remains localhost-only and becomes inert after disposal', async t => {
  const h = await harness(t, {hostname: 'ffcap.cn'})
  h.advance(); h.api.setPaused(true)
  const counts = () => [h.weatherSamples.length, h.weatherUpdates.length, h.renders.length, h.reports.length]
  const before = counts()
  h.api.setWeatherPreview('sunset')
  assert.deepEqual(counts(), before, 'production callers cannot activate debug preview')
  window.location.hostname = 'localhost'
  h.api.dispose(); h.api.setWeatherPreview('sunset')
  assert.deepEqual(counts(), before, 'disposed controller cannot update released atmosphere resources')
  assert.equal(h.pendingCount, 0)
})
