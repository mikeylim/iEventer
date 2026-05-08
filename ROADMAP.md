# Roadmap

What's next for iEventer, ordered by portfolio impact. See [CHANGELOG.md](./CHANGELOG.md) for completed work.

---

## ✅ Phase 5 — Cloudflare Workers Deploy (DONE 2026-05-05)

Live at [ieventer.mikedohyunlim.workers.dev](https://ieventer.mikedohyunlim.workers.dev). See [CHANGELOG.md](./CHANGELOG.md) for the full write-up.

**Still on the followup list:**
- [ ] Wire up Cloudflare Cron Trigger to call `/api/cron/daily-picks` daily (currently lazy-only — fires when a signed-in user visits home)
- [ ] Optional: custom domain ($10/yr)
- [ ] Smoke-test on a fresh browser/device + production flows

---

## 🚀 Next: Phase 6 — README polish + portfolio assets

**Goal:** Make the GitHub repo presentation-ready for recruiters. Live URL is up; now make the project visible at a glance.

**Tasks:**
- [x] Live demo link pinned at the top
- [x] Update tech-stack section to reflect post-redesign state
- [x] Architecture diagram (Mermaid; renders on GitHub natively)
- [x] Project structure + design philosophy sections
- [ ] Capture screenshots into `docs/screenshots/` (see that folder's README for spec)
  - [ ] `home-light.png`
  - [ ] `home-dark.png`
  - [ ] `onboarding.png`
  - [ ] `plan-detail.png`
  - [ ] `signin.png`
- [ ] Record `golden-path.gif` (30 sec, ≤ 8 MB) — sign in → daily pick → search → add to plan → optimize route
- [ ] Add build-status badge (after Phase 8 CI is in place)

**Estimated:** ~1 hour

---

## 🌐 Phase 7 — Multi-source Event Aggregation (Option C)

**Goal:** Live up to the value prop ("aggregate events from multiple sources").

**Tasks:**
- [ ] Add **Lu.ma API** integration (tech meetups, hackathons)
- [ ] Add **Ticketmaster Discovery API** (concerts, sports, big shows)
- [ ] Define unified `NormalizedEvent` interface across sources (already started in `src/lib/eventbrite.ts`)
- [ ] Parallel-fetch all sources, dedupe by name + date + venue
- [ ] Add source provider badge on event cards
- [ ] Update `/api/events` to query all sources and merge results

**Estimated:** 1–2 days

---

## 🧪 Phase 8 — Tests + CI

**Goal:** Engineering signal for recruiters — most junior portfolios have zero tests.

**Tasks:**
- [ ] **Vitest** + React Testing Library on key components: `EventCard`, `AISuggestionCard`, `DailyPickCard`
- [ ] Unit tests for `parseAiJson`, `formatEventDate`, plan filter helpers
- [ ] **Playwright** smoke test for the golden path (sign in → onboarding → search → add to plan → optimize)
- [ ] **GitHub Actions** workflow: lint → type-check → test on every PR
- [ ] Status badge in README

**Estimated:** ~1 day

---

## 📱 Phase 9 — Mobile / Accessibility QA Pass

**Goal:** Fix the rough edges that always exist after a desktop-first redesign.

**Tasks:**
- [ ] Walk through every screen at mobile widths (375px, 414px, 768px)
- [ ] Verify keyboard navigation across forms and dropdowns
- [ ] Check focus states on all interactive elements
- [ ] Verify color contrast (WCAG AA) in light + dark modes
- [ ] Add `aria-label`s to icon-only buttons
- [ ] Test screen-reader announcements on form errors

**Estimated:** ~2 hours

---

## 📌 Deferred (in agenda — bring up at natural revisit points)

These were explicitly deferred during design review on **2026-04-27**:

- [ ] **"Share Plan"** — public share link with `shareSlug` (schema already has the column ready)
- [ ] **"Browse Events" / "Categories" / "Saved" nav links** — design proposed these but they don't have real screens yet

---

## 💡 Idea backlog (lower priority, not yet committed to)

Things that came up in earlier design conversations but aren't in scope yet:

- **Hobby Explorer** — "Try a hobby" engine separate from events ("Based on you, try: bouldering, pottery, urban sketching")
- **Social plans** — invite a friend, RSVP/vote on options
- **"Did you go?" journal** — post-event prompt, builds attendance history + streak
- **Event prep sheets** — for tech meetups, AI-generates speaker bios + conversation starters
- **City guides** — auto-generated travel itineraries
- **Map view** for events (Mapbox / Leaflet)
- **Weekly digest email** (Resend) every Sunday with the week ahead
- **Semantic search via pgvector** — embed events + interests for "find me something chill" matches
