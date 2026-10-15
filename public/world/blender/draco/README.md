# Local Draco decoder

This directory holds only the two unmodified glTF WASM decoder files required by
Three.js DRACOLoader. They are copied from the project's already installed
`three@0.185.1/examples/jsm/libs/draco/gltf/` directory. Do not add a dependency,
remote CDN, JS fallback, build output, private models, or downloaded add-ons here.
Retain earlier versions until the user authorizes deletion. Runtime files:

- `draco_wasm_wrapper.js`
- `draco_decoder.wasm`

Source: https://github.com/mrdoob/three.js/tree/r185/examples/jsm/libs/draco/gltf
Upstream project: https://github.com/google/draco
License: Apache License 2.0 (Draco); Three.js is MIT licensed.
The accompanying `LICENSE.txt` is the unmodified upstream Apache license.
The two files are original upstream decoder distribution files, not FFCAP art.
Readme/source tracking added 2026-09-05 for the approved local Blender pilot.

Decoder code runs in browser workers, at most one on mobile and two on desktop.
Each model-loading operation terminates its workers after parsing or failure;
the resulting render geometry does not depend on workers remaining alive.

The explicit asset inspector executes this same official WASM locally, verifies
actual decompressed coordinates, and rejects decoder/network dependencies that
the runtime has not configured. This is separate from mobile performance QA.

SHA-256 of the installed Three r185 glTF decoder distribution:

```
8bb2952d2ba7d67e1414f8df819410cb0434a666be53f671fff75f68843d76f6  draco_wasm_wrapper.js
a680d927bed9cb864ddbd63521868891af2bfbe755092761b4837487618df8ac  draco_decoder.wasm
```
