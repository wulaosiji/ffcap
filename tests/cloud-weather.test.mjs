import assert from 'node:assert/strict'
import test from 'node:test'
import * as weather from '../src/components/editorial-home/world/settlement/cloudWeather.mjs'

const {sampleCloudWeather, CLOUD_DAY_CYCLE_SECONDS} = weather
const phases = ['day', 'sunrise', 'sunset', 'night']
const strengths = ['daylight', 'sunrise', 'sunset', 'stars', 'wind', 'cloudCover', 'haze']
const numeric = [...strengths, 'cloudDrift']
const finiteAndBounded = state => {
  assert.ok(phases.includes(state.phase))
  for (const field of strengths) {
    assert.ok(Number.isFinite(state[field]), `${field} must be finite`)
    assert.ok(state[field] >= 0 && state[field] <= 1, `${field} outside 0..1: ${state[field]}`)
  }
  assert.ok(Number.isFinite(state.cloudDrift))
}

test('weather starts bright, uses seconds, and is deterministic regardless of sample order', () => {
  assert.equal(CLOUD_DAY_CYCLE_SECONDS, 480)
  for (const seed of [0, 1, -1, 50905, 0x7fffffff]) {
    const first = sampleCloudWeather(0, {seed})
    assert.equal(first.phase, 'day')
    assert.equal(first.daylight, 1)
    assert.equal(first.sunrise, 0)
    assert.equal(first.sunset, 0)
    assert.equal(first.stars, 0)
    assert.ok(first.cloudCover >= .14 && first.cloudCover <= .20)
    assert.equal(first.cloudDrift, 0)
    const expected = sampleCloudWeather(337.25, {seed})
    for (const t of [99999, 0, 25, 888, 12]) sampleCloudWeather(t, {seed})
    assert.deepEqual(sampleCloudWeather(337.25, {seed}), expected)
    assert.deepEqual(sampleCloudWeather(337.25, {seed}), sampleCloudWeather(337.25, {seed}))
  }
})

test('ordinary time has a full solar cycle with separate natural dawn and dusk', () => {
  for (const seed of [0, 1, 50905, 2026]) {
    const seen = new Set()
    let maximumDawn = 0, maximumDusk = 0
    for (let t = 0; t < CLOUD_DAY_CYCLE_SECONDS; t += .25) {
      const state = sampleCloudWeather(t, {seed})
      finiteAndBounded(state)
      seen.add(state.phase)
      maximumDawn = Math.max(maximumDawn, state.sunrise)
      maximumDusk = Math.max(maximumDusk, state.sunset)
      assert.equal(state.sunrise * state.sunset, 0, 'rising and falling light never overlap')
      if (state.sunset > 0) assert.ok(t < CLOUD_DAY_CYCLE_SECONDS / 2)
      if (state.sunrise > 0) assert.ok(t > CLOUD_DAY_CYCLE_SECONDS / 2)
      const nextDay = sampleCloudWeather(t + CLOUD_DAY_CYCLE_SECONDS, {seed})
      for (const field of ['daylight', 'sunrise', 'sunset']) assert.ok(Math.abs(state[field] - nextDay[field]) < 1e-12)
      const otherSeed = sampleCloudWeather(t, {seed: seed + 123})
      for (const field of ['daylight', 'sunrise', 'sunset']) assert.equal(state[field], otherSeed[field], 'seed cannot shift the sun')
    }
    assert.deepEqual([...seen].sort(), [...phases].sort(), `Missing phase for seed ${seed}`)
    assert.ok(maximumDawn > .99 && maximumDusk > .99)
    assert.equal(sampleCloudWeather(CLOUD_DAY_CYCLE_SECONDS / 2, {seed}).phase, 'night')
  }
})

test('dense samples remain gently bounded through noon, midnight and seeded noise joins', t => {
  const dt = 1 / 32
  // Maximum strength units per second, including the faster solar horizon band.
  // Slow air/cloud changes have much tighter limits than the sun itself.
  const rates = {daylight: .04, sunrise: .07, sunset: .07, stars: .08, wind: .0021, cloudCover: .0123, haze: .013}
  const measured = Object.fromEntries(strengths.map(field => [field, 0]))
  for (const seed of [0, 50905, 99]) {
    let previous = sampleCloudWeather(0, {seed})
    for (let t = dt; t <= 2880; t += dt) {
      const current = sampleCloudWeather(t, {seed})
      finiteAndBounded(current)
      for (const field of strengths) {
        const rate = Math.abs(current[field] - previous[field]) / dt
        measured[field] = Math.max(measured[field], rate)
        assert.ok(rate <= rates[field], `${field} changes too quickly at ${t}, seed ${seed}: ${rate}/s`)
      }
      assert.ok(current.cloudDrift > previous.cloudDrift, 'clouds never wrap, reverse or reset')
      previous = current
    }
    for (const boundary of [90, 160, 233, 240, 283, 311, 419, 480, 960, 1440, 1920, 1e6]) {
      const before = sampleCloudWeather(boundary - 1e-5, {seed})
      const after = sampleCloudWeather(boundary + 1e-5, {seed})
      for (const field of numeric) assert.ok(Math.abs(after[field] - before[field]) < 2e-6,
        `${field} discontinuity across ${boundary}`)
      const centre = sampleCloudWeather(boundary, {seed})
      const delta = .005, left = sampleCloudWeather(boundary - delta, {seed}), right = sampleCloudWeather(boundary + delta, {seed})
      for (const field of numeric) assert.ok(Math.abs((right[field] - centre[field]) / delta - (centre[field] - left[field]) / delta) < .0001,
        `${field} has a velocity kink at ${boundary}`)
    }
  }
  assert.ok(sampleCloudWeather(7200).cloudDrift > 1, 'cloud motion is intentionally unwrapped')
  t.diagnostic(JSON.stringify({samples: 3 * 2880 / dt, maximumStrengthChangePerSecond: measured}))
})

test('cloud cover, breeze and haze vary slowly with the seed instead of repeating each solar day', () => {
  const signatures = new Set()
  for (const seed of [0, 1, 2, 50905]) {
    const samples = Array.from({length: 121}, (_, i) => sampleCloudWeather(i * 12, {seed, preview: 'day'}))
    for (const field of ['cloudCover', 'wind', 'haze']) {
      const values = samples.map(state => state[field])
      assert.ok(Math.max(...values) - Math.min(...values) > .035, `${field} is effectively frozen for seed ${seed}`)
      assert.notEqual(samples[40][field], samples[80][field], `${field} repeats each day for seed ${seed}`)
    }
    signatures.add(JSON.stringify(samples.map(({cloudCover, wind, haze}) => [cloudCover, wind, haze])))
  }
  assert.equal(signatures.size, 4)
})

test('all four previews retain animated clouds, breeze and haze without advancing a paused clock', () => {
  for (const preview of phases) {
    const a = sampleCloudWeather(0, {preview})
    const b = sampleCloudWeather(900, {preview})
    assert.equal(a.phase, preview)
    assert.equal(b.phase, preview)
    finiteAndBounded(a)
    finiteAndBounded(b)
    assert.ok(b.cloudDrift > a.cloudDrift)
    assert.equal(a.cloudDrift, sampleCloudWeather(0).cloudDrift)
    assert.equal(b.cloudDrift, sampleCloudWeather(900).cloudDrift)
    for (const field of ['daylight', 'sunrise', 'sunset']) assert.equal(a[field], b[field])
    for (const field of ['cloudCover', 'wind', 'haze']) assert.notEqual(a[field], b[field], `${preview} froze ${field}`)
    for (let i = 0; i < 50; i++) assert.deepEqual(sampleCloudWeather(900, {preview}), b)
    assert.equal(a.sunrise, preview === 'sunrise' ? 1 : 0)
    assert.equal(a.sunset, preview === 'sunset' ? 1 : 0)
    if (preview === 'day') assert.equal(a.stars, 0)
    if (preview === 'night') assert.ok(a.stars > .8)
  }
})

test('long-running states expose no storm or meteor fields, exports, or reactivatable old previews', t => {
  assert.deepEqual(Object.keys(weather).sort(), ['CLOUD_DAY_CYCLE_SECONDS', 'sampleCloudWeather'].sort())
  const expected = ['phase', ...numeric].sort()
  for (const seed of [0, 1, -1, 50905, 0x7fffffff]) {
    for (let seconds = 0; seconds <= 28800; seconds += .5) {
      const state = sampleCloudWeather(seconds, {seed})
      finiteAndBounded(state)
      assert.deepEqual(Object.keys(state).sort(), expected)
    }
    for (const preview of ['storm', 'meteor']) {
      for (const seconds of [0, 9, 150, 240, 480, 960, 10000]) {
        assert.deepEqual(sampleCloudWeather(seconds, {seed, preview}), sampleCloudWeather(seconds, {seed}))
      }
    }
  }
  t.diagnostic('288,005 bounded samples: 8 hours per seed, 5 seeds; old event previews ignored')
})

test('invalid clocks/seeds are safe, negative clocks freeze at the start, and invalid previews do not leak phases', () => {
  for (const time of [-1, -1e8, NaN, Infinity, -Infinity]) {
    assert.deepEqual(sampleCloudWeather(time), sampleCloudWeather(0))
  }
  for (const seed of [NaN, Infinity, -Infinity]) {
    assert.deepEqual(sampleCloudWeather(150, {seed}), sampleCloudWeather(150))
  }
  for (const preview of ['', 'rainbow', null, 5]) {
    assert.deepEqual(sampleCloudWeather(200, {preview}), sampleCloudWeather(200))
  }
  for (const time of [1e6, 1e9, Number.MAX_SAFE_INTEGER]) finiteAndBounded(sampleCloudWeather(time))
})
