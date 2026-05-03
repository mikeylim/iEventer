# Roadmap

What's next for iEventer, ordered by portfolio impact. See [CHANGELOG.md](./CHANGELOG.md) for completed work.

---

## 🚀 Next: Phase 5 — Cloudflare Pages Deploy

**Goal:** Get a live URL on the resume. Single biggest portfolio multiplier.

**Tasks:**
- [ ] Create Cloudflare Pages project, connect GitHub repo
- [ ] Configure `@opennextjs/cloudflare` adapter
- [ ] Add prod env vars in Cloudflare dashboard (`DATABASE_URL`, `AUTH_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GEMINI_API_KEY`, `EVENTBRITE_API_KEY`, `CRON_SECRET`)
- [ ] Add prod redirect URI to Google OAuth (`https://<prod-domain>/api/auth/callback/google`)
- [ ] Update `NEXTAUTH_URL` for prod
- [ ] Wire up Cloudflare Cron Trigger to hit `/api/cron/daily-picks` daily
- [ ] Smoke-test the live deployment (sign in, onboarding, daily pick, plan flow)
- [ ] Optional: custom domain ($10/yr)

**Estimated:** ~half day

---

## 📚 Phase 6 — README polish + portfolio assets

**Goal:** Make the GitHub repo presentation-ready for recruiters.

**Tasks:**
- [ ] Add screenshots of: Home with daily pick, Onboarding, /plans, Plan detail (light + dark)
- [ ] Record a 30-second demo GIF showing the golden path (sign in → daily pick → search → plan → optimize)
- [ ] Update tech-stack section in README to reflect post-redesign state
- [ ] Add architecture diagram (auth flow + DB schema overview)
- [ ] Pin live demo link at the top
- [ ] Add badges: build status (after CI), license, tech stack

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
