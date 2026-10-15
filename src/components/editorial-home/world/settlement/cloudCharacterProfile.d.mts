export interface CloudCharacterProfile {
  readonly kind: 'human' | 'dog' | 'robot'
  readonly glbUrl: string
  readonly manifestUrl: string
  readonly radius: number
  readonly height: number
  readonly walkSpeed: number
  readonly runSpeed: number
  readonly collision: Readonly<{shape: 'capsule' | 'box'; halfLength: number; stepHeight: number; snapDistance: number; turnSpeed: number}>
  readonly camera: Readonly<{targetHeight: number; baseHeight: number; distanceDesktop: number; distanceMobile: number; yaw: number; pitch: number}>
}
export const CLOUD_HUMAN_PROFILE: Readonly<CloudCharacterProfile>
export const CLOUD_DOG_PROFILE: Readonly<CloudCharacterProfile>
export const CLOUD_ROBOT_PROFILE: Readonly<CloudCharacterProfile>
export type CloudCharacterKind = CloudCharacterProfile['kind']
export const CLOUD_CHARACTER_PROFILES: Readonly<Record<CloudCharacterKind,Readonly<CloudCharacterProfile>>>
