# Settlement Environment Models

- Store reviewed self-hosted natural-environment GLB/glTF assets only.
- Prefer standalone `<descriptive-name>.glb` files with embedded textures.
- Keep original official downloads and unused source variants in the existing local-only design-verification directory, outside `public/`.
- Record source pages, exact official download URLs, license, source author, runtime size, mesh count and triangle count in `../ASSET_SOURCES.md`.
- Match visible geometry with separately reviewed simplified collision geometry; imported visual meshes are not automatically physical colliders.
- Limit texture sizes to 1K for the first mobile-verification slice, and select one level of detail rather than rendering all supplied LODs together.
- Do not delete prior assets or overwrite retained source files during optimization; export a clearly named new runtime variant.
