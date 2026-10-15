/** Deterministic visual atmosphere, not a physical weather simulation.
 * Time is elapsed, unpaused scene time in seconds. No wall clock or random state.
 */
export const CLOUD_DAY_CYCLE_SECONDS = 480
const TAU = Math.PI * 2
const PREVIEWS = new Set(['day', 'sunrise', 'sunset', 'night'])

const clamp01 = value => Math.max(0, Math.min(1, value))
const smooth = (lower, upper, value) => {
  const t = clamp01((value - lower) / (upper - lower))
  return t * t * t * (t * (t * 6 - 15) + 10)
}

// Integer avalanche hashing makes an arbitrary-time sample independent of the
// samples made before it. Seed affects weather, not the shared solar clock.
function noise(seed, index, salt) {
  let n = (seed ^ Math.imul(index | 0, 0x9e3779b1) ^ salt) >>> 0
  n = Math.imul(n ^ (n >>> 16), 0x7feb352d)
  n = Math.imul(n ^ (n >>> 15), 0x846ca68b)
  return ((n ^ (n >>> 16)) >>> 0) / 4294967296
}

// C2 interpolation between seeded values over several minutes, not sudden
// events or a repeated day-long loop. Every sample is independently seekable.
function slowNoise(time, seed, period, salt) {
  const position = time / period
  const index = Math.floor(position)
  const mix = smooth(0, 1, position - index)
  return noise(seed, index, salt) * (1 - mix) + noise(seed, index + 1, salt) * mix
}

/**
 * @param {number} time Elapsed active-scene seconds; invalid/negative time is 0.
 * @param {{seed?:number, preview?:'day'|'sunrise'|'sunset'|'night'}} options
 * @returns {{phase:string,daylight:number,sunrise:number,sunset:number,stars:number,wind:number,cloudCover:number,haze:number,cloudDrift:number}}
 */
export function sampleCloudWeather(time, {seed = 50905, preview} = {}) {
  const t = Number.isFinite(time) ? Math.max(0, time) : 0
  const key = Number.isFinite(seed) ? Math.trunc(seed) | 0 : 50905
  const solarTime = t % CLOUD_DAY_CYCLE_SECONDS
  const angle = solarTime / CLOUD_DAY_CYCLE_SECONDS * TAU
  const height = Math.cos(angle)
  let daylight = smooth(-.24, .48, height)
  // Separate rising/falling halves share a wide horizon envelope. The band is
  // zero at noon/midnight, so choosing a half never creates a lighting jump.
  const horizon = smooth(-.55, .10, height) * (1 - smooth(.45, .75, height))
  let sunrise = solarTime > CLOUD_DAY_CYCLE_SECONDS / 2 ? horizon : 0
  let sunset = solarTime < CLOUD_DAY_CYCLE_SECONDS / 2 ? horizon : 0
  let phase = sunrise > .18 ? 'sunrise'
    : sunset > .18 ? 'sunset'
    : daylight < .18 ? 'night' : 'day'

  // Preview fixes only the solar composition. Air/clouds keep moving on the
  // same supplied clock; the scene owner cross-fades preview selection changes.
  if (PREVIEWS.has(preview)) {
    phase = preview
    daylight = preview === 'day' ? 1 : preview === 'sunrise' ? .38 : preview === 'sunset' ? .26 : 0
    sunrise = preview === 'sunrise' ? 1 : 0
    sunset = preview === 'sunset' ? 1 : 0
  }

  const offset = noise(key, 0, 0x299f31d0) * TAU
  // Unwrapped monotonically increasing phase. Consumers may put it through a
  // periodic shader, but must not reset cloud coordinates on a day/weather join.
  const cloudDrift = t * .0015 + .015 * (Math.sin(t * .006 + offset) - Math.sin(offset))
  const wind = .09 + .15 * slowNoise(t, key, 160, 0x13198a2e) +
    .045 * slowNoise(t, key, 311, 0x03707344)
  const initialCloud = .14 + .06 * noise(key, 0, 0x243f6a88)
  const cloudTarget = .16 + .32 * slowNoise(t, key, 233, 0x243f6a88) +
    .10 * slowNoise(t, key, 419, 0x85a308d3)
  // The opening is reliably clear; its first 90 seconds ease into the broader
  // cloud pattern without changing the shared 480-second solar timing.
  const cloudCover = initialCloud + (cloudTarget - initialCloud) * smooth(0, 90, t)
  const haze = .055 + .13 * slowNoise(t, key, 283, 0xa4093822) +
    .10 * cloudCover + .15 * sunrise + .085 * sunset
  const stars = smooth(.08, .98, 1 - daylight) * (1 - .72 * cloudCover)

  return {phase, daylight, sunrise, sunset, stars, wind, cloudCover, haze, cloudDrift}
}
