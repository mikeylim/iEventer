# Changelog

All notable changes to iEventer are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

---

## [Phase 5 — Cloudflare Workers Deploy] — 2026-05-05

### Added
- 🌐 **Live deployment:** [ieventer.mikedohyunlim.workers.dev](https://ieventer.mikedohyunlim.workers.dev)
- `@opennextjs/cloudflare` adapter + `wrangler` dev dependency
- `wrangler.jsonc` Workers config with `nodejs_compat` flag (required for postgres-js TCP)
- `open-next.config.ts` adapter config
- `cf:build`, `cf:preview`, `cf:deploy`, `cf:upload` package scripts
- `src/lib/auth.config.ts` — edge-safe Auth.js config used by middleware-equivalent paths
- `docs/DEPLOY.md` — full Cloudflare deploy walkthrough with secrets, OAuth setup, troubleshooting

### Changed
- **Auth session strategy: `database` → `jwt`.** Database sessions can't be validated on edge runtime without per-request Postgres lookups. Auth.js v5 still uses the Drizzle adapter for OAuth user/account persistence on first sign-in; sessions themselves are now stateless JWT cookies.
- Split Auth.js config into `auth.config.ts` (edge-safe, no DB) + `auth.ts` (full, with Drizzle adapter) per the official Auth.js v5 pattern
- `jwt` and `session` callbacks now propagate `user.id` so server actions and components keep getting `session.user.id`
- `.gitignore` excludes `.open-next/` and `.wrangler/` build artifacts

### Removed
- `src/proxy.ts` — Next.js 16 forces middleware to Node.js runtime, but OpenNext for Cloudflare doesn't support Node middleware on Workers. Auth gating that the proxy handled is now per-page in server components (which we already had everywhere). Sign-in page's "redirect signed-in users away" check moved to the page itself.

### Fixed
- `/api/events` was getting blocked by ad blockers (uBlock, Brave Shields) in production with `ERR_BLOCKED_BY_CLIENT` — the path matched generic analytics-endpoint filter rules. **Renamed to `/api/discover`**. Localhost was unaffected because most blockers exempt it from filtering.

---

## [Phase 4 — UI Redesign + Reliability] — 2026-04-30

### Added
- **Design system overhaul:** new teal `#35858E` + sage `#7DA78C` + cream `#FAFBF8` palette
- **Light + dark mode** via `next-themes` with system preference detection
- **Typography:** Playfair Display (display) + Inter (body) via `next/font/google`
- **shadcn/ui primitives** — Button, Input, Textarea, Badge, Tabs, Avatar, DropdownMenu, Skeleton
- `cn()` helper in `src/lib/utils.ts` (clsx + tailwind-merge)
- Sticky top nav (logo, theme toggle, avatar dropdown menu) replacing the old colored hero banner
- Avatar dropdown with My Plans / Profile / Sign out
- New components: `EventCard`, `AISuggestionCard`, `RouteTimelineNode`, `DailyPickCard`, `ThemeProvider`, `ThemeToggle`, `PlanDescriptionForm`
- Inline editable description on plan detail page (hover-to-edit pencil)
- Shared `parseAiJson()` helper in `src/lib/parseAiJson.ts` — strips code fences, fixes trailing commas, escapes control chars in strings, logs raw output on hard parse failure
- Optional `description` column on `plan` table

### Changed
- **Sign-in:** centered card with blurred background blobs + 3-icon feature highlights
- **Onboarding:** collapsible interest categories, per-category selected count, X/3 counter badge, sticky bottom continue bar
- **Home:** wider container `max-w-7xl`, 2-col AI suggestions, 3-col events grid, gradient plan panel, redesigned filter bar
- **DailyPickCard:** cinematic 21:9 hero image, floating "Today's Surprise Pick" chip, italic AI-reason pull quote
- **/plans:** 3-col plan card grid with description preview
- **/plans/[id]:** image-thumbnail event rows + travel-time ribbon between events
- All 3 Gemini callers (`/api/suggest`, `/api/optimize-route`, `lib/dailyPick`) switched from `gemini-2.0-flash` → `gemini-2.5-flash-lite`
- All 3 Gemini callers now request `responseMimeType: "application/json"` for strict JSON output
- All 3 Gemini callers use `parseAiJson()` instead of inline JSON.parse + regex cleanup
- Excluded `design-ref/` from `tsconfig.json`

### Fixed
- Misleading "Check your Gemini API key" error message — replaced with `friendlyGeminiError()` that surfaces real reasons: rate limit, network, auth, model permission
- Frequent JSON parse failures from Gemini malformed output (unescaped quotes, trailing commas, markdown wrapping)

---

## [Phase 3 — Surprise Me Daily Pick] — 2026-04-26

### Added
- `daily_pick` table with unique index on `(userId, pickDate)` and `dismissedAt` column
- Daily-pick generation engine in `src/lib/dailyPick.ts`:
  - Deterministic interest rotation (day-of-year hash mod number-of-interests)
  - 30-day exclusion of recently-picked events
  - Two-stage AI: Eventbrite search → Gemini picks best candidate + writes personalized 1–2 sentence reason in second person ("You")
  - Atomic upsert by `(userId, pickDate)` for regeneration
- Helpers: `getTodaysPick`, `markPickSeen`, `dismissPick`, `listRecentPicks`
- `POST /api/cron/daily-picks` endpoint protected by `CRON_SECRET` for Cloudflare Cron Triggers (uses `Promise.allSettled` over onboarded users)
- Server actions: `regenerateTodaysPick`, `markPickSeen`, `dismissPick`
- `DailyPickCard` UI on home page with View / Add to Plan / Try Another / Dismiss actions
- Auto-marks `seenAt` on mount; lazy generation on home-page load as dev fallback
- Extracted reusable `searchEventbrite()` lib (`src/lib/eventbrite.ts`) shared by daily pick generator and `/api/events`

### Fixed
- Stale plan after sign-out (3 layers of defense: `force-dynamic` on home page, `key` prop on `HomeClient`, `revalidatePath` + hard redirect on sign-out)
- Unreadable ISO timestamp in plan panel — new `formatEventDate()` helper using `toLocaleString`
- Optimize-route now pre-formats dates before sending to Gemini and explicitly forbids ISO timestamps in output

---

## [Phase 1.5 — Personalization + Plan Persistence] — 2026-04-23

### Added
- `getSessionProfile()` helper fetches user + profile + interests in one query
- `summarizeProfile()` builds Gemini-ready natural-language summary
- Plan server actions in `src/lib/plans.ts`: `getOrCreateCurrentPlan`, `addEventToPlan`, `removeEventFromPlan`, `renamePlan`, `deletePlan`, `createNewPlan`, `saveOptimizedRoute`, `listUserPlans`, `getPlanWithEvents`
- `/plans` page listing all user plans with event counts and delete
- `/plans/[id]` detail page with read-only event list and "Edit this plan →" CTA that touches `updatedAt` and redirects to `/`
- "My Plans" link in top nav for signed-in users
- Optimistic plan add/remove with rollback on failure
- Optimized routes cached on `plan` row to avoid re-calling Gemini after refresh

### Changed
- Refactored home page from pure client into server (`page.tsx`) + client (`HomeClient.tsx`) split
- `/api/suggest` and `/api/optimize-route` now enriched with user profile when signed in
- Optimize-route auto-fills starting location from profile if not sent
- Removed deprecated `baseUrl` from `tsconfig.json`

---

## [Phase 1 — Auth + Database + Onboarding] — 2026-04-22

### Added
- **Drizzle ORM** with Supabase Postgres (transaction pooler)
- Database schema: NextAuth tables (`user`, `account`, `session`, `verificationToken`) + app tables (`profile`, `interest`, `user_interest`, `plan`, `plan_event`, `journal_entry`, `daily_pick`)
- **NextAuth v5** with Google OAuth and Drizzle adapter, database session strategy
- Route protection via Next.js 16 `proxy.ts`
- `/auth/signin` page with branded Google sign-in button
- `/onboarding` flow with 45 interests across 12 categories (Tech, Fitness, Creative, Food, Music, Outdoors, Learning, Social, Wellness, Nightlife, Family, Culture)
- Top nav `UserNav` with sign-in/out
- Database scripts: `db:push`, `db:generate`, `db:migrate`, `db:studio`, `db:seed`
- `.env.example` with all required env vars and provider links
- `README.md` with setup instructions and tech stack

---

## [MVP — Hackathon Build] — 2026-04-08

### Added
- AI-powered activity suggestions via **Google Gemini 2.0 Flash**
- Dual input modes: free-text prompt or interactive option selectors (mood, companions, budget, vibes)
- **Eventbrite Destination Search API** integration with point-radius geocoding (Nominatim)
- Real event cards with images via Eventbrite Media API
- Multi-event plan with "Add to Plan" flow
- AI route optimizer (Gemini) for multi-event itinerary planning
- Event filtering by date (today / tomorrow / weekend / week), price (free / paid), and dynamic category
- Infinite-scroll pagination using Eventbrite continuation tokens
- "Show Me More Ideas" — additional Gemini suggestions excluding already-shown
- Auto-scroll to events section after Gemini generates suggestions

### Stack
- Next.js 16 (App Router) + TypeScript + Tailwind CSS v4
