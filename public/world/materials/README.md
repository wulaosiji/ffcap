# Settlement Material Assets

- Store only runtime-ready, self-hosted material maps here.
- Use lowercase descriptive filenames: `<surface>-color.jpg` and optional `<surface>-normal.jpg`.
- Color maps are sRGB; normal maps are OpenGL tangent-space data and must remain linear.
- Keep each map at no more than 1024 × 1024 pixels for the first playable slice.
- Record original download and license URLs, transformations, dimensions and byte sizes in `../ASSET_SOURCES.md`.
- Preserve full source archives outside the public runtime folder in the project's existing local-only design-verification directory. Do not publish source ZIP files or unused maps.
- Do not delete or replace source files without the user's approval. Material changes must retain source provenance.
