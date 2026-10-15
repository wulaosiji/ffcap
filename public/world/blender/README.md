# Blender runtime exports

Reviewed, optimized GLB exports from scripts/world/blender. Versioned
filenames preserve previous work. Editable .blend files, installers, intermediate
renders and validation dumps remain local-only outside public. Source/license
records belong in the project's authoring records, not in exported manifests.

The current local pilot loads `cloud-courtyard-v2.glb` with its matching layout
and defaults to `cloud-robot-v1.glb` with its matching SHA256/byte manifest.
The user can select human or `cloud-dog-v1.glb` only inside the courtyard; each
selection restarts at the entrance. The dog is an
original procedural Blender mesh, embedded material maps, 32-bone skin, and
idle/walk/run clips made for the approved cloud-island dog references. No game
character, remote model, or image-only substitute is used.

`explorer-v2.glb`, `explorer-v1.glb` and `courtyard-v1-draco.glb` remain intact
for rollback. The V1 courtyard uses the local decoder in `draco/`. The earlier
uncompressed courtyard is preserved in the private authoring archive.
Verify both model contracts and the visible walking surfaces with `npm test`.
These files are a local pilot, not a statement that the visual target has passed.

Environment revision: `r12p-wood-01`, reviewed timber, limestone, masonry and bank geometry.
1,552,082 authored triangles, 20,592,944 bytes. Reviewed ceiling: 1,800,000
triangles, no decimation; unchanged physics and guide layout. Runtime ground r12h-ground-03
and creek r12k-water-03, lighting r12m-light-01. Desktop same-renderer 32:9 poster matches. Mobile review deferred.
Embedded bark maps derive from [ambientCG Bark014](https://ambientcg.com/view?id=Bark014),
[CC0 1.0](https://docs.ambientcg.com/license/), 1K JPG Color / OpenGL Normal.
Web copies retain 1024×1024 resolution at JPEG quality 88 / 92. Original ZIP,
source images and prior runtime files remain in the private authoring archive.
The dog remains the approved smooth `r04-sit6` asset; no runtime hair layers.

Robot r03 is original Blender geometry: one complete .764 m wide closed tread,
48 linked shoes, eight road wheels, articulated arms/neck/binocular optics,
135,320 triangles across unique authored meshes; runtime repeats the original
tread mesh without decimation. GLB 3,169,120 bytes, SHA256
`7e30d590e48da69679044a5f5c7346cb134f42e48edd23bec3ede60bd5ef1f93`.
This is a guided stylized rover, not a complete tracked-vehicle dynamics simulator.
