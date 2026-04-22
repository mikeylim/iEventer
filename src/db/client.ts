import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// During `next build`, Next.js pre-collects every route even if no queries
// run. If DATABASE_URL is unset, fall back to a placeholder so the build
// succeeds. At request time, any missing/broken DATABASE_URL will fail loudly.
const connectionString =
  process.env.DATABASE_URL ||
  "postgres://placeholder:placeholder@localhost:5432/placeholder";

const client = postgres(connectionString, { prepare: false, max: 1 });

export const db = drizzle(client, { schema });
