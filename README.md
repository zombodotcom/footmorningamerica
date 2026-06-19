# Foot Morning America

> Your #1 source for foot news. With your host, **Footy**. 🦶

A free, parody foot-content **brand + creator directory** for [footmorningamerica.com](https://footmorningamerica.com). It hosts no adult content — it's a funny, mostly-SFW brand (a riff on "Good Morning America") that builds an audience and links out to creators on their own platforms, monetized through affiliate/referral programs.

## What it is

- **The Brand** — Footy the mascot delivering absurd "foot news" and segments. Shareable content that drives traffic.
- **The Directory** — a moderated, creator-submitted list of foot-content creators. Every listing is reviewed before it goes live, and links out to the creator's own platform (OnlyFans / FeetFinder / Fansly / etc.).
- **The Money** — affiliate/referral commissions on creator signups first; paid featured placement and ads come later.

It hosts and processes **no** adult content or payments.

## Tech stack

| Layer | Choice |
|---|---|
| Framework | [Astro](https://astro.build) (static) + TypeScript |
| Styling | Tailwind CSS |
| Data / storage | [Supabase](https://supabase.com) (Postgres + Storage) |
| Hosting | [Netlify](https://netlify.com) |
| Tests | Vitest (unit) + Playwright (E2E) |

## Local development

```bash
npm install
cp .env.example .env   # fill in your Supabase + site values
npm run dev            # http://localhost:4321
```

### Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Preview the production build |
| `npm test` | Run unit tests (Vitest) |
| `npm run test:e2e` | Run E2E tests (Playwright) |
| `npm run check` | Astro + TypeScript type check |

## Environment variables

Set these locally in `.env` and in the Netlify dashboard:

| Var | Purpose |
|---|---|
| `PUBLIC_SUPABASE_URL` | Supabase project URL |
| `PUBLIC_SUPABASE_ANON_KEY` | Anon key — build-time reads of approved listings |
| `SUPABASE_SERVICE_ROLE_KEY` | **Server-only** — used by the submission endpoint |
| `PUBLIC_SITE_URL` | Canonical site URL |

## Deploy to Netlify

1. Connect this repo as a new Netlify site (build command `npm run build`, publish dir `dist`).
2. Add the environment variables above under **Site settings → Environment variables**.
3. Point `footmorningamerica.com` at the site.

## Project docs

- Design spec: [`docs/superpowers/specs/2026-06-18-foot-morning-america-design.md`](docs/superpowers/specs/2026-06-18-foot-morning-america-design.md)
- Implementation plan: [`docs/superpowers/plans/2026-06-18-foot-morning-america-mvp.md`](docs/superpowers/plans/2026-06-18-foot-morning-america-mvp.md)

## Status

🚧 Pre-MVP — scaffolding in progress. See the implementation plan for the build sequence.

---

*Foot Morning America is a parody brand and directory. All linked content is created and hosted by third parties who are solely responsible for it. 18+.*
