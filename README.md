# SWOL

Workout tracker with low-key social. Responsive PWA — same app on phone (in the
gym) and desktop (planning, trends, flexing on friends).

## Stack

- **SolidJS + Vite + TypeScript** (mirrors the `willys-rack-shack` setup)
- **Supabase** — Postgres + Auth (OAuth) + Row Level Security
- **vite-plugin-pwa** — installable to the home screen
- Theming via `--swl-*` CSS custom properties in `[data-theme]` blocks; the
  active theme is stored in `localStorage` (`swl-theme`) and applied to
  `<html data-theme>` by `RootLayout`.

## Getting started

```bash
npm install
cp .env.example .env   # fill in your Supabase URL + anon key
npm run dev
```

Then apply the database schema: open the Supabase SQL editor and run
`supabase/schema.sql`.

### Auth setup

OAuth providers are configured in the Supabase dashboard (Authentication →
Providers). v1 wires **Google** and **GitHub** (both free). Add the redirect URL
`http://localhost:5173/auth/callback` (and your prod origin) to the provider's
allowed redirects and to Supabase's URL config. Apple is stubbed in the UI and
can be enabled later (requires the Apple Developer Program).

## Structure

```
src/
  index.tsx                 # router + routes
  RootLayout.tsx            # theme sync + auth init + app shell
  theme.css                 # --swl-* tokens per [data-theme]
  supabaseClient.ts         # single Supabase client
  stores/                   # theme.store, auth.store (Solid signals)
  services/                 # theme-colors.service (CSS vars -> canvas)
  components/app-shell/      # responsive nav (bottom bar / left rail)
  views/                    # dashboard, log, trends, login, auth callback
  lib/types.ts              # domain types mirroring the schema
supabase/schema.sql         # tables, RLS, profile trigger
```

## Decisions so far

- Responsive single app (no device/flow split yet — revisit as it matures).
- Online-only for v1; offline write queue is a later milestone.
- DOB is private: stored on `profiles`, exposed only via the `public_profiles`
  view which omits it, enforced by RLS.
