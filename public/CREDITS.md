# RegretBox Asset Credits & Fallback Notice

RegretBox v3.0 supports self-hosted GLB models and KTX2/WebP textures placed in `public/models/` and `public/textures/` (see Section 10 of `REGRETBOX_PRODUCT_SPEC.md`).

## Current Status
- **Fonts:** `@fontsource/cormorant-garamond` and `@fontsource/inter` (self-hosted WOFF2 bundled by Vite, OFL-1.1).
- **3D Models & PBR Textures:** Currently using high-detail sculpted procedural geometry (`ExtrudeGeometry` with bevels, recessed stone frames, vertex weathering noise, recursive `TubeGeometry` branches, custom shader grass) and procedural 1024–2048px CanvasTexture PBR maps (Albedo, Normal, Roughness, Emissive).
- **External GLB/KTX2 Assets:** None bundled yet; dropping `.glb` / `.webp` / `.hdr` files into the documented `public/models/` and `public/textures/` paths can replace any procedural asset seamlessly.
