-- Fix Supabase database linter findings:
-- - 0013_rls_disabled_in_public
-- - 0023_sensitive_columns_exposed
--
-- This app reads and writes Postgres from trusted server-side code through
-- Drizzle/DATABASE_URL. It does not use Supabase's browser client or PostgREST
-- API for these tables, so we enable RLS without public anon/authenticated
-- policies. That makes Supabase API access deny-by-default while preserving
-- trusted server database access through the database owner/service connection.

alter table public."user" enable row level security;
alter table public."account" enable row level security;
alter table public."session" enable row level security;
alter table public."verificationToken" enable row level security;
alter table public."interest" enable row level security;
alter table public."profile" enable row level security;
alter table public."user_interest" enable row level security;
alter table public."plan" enable row level security;
alter table public."plan_event" enable row level security;
alter table public."journal_entry" enable row level security;
alter table public."daily_pick" enable row level security;

-- Optional hardening: remove direct PostgREST grants for Supabase client roles.
-- The app should keep using the server DATABASE_URL/Hyperdrive connection.
revoke all on table public."user" from anon, authenticated;
revoke all on table public."account" from anon, authenticated;
revoke all on table public."session" from anon, authenticated;
revoke all on table public."verificationToken" from anon, authenticated;
revoke all on table public."interest" from anon, authenticated;
revoke all on table public."profile" from anon, authenticated;
revoke all on table public."user_interest" from anon, authenticated;
revoke all on table public."plan" from anon, authenticated;
revoke all on table public."plan_event" from anon, authenticated;
revoke all on table public."journal_entry" from anon, authenticated;
revoke all on table public."daily_pick" from anon, authenticated;
