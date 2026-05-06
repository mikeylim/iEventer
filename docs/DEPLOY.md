# Deploying iEventer to Cloudflare

iEventer deploys to Cloudflare Workers via [`@opennextjs/cloudflare`](https://opennext.js.org/cloudflare). Pages and Workers share the same infrastructure now — we use the Workers approach because it gives us full Node.js compat for Postgres.

## Prerequisites

- A [Cloudflare account](https://dash.cloudflare.com/sign-up) (free tier is fine)
- Wrangler CLI configured locally (auto-installs the first time you run `npx wrangler login`)
- Production-ready env vars (see below)

## One-time setup

### 1. Authenticate Wrangler

```bash
npx wrangler login
```

This opens a browser to log into your Cloudflare account.

### 2. Add the production redirect URI to Google OAuth

Go to https://console.cloud.google.com/apis/credentials → your OAuth client → **Authorized redirect URIs** and add:

```
https://ieventer.<your-account>.workers.dev/api/auth/callback/google
```

(Replace `<your-account>` with your actual Cloudflare subdomain. You'll see the deployed URL after the first deploy.)

### 3. Set production env vars

Two ways. **For each var, use option A or B, not both.**

**Option A — via Wrangler CLI** (faster, auth keys + secrets stay encrypted):

```bash
npx wrangler secret put DATABASE_URL
npx wrangler secret put AUTH_SECRET
npx wrangler secret put GOOGLE_CLIENT_ID
npx wrangler secret put GOOGLE_CLIENT_SECRET
npx wrangler secret put GEMINI_API_KEY
npx wrangler secret put EVENTBRITE_API_KEY
npx wrangler secret put CRON_SECRET
npx wrangler secret put NEXTAUTH_URL  # e.g. https://ieventer.<account>.workers.dev
npx wrangler secret put AUTH_URL      # same as NEXTAUTH_URL — Auth.js v5 reads either
```

**Option B — via Cloudflare dashboard** (visual):

1. Go to https://dash.cloudflare.com → Workers & Pages → `ieventer` → Settings → Variables
2. Add each variable above as an **encrypted** secret

### 4. First deploy

```bash
npm run cf:build
npm run cf:deploy
```

The first deploy will print your URL — something like `https://ieventer.<your-account>.workers.dev`.

### 5. Update env vars with the real URL

After the first deploy, set `NEXTAUTH_URL` and `AUTH_URL` to the actual deployed URL (steps 2 + 3 above mention this).

## Subsequent deploys

```bash
npm run cf:build && npm run cf:deploy
```

Or set up a GitHub Actions workflow to run on every push to `main` (see [Phase 8 in ROADMAP.md](../ROADMAP.md)).

## Local preview against the production bundle

Before deploying, you can preview the exact Workers build locally:

```bash
npm run cf:preview
```

This boots Wrangler's local Workers runtime against `.open-next/worker.js`. Useful for catching edge-runtime quirks before deploy.

## Daily-pick cron

Currently lazy-only (a pick generates when a signed-in user visits `/`). To wire up scheduled execution:

1. Add `triggers.crons` to `wrangler.jsonc` (e.g. `["0 0 * * *"]` for midnight UTC daily)
2. Add a `scheduled` handler in a custom worker entry that calls `/api/cron/daily-picks` with `Authorization: Bearer ${CRON_SECRET}`

Tracked in [ROADMAP.md](../ROADMAP.md).

## Troubleshooting

**Build fails with "Node.js middleware is not currently supported"**
We removed `proxy.ts` for this reason. Auth gating is now handled per-page in server components. Don't re-add `proxy.ts` / `middleware.ts` until OpenNext supports it.

**`postgres-js` errors at runtime about `net.createConnection`**
Make sure `wrangler.jsonc` has `"compatibility_flags": ["nodejs_compat"]` and `"compatibility_date"` is recent (`2025-04-01` or later).

**Sign-in redirects to localhost**
You forgot to set `NEXTAUTH_URL` / `AUTH_URL` to the deployed URL.

**Sessions don't persist**
We use JWT sessions (not database sessions) for edge compatibility. `AUTH_SECRET` must be set in prod.
