# English article covers

List, detail, OG, English hubs, and the English homepage announcement read this directory.

- Primary file: `<english slug>.webp`, page URL `/editorial/covers/en/<english slug>.webp`
- Use a same-name `.jpg` only when webp is missing, then `.png`. Do not use `.jpeg`. Keep extensions lowercase.
- Slug matches the English article catalog: lowercase letters, digits, and hyphens, for example `only-45-of-americans-pay-for-ai-these.webp` or a backfill id such as `20240318a08dcj00.webp`.
- Keep the social-warm editorial illustration (amber / terracotta / sage). Do not redraw it as site forest-green chrome. Prefer 16:9.
- The directory may be empty. Missing files fall back to the first Substack image of a published English article. Articles with neither stay without a cover.
- `encoverlocalfixture.webp` is the 1×1 fixture for `tests/cover-image.test.mjs`, not an article cover. Batch exports must keep it and must not treat it as an article.

This change only mounts the path. Do not commit batch images here. Deploy overlays `public/editorial/covers/en/` the same way as `public/editorial/covers/zh/` (rsync the local webp tree onto the release). Research list, article detail, and matching OG check the disk on each request. Homepage, Data & Rankings, and Events & Awards resolve covers when those pages are built; dropping files without a rebuild will not update those three.
