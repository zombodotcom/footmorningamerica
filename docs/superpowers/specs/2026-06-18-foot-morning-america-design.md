# Foot Morning America — Design Spec

**Date:** 2026-06-18
**Domain:** footmorningamerica.com
**Status:** Approved design — ready for implementation planning

---

## 1. Concept

**Foot Morning America** is a free, funny, mascot-fronted foot-content **brand + creator directory**. It is a parody of "Good Morning America," anchored by a cartoon foot mascot named **Footy**.

It is **not** a paid site, and it **hosts no adult content**. It makes money by sending fans to creators (affiliate/referral commissions) and, later, by charging creators for featured placement.

### The three pillars

1. **The Brand** — Footy the mascot delivers absurd "foot news," daily bits, and parody segments. This content is mostly-SFW. It serves two purposes:
   - **Marketing:** shareable, screenshot-friendly content that drives free social + SEO traffic.
   - **Legal buffer:** mostly-SFW brand content keeps adult material well under the legal one-third-of-site threshold (see §6).
2. **The Directory** — a browsable/searchable list of foot-content creators, populated by **creator-submitted listings** (never scraped). Each listing links out to the creator's OnlyFans / FeetFinder / etc.
3. **The Money** — affiliate/referral links on outbound creator links and platform signups. Paid featured-listing upsell arrives in Phase 2.

### Audience priority

**Fans first, creators second.** The brand builds the audience; affiliate revenue follows the audience; charging creators for placement only works once the audience exists. (Validated by research — see §7.)

---

## 2. Monetization model (research-backed)

Priority order, lead with the first:

1. **Affiliate / referral — the foundation.**
   - OnlyFans referral: 5% of a referred creator's earnings for their first 12 months (capped $50k/creator). Per-referral payout is usually small → **value is in volume**, which a high-traffic directory generates.
   - FeetFinder: sellers pay a recurring $4.99–$14.99/mo subscription. Exact affiliate % is **unconfirmed** and must be verified directly before relying on figures.
   - Fansly and other foot marketplaces: evaluate referral terms during build.
2. **Paid / featured placement — Phase 2.** Creators pay to be featured once traffic is real. This is the "sponsors" idea and runs on the same moderation workflow as free listings.
3. **Display ads — supplement only.** Adult-adjacent traffic earns only ~$1.50 per 1,000 visits. A topping, not a foundation. Deferred past MVP.

---

## 3. MVP scope

The directory faces an empty-room problem (a directory with zero creators is dead on arrival), so v1 **leads with the brand** and seeds the directory via submissions.

**In scope for MVP:**

- **Homepage** — Footy mascot, "Foot Morning America" broadcast theme, a few funny segments. Built to be screenshot-and-shared.
- **"Get Featured" submission form** — creators submit handle, links, and a photo. Writes a `pending` listing to Supabase. This is also the future paid product.
- **Directory page** — displays `approved` creator listings (starts small, grows). Basic filter/search.
- **Affiliate link handling** — every outbound creator/platform link routed through a central affiliate-link builder so tags are consistent and auditable.
- **Age gate** — interstitial confirming 18+ before viewing the directory.
- **Legal footer + 2257-style statement** — cheap insurance, done from day one (see §6).
- **Moderation** — submissions land as `pending`; an admin approves via the Supabase dashboard before they go public. **Critical:** no unvetted adult link auto-publishes.

**Explicitly out of scope for MVP (Phase 2+):**

- Creator self-serve logins / accounts
- Paid featured-placement checkout
- Display ads
- Automated content ingestion of any kind (scraping is prohibited — see §6)

---

## 4. Architecture & components

**Stack:** Astro frontend hosted on **Netlify**; data, image storage, and (future) auth on **Supabase**; tests via **Vitest + Playwright** using **TDD**.

### Components (each one purpose, clear interface, independently testable)

| Component | Responsibility | Depends on |
|---|---|---|
| **Brand pages** (`/`, segments) | Static Footy/brand content | Astro content collections |
| **Directory page** (`/directory`) | Render `approved` listings; filter/search | Supabase read (listings) |
| **Submission form** (`/get-featured`) | Validate + write `pending` listing + upload photo | Supabase insert + Storage |
| **Affiliate-link builder** (lib) | Given a creator's platform + handle, return the correctly-tagged outbound URL | none (pure function) |
| **Age gate** (component) | Block directory access until 18+ confirmed; persist choice | browser storage |
| **Listing schema** (Supabase) | Source of truth for creator listings + moderation state | Supabase Postgres + RLS |
| **Legal pages** (footer, 2257 statement, terms) | Static compliance content | none |

### Data model (Supabase `listings` table — initial shape)

- `id` (uuid, pk)
- `display_name` (text)
- `platform` (enum: onlyfans | feetfinder | fansly | other)
- `handle` (text)
- `outbound_url` (text — raw; affiliate tagging applied at render by the builder)
- `photo_path` (text — Supabase Storage path)
- `bio` (text, short)
- `status` (enum: pending | approved | rejected) — **default `pending`**
- `created_at` (timestamptz)

**RLS:** public can read only `status = approved`; inserts allowed for submissions (anon, rate-limited) but capped to `status = pending`; only admin can read/flip `pending`/`rejected`. (Schema is intentionally shaped to mirror a clean future creator-accounts model.)

### Render strategy

Directory data comes from Supabase. Default to **mostly-static** (build-time fetch of approved listings) with a Netlify deploy hook fired on approval, so the public site stays fast and cheap. Revisit on-demand/SSR for live search if volume demands it. Final render mode is decided in the implementation plan.

### Data flow

1. Creator submits form → photo uploads to Supabase Storage, row inserted as `pending`.
2. Admin reviews in Supabase dashboard → flips to `approved` (or `rejected`).
3. Approval triggers a Netlify rebuild → approved listing appears in the directory.
4. Fan clicks a listing → affiliate-link builder produces the tagged outbound URL → fan lands on the creator's platform.

---

## 5. Testing strategy (TDD throughout)

Write the test first, then the code — especially for the affiliate logic and age gate, where bugs mean lost money or legal risk.

- **Vitest** — unit/component tests:
  - Affiliate-link builder (correct tags per platform; rejects malformed input) — highest priority.
  - Submission-form validation (required fields, URL/handle sanity, photo constraints).
  - Directory rendering logic (only `approved` shown; filter/search correctness).
- **Playwright** — end-to-end:
  - Homepage loads and renders Footy/brand.
  - Age gate blocks the directory until confirmed, and persists.
  - Submission form submits and lands a `pending` row (against a test Supabase project).
  - Directory renders approved listings; outbound links carry affiliate tags.
- **Astro `check` + TypeScript** — typed content collections and Supabase types so malformed data fails the build, not production.
- **Link check in CI** — catches broken outbound/affiliate links.
- **CI gate** — all tests + type check + link check must pass before Netlify deploys.

---

## 6. Legal & compliance

Research finding (high confidence, primary sources): a site that **only links** to adult content and **never hosts it**:

- Is **outside 18 USC 2257** record-keeping — those obligations attach to producers/hosts who insert or manage explicit content, not to linkers.
- Falls **below the "one-third adult content" threshold** of the 25+ state age-verification laws (Texas/Louisiana-style, upheld by SCOTUS in *Free Speech Coalition v. Paxton*, June 2025) — **provided adult material stays well under one-third of total site content.** Footy's mostly-SFW brand content is what keeps us under that line.

**Hard rules baked into the design:**

1. **Never host adult content.** Link out only.
2. **Never scrape** OnlyFans or other platforms (ToS-prohibited). Listings are **creator-submitted and manually moderated** only.
3. **Keep adult material well under one-third** of total site content (brand content is the buffer).
4. **Age gate + legal footer + 2257-style statement** present from launch as belt-and-suspenders.
5. **Open legal question:** whether "linking" counts as "distributing" under state AV statutes is legally unsettled. **Action:** a one-time consult with adult-industry counsel before public launch. Not a blocker for building; a gate before going live.

---

## 7. Traffic strategy

Footy is the marketing. The mascot posts the bits across:

- **X/Twitter, Reddit** — allow the spicier funnel; primary adult-adjacent reach.
- **TikTok, Instagram** — kept SFW (mascot-safe) to stay within platform rules; top-of-funnel brand awareness.
- **SEO** — brand content + creator names build organic Google traffic over time.

The faceless Footy mascot means no personal exposure and a fully brandable, shareable identity.

---

## 8. Competitive validation

Free creator-discovery directories operate at scale, confirming the audience:

- **OnlyFinder** — Google-style OnlyFans search engine, 4M+ profiles indexed.
- **OnlySearch** — 2M+ profiles.
- **FanClubOnly** — same playbook; founder confirms directories monetize via "paid placement, premium tiers, or affiliate commissions on signups."

Note: specific competitor *revenue* figures (e.g. a claimed OnlyFinder $500k/yr) failed fact-checking and are unverified. Audience scale is confirmed; exact competitor earnings are not.

---

## 9. Phasing

- **Phase 1 (MVP):** brand homepage, Footy, submission form → Supabase, moderated directory, affiliate links, age gate, legal pages. Astro + Netlify + Supabase. Full test suite. Legal consult before public launch.
- **Phase 2:** paid featured placement (creator pays for a boosted slot), creator self-serve accounts (Supabase Auth), richer directory search.
- **Phase 3:** display ads (adult-friendly network) as a supplement; evaluate additional affiliate programs; scale traffic.

---

## 10. Open questions (carry into planning / pre-launch)

1. Exact, current FeetFinder (and other foot marketplace) affiliate commission terms — verify directly before relying on numbers.
2. Does linking = "distributing" under Texas/Louisiana-style AV laws? Resolve with counsel before public launch.
3. Realistic RPM for foot-themed *adult-adjacent* traffic vs. hardcore adult traffic — only generic Tier-1 figures are verified. Affects whether/when ads are worth it.
4. Sponsored-placement price points creators will actually pay, and the traffic volume at which paid placement out-earns affiliate referrals.
