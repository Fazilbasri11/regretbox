# RegretBox — The Regret Cemetery

*Write it. Bury it. Let it rest.*

RegretBox is an anonymous, responsive 3D digital cemetery built with **Vite + React + TypeScript + Three.js + GSAP** and **Vercel Serverless Functions + Supabase Postgres**.

Visitors write **one sentence** (max 120 characters) without creating an account, confirm public burial, and watch a unique numbered gravestone appear in an explorable 3D cemetery whose atmosphere adapts automatically to the visitor's local time of day (**Morning Mist**, **Overcast Day**, **Twilight Dusk**, and **Moonlit Night**).

## Key Features

- **Zero accounts / zero private history:** No login, registration, reminders, or editing after burial.
- **One-sentence burial form:** Strictly 3–120 characters, live counter, explicit public permanence warning, anti-spam honeypot, and server-side rate limiting.
- **Atomic grave numbers:** Unique sequential `#00001` numbers allocated server-side via PostgreSQL sequence + advisory lock (`create_public_grave` RPC).
- **Explorable 3D Cemetery:**
  - Procedural wrought-iron entrance gate (`R` crest), cobblestone path, Gothic chapel, flickering stone lanterns, trees, and flower clusters.
  - **Local Time-of-Day Atmosphere:** Automatically sets sky shader, fog, moon/sun, stars, and lantern intensity from the visitor's local clock (with manual preview selector in the HUD).
  - **Performance-first rendering:** `THREE.InstancedMesh` for stone silhouettes, LOD engraved plaques for nearby stones, **Low Graphics Mode**, and automatic **2D List View** fallback when WebGL is unavailable.
  - **Desktop & Mobile controls:** `WASD`/Arrows, drag look, scroll dolly, `Esc` close, plus 1-finger look + virtual joystick + bottom sheet on mobile (safe down to `320px`).
- **Search & Moderation:** Search by `#00291` / `00291`, permalink pages (`/graves/:graveNumber`), and public gravestone reporting (`visible` / `flagged` / `hidden`).

## Local Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create a Supabase project and run the SQL files in order via the Supabase SQL Editor:
   - `supabase/migrations/001_initial_schema.sql`
   - `supabase/seed.sql` (optional demonstration seed graves `#00289`–`#00297`)

3. Copy `.env.example` to `.env.local` and fill in your credentials:
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key

   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   RATE_LIMIT_SECRET=random-long-secret-string
   ```
   > If `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are left blank, the frontend safely runs in read-only demonstration mode using the built-in seed stones.

4. Start local development:
   - Frontend only (UI + 3D Demo): `npm run dev`
   - Full stack (Frontend + `/api/*` Vercel Functions): `npx vercel dev`

## Testing & Build

```bash
npm run typecheck
npm test
npm run build
```

## Deploying to Vercel

1. Push this repository to GitHub.
2. Import the repository in **Vercel** (Framework Preset: **Vite**).
3. Add the environment variables from `.env.example` in **Vercel Project Settings -> Environment Variables**:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY` (server-side secret, never prefix with `VITE_`)
   - `RATE_LIMIT_SECRET`
4. Deploy. `vercel.json` handles SPA routing while preserving `/api/*` serverless functions.
