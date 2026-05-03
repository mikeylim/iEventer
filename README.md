# 🎉 iEventer

An AI-powered event and activity finder that helps you discover what to do based on your mood, interests, and location. Combines Google Gemini for personalized recommendations with real events from Eventbrite, Lu.ma, and Ticketmaster.

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38bdf8?logo=tailwindcss)
![Drizzle ORM](https://img.shields.io/badge/Drizzle-ORM-green)
![NextAuth](https://img.shields.io/badge/NextAuth-v5-purple)

## Features

- **AI-powered suggestions** — Gemini generates personalized activity ideas with step-by-step how-tos, cost estimates, and locations
- **Dual input modes** — Free-text prompts ("I'm bored on a Saturday") or interactive option selectors (mood, budget, companions)
- **Real events integration** — Search live events from Eventbrite with location-aware filtering
- **Smart filtering** — Filter by when (today, tomorrow, weekend), price (free/paid), and category
- **Multi-event planning** — Add events to a plan, then let AI optimize the best route and order
- **Personalized profiles** — Interest-based onboarding for tailored recommendations
- **Google OAuth** — Secure sign-in via NextAuth v5

## Tech Stack

| Layer | Tools |
|-------|-------|
| **Frontend** | Next.js 16 (App Router), TypeScript, Tailwind CSS v4, React Hook Form, Zod |
| **Backend** | Next.js Server Actions, Drizzle ORM, PostgreSQL (Supabase) |
| **Auth** | NextAuth v5 (Auth.js) with Google OAuth |
| **AI** | Google Gemini 2.0 Flash |
| **External APIs** | Eventbrite, Nominatim (geocoding) |
| **Hosting** | Cloudflare Pages (planned) |
| **Email** | Resend (planned) |

## Getting Started

### 1. Clone & install

```bash
git clone https://github.com/mikeylim/iEventer.git
cd iEventer
npm install
```

### 2. Set up services

You'll need accounts for:

- **[Supabase](https://supabase.com/dashboard)** — Postgres database
- **[Google Cloud Console](https://console.cloud.google.com/)** — OAuth credentials
- **[Google AI Studio](https://aistudio.google.com/apikey)** — Gemini API key
- **[Eventbrite](https://www.eventbrite.com/platform/api-keys)** — Private API token

### 3. Configure environment variables

```bash
cp .env.example .env.local
```

Fill in your keys in `.env.local`.

### 4. Initialize the database

```bash
# Push the schema to your Supabase Postgres instance
npm run db:push

# Seed the interests table
npm run db:seed
```

### 5. Run the dev server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000).

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm run db:push` | Push schema changes to the database |
| `npm run db:generate` | Generate a migration file |
| `npm run db:migrate` | Apply pending migrations |
| `npm run db:studio` | Open Drizzle Studio (visual DB explorer) |
| `npm run db:seed` | Seed the interests table |

## Project Structure

```
src/
├── app/
│   ├── api/              # API routes (auth, events, suggest, optimize-route)
│   ├── auth/signin/      # Sign-in page
│   ├── onboarding/       # First-time user profile setup
│   ├── layout.tsx        # Root layout with top nav
│   └── page.tsx          # Main discovery page
├── components/           # Shared components (UserNav, etc.)
├── db/
│   ├── client.ts         # Drizzle DB client
│   ├── schema.ts         # Database schema (users, profiles, plans, etc.)
│   └── seed.ts           # Interest seed data
├── lib/
│   ├── auth.ts           # NextAuth v5 config
│   └── interests.ts      # Interest categories + seed list
└── proxy.ts              # Edge middleware (route protection)
```

## Project history & next steps

- 📜 [**CHANGELOG.md**](./CHANGELOG.md) — every phase shipped, dated and detailed
- 🗺️ [**ROADMAP.md**](./ROADMAP.md) — what's next, deferred features, and the idea backlog

## License

MIT
