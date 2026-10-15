export type CloudWeatherPhase = 'day' | 'sunrise' | 'sunset' | 'night';

export interface CloudWeatherState {
  phase: CloudWeatherPhase;
  /** Astronomical daylight, 0..1; clouds can soften the rendered sunlight. */
  daylight: number;
  /** Separate non-overlapping rising/falling horizon envelopes, 0..1. */
  sunrise: number;
  sunset: number;
  /** Night visibility after slowly varying cloud cover, 0..1. */
  stars: number;
  /** Unwrapped, monotonically increasing cloud-motion phase; not limited to 0..1. */
  cloudDrift: number;
  wind: number;
  cloudCover: number;
  haze: number;
}

export const CLOUD_DAY_CYCLE_SECONDS: 480;

/** Stateless visual weather sampled at elapsed active-scene seconds. */
export function sampleCloudWeather(
  time: number,
  options?: {seed?: number; preview?: CloudWeatherPhase},
): CloudWeatherState;
