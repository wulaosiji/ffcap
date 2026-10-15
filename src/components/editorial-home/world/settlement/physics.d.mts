import type {CloudCharacterProfile} from './cloudCharacterProfile.mjs';
export type WorldVector = [number, number, number];
export interface CollisionBox {
  position: WorldVector;
  halfExtents: WorldVector;
  rotationY?: number;
}
export interface CollisionSurface {
  id?: string;
  vertices: number[];
  indices: number[];
}
export interface TraversalSnapshot {
  position: { x: number; y: number; z: number };
  grounded: boolean;
  moving: boolean;
  heading: number;
}
export interface Traversal {
  step(dt: number, input?: { x: number; z: number; run?: boolean; heading?: number }): TraversalSnapshot;
  teleport(target: WorldVector): TraversalSnapshot;
  readonly position: TraversalSnapshot['position'];
  sampleGround(x: number, z: number, fromY: number, maxDrop?: number): {height: number; normal: {x: number; y: number; z: number}} | null;
  dispose(): void;
}
export const CHARACTER_HEIGHT: number;
export const CHARACTER_RADIUS: number;
export const WALK_SPEED: number;
export const RUN_SPEED: number;
export const FIXED_TIMESTEP: number;
export const MAX_FRAME_TIME: number;
export const MAX_STEP_HEIGHT: number;
export const MAX_SLOPE_ANGLE: number;
export const CONTACT_GAP: number;
export function createTraversal(config: { colliders: CollisionBox[]; spawn: WorldVector; surfaces?: CollisionSurface[]; character?: CloudCharacterProfile }): Promise<Traversal>;
