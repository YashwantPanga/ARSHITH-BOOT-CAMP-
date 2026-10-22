-- Arshith Bootcamp: run this once in Supabase -> SQL Editor -> New query -> Run.
-- Each row holds one collection of the app database (students, certificates, courses, ...).
create table if not exists public.app_state (
  key        text primary key,
  data       jsonb not null,
  updated_at timestamptz not null default now()
);

-- Lock the table: with RLS on and no policies, only the server's secret key can read or write it.
alter table public.app_state enable row level security;
