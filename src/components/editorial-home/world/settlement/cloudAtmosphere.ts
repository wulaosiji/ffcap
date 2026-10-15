import * as T from 'three'
import type {CloudWeatherState} from './cloudWeather.mjs'

export type CloudAtmosphereWeather = CloudWeatherState

type AtmosphereOptions = {
  mobile: boolean
  /** Borrowed from the environment owner; never modified or disposed here. */
  skyTexture: T.Texture
}

const skyVertex = /* glsl */ `
varying vec3 vDirection;
void main() {
  vDirection = position;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  gl_Position.z = gl_Position.w;
}`

const skyFragment = /* glsl */ `
uniform sampler2D uSky;
uniform float uTime;
uniform float uDaylight;
uniform float uSunrise;
uniform float uSunset;
uniform float uStars;
uniform float uCloudDrift;
uniform float uWind;
uniform float uCloudCover;
uniform float uHaze;
varying vec3 vDirection;

float hash21(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

float starField(vec2 uv) {
  vec2 grid = uv * vec2(360.0, 180.0);
  vec2 cell = floor(grid);
  float seed = hash21(cell);
  vec2 centre = vec2(hash21(cell + 7.0), hash21(cell + 19.0));
  vec2 delta = fract(grid) - mix(vec2(.2), vec2(.8), centre);
  float distanceToStar = length(delta);
  float width = max(fwidth(distanceToStar), .012);
  float point = 1.0 - smoothstep(.032, .032 + width, distanceToStar);
  // Sparse world-fixed stars. A 26-second, <8% shimmer never flashes.
  return step(.9958, seed) * point * (.76 + .06 * sin(uTime * .24 + seed * 150.0));
}

vec2 panoramaUv(vec2 uv) {
  return vec2(fract(uv.x), clamp(uv.y, .002, .998));
}

vec3 samplePanorama(vec2 uv) {
  // The source image's left/right cloud contours are not identical. Hide its
  // longitude cut using a continuous half-turn sample only in the join band.
  // The alternate sample's own cut is half a turn away, where its weight is 0.
  vec2 wrapped = panoramaUv(uv);
  float edgeDistance = min(wrapped.x, 1.0 - wrapped.x);
  float joinWeight = 1.0 - smoothstep(0.0, .055, edgeDistance);
  // atan/fract jumps otherwise force the implicit mip footprint across the
  // whole image, leaving a thin blurred stripe even after colour continuity.
  vec2 dx = dFdx(uv), dy = dFdy(uv);
  dx.x -= floor(dx.x + .5);
  dy.x -= floor(dy.x + .5);
  vec3 base = textureGrad(uSky, wrapped, dx, dy).rgb;
  vec3 join = textureGrad(uSky, panoramaUv(uv + vec2(.5, 0.0)), dx, dy).rgb;
  return mix(base, join, joinWeight);
}

void main() {
  vec3 direction = normalize(vDirection);
  vec2 skyUv = vec2(atan(direction.z, direction.x) / 6.28318530718 + .5,
                   asin(clamp(direction.y, -1.0, 1.0)) / 3.14159265359 + .5);
  float latitudeWeight = 1.0 - pow(abs(direction.y), 4.0);
  float cloudPhase = uCloudDrift * 6.28318530718;
  vec2 driftUv = skyUv;
  // The owner supplies the same pause-aware time and unwrapped drift everywhere.
  // Two samples of the existing panorama give slow layers without new geometry.
  driftUv.x += uTime * .000030 + uCloudDrift * .007
             + sin(direction.z * 4.0 + uTime * .015 + cloudPhase) * .0017 * latitudeWeight;
  driftUv.y += sin(direction.x * 5.0 - uTime * .018 + cloudPhase)
             * (.0011 + uWind * .00045) * latitudeWeight;
  vec3 panorama = samplePanorama(driftUv);
  vec2 highUv = skyUv + vec2(.047 + uTime * .000018 + uCloudDrift * .004, .018);
  highUv.y += sin(direction.z * 3.0 + uTime * .011) * .00065 * latitudeWeight;
  vec3 highPanorama = samplePanorama(highUv);

  float luminance = dot(panorama, vec3(.2126, .7152, .0722));
  float cloud = smoothstep(.31, .78, luminance);
  float upperSky = smoothstep(.12, .72, direction.y);
  float highVeil = smoothstep(.43, .83, dot(highPanorama, vec3(.2126, .7152, .0722))) * upperSky;
  float cloudDensity = clamp(cloud * (.76 + .42 * uCloudCover)
                           + highVeil * uCloudCover * .22, 0.0, 1.0);
  // Retain the source panorama's cloud contours instead of replacing night with black.
  vec3 night = mix(vec3(.035, .054, .085), vec3(.007, .016, .042), upperSky);
  night += cloudDensity * mix(vec3(.043, .050, .069), vec3(.025, .032, .053), upperSky);
  vec3 daylightSky = panorama;
  daylightSky = mix(daylightSky, mix(panorama, highPanorama, .46), highVeil * uCloudCover * .17);
  float gray = dot(daylightSky, vec3(.2126, .7152, .0722));
  daylightSky = mix(daylightSky, vec3(gray * .96, gray * .99, gray * 1.02),
                   uCloudCover * cloudDensity * .12);
  vec3 color = mix(night, daylightSky, uDaylight);

  float horizon = exp(-pow((direction.y - .055) * 4.25, 2.0));
  vec2 horizontalDirection = direction.xz / max(length(direction.xz), .0001);
  float east = pow(max(0.0, dot(horizontalDirection, normalize(vec2(-.7, -.6)))), 2.0);
  float west = pow(max(0.0, dot(horizontalDirection, normalize(vec2(.7, .6)))), 2.0);
  vec3 dawn = mix(vec3(.43, .235, .16), vec3(.76, .48, .28), cloudDensity);
  vec3 dusk = mix(vec3(.34, .16, .22), vec3(.71, .335, .20), cloudDensity);
  color = mix(color, dawn, uSunrise * horizon * (.22 + .43 * east));
  color = mix(color, dusk, uSunset * horizon * (.22 + .46 * west));
  // Broad soft warm edges and a faint upper afterglow, never sharp beams.
  float cloudEdge = smoothstep(.18, .48, cloud) * (1.0 - smoothstep(.56, .91, cloud));
  color += cloudEdge * horizon * (uSunrise * east * vec3(.11, .055, .020)
                              + uSunset * west * vec3(.12, .041, .022));
  color += uSunset * upperSky * cloudDensity * vec3(.014, .008, .023);

  // Horizon haze affects only distant sky. Scene lights and ground fog stay owned
  // by the caller; no screen-space filter or scene/environment mutation is used.
  vec3 hazeTint = mix(vec3(.061, .078, .112), vec3(.52, .61, .69), uDaylight);
  hazeTint = mix(hazeTint, vec3(.65, .41, .28), uSunrise * .60);
  hazeTint = mix(hazeTint, vec3(.49, .26, .29), uSunset * .66);
  color = mix(color, hazeTint, horizon * uHaze * .25);
  float clearNight = uStars * (1.0 - cloudDensity * .91) * (1.0 - uHaze * horizon * .70);
  float aboveHorizon = smoothstep(.025, .17, direction.y);
  color += vec3(.58, .67, .83) * starField(skyUv) * clearNight * aboveHorizon;
  gl_FragColor = vec4(max(color, vec3(0.0)), 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`

/** One bounded sky draw. The caller supplies pause/visibility-aware time.
 * Cloud layers, horizon color and star visibility are visual atmosphere only.
 */
export function createCloudAtmosphere(scene: T.Scene, options: AtmosphereOptions) {
  const {mobile, skyTexture} = options
  if (!skyTexture?.isTexture) throw new TypeError('Cloud atmosphere needs an owned sky texture')

  const previousBackground = scene.background
  const uniforms = {
    uSky: {value: skyTexture}, uTime: {value: 0}, uDaylight: {value: 1},
    uSunrise: {value: 0}, uSunset: {value: 0}, uStars: {value: 0},
    uCloudDrift: {value: 0}, uWind: {value: 0}, uCloudCover: {value: .35}, uHaze: {value: .2},
  }
  // GTAO's override pass ignores the custom far-plane vertex rule. Actual sky
  // geometry must therefore remain beyond the island (camera far plane: 420 m).
  const skyGeometry = new T.SphereGeometry(320, mobile ? 32 : 48, mobile ? 20 : 28)
  const skyMaterial = new T.ShaderMaterial({
    name: 'Cloud atmosphere — layered panorama and gradual daylight',
    uniforms, vertexShader: skyVertex, fragmentShader: skyFragment,
    side: T.BackSide, depthWrite: false, depthTest: false, fog: false,
  })
  const sky = new T.Mesh(skyGeometry, skyMaterial)
  sky.name = 'Cloud atmosphere sky dome'
  sky.frustumCulled = false
  sky.renderOrder = -1000
  scene.background = null
  scene.add(sky)
  let disposed = false

  const bounded = (value: number) => T.MathUtils.clamp(value, 0, 1)
  return {
    update(time: number, weather: CloudAtmosphereWeather, cameraPosition: T.Vector3) {
      if (disposed) return
      // Validate the entire snapshot before changing a uniform or scene position.
      if (!weather || !cameraPosition || !Number.isFinite(time)
        || ![cameraPosition.x, cameraPosition.y, cameraPosition.z,
          weather.daylight, weather.sunrise, weather.sunset, weather.stars,
          weather.cloudDrift, weather.wind, weather.cloudCover, weather.haze].every(Number.isFinite)) {
        throw new TypeError('Cloud atmosphere update requires finite weather, time and camera coordinates')
      }
      if (!['day', 'sunrise', 'sunset', 'night'].includes(weather.phase)) {
        throw new TypeError('Cloud atmosphere update requires a supported daylight phase')
      }
      uniforms.uTime.value = time
      uniforms.uDaylight.value = bounded(weather.daylight)
      uniforms.uSunrise.value = bounded(weather.sunrise)
      uniforms.uSunset.value = bounded(weather.sunset)
      uniforms.uStars.value = bounded(weather.stars)
      uniforms.uCloudDrift.value = weather.cloudDrift
      uniforms.uWind.value = bounded(weather.wind)
      uniforms.uCloudCover.value = bounded(weather.cloudCover)
      uniforms.uHaze.value = bounded(weather.haze)
      sky.position.copy(cameraPosition)
    },
    dispose() {
      if (disposed) return
      disposed = true
      scene.remove(sky)
      if (scene.background === null) scene.background = previousBackground
      skyGeometry.dispose()
      skyMaterial.dispose()
      // The environment still owns skyTexture, scene lighting and fog.
    },
  }
}
