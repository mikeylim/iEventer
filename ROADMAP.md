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

## 📸 Phase 6 — README polish + portfolio assets (in progress — pending screenshots)

**Goal:** Make the GitHub repo presentation-ready for recruiters. Live URL is up; now make the project visible at a glance.

**Tasks:**
- [x] Live demo link pinned at the top
- [x] Update tech-stack section to reflect post-redesign state
- [x] Architecture diagram (Mermaid; renders on GitHub natively)
- [x] Project structure + design philosophy sections
- [ ] Capture screenshots into `docs/screenshots/` (see that folder's README for spec)
  - [x] `home-light.png`
  - [ ] `home-dark.png`
  - [x] `onboarding.png`
  - [x] `plan-detail.png`
  - [ ] `signin.png`
- [ ] Record `golden-path.gif` (30 sec, ≤ 8 MB) — sign in → daily pick → search → add to plan → optimize route
- [x] Add build-status badge (after Phase 8 CI is in place)

**Estimated:** ~1 hour

---

## ✅ Phase 7 — Context-Aware Outing Discovery (DONE 2026-09-23)

**Goal:** Expand beyond event-only search without turning iEventer into an unfocused directory.

**Tasks shipped:**
- [x] Make destination and outing date request-specific; profile location is prefill only
- [x] Define a unified `DiscoveryItem` model for events, places, and food/drink
- [x] Retrieve real attractions, parks, restaurants, and cafes from Geoapify
- [x] Retrieve Open-Meteo forecasts and rank indoor/outdoor places against conditions
- [x] Add All / Events / Places / Food & Drink result views
- [x] Reuse saved plans and route optimization for every discovery type
- [x] Keep event pagination isolated so it does not spend place/weather API quota

**Next discovery follow-up:** Ground Gemini ranking against retrieved candidate IDs, then evaluate recommendation relevance before adding another listing provider.

---

## ✅ Phase 8 — Tests + CI (DONE 2026-05-09)

34 unit/component tests passing across 5 files, Playwright smoke tests covering anonymous home, GitHub Actions CI runs lint → typecheck → tests → build on every push and PR. See [CHANGELOG.md](./CHANGELOG.md) for the full write-up.

**Tasks shipped:**
- [x] Vitest + React Testing Library + jsdom configured
- [x] Unit tests: `parseAiJson`, `formatEventDate`, event filters (with injectable `now`)
- [x] Component tests: `EventCard`, `AISuggestionCard`
- [x] Playwright smoke tests covering anonymous home (hero, sign-in CTA, submit-button enabling)
- [x] GitHub Actions workflow (`.github/workflows/ci.yml`)
- [x] CI badge in README

**Not shipped (deliberately):**
- DailyPickCard tests — depends on server actions; would require non-trivial mocking
- Full golden-path Playwright (sign in → onboarding → ...) — needs auth + DB mocking; manual QA covers this for now

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

## ✅ Phase 10 — AI Contracts + Reliability (DONE 2026-09-04)

**Goal:** Make AI behavior bounded, observable, and defensible instead of relying on prompt wording alone.

**Tasks shipped:**
- [x] Replace the legacy `@google/generative-ai` package with the maintained `@google/genai` SDK
- [x] Centralize Gemini model selection, request timeout, retry policy, prompt versions, and token-usage logging
- [x] Validate suggestion, route, and Daily Pick inputs and outputs with Zod runtime contracts
- [x] Send response JSON Schema to Gemini and reject malformed, incomplete, duplicate, or hallucinated results
- [x] Separate untrusted user/event data from system instructions to reduce prompt-injection risk
- [x] Sanitize parser and request failures so raw model output is not written to application logs
- [x] Add route-handler and contract regression tests (53 tests across 8 files total)

**Next AI follow-up:** Build a small versioned evaluation dataset and scoring script for recommendation relevance, constraint adherence, and route completeness.

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
