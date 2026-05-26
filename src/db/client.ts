import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

/**
 * DB client that works in three environments:
 *   1. Cloudflare Workers (production) — uses the Hyperdrive binding
 *      (`env.HYPERDRIVE.connectionString`) for stable pooled connections.
 *      Avoids the TCP-socket hang from running postgres-js raw on Workers.
 *   2. Local `next dev` — uses `DATABASE_URL` from .env.local.
 *   3. Build-time / seed script — uses `DATABASE_URL` if present, else a
 *      placeholder so route collection doesn't crash.
 *
 * Implementation note: Auth.js's DrizzleAdapter does an `instanceof
 * PostgresJsDatabase` check at module load. A bare `Proxy({})` fails that
 * check. So we wrap a real "boot" Drizzle instance with the Proxy — the
 * instanceof check sees the real target, and the `get` trap forwards
 * method calls to whichever Drizzle instance is appropriate at the moment
 * (Hyperdrive-backed in prod, the boot instance in dev/build).
 */

const PLACEHOLDER =
  "postgres://placeholder:placeholder@localhost:5432/placeholder";

// Boot instance — used for the DrizzleAdapter type check and as a fallback.
const bootConnectionString = process.env.DATABASE_URL || PLACEHOLDER;
const bootClient = postgres(bootConnectionString, {
  prepare: false,
  max: 1,
  idle_timeout: 5,
});
const bootDb = drizzle(bootClient, { schema });

// Cache the runtime Drizzle instance by connection string so we don't
// rebuild it on every request.
let cachedRuntimeDb: typeof bootDb | null = null;
let cachedConnectionString: string | null = null;

function getRuntimeDb(): typeof bootDb {
  // Try the Cloudflare Hyperdrive binding (only resolves inside a Workers
  // request context). Synchronous require is fine — @opennextjs/cloudflare
  // ships a Node-safe entry that just throws if there's no context.
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const cf = require("@opennextjs/cloudflare");
    const { env } = cf.getCloudflareContext();
    const hd = env?.HYPERDRIVE as { connectionString?: string } | undefined;
    if (hd?.connectionString) {
      if (
        cachedRuntimeDb &&
        cachedConnectionString === hd.connectionString
      ) {
        return cachedRuntimeDb;
      }
      const client = postgres(hd.connectionString, {
        prepare: false,
        max: 5,
        idle_timeout: 20,
      });
      cachedRuntimeDb = drizzle(client, { schema });
      cachedConnectionString = hd.connectionString;
      return cachedRuntimeDb;
    }
  } catch {
    // Not on Cloudflare or not in request context — fall through.
  }
  return bootDb;
}

export const db = new Proxy(bootDb, {
  get(_, prop, receiver) {
    return Reflect.get(getRuntimeDb(), prop, receiver);
  },
});
