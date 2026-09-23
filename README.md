# iEventer

> **Turn a mood, destination, and date into a practical outing.**

An AI-assisted outing planner that combines creative activity ideas with verified events, places, restaurants, cafes, and destination-specific weather. A saved home location can prefill the form, but every search has its own destination so a user can live in North York and plan an afternoon downtown.

🌐 **[Live demo →](https://ieventer.mikedohyunlim.workers.dev)** &nbsp;·&nbsp;
📜 [Changelog](./CHANGELOG.md) &nbsp;·&nbsp;
🗺️ [Roadmap](./ROADMAP.md) &nbsp;·&nbsp;
🚀 [Deploy guide](./docs/DEPLOY.md)

[![CI](https://github.com/mikeylim/iEventer/actions/workflows/ci.yml/badge.svg)](https://github.com/mikeylim/iEventer/actions/workflows/ci.yml)
![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38bdf8?logo=tailwindcss)
![Drizzle ORM](https://img.shields.io/badge/Drizzle-ORM-green)
![Auth.js](https://img.shields.io/badge/Auth.js-v5-purple)
![Cloudflare Workers](https://img.shields.io/badge/Cloudflare-Workers-orange?logo=cloudflare)
![Gemini](https://img.shields.io/badge/Google-Gemini-4285F4?logo=google)

---

<p align="center">
  <img src="./docs/screenshots/home-light.png" alt="Home with daily surprise pick (light mode)" width="48%" />
  <img src="./docs/screenshots/onboarding.png" alt="Onboarding flow with AI-generated contents" width="40%" />
  <img src="./docs/screenshots/plan-detail.png" alt="A plan detail page with 3+ events showing image thumbs and the travel-time ribbon" width="48%" />
</p>

---

## ✨ Why iEventer?

- **It knows you.** Onboarding maps you to 3+ of 45 interests across 12 categories, then every Gemini prompt and event pick is conditioned on your profile.
- **One curated pick a day.** "Today's Surprise Pick" picks one event each day for you, with a personalized AI explanation of why. Built to fight decision paralysis.
- **Multi-event plans, optimized.** Add multiple events to a plan, then let Gemini compute the best route, travel tips between stops, and an estimated time + cost.
- **One request, grounded options.** Gemini generates creative activity ideas while Eventbrite and Geoapify supply listings the user can actually open and save.
- **Destination and weather aware.** Every search accepts its own meeting location and date; Open-Meteo context prioritizes suitable indoor or outdoor stops.

## ✅ What's working today

- **Auth** — Google OAuth via Auth.js v5, JWT sessions (edge-compatible), Drizzle adapter for user persistence
- **Onboarding** — interactive interest selection, location capture, sticky bottom continue bar
- **AI suggestions** — Gemini 3.5 Flash Lite through the maintained `@google/genai` SDK, with JSON Schema output, Zod validation, bounded inputs, retries, timeouts, and token-usage logging
- **Verified discovery** — Eventbrite events plus Geoapify places, restaurants, and cafes in All / Events / Places / Food & Drink views
- **Weather context** — Open-Meteo forecast for the selected destination and date, with deterministic indoor/outdoor ranking
- **Plans** — persisted in Postgres, optimistic add/remove with rollback, AI-cached optimized routes
- **Daily surprise pick** — deterministic interest rotation by day-of-year, 30-day exclusion of recently-picked events, regenerate / dismiss / add-to-plan actions
- **Light + dark mode** with `next-themes`, system preference detection
- **Production deploy** — Cloudflare Workers via `@opennextjs/cloudflare`

## 🧱 Tech Stack

| Layer | Tools |
|-------|-------|
| **Frontend** | Next.js 16 (App Router) · TypeScript · Tailwind CSS v4 · shadcn/ui · React Hook Form · Zod |
| **Backend** | Next.js Server Actions · Drizzle ORM · PostgreSQL (Supabase) |
| **Auth** | Auth.js (NextAuth) v5 with Google OAuth · JWT sessions · Drizzle adapter |
| **AI** | Google Gemini Flash Lite with structured JSON responses |
| **External APIs** | Eventbrite Destination Search · Geoapify Places/geocoding · Open-Meteo weather · Nominatim geocoding fallback |
| **Hosting** | Cloudflare Workers via `@opennextjs/cloudflare` |
| **Theming** | `next-themes` (light/dark/system), Playfair Display + Inter via `next/font` |

## 🏗️ Architecture

```mermaid
flowchart LR
  Browser[Browser]

  subgraph CF[Cloudflare Workers]
    NextApp[Next.js 16 App Router<br/>OpenNext bundle]
  end

  subgraph Auth[Auth.js v5]
    Google[Google OAuth]
    JWT[JWT Session<br/>edge-safe]
  end

  Supabase[(Supabase Postgres<br/>users · profiles · plans<br/>events · daily_picks)]
  Gemini[Google Gemini Flash Lite]
  Eventbrite[Eventbrite API]
  Geoapify[Geoapify Places]
  Weather[Open-Meteo Forecast]
  Nominatim[Nominatim Geocoding]

  Browser -->|HTTPS| NextApp
  NextApp -->|"sign-in"| Google
  Google -->|callback| JWT
  JWT -->|cookie| Browser

  NextApp -->|Drizzle ORM| Supabase
  NextApp -->|generateContent| Gemini
  NextApp -->|destination search| Eventbrite
  NextApp -->|place search + geocode| Geoapify
  NextApp -->|forecast by coordinates| Weather
  NextApp -->|geocode fallback| Nominatim
```

## 📁 Project structure

```
src/
├── app/
│   ├── api/
│   │   ├── auth/[...nextauth]/   # Auth.js handlers
│   │   ├── cron/daily-picks/     # Daily-pick generation endpoint (CRON_SECRET protected)
│   │   ├── discover/             # Unified event, place, food, and weather retrieval
│   │   ├── optimize-route/       # Gemini multi-event route optimizer
│   │   └── suggest/              # Gemini activity suggestions
│   ├── auth/signin/              # Sign-in page
│   ├── onboarding/               # First-time user flow
│   ├── plans/                    # Saved plans list and detail
│   ├── HomeClient.tsx            # Main discovery UI (client island)
│   └── page.tsx                  # Server-rendered home (fetches session + current plan + daily pick)
├── components/
│   ├── ui/                       # shadcn/ui primitives (Button, Tabs, Avatar, etc.)
│   ├── DailyPickCard.tsx         # Cinematic 21:9 hero
│   ├── EventCard.tsx
│   ├── PlaceCard.tsx
│   ├── WeatherContext.tsx
│   ├── AISuggestionCard.tsx
│   ├── RouteTimelineNode.tsx
│   ├── ThemeProvider.tsx
│   ├── ThemeToggle.tsx
│   └── UserNav.tsx
├── db/
│   ├── client.ts                 # Drizzle/postgres-js client
│   ├── schema.ts                 # 11-table schema
│   └── seed.ts                   # 45 interests across 12 categories
├── lib/
│   ├── ai/                       # Shared Gemini client, runtime contracts, and response invariants
│   ├── auth.config.ts            # Edge-safe Auth.js config (JWT)
│   ├── auth.ts                   # Full server-side auth (with Drizzle adapter)
│   ├── dailyPick.ts              # Daily-pick generation logic
│   ├── discovery.ts              # Unified result model + weather-aware ranking
│   ├── eventbrite.ts             # Eventbrite normalization
│   ├── geoapify.ts               # Place and food retrieval
│   ├── location.ts               # Request-specific destination geocoding
│   ├── weather.ts                # Open-Meteo forecast normalization
│   ├── parseAiJson.ts            # Hardened Gemini JSON parser
│   ├── plans.ts                  # Plan server actions (CRUD + optimistic updates)
│   ├── session.ts                # getSessionProfile() — user + interests + profile in one query
│   └── interests.ts              # Interest seed data
└── ...
```

## 🚀 Run locally

### 1. Clone & install

```bash
git clone https://github.com/mikeylim/iEventer.git
cd iEventer
npm install
```

### 2. Create accounts (all have free tiers)

- **[Supabase](https://supabase.com/dashboard)** — Postgres database
- **[Google Cloud Console](https://console.cloud.google.com/)** — OAuth client credentials
- **[Google AI Studio](https://aistudio.google.com/apikey)** — Gemini API key
- **[Eventbrite](https://www.eventbrite.com/platform/api-keys)** — private API token
- **[Geoapify](https://myprojects.geoapify.com/)** — Places and geocoding API key

### 3. Configure environment variables

```bash
cp .env.example .env.local
```

Fill in every key — see `.env.example` for inline help and links.

### 4. Initialize the database

```bash
npm run db:push   # apply schema to Supabase
npm run db:seed   # seed the 45 interests
```

### 5. Start the dev server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000).

> **Deploy to Cloudflare Workers:** see [docs/DEPLOY.md](./docs/DEPLOY.md).

## 📜 Available scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Next.js dev server |
| `npm run build` | Production build (Node target) |
| `npm run test` | Vitest in watch mode |
| `npm run test:run` | Vitest single run (CI mode) |
| `npm run test:e2e` | Playwright end-to-end tests |
| `npm run lint` | ESLint |
| `npm run audit:prod` | Fail on high or critical production dependency advisories |
| `npm run cf:build` | Build for Cloudflare Workers (via OpenNext) |
| `npm run cf:preview` | Preview the Workers build locally |
| `npm run cf:deploy` | Deploy to Cloudflare |
| `npm run db:push` | Push schema to Postgres |
| `npm run db:generate` | Generate a migration file |
| `npm run db:studio` | Open Drizzle Studio |
| `npm run db:seed` | Seed the interests table |

## 🧭 Design philosophy

The app intentionally avoids the patterns of Eventbrite (transactional, ticket-marketplace feel) and Meetup (static group directory). Instead:

- **Two input modes** — free-text ("I'm bored on a Saturday with no money") OR pill selectors (mood / companions / budget / vibes). Mood matters more than keywords.
- **Retrieval before generation.** AI suggests possible activities; provider APIs supply verifiable events and venues. Weather ranking is deterministic and inspectable.
- **The destination belongs to the outing.** A profile location is only a convenient default and never restricts where the user can plan.
- **Plans are first-class.** Events, attractions, restaurants, and cafes can share one saved route that users can revisit and optimize.
- **Daily ritual.** The Surprise Pick gives users a reason to come back daily.

## 📂 Project history & next steps

- 📜 [**CHANGELOG.md**](./CHANGELOG.md) — every phase shipped, dated and detailed
- 🗺️ [**ROADMAP.md**](./ROADMAP.md) — what's next, deferred features, idea backlog
- 🚀 [**docs/DEPLOY.md**](./docs/DEPLOY.md) — Cloudflare deployment walkthrough

## 📝 License

MIT
