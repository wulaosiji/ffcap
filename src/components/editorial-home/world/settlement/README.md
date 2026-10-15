# Cloud settlement runtime checkpoint

This directory owns the authored island, original dog rig, guided traversal,
camera entry, atmosphere and opt-in music. Physical/Entertainment interiors are
closed; do not re-enable free keyboard movement as part of visual refinement.

Natural surface effects:

- `cloudBreeze.mjs`: shared world-space breeze and rooted blade flexibility.
- The dog retains its original smooth material. User explicitly rejected fur;
  do not attach strands, add undercoat shaders or apply wind to the dog's skin.
- `cloudSurfaceEffects.mjs`: downstream coordinates, animated surface normals,
  sparse foam and a fixed shallow pebble bed. Not a fluid solver.
- The settlement owns the clock. Freeze all surface motion while paused/hidden;
  never add an independent timer.
- Derived geometry/materials dispose independently. Never dispose the borrowed
  coat skeleton, source textures or original rig from the surface-effect owner.

`tests/cloud-natural-effects.test.mjs` checks the smooth-dog boundary, the creek's
downstream direction, root constraints and disposal; browser visual review is
still required. Passing these tests is not reference-image or real-device signoff.

The scene checkpoint includes prerequisite scene code and public runtime assets
that were previously untracked. It intentionally does not commit unrelated
homepage integration, article/product/footer work or server configuration.
Production remains the separately frozen and verified cloud-dog-guided release
until another explicit production authorization is given.
