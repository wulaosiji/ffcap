/** Metres/seconds, model forward -Z, origin at the ground below the body. */
export const CLOUD_HUMAN_PROFILE = Object.freeze({
  kind: 'human', glbUrl: '/world/blender/explorer-v2.glb', manifestUrl: '/world/blender/explorer-v2-asset.json',
  radius: .28, height: 1.75, walkSpeed: 3.2, runSpeed: 5.3,
  collision: Object.freeze({shape: 'capsule', halfLength: .28, stepHeight: .26, snapDistance: .3, turnSpeed: 10}),
  camera: Object.freeze({targetHeight: 1.32, baseHeight: 1.5, distanceDesktop: 5.3, distanceMobile: 4.6, yaw: .053, pitch: .265}),
})

export const CLOUD_DOG_PROFILE = Object.freeze({
  kind: 'dog', glbUrl: '/world/blender/cloud-dog-v1.glb', manifestUrl: '/world/blender/cloud-dog-v1-asset.json',
  // r01-fix measured rest bounds: height .771574, Z[-.527472,+.598339].
  // Include ears and the relaxed tail, not just the .52 m shoulder/torso.
  radius: .17, height: .79, walkSpeed: 1.2, runSpeed: 2.8,
  collision: Object.freeze({shape: 'box', halfLength: .61, stepHeight: .20, snapDistance: .24, turnSpeed: 2}),
  camera: Object.freeze({targetHeight: .5, baseHeight: .68, distanceDesktop: 3.5, distanceMobile: 3, yaw: .053, pitch: .265}),
})

export const CLOUD_ROBOT_PROFILE = Object.freeze({
  kind:'robot',glbUrl:'/world/blender/cloud-robot-v1.glb',manifestUrl:'/world/blender/cloud-robot-v1-asset.json',
  radius:.37,height:1.02,walkSpeed:1.45,runSpeed:1.8,
  collision:Object.freeze({shape:'box',halfLength:.31,stepHeight:.20,snapDistance:.24,turnSpeed:1.8}),
  camera:Object.freeze({targetHeight:.65,baseHeight:.87,distanceDesktop:3.8,distanceMobile:3.4,yaw:.053,pitch:.265}),
})
export const CLOUD_CHARACTER_PROFILES=Object.freeze({human:CLOUD_HUMAN_PROFILE,robot:CLOUD_ROBOT_PROFILE,dog:CLOUD_DOG_PROFILE})
