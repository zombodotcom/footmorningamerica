# Foot Morning America MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the MVP of footmorningamerica.com — a Footy-mascot foot brand site plus a moderated, creator-submitted directory that links out to creators with affiliate-tagged platform CTAs.

**Architecture:** Astro static site hosted on Netlify, with a single serverless endpoint for form submissions. Creator listings live in Supabase Postgres (with RLS + Storage for photos); approved listings are fetched at build time and rendered as static pages. Moderation is manual via the Supabase dashboard for MVP. Everything built test-first.

**Tech Stack:** Astro + TypeScript, Tailwind CSS, Supabase (Postgres + Storage), `@supabase/supabase-js`, Netlify (`@astrojs/netlify` adapter), Vitest (unit), Playwright (E2E).

---

## File Structure

```
footmorningamerica/
├─ astro.config.mjs                 # Astro config: netlify adapter, tailwind, static output
├─ package.json
├─ tsconfig.json
├─ vitest.config.ts                 # Vitest (uses Astro's getViteConfig)
├─ playwright.config.ts             # Playwright E2E config
├─ .env.example                     # documents required env vars
├─ supabase/
│  └─ migrations/
│     └─ 0001_listings.sql          # listings table + enums + RLS + storage bucket
├─ src/
│  ├─ lib/
│  │  ├─ affiliate.ts               # pure: build outbound + platform-signup URLs
│  │  ├─ affiliate.config.ts        # affiliate ref codes per platform
│  │  ├─ listing.ts                 # Listing type + validateSubmission()
│  │  ├─ supabase.ts                # supabase client factory (anon + service)
│  │  └─ listings.repo.ts           # getApprovedListings(), insertPendingListing()
│  ├─ components/
│  │  ├─ AgeGate.astro              # 18+ interstitial (client island)
│  │  ├─ CreatorCard.astro          # one directory listing
│  │  └─ Footer.astro               # legal footer
│  ├─ layouts/
│  │  └─ Base.astro                 # shared head/nav/footer + age gate mount
│  ├─ pages/
│  │  ├─ index.astro                # homepage / Footy brand
│  │  ├─ directory.astro            # directory of approved listings
│  │  ├─ get-featured.astro         # submission form
│  │  ├─ legal/2257.astro           # 2257-style statement
│  │  ├─ legal/terms.astro          # terms
│  │  └─ api/submit.ts              # serverless POST endpoint (prerender=false)
│  └─ styles/global.css
└─ tests/
   ├─ unit/affiliate.test.ts
   ├─ unit/listing.test.ts
   ├─ unit/listings.repo.test.ts
   └─ e2e/
      ├─ homepage.spec.ts
      ├─ age-gate.spec.ts
      └─ directory.spec.ts
```

**Responsibility boundaries:**
- `lib/affiliate.ts` — pure URL logic, no I/O. Highest-value tests.
- `lib/listing.ts` — the `Listing` type + pure form validation.
- `lib/listings.repo.ts` — the only module that talks to Supabase for listings.
- `pages/api/submit.ts` — the only server code; validates then writes via the repo with the service key.
- Pages are presentational; all logic lives in `lib/`.

---

## Environment variables

Documented in `.env.example`, set in Netlify dashboard for deploys:

- `PUBLIC_SUPABASE_URL` — Supabase project URL (safe to expose)
- `PUBLIC_SUPABASE_ANON_KEY` — anon key, used for build-time reads of approved listings
- `SUPABASE_SERVICE_ROLE_KEY` — **server-only**, used by `api/submit.ts` to insert pending rows + upload photos. Never imported into client code.
- `PUBLIC_SITE_URL` — canonical site URL for SEO/links

---

## Task 1: Scaffold the Astro project

**Files:**
- Create: `package.json`, `astro.config.mjs`, `tsconfig.json`, `src/pages/index.astro`, `src/styles/global.css`

- [ ] **Step 1: Create the Astro project in-place**

Run (answer prompts: Empty template, Yes to TypeScript "Strict", Yes install deps):
```bash
npm create astro@latest -- --template minimal --typescript strict --no-git --skip-houston .
```

- [ ] **Step 2: Add Tailwind and the Netlify adapter via official integrations**

```bash
npx astro add tailwind --yes
npx astro add netlify --yes
```

- [ ] **Step 3: Set static output with server endpoints allowed in `astro.config.mjs`**

```js
import { defineConfig } from 'astro/config';
import netlify from '@astrojs/netlify';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  output: 'static',
  adapter: netlify(),
  site: process.env.PUBLIC_SITE_URL ?? 'https://footmorningamerica.com',
  vite: { plugins: [tailwindcss()] },
});
```

- [ ] **Step 4: Verify the dev build works**

Run: `npm run build`
Expected: build completes with no errors; `dist/` produced.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore: scaffold Astro + Tailwind + Netlify adapter"
```

---

## Task 2: Wire up the test runners

**Files:**
- Create: `vitest.config.ts`, `playwright.config.ts`, `tests/unit/smoke.test.ts`
- Modify: `package.json` (scripts)

- [ ] **Step 1: Install test deps**

```bash
npm install -D vitest @playwright/test
npx playwright install --with-deps chromium
```

- [ ] **Step 2: Write `vitest.config.ts` using Astro's helper**

```ts
/// <reference types="vitest" />
import { getViteConfig } from 'astro/config';

export default getViteConfig({
  test: {
    include: ['tests/unit/**/*.test.ts'],
    environment: 'node',
  },
});
```

- [ ] **Step 3: Write `playwright.config.ts`**

```ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  webServer: {
    command: 'npm run preview',
    url: 'http://localhost:4321',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  use: { baseURL: 'http://localhost:4321' },
});
```

- [ ] **Step 4: Add a failing smoke test `tests/unit/smoke.test.ts`**

```ts
import { describe, it, expect } from 'vitest';

describe('test harness', () => {
  it('runs', () => {
    expect(1 + 1).toBe(2);
  });
});
```

- [ ] **Step 5: Add scripts to `package.json`**

```json
"scripts": {
  "dev": "astro dev",
  "build": "astro build",
  "preview": "astro preview",
  "test": "vitest run",
  "test:e2e": "playwright test",
  "check": "astro check"
}
```

- [ ] **Step 6: Run unit tests to verify the harness works**

Run: `npm test`
Expected: PASS (1 test).

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "test: add Vitest + Playwright harness"
```

---

## Task 3: Affiliate-link builder (pure logic — highest priority)

**Files:**
- Create: `src/lib/affiliate.config.ts`, `src/lib/affiliate.ts`, `tests/unit/affiliate.test.ts`

**Design:** Two pure functions.
- `buildCreatorUrl(rawUrl)` — outbound link to an individual creator profile: validated + UTM-tagged for our own analytics (creators are not per-link affiliates).
- `buildPlatformSignupUrl(platform)` — a "start selling here" CTA carrying *our* affiliate ref code (this is where referral money comes from).

- [ ] **Step 1: Write the failing test `tests/unit/affiliate.test.ts`**

```ts
import { describe, it, expect } from 'vitest';
import { buildCreatorUrl, buildPlatformSignupUrl } from '../../src/lib/affiliate';

describe('buildCreatorUrl', () => {
  it('passes through a valid https url and adds our utm source', () => {
    const out = buildCreatorUrl('https://onlyfans.com/footqueen');
    expect(out).toContain('https://onlyfans.com/footqueen');
    expect(out).toContain('utm_source=footmorningamerica');
  });

  it('rejects non-http(s) urls', () => {
    expect(() => buildCreatorUrl('javascript:alert(1)')).toThrow();
    expect(() => buildCreatorUrl('ftp://x.com')).toThrow();
  });
});

describe('buildPlatformSignupUrl', () => {
  it('appends the feetfinder affiliate ref', () => {
    const out = buildPlatformSignupUrl('feetfinder');
    expect(out).toContain('ref=');
    expect(out).toMatch(/^https:\/\//);
  });

  it('throws on an unknown platform', () => {
    // @ts-expect-error testing runtime guard
    expect(() => buildPlatformSignupUrl('myspace')).toThrow();
  });
});
```

- [ ] **Step 2: Run it to verify failure**

Run: `npx vitest run tests/unit/affiliate.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Write `src/lib/affiliate.config.ts`**

```ts
export type Platform = 'onlyfans' | 'feetfinder' | 'fansly' | 'other';

// Affiliate/referral codes — fill with real codes once accounts exist.
// Signup base URLs are the "start selling" pages where referral credit applies.
export const PLATFORM_SIGNUP: Record<Exclude<Platform, 'other'>, { base: string; refParam: string; ref: string }> = {
  onlyfans:   { base: 'https://onlyfans.com/',            refParam: 'ref', ref: 'PLACEHOLDER_OF_REF' },
  feetfinder: { base: 'https://feetfinder.com/',          refParam: 'ref', ref: 'PLACEHOLDER_FF_REF' },
  fansly:     { base: 'https://fansly.com/',              refParam: 'ref', ref: 'PLACEHOLDER_FANSLY_REF' },
};

export const UTM_SOURCE = 'footmorningamerica';
```

- [ ] **Step 4: Write `src/lib/affiliate.ts`**

```ts
import { PLATFORM_SIGNUP, UTM_SOURCE, type Platform } from './affiliate.config';

export function buildCreatorUrl(rawUrl: string): string {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new Error(`Invalid URL: ${rawUrl}`);
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') {
    throw new Error(`Disallowed protocol: ${url.protocol}`);
  }
  url.searchParams.set('utm_source', UTM_SOURCE);
  return url.toString();
}

export function buildPlatformSignupUrl(platform: Platform): string {
  if (platform === 'other' || !(platform in PLATFORM_SIGNUP)) {
    throw new Error(`No signup affiliate config for platform: ${platform}`);
  }
  const cfg = PLATFORM_SIGNUP[platform as Exclude<Platform, 'other'>];
  const url = new URL(cfg.base);
  url.searchParams.set(cfg.refParam, cfg.ref);
  return url.toString();
}
```

- [ ] **Step 5: Run tests to verify pass**

Run: `npx vitest run tests/unit/affiliate.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: affiliate-link builder with passthrough + signup ref"
```

---

## Task 4: Supabase schema migration

**Files:**
- Create: `supabase/migrations/0001_listings.sql`

- [ ] **Step 1: Write the migration SQL**

```sql
-- 0001_listings.sql
create type platform as enum ('onlyfans', 'feetfinder', 'fansly', 'other');
create type listing_status as enum ('pending', 'approved', 'rejected');

create table listings (
  id           uuid primary key default gen_random_uuid(),
  display_name text not null,
  platform     platform not null,
  handle       text not null,
  outbound_url text not null,
  photo_path   text,
  bio          text,
  status       listing_status not null default 'pending',
  created_at   timestamptz not null default now()
);

create index listings_status_idx on listings (status);

alter table listings enable row level security;

-- Public may read ONLY approved listings.
create policy "public reads approved"
  on listings for select
  using (status = 'approved');

-- No anon insert/update/delete: writes go through the service-role endpoint only.

-- Storage bucket for creator photos (public-read, server-write).
insert into storage.buckets (id, name, public) values ('creator-photos', 'creator-photos', true)
  on conflict (id) do nothing;
```

- [ ] **Step 2: Apply it to your Supabase project**

Run in the Supabase SQL editor (or `supabase db push` if using the CLI). Verify the `listings` table and `creator-photos` bucket exist in the dashboard.

- [ ] **Step 3: Seed one approved row for build/testing**

In the SQL editor:
```sql
insert into listings (display_name, platform, handle, outbound_url, bio, status)
values ('Demo Footy Fan', 'onlyfans', 'demo', 'https://onlyfans.com/demo', 'Sample listing.', 'approved');
```

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: supabase listings schema + RLS + photo bucket"
```

---

## Task 5: Supabase client + env

**Files:**
- Create: `src/lib/supabase.ts`, `.env.example`, `.env` (local, gitignored)

- [ ] **Step 1: Install the client**

```bash
npm install @supabase/supabase-js
```

- [ ] **Step 2: Write `.env.example`**

```bash
PUBLIC_SUPABASE_URL=
PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
PUBLIC_SITE_URL=https://footmorningamerica.com
```

- [ ] **Step 3: Create local `.env` with your real values (not committed)**

Copy `.env.example` to `.env` and paste your Supabase project URL + keys from the dashboard.

- [ ] **Step 4: Write `src/lib/supabase.ts`**

```ts
import { createClient } from '@supabase/supabase-js';

// Anon client — build-time reads of approved listings (RLS enforced).
export function anonClient() {
  const url = import.meta.env.PUBLIC_SUPABASE_URL;
  const key = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('Missing PUBLIC_SUPABASE_* env vars');
  return createClient(url, key);
}

// Service client — server endpoint only. Bypasses RLS; never import in client code.
export function serviceClient() {
  const url = import.meta.env.PUBLIC_SUPABASE_URL;
  const key = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Missing service-role env vars');
  return createClient(url, key, { auth: { persistSession: false } });
}
```

- [ ] **Step 5: Commit**

```bash
git add .env.example src/lib/supabase.ts
git commit -m "feat: supabase client factories + env template"
```

---

## Task 6: Listing type + submission validation (pure)

**Files:**
- Create: `src/lib/listing.ts`, `tests/unit/listing.test.ts`

- [ ] **Step 1: Write the failing test `tests/unit/listing.test.ts`**

```ts
import { describe, it, expect } from 'vitest';
import { validateSubmission } from '../../src/lib/listing';

const valid = {
  display_name: 'Foot Queen',
  platform: 'onlyfans',
  handle: 'footqueen',
  outbound_url: 'https://onlyfans.com/footqueen',
  bio: 'Hi',
};

describe('validateSubmission', () => {
  it('accepts a valid submission', () => {
    const r = validateSubmission(valid);
    expect(r.ok).toBe(true);
  });

  it('rejects a missing display_name', () => {
    const r = validateSubmission({ ...valid, display_name: '' });
    expect(r.ok).toBe(false);
  });

  it('rejects an unknown platform', () => {
    const r = validateSubmission({ ...valid, platform: 'myspace' });
    expect(r.ok).toBe(false);
  });

  it('rejects a non-https outbound_url', () => {
    const r = validateSubmission({ ...valid, outbound_url: 'http://x.com' });
    expect(r.ok).toBe(false);
  });
});
```

- [ ] **Step 2: Run it to verify failure**

Run: `npx vitest run tests/unit/listing.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Write `src/lib/listing.ts`**

```ts
import type { Platform } from './affiliate.config';

export interface Listing {
  id: string;
  display_name: string;
  platform: Platform;
  handle: string;
  outbound_url: string;
  photo_path: string | null;
  bio: string | null;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

export type SubmissionInput = Pick<Listing, 'display_name' | 'platform' | 'handle' | 'outbound_url' | 'bio'>;

const PLATFORMS = ['onlyfans', 'feetfinder', 'fansly', 'other'];

export function validateSubmission(input: Record<string, unknown>):
  { ok: true; value: SubmissionInput } | { ok: false; errors: string[] } {
  const errors: string[] = [];
  const s = (v: unknown) => (typeof v === 'string' ? v.trim() : '');

  const display_name = s(input.display_name);
  const platform = s(input.platform);
  const handle = s(input.handle);
  const outbound_url = s(input.outbound_url);
  const bio = s(input.bio);

  if (!display_name) errors.push('display_name required');
  if (!PLATFORMS.includes(platform)) errors.push('invalid platform');
  if (!handle) errors.push('handle required');
  try {
    const u = new URL(outbound_url);
    if (u.protocol !== 'https:') errors.push('outbound_url must be https');
  } catch {
    errors.push('outbound_url invalid');
  }

  if (errors.length) return { ok: false, errors };
  return { ok: true, value: { display_name, platform: platform as Platform, handle, outbound_url, bio } };
}
```

- [ ] **Step 4: Run tests to verify pass**

Run: `npx vitest run tests/unit/listing.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: Listing type + submission validation"
```

---

## Task 7: Listings repository

**Files:**
- Create: `src/lib/listings.repo.ts`, `tests/unit/listings.repo.test.ts`

**Design:** Repo functions accept a Supabase client (dependency injection) so they're testable with a fake.

- [ ] **Step 1: Write the failing test `tests/unit/listings.repo.test.ts`**

```ts
import { describe, it, expect } from 'vitest';
import { getApprovedListings, insertPendingListing } from '../../src/lib/listings.repo';

function fakeClient(rows: any[]) {
  const calls: any = {};
  return {
    calls,
    from() {
      return {
        select() { return this; },
        eq(_col: string, val: string) { calls.statusFilter = val; return this; },
        order() { return Promise.resolve({ data: rows, error: null }); },
        insert(payload: any) { calls.inserted = payload; return Promise.resolve({ error: null }); },
      };
    },
  } as any;
}

describe('getApprovedListings', () => {
  it('queries only approved and returns rows', async () => {
    const client = fakeClient([{ id: '1', status: 'approved' }]);
    const rows = await getApprovedListings(client);
    expect(client.calls.statusFilter).toBe('approved');
    expect(rows).toHaveLength(1);
  });
});

describe('insertPendingListing', () => {
  it('inserts with status pending', async () => {
    const client = fakeClient([]);
    await insertPendingListing(client, {
      display_name: 'X', platform: 'onlyfans', handle: 'x',
      outbound_url: 'https://onlyfans.com/x', bio: '',
    });
    expect(client.calls.inserted.status).toBe('pending');
  });
});
```

- [ ] **Step 2: Run it to verify failure**

Run: `npx vitest run tests/unit/listings.repo.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Write `src/lib/listings.repo.ts`**

```ts
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Listing, SubmissionInput } from './listing';

export async function getApprovedListings(client: SupabaseClient): Promise<Listing[]> {
  const { data, error } = await client
    .from('listings')
    .select('*')
    .eq('status', 'approved')
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as Listing[];
}

export async function insertPendingListing(
  client: SupabaseClient,
  input: SubmissionInput & { photo_path?: string | null },
): Promise<void> {
  const { error } = await client.from('listings').insert({ ...input, status: 'pending' });
  if (error) throw new Error(error.message);
}
```

- [ ] **Step 4: Run tests to verify pass**

Run: `npx vitest run tests/unit/listings.repo.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: listings repository with injectable client"
```

---

## Task 8: Base layout + legal footer + age gate

**Files:**
- Create: `src/layouts/Base.astro`, `src/components/Footer.astro`, `src/components/AgeGate.astro`, `tests/e2e/age-gate.spec.ts`
- Create: `src/pages/legal/2257.astro`, `src/pages/legal/terms.astro`

- [ ] **Step 1: Write the failing E2E test `tests/e2e/age-gate.spec.ts`**

```ts
import { test, expect } from '@playwright/test';

test('age gate blocks until confirmed, then persists', async ({ page }) => {
  await page.goto('/directory');
  await expect(page.getByTestId('age-gate')).toBeVisible();
  await page.getByRole('button', { name: /i am 18/i }).click();
  await expect(page.getByTestId('age-gate')).toBeHidden();
  await page.reload();
  await expect(page.getByTestId('age-gate')).toBeHidden();
});
```

- [ ] **Step 2: Write `src/components/AgeGate.astro`**

```astro
---
---
<div id="age-gate" data-testid="age-gate" class="fixed inset-0 z-50 hidden items-center justify-center bg-black/90 text-white">
  <div class="max-w-md p-8 text-center">
    <h2 class="text-2xl font-bold">This area is for adults.</h2>
    <p class="mt-2">Foot Morning America links to content intended for adults 18+.</p>
    <button id="age-ok" class="mt-6 rounded bg-white px-6 py-3 font-bold text-black">I am 18 or older</button>
  </div>
</div>
<script>
  const KEY = 'fma-age-ok';
  const gate = document.getElementById('age-gate')!;
  if (localStorage.getItem(KEY) !== 'yes') gate.classList.replace('hidden', 'flex');
  document.getElementById('age-ok')?.addEventListener('click', () => {
    localStorage.setItem(KEY, 'yes');
    gate.classList.replace('flex', 'hidden');
  });
</script>
```

- [ ] **Step 3: Write `src/components/Footer.astro`**

```astro
---
---
<footer class="mt-16 border-t border-neutral-200 px-6 py-8 text-sm text-neutral-500">
  <p>Foot Morning America is a parody brand and directory. We host no adult content; we link to third-party platforms.</p>
  <p class="mt-2">
    <a href="/legal/2257">18 U.S.C. 2257 Statement</a> ·
    <a href="/legal/terms">Terms</a>
  </p>
  <p class="mt-2">All linked content is created and hosted by third parties who are solely responsible for it.</p>
</footer>
```

- [ ] **Step 4: Write `src/layouts/Base.astro`**

```astro
---
import Footer from '../components/Footer.astro';
import AgeGate from '../components/AgeGate.astro';
import '../styles/global.css';
const { title = 'Foot Morning America', gated = false } = Astro.props;
---
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>{title}</title>
  </head>
  <body class="min-h-screen bg-white text-neutral-900">
    <nav class="flex gap-6 px-6 py-4 font-bold">
      <a href="/">Foot Morning America</a>
      <a href="/directory">Directory</a>
      <a href="/get-featured">Get Featured</a>
    </nav>
    <main><slot /></main>
    <Footer />
    {gated && <AgeGate />}
  </body>
</html>
```

- [ ] **Step 5: Write the two legal pages**

`src/pages/legal/2257.astro`:
```astro
---
import Base from '../../layouts/Base.astro';
---
<Base title="2257 Statement — Foot Morning America">
  <section class="prose mx-auto px-6 py-12">
    <h1>18 U.S.C. § 2257 Statement</h1>
    <p>Foot Morning America does not produce, host, or store any sexually explicit content. The site
       functions solely as a directory linking to third-party platforms. We are not a "producer" of
       any content within the meaning of 18 U.S.C. § 2257. All records required by law for content
       are maintained by the third-party producers and platforms that host it.</p>
  </section>
</Base>
```

`src/pages/legal/terms.astro`:
```astro
---
import Base from '../../layouts/Base.astro';
---
<Base title="Terms — Foot Morning America">
  <section class="prose mx-auto px-6 py-12">
    <h1>Terms of Use</h1>
    <p>You must be 18 or older to use the directory. Listings are submitted by creators and link to
       third-party platforms. We do not control or endorse third-party content. We reserve the right
       to remove any listing at our discretion.</p>
  </section>
</Base>
```

- [ ] **Step 6: Run the E2E test (needs the directory page from Task 9; expect fail until then)**

Run: `npm run build && npx playwright test tests/e2e/age-gate.spec.ts`
Expected: FAIL until `/directory` exists (Task 9). Leave this test in place; it passes after Task 9.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: base layout, legal footer, age gate, legal pages"
```

---

## Task 9: Directory page

**Files:**
- Create: `src/pages/directory.astro`, `src/components/CreatorCard.astro`, `tests/e2e/directory.spec.ts`

- [ ] **Step 1: Write the failing E2E test `tests/e2e/directory.spec.ts`**

```ts
import { test, expect } from '@playwright/test';

test('directory shows approved listings with affiliate-tagged links', async ({ page }) => {
  await page.goto('/directory');
  await page.getByRole('button', { name: /i am 18/i }).click();
  const card = page.getByTestId('creator-card').first();
  await expect(card).toBeVisible();
  const link = card.getByRole('link', { name: /view/i });
  await expect(link).toHaveAttribute('href', /utm_source=footmorningamerica/);
});
```

- [ ] **Step 2: Write `src/components/CreatorCard.astro`**

```astro
---
import { buildCreatorUrl } from '../lib/affiliate';
const { listing } = Astro.props;
const href = buildCreatorUrl(listing.outbound_url);
---
<article data-testid="creator-card" class="rounded-lg border border-neutral-200 p-4">
  <h3 class="font-bold">{listing.display_name}</h3>
  <p class="text-sm text-neutral-500">{listing.platform} · @{listing.handle}</p>
  {listing.bio && <p class="mt-2 text-sm">{listing.bio}</p>}
  <a href={href} rel="nofollow noopener" target="_blank"
     class="mt-3 inline-block rounded bg-black px-4 py-2 text-sm font-bold text-white">View →</a>
</article>
```

- [ ] **Step 3: Write `src/pages/directory.astro`**

```astro
---
import Base from '../layouts/Base.astro';
import CreatorCard from '../components/CreatorCard.astro';
import { anonClient } from '../lib/supabase';
import { getApprovedListings } from '../lib/listings.repo';

const listings = await getApprovedListings(anonClient());
---
<Base title="Directory — Foot Morning America" gated={true}>
  <section class="mx-auto max-w-5xl px-6 py-12">
    <h1 class="text-3xl font-black">The Footy Directory</h1>
    <p class="mt-2 text-neutral-500">{listings.length} creators and counting.</p>
    <div class="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {listings.map((l) => <CreatorCard listing={l} />)}
    </div>
  </section>
</Base>
```

- [ ] **Step 4: Build and run the directory + age-gate E2E tests**

Run: `npm run build && npx playwright test tests/e2e/directory.spec.ts tests/e2e/age-gate.spec.ts`
Expected: PASS (requires `.env` with Supabase creds + the seeded approved row from Task 4).

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: directory page rendering approved listings"
```

---

## Task 10: Submission form + serverless endpoint

**Files:**
- Create: `src/pages/get-featured.astro`, `src/pages/api/submit.ts`

- [ ] **Step 1: Write the form page `src/pages/get-featured.astro`**

```astro
---
import Base from '../layouts/Base.astro';
---
<Base title="Get Featured — Foot Morning America">
  <section class="mx-auto max-w-lg px-6 py-12">
    <h1 class="text-3xl font-black">Get on Foot Morning America</h1>
    <p class="mt-2 text-neutral-500">Submit your profile. We review every listing before it goes live.</p>
    <form method="POST" action="/api/submit" enctype="multipart/form-data" class="mt-8 grid gap-4">
      <input name="display_name" required placeholder="Display name" class="rounded border p-3" />
      <select name="platform" required class="rounded border p-3">
        <option value="">Platform…</option>
        <option value="onlyfans">OnlyFans</option>
        <option value="feetfinder">FeetFinder</option>
        <option value="fansly">Fansly</option>
        <option value="other">Other</option>
      </select>
      <input name="handle" required placeholder="@handle" class="rounded border p-3" />
      <input name="outbound_url" required type="url" placeholder="https://… your profile link" class="rounded border p-3" />
      <textarea name="bio" placeholder="Short bio" class="rounded border p-3"></textarea>
      <input name="photo" type="file" accept="image/*" class="rounded border p-3" />
      <button class="rounded bg-black px-6 py-3 font-bold text-white">Submit for review</button>
    </form>
  </section>
</Base>
```

- [ ] **Step 2: Write the endpoint `src/pages/api/submit.ts`**

```ts
import type { APIRoute } from 'astro';
import { serviceClient } from '../../lib/supabase';
import { validateSubmission } from '../../lib/listing';
import { insertPendingListing } from '../../lib/listings.repo';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  const form = await request.formData();
  const result = validateSubmission(Object.fromEntries(form.entries()));
  if (!result.ok) {
    return new Response(JSON.stringify({ errors: result.errors }), { status: 400 });
  }

  const client = serviceClient();
  let photo_path: string | null = null;

  const photo = form.get('photo');
  if (photo instanceof File && photo.size > 0) {
    const key = `submissions/${crypto.randomUUID()}-${photo.name}`;
    const { error } = await client.storage.from('creator-photos').upload(key, photo, { upsert: false });
    if (!error) photo_path = key;
  }

  await insertPendingListing(client, { ...result.value, photo_path });
  return new Response(null, { status: 303, headers: { Location: '/get-featured?submitted=1' } });
};
```

- [ ] **Step 3: Show the success banner on redirect — add to `get-featured.astro` above the form**

```astro
{Astro.url.searchParams.get('submitted') && (
  <p class="rounded bg-green-100 p-3 text-green-800">Thanks! Your listing is in review.</p>
)}
```

- [ ] **Step 4: Manual test against your Supabase project**

Run: `npm run dev`, open `/get-featured`, submit the form, and confirm a new `pending` row appears in the Supabase `listings` table and the photo lands in the `creator-photos` bucket.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: get-featured form + serverless submit endpoint"
```

---

## Task 11: Homepage / Footy brand

**Files:**
- Modify: `src/pages/index.astro`
- Create: `tests/e2e/homepage.spec.ts`

- [ ] **Step 1: Write the failing E2E test `tests/e2e/homepage.spec.ts`**

```ts
import { test, expect } from '@playwright/test';

test('homepage shows the brand and links to directory', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /foot morning america/i })).toBeVisible();
  await expect(page.getByRole('link', { name: /directory/i }).first()).toBeVisible();
});
```

- [ ] **Step 2: Write `src/pages/index.astro`**

```astro
---
import Base from '../layouts/Base.astro';
---
<Base title="Foot Morning America — Your #1 Source for Foot News">
  <section class="mx-auto max-w-4xl px-6 py-20 text-center">
    <p class="text-sm font-bold uppercase tracking-widest text-red-600">Live • Every Morning</p>
    <h1 class="mt-4 text-5xl font-black leading-tight">Foot Morning America</h1>
    <p class="mt-4 text-xl text-neutral-600">
      With your host, <strong>Footy</strong>. The nation's most trusted name in foot news,
      foot weather, and the people who make it happen.
    </p>
    <div class="mt-10 flex justify-center gap-4">
      <a href="/directory" class="rounded bg-black px-8 py-4 font-bold text-white">Browse the Directory</a>
      <a href="/get-featured" class="rounded border-2 border-black px-8 py-4 font-bold">Get Featured</a>
    </div>
  </section>
  <section class="mx-auto max-w-4xl px-6 pb-20">
    <h2 class="text-2xl font-black">This Morning's Segments</h2>
    <ul class="mt-4 grid gap-4 sm:grid-cols-3">
      <li class="rounded-lg border p-4"><strong>Footy's Forecast</strong><p class="text-sm text-neutral-500">Today: sunny with a high chance of sandals.</p></li>
      <li class="rounded-lg border p-4"><strong>Breaking Soles</strong><p class="text-sm text-neutral-500">Local woman discovers she has two feet.</p></li>
      <li class="rounded-lg border p-4"><strong>Creator of the Day</strong><p class="text-sm text-neutral-500">Featured from the directory.</p></li>
    </ul>
  </section>
</Base>
```

- [ ] **Step 3: Build and run the homepage test**

Run: `npm run build && npx playwright test tests/e2e/homepage.spec.ts`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: Footy homepage with brand hero + segments"
```

---

## Task 12: Full suite green + CI gate

**Files:**
- Create: `.github/workflows/ci.yml`

- [ ] **Step 1: Run the whole suite locally**

Run: `npm run check && npm test && npm run build && npx playwright test`
Expected: type check passes, all unit tests pass, build succeeds, all E2E pass.

- [ ] **Step 2: Write `.github/workflows/ci.yml`**

```yaml
name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    env:
      PUBLIC_SUPABASE_URL: ${{ secrets.PUBLIC_SUPABASE_URL }}
      PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.PUBLIC_SUPABASE_ANON_KEY }}
      SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: npm }
      - run: npm ci
      - run: npm run check
      - run: npm test
      - run: npx playwright install --with-deps chromium
      - run: npm run build
      - run: npx playwright test
```

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "ci: typecheck + unit + build + e2e gate"
```

---

## Task 13: Netlify deploy + rebuild-on-approval hook

**Files:**
- Create: `netlify.toml`

- [ ] **Step 1: Write `netlify.toml`**

```toml
[build]
  command = "npm run build"
  publish = "dist"

[build.environment]
  NODE_VERSION = "20"
```

- [ ] **Step 2: Connect the repo in Netlify and set env vars**

In the Netlify dashboard: add a new site from this git repo; set `PUBLIC_SUPABASE_URL`, `PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, and `PUBLIC_SITE_URL` under Site settings → Environment variables. Point the domain `footmorningamerica.com` at the site.

- [ ] **Step 3: Create a build hook for approvals**

In Netlify: Site settings → Build & deploy → Build hooks → create "approval-rebuild". After you flip a listing to `approved` in the Supabase dashboard, trigger this hook (manually for MVP, or via a Supabase Database Webhook later) to publish.

- [ ] **Step 4: Verify the live deploy**

Confirm the deployed site loads, the age gate works, and the seeded directory listing appears.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore: netlify build config"
```

---

## Pre-launch checklist (not code — gate before public launch)

- [ ] Replace `PLACEHOLDER_*` affiliate refs in `affiliate.config.ts` with real codes once accounts exist.
- [ ] One-time consult with adult-industry counsel re: linking-as-distribution under state AV laws (spec §6).
- [ ] **Vet the brand name + parody positioning** with the same counsel — "Foot Morning America" riffs on the famous "Good Morning America" mark; primary risk is trademark dilution/tarnishment (famous family-TV brand ↔ adult content). Mitigation already applied: no visual mimicry of GMA (logo/font/color stripes/initialisms), original Footy mascot, no taglines that literally echo GMA.
- [ ] Confirm adult-link content stays well under one-third of total site content (spec §6) — SFW `/news` posts are the buffer; keep them flowing.
- [ ] Verify FeetFinder/Fansly affiliate terms directly before relying on payout figures.

---

## Self-Review notes

- **Spec coverage:** Concept/brand (Task 11), directory (Tasks 7,9), submission + moderation pending-default (Tasks 6,7,10 + schema Task 4), affiliate links (Task 3, used in Task 9), age gate + legal (Task 8), stack Astro+Netlify+Supabase (Tasks 1,5,13), testing Vitest+Playwright TDD (throughout), legal rules surfaced in footer/2257 + pre-launch checklist. Display ads / paid placement / creator auth correctly deferred (Phase 2+, not in MVP tasks).
- **Type consistency:** `Platform`, `Listing`, `SubmissionInput`, `validateSubmission`, `getApprovedListings`, `insertPendingListing`, `buildCreatorUrl`, `buildPlatformSignupUrl` named consistently across tasks.
- **Moderation:** enforced two ways — RLS public-read-approved-only (Task 4) and `status: 'pending'` default on insert (Tasks 4,7).
