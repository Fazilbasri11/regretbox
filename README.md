# RegretBox — The Regret Cemetery (v3.0)

*Write it. Bury it. Let it rest.*

RegretBox is an anonymous, full-screen 3D digital cemetery built with **Vite + TypeScript + Three.js + `postprocessing` + GSAP** and **Vercel Serverless Functions + Supabase Postgres**.

Opening `/` enters the moonlit foggy gothic cemetery directly (no landing page, no login, no personal dashboard). Visitors can explore the grounds, read public engraved gravestones, search by grave number, or click **Add Your Regret** to carve one sentence (up to 120 characters) into permanent stone.

## Highlights
- **Full-Screen 3D Experience:** Locked *Moonlit Foggy Night* aesthetic with sky shader, cratered full moon + 2-layer halo + drifting clouds, ground mist, fireflies, wet cobblestone path with PMREM specular reflections, wrought-iron `R` gate, gothic chapel with glowing tracery windows, sculpted beveled gravestones (`arched`, `slim`, `cross`, `scroll`), flickering lanterns, and carved wooden **Add Your Regret** sign.
- **Readable Engraved Typography:** Dynamic 1024px/2048px `CanvasTexture` + carved normal map (`Cormorant Garamond`, `R.I.P.`, `Regret #00291`, auto-fit quote, `Dikuburkan: 25 Nov 2026`), LRU-cached up to 48 textures.
- **Post-Processing & Quality Governor:** `postprocessing` (`BloomEffect`, `DepthOfFieldEffect`, `VignetteEffect`, `NoiseEffect`, `ToneMappingEffect`, `SMAAEffect`) with `Auto / High / Medium / Low` tiers and automatic 2D **List View** fallback (`/list`) if WebGL is unavailable.
- **Asset Strategy:** Supports self-hosted `.glb` / `.webp` / `.hdr` files in `public/models/` & `public/textures/` with high-detail sculpted procedural PBR fallbacks (see `public/CREDITS.md`).

## Local Setup

> On Windows PowerShell where `npm.ps1` is blocked by execution policy, use `npm.cmd` and `npx.cmd`.

1. Install dependencies:
   ```powershell
   npm.cmd install
   ```
2. *(Optional for DB persistence)* Run `supabase/migrations/001_initial_schema.sql` and `supabase/seed.sql` in Supabase SQL Editor, then copy `.env.example` to `.env.local` and fill:
   ```env
   VITE_SUPABASE_URL=
   VITE_SUPABASE_ANON_KEY=
   SUPABASE_URL=
   SUPABASE_SERVICE_ROLE_KEY=
   RATE_LIMIT_SECRET=
   ```
3. Run locally:
   - Frontend + 3D Cemetery (uses 40-grave demonstration seed when Supabase is unconfigured): `npm.cmd run dev`
   - Full-stack with `/api/*` Vercel Functions: `npx.cmd vercel dev`

## Verification & Deployment
```powershell
npm.cmd run typecheck
npm.cmd test
npm.cmd run build
```
Deploy to **Vercel** by importing the GitHub repo (Framework Preset: Vite) and adding the variables from `.env.example` in **Project Settings -> Environment Variables**.
