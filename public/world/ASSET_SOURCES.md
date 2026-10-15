# Settlement Asset Sources

Verified 2026-09-05. Runtime textures are self-hosted: the browser must not request
ambientCG, Poly Haven, or any other external texture service while playing.

## License

The third-party material assets below are CC0 1.0 Universal. Commercial use,
modification and redistribution with a game are permitted by their publishers.

- [ambientCG license](https://docs.ambientcg.com/license/)
- [Poly Haven license](https://polyhaven.com/license)
- [CC0 1.0 legal code](https://creativecommons.org/publicdomain/zero/1.0/legalcode)

No Sky: Children of the Light artwork, characters, models, game captures, or
audio are included in these runtime assets. The game's visual references are
design references only, not distributable source materials.

## Runtime materials

All eight JPG maps are 1024 × 1024 pixels. Color is sRGB; normals are OpenGL
tangent-space maps and must use linear/no color-space conversion. Source images
were decoded and re-encoded with Sharp: JPEG quality 82 for color and 88 for
normals, 4:4:4 chroma sampling, no metadata. No color painting or AI generation
was used for these materials. Geometry and rendering may tint the base color.

| Runtime file | Bytes | Source asset | Intended use |
| --- | ---: | --- | --- |
| `materials/grass-color.jpg` | 574142 | ambientCG Ground037 | Moss/grass ground with soil detail |
| `materials/grass-normal.jpg` | 1022713 | ambientCG Ground037 | Matching small-scale ground detail |
| `materials/rock-color.jpg` | 328689 | ambientCG Rock030 | Grey cliff rock surface |
| `materials/rock-normal.jpg` | 1040463 | ambientCG Rock030 | Matching grey rock detail |
| `materials/wood-color.jpg` | 161541 | ambientCG Wood049 | Warm oak worktables and timber |
| `materials/wood-normal.jpg` | 337536 | ambientCG Wood049 | Matching subtle grain |
| `materials/stone-color.jpg` | 282737 | Poly Haven White Sandstone Blocks 02 | Ivory masonry and weathered stone |
| `materials/stone-normal.jpg` | 312672 | Poly Haven White Sandstone Blocks 02 | Matching chipped masonry detail |

Color-only transfer: 1,347,109 bytes. All maps together: 4,060,493 bytes.
Use color-only or reduced normal loading on constrained devices if required.
Rock030 is a generic procedural grey cliff texture, not an authenticated Iceland
scan; the basalt reference belongs to the scene's shape and geological art
direction. White Sandstone Blocks 02 is sandstone, not marble or limestone.

### Grass ground

- Creator/publisher: ambientCG (Lennart Demes).
- Source page: https://ambientcg.com/view?id=Ground037
- Original download: https://ambientcg.com/get?file=Ground037_1K-JPG.zip
- Selected archive members: `Ground037_1K-JPG_Color.jpg`, `Ground037_1K-JPG_NormalGL.jpg`.
- Publisher technique: surface photogrammetry; source repeat approximately 2.1 m × 2.1 m.
- License: https://docs.ambientcg.com/license/

### Grey cliff rock

- Creator/publisher: ambientCG (Lennart Demes).
- Source page: https://ambientcg.com/view?id=Rock030
- Original download: https://ambientcg.com/get?file=Rock030_1K-JPG.zip
- Selected archive members: `Rock030_1K-JPG_Color.jpg`, `Rock030_1K-JPG_NormalGL.jpg`.
- Publisher technique: procedural; grey cliff/rock/stone material.
- License: https://docs.ambientcg.com/license/

### Oak wood

- Creator/publisher: ambientCG (Lennart Demes).
- Source page: https://ambientcg.com/view?id=Wood049
- Original download: https://ambientcg.com/get?file=Wood049_1K-JPG.zip
- Selected archive members: `Wood049_1K-JPG_Color.jpg`, `Wood049_1K-JPG_NormalGL.jpg`.
- Publisher technique: procedural; source repeat approximately 0.8 m × 0.8 m.
- License: https://docs.ambientcg.com/license/

### Ivory stone blocks

- Creator: Rob Tuytel; publisher: Poly Haven.
- Source page: https://polyhaven.com/a/white_sandstone_blocks_02
- Original color download: https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/white_sandstone_blocks_02/white_sandstone_blocks_02_diff_1k.jpg
- Original OpenGL normal download: https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/white_sandstone_blocks_02/white_sandstone_blocks_02_nor_gl_1k.jpg
- Source repeat: approximately 2 m wide.
- License: https://polyhaven.com/license

## Source retention and excluded candidates

Original public downloads and extracted source maps are preserved in the existing
local-only `11_本机私密资料库/设计验收_20260905/` directory. That directory is not a
runtime/public folder. Unused roughness, displacement, AO, Blender and material
definition files remain in the source ZIP archives and are not shipped.

Tiles074 was inspected and excluded because its black-and-white checkerboard
pattern does not fit the approved art direction. LeafSet026 and Foliage008 were
inspected and excluded from the runtime: they are leaf/blade atlases, not a
ready-to-use grass tuft sprite. No unlicensed foliage or cloud images were added.

## Natural environment models

Added 2026-09-05 after replacing primitive-only environment direction with
reviewed natural geometry. Both models are true mesh assets distributed by
Poly Haven under CC0 1.0. They are not game-ripped assets or generated substitutes.

| Runtime GLB | Bytes | Meshes | Triangles | Source |
| --- | ---: | ---: | ---: | --- |
| `models/boulder-01-mobile.glb` | 1540768 | 1 | 12830 | [Boulder 01](https://polyhaven.com/a/boulder_01) |
| `models/fern-02.glb` | 1496792 | 4 | 6232 | [Fern 02](https://polyhaven.com/a/fern_02) |

Total model transfer: 3,037,560 bytes (about 2.90 MiB). All textures are embedded
at 1024 × 1024. No runtime asset references outside the GLBs; no Draco, Meshopt,
or other decoder extension is required to load them. Reuse geometry/materials
for repeated plants and rocks instead of re-downloading each instance. The
triangle figures above are decoded asset counts, not measured frame performance.

### Boulder 01 mobile export

- Creator: Rico Cilliers; publisher: Poly Haven.
- License: https://polyhaven.com/license
- Original glTF: https://dl.polyhaven.org/file/ph-assets/Models/gltf/1k/boulder_01/boulder_01_1k.gltf
- Original binary: https://dl.polyhaven.org/file/ph-assets/Models/gltf/8k/boulder_01/boulder_01.bin
- Color: https://dl.polyhaven.org/file/ph-assets/Models/jpg/1k/boulder_01/boulder_01_diff_1k.jpg
- OpenGL normal: https://dl.polyhaven.org/file/ph-assets/Models/jpg/1k/boulder_01/boulder_01_nor_gl_1k.jpg
- AO/roughness/metal: https://dl.polyhaven.org/file/ph-assets/Models/jpg/1k/boulder_01/boulder_01_arm_1k.jpg
- Runtime node: `boulder_01`. Nominal extents approximately 1.27 m × 1.00 m × 1.83 m; source geometry extends about 0.074 m below its origin. Position or partially bury it deliberately.
- Source glTF contains 66,122 triangles. Local attribute-aware Meshoptimizer simplification targets 10,000 triangles and 0.005 normalized positional/attribute error; result is 12,830 triangles, 11,952 vertices, reported normalized combined error 0.00497913. Normals and UVs participate in the error metric. This is not a physical accuracy guarantee.
- Geometry and source transforms retained; unused vertices compacted. Texture JPEG quality 82 (color/ARM) and 85 (normals), 4:4:4; no art repainting.
- SHA-256: `52272b2e4e9b96a8610c376a20aabd01ec6d9b78b2e69fc4b4387fc63c5379fb`.

### Fern 02 export

- Creators: Rico Cilliers (modeling), Rob Tuytel (scanning); publisher: Poly Haven.
- License: https://polyhaven.com/license
- Original glTF: https://dl.polyhaven.org/file/ph-assets/Models/gltf/1k/fern_02/fern_02_1k.gltf
- Original binary: https://dl.polyhaven.org/file/ph-assets/Models/gltf/8k/fern_02/fern_02.bin
- Color: https://dl.polyhaven.org/file/ph-assets/Models/jpg/1k/fern_02/fern_02_diff_1k.jpg
- Alpha: https://dl.polyhaven.org/file/ph-assets/Models/png/1k/fern_02/fern_02_alpha_1k.png
- OpenGL normal: https://dl.polyhaven.org/file/ph-assets/Models/jpg/1k/fern_02/fern_02_nor_gl_1k.jpg
- AO/roughness/metal: https://dl.polyhaven.org/file/ph-assets/Models/jpg/1k/fern_02/fern_02_arm_1k.jpg
- Four original variations: `fern_02_b` (2,384 triangles), `fern_02_c` (2,248), `fern_02_a` (784), `fern_02_d` (816). Meshes are arranged in the source's 2 × 2 display layout. Clone individual named nodes and clear their display translation when scattering plants.
- Heights approximately 0.21–0.43 m and widths approximately 0.57–0.99 m; some source roots extend about 0.03 m below origin.
- Source geometry unchanged. The official glTF references JPG color despite requiring alpha-mask foliage; the separately supplied official Alpha PNG was joined into an RGBA PNG base-color map. This restores actual fern leaf silhouettes. Retain `alphaMode=MASK`, `alphaCutoff=0.5`, and double-sided materials.
- Normal and ARM JPEGs recompressed at qualities 85 and 82; the joined alpha-bearing color image uses lossless PNG. All are embedded, without external paths.
- SHA-256: `896f04f2bfe2b4c5651097862e6633cd064078a47c1ee879799e601c03a5dd3b`.

### Model provenance and validation

Official filenames and download links were obtained through the documented
`GET /files/{id}` endpoint, using the unique user agent
`FFCAP-Settlement-AssetPreparation/1.0`. Every source payload was checked against
the publisher's byte size and MD5 checksum before conversion. API metadata and
original files remain preserved in local-only
`11_本机私密资料库/设计验收_20260905/environment-model-sources/` alongside the
preparation script and a conservative high-detail comparison export.

- API documentation: https://github.com/Poly-Haven/Public-API/blob/master/swagger.yml
- Current API terms: https://raw.githubusercontent.com/Poly-Haven/Public-API/master/ToS.md
- Geometry optimization reference: https://github.com/zeux/meshoptimizer#simplification

The website uses downloaded self-hosted CC0 assets only; it does not use the live
Poly Haven API. Package validation checks GLB headers and lengths, buffer bounds,
triangle indices, decoded 1K texture dimensions, embedded resource references,
and a nontrivial 0–255 fern alpha channel. Final scene lighting, contact with the
ground, collision layout and real-device performance require scene verification.

## Original project assets

### Active V2 release, 2026-09-05

The current homepage loads `cloud-courtyard-v2.glb` and `explorer-v2.glb` with
matching SHA-256 manifests. All assets and decoders are self-hosted. V1 remains
preserved but is not the active scene. V2 contains 328,284 environment triangles
and a 61,954-triangle character with 24 bones and idle/walk/run animation.
The approximately 22 by 24 metre courtyard has a substantial rock foundation;
only the Agentic studio is currently enterable. Visual acceptance is unfinished.

The explorer is **not wholly original anatomy**. Its head, neck, forearms/hands,
skin map and short01 hair are adapted from official MakeHuman Community CC0
assets; the costume, split-tail coat, scarf, boots, satchel, skeleton/weights and
animation are project-authored. No MakeHuman source code or add-on is shipped.

- [MakeHuman asset licensing](https://static.makehumancommunity.org/about/license.html)
- [Official asset license](https://github.com/makehumancommunity/makehuman/blob/master/LICENSE.ASSETS.md)
- [Official CC0 system asset pack](https://static.makehumancommunity.org/assets/assetpacks/makehuman_system_assets.html)
- Anatomy source: `makehuman/data/3dobjs/base.obj` and official adult Asian male
  morph targets in `makehumancommunity/makehuman`.
- Skin: `skins/young_asian_male/young_lightskinned_male_diffuse3.png` from the
  official CC0 system pack. Hair: `hair/short01/`, with original alpha/proxy data.
- Original copyright holders named by the CC0 release: Data Collection AB,
  Joel Palmius and Jonas Hauquier. Complete original files, license texts and
  individual source hashes are retained privately in `explorer-v2-sources.md`.

The V2 environment is authored in Blender with the reviewed CC0 textures above.
Its collision mesh follows visible terrain and floor geometry. Water, cloth and
foliage motion are visual effects, not full fluid/cloth/ecosystem simulation.
Static overview posters, when present, are offline renders of these same GLBs,
not the concept references; offline and browser lighting may differ slightly.

The earlier articulated prototype remains preserved in `world/settlement/`, but
is no longer the active visual asset. The Blender pilot now uses the original
skinned explorer and environment described below. Texture rights above do not
imply a license for third-party games. No game audio, game logos, or extracted
game files are used.

### Blender pilot, 2026-09-05

Original assets authored reproducibly in official Blender 4.5.13 LTS. Source
scripts are in `scripts/world/blender/`; editable `.blend` source, earlier
exports and review renders remain in the private project authoring directory.
No external modeling add-on, asset purchase, or extracted game model is used.

| Runtime file | Bytes | Triangles | Materials | Content |
| --- | ---: | ---: | ---: | --- |
| `blender/explorer-v1.glb` | 2047756 | 59436 | 12 | One skinned mesh, 24 joints, original explorer, idle/walk/run |
| `blender/courtyard-v1-draco.glb` | 4431740 | 255770 | 16 | 22 material-batched meshes, courtyard, bridge, three studio masses |

The character is 1.74 m tall with soles at Y=0 and faces -Z. Horizontal
translation is owned by web traversal, not animation root motion. Clothing and
scarf deformation use the authored rig; they are not a cloth simulation.

The environment embeds the existing reviewed rock, grass, wood and stone-normal
maps and the original illustrative workflow image listed above. Blender's
texture multipliers are serialized into standard glTF `baseColorFactor` so the
webpage retains the same authored green meadow, muted rock and oak colors.
Water uses small visual waves and sky reflection, not fluid simulation.

Only Agentic is enterable in this pilot; Physical and Entertainment have visibly
latched 1.1 m timber barriers matching the existing collision layout. All three
research categories remain available through the ordinary website below.

The compressed environment uses `KHR_draco_mesh_compression`. Required decoder
files are self-hosted in `blender/draco/`, copied unchanged from the existing
Three r185 dependency. Sources, checksums and Apache license are included there.
No model or decoder is fetched from a third-party CDN at runtime. The earlier
38 MB uncompressed export is retained privately and is not a runtime download.

Automated validation actually decodes the geometry, checks bounds/skin/animations,
and ray-tests bridge/stair sole supports against the separate physics layout.
These checks do not establish commercial-game art quality or phone performance.

### Generated raster assets

Built-in ImageGen was used; no external API key or CLI generation was used.
These images are original project assets, not CC0 source scans. The concept
image is a visual target only and is not passed off as a real-time screenshot.

- `cloud-sky.webp`: initial sky panorama, retained unused for provenance.
- `cloud-sky-v2.webp`: corrected cloud panorama used for background/environment
  and static fallback. Art brief: an original equirectangular cloud-country sky,
  clear daylight, soft cumulus, natural blue, continuous horizontal horizon,
  no buildings, characters, text, beams, or copyrighted game assets. The second
  version corrects the cloud/horizon placement of the first.
- `agent-workflow.webp`: 1024 × 577, 50,384 bytes. Illustrative monitor texture,
  not a live agent dashboard. Converted to WebP quality 88; no creative repainting
  during conversion. Original generated file ends in
  `exec-51b27421-057d-4afc-95c8-f9b5799e1ec7.png`.

Final workflow-screen prompt:

> Use case: ui-mockup. Asset type: original 16:9 flat screen texture for three
> in-world monitors in a sunny, warm-stone village research studio for Agentic
> AI. Generate a complete refined editorial workflow dashboard, full bleed,
> perfectly orthographic front view; ONLY screen content, no monitor bezel,
> no perspective or environment. Warm ivory paper background with fine
> restrained soft slate lines, muted sage green and charcoal typography.
> Three distinct columns with the exact headings PERCEIVE, REASON, ACT.
> Small node connections and a sophisticated illustrated abstract planning map
> below, flowing from input to coordinated steps to completed work. Small
> top-left heading AGENTIC STUDIO. Understated designer-quality meaningful
> layout with ample negative space and fine details but high overall readability
> when used as a small game texture. No fake realtime numerical stats, no human
> names, no logos, no neon, no beams, no glow, no shadows outside image. The
> result should feel like an elegant architectural research screen, not a
> cyberpunk HUD. Exact text only the four headings requested, other details can
> be simple non-text diagrams.
