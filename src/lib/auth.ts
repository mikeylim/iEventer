import NextAuth from "next-auth";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "@/db/client";
import {
  users,
  accounts,
  sessions,
  verificationTokens,
} from "@/db/schema";
import { authConfig } from "./auth.config";

/**
 * Full server-side auth — adds the Drizzle adapter so OAuth account / user
 * creation persists to Postgres. Used by API routes, server actions, and
 * server components. Edge middleware uses `auth.config.ts` instead.
 */
export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
});
