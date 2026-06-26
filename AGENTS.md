<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This project uses Next.js 16. APIs, conventions, and file structure may differ from older Next.js versions. Before writing or changing Next.js code, read the relevant guide in `node_modules/next/dist/docs/` and heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Codex Project Context

## Product

iEventer is an AI-powered event and activity discovery app built as a portfolio-grade project. It started as a short hackathon MVP and is now intended to show practical junior full-stack engineering ability: auth, persistence, deployment, testing, clean architecture, and a polished user flow.

Prioritize features that make the product clearer, more reliable, and more impressive to a hiring manager. Avoid flashy additions that do not improve the core product story.

## User Context

Mike is a junior full-stack web developer actively looking for developer roles. He values practical explanations, clean code, and portfolio-relevant improvements. When summarizing work, explain what changed and why in concrete terms.

## Stack

- Next.js 16 App Router, React 19, TypeScript
- Tailwind CSS v4, shadcn/ui-style primitives, lucide-react
- Auth.js / NextAuth v5 with Google OAuth, JWT sessions, Drizzle adapter
- Drizzle ORM with Supabase Postgres
- Gemini API for AI suggestions, route optimization, and daily-pick reasoning
- Eventbrite Destination Search API plus Nominatim geocoding
- Cloudflare Workers deployment through `@opennextjs/cloudflare`
- Vitest, React Testing Library, Playwright, GitHub Actions CI

## Important Architecture Notes

- Home is split between `src/app/page.tsx` server work and `src/app/HomeClient.tsx` client interactivity.
- Auth config is split:
  - `src/lib/auth.config.ts` is edge-safe Auth.js config.
  - `src/lib/auth.ts` includes the Drizzle adapter and full server-side auth.
- Production uses JWT sessions. Do not reintroduce database sessions unless the Cloudflare runtime constraints are deliberately revisited.
- `src/proxy.ts` was removed because Next.js 16 middleware/proxy constraints and OpenNext Cloudflare support made it unsuitable here. Keep auth gating in pages/server components unless current Next/OpenNext docs say otherwise.
- Event search endpoint is `/api/discover`, not `/api/events`, because `/api/events` was blocked by browser ad blockers in production.
- Plan data is persisted through `src/lib/plans.ts`; routes are cached on the plan row after optimization.
- Daily picks live in `src/lib/dailyPick.ts` and `/api/cron/daily-picks`; Cloudflare Cron wiring is still a follow-up.
- Gemini JSON parsing should go through `src/lib/parseAiJson.ts`, not raw `JSON.parse`.

## Current Product State

Working:
- Google sign-in and onboarding with interest selection.
- AI activity suggestions conditioned on profile data.
- Real Eventbrite events with filtering and pagination.
- Saved plans with optimistic add/remove, plan detail pages, and route optimization.
- Daily Surprise Pick with regenerate, dismiss, seen, and add-to-plan flows.
- Light/dark theme support.
- Cloudflare Workers deployment and GitHub Actions CI.

Primary roadmap:
- Phase 6: finish README/portfolio assets, screenshots, and golden-path GIF.
- Phase 7: multi-source event aggregation, likely Lu.ma and Ticketmaster, with a unified normalized event model.
- Phase 9: mobile and accessibility QA pass.

Deferred agenda to mention naturally when the user asks "what's next":
- Share Plan: public share link using existing `shareSlug` schema support.
- Browse Events / Categories / Saved nav links: only add when backed by real screens.
- Cloudflare Hyperdrive wiring: user previously planned to provide the Hyperdrive instance ID.
- Cloudflare Cron trigger for `/api/cron/daily-picks`.

## Commands

- `npm run dev` - local Next dev server
- `npm run lint` - ESLint
- `npm run test:run` - Vitest once
- `npm run test:e2e` - Playwright
- `npm run build` - production Next build
- `npm run cf:build` - OpenNext Cloudflare build
- `npm run cf:preview` - local Workers preview
- `npm run cf:deploy` - deploy to Cloudflare
- `npm run db:push` - push Drizzle schema
- `npm run db:seed` - seed interests from `.env.local`

Use the narrowest verification command that matches the change. For UI changes, prefer a browser/screenshot check when practical.

## Documentation Sources

- `README.md` has the public-facing product overview and setup guide.
- `CHANGELOG.md` has completed phases and the historical implementation record.
- `ROADMAP.md` has the next phases, deferred work, and idea backlog.
- `docs/DEPLOY.md` has Cloudflare deployment and OAuth troubleshooting.
- `docs/CODEX_MIGRATION.md` records the Claude-to-Codex migration.

## Secrets And Safety

- Do not put API keys, bearer tokens, OAuth secrets, database URLs, or Cloudflare credentials into agent memory or documentation.
- Claude's local settings contained command allow-list entries with a bearer token. Treat that as historical local state only; do not migrate it.
- Use `.env.local`, Cloudflare secrets, GitHub repository secrets, and provider dashboards for credentials.

## Collaboration Preferences

- Keep explanations practical and specific.
- Use Conventional Commits when the user asks to commit.
- Do not include tool/AI attribution such as "Claude wrote this" or "Codex wrote this" in commits, docs, or app copy.
- If changing Next.js behavior, cite the local Next.js 16 docs path that informed the change.
