-- Optional: creates public.calendar_events (UUID rows, meta JSON).
-- The deployed frontend instead syncs to public.events + public.tasks
-- (see starter-frontend/src/lib/supabaseCalendarTask.ts). Use this file
-- only if you want the alternate calendar_events model.
--
-- Run in Supabase SQL Editor. Prereq: pgcrypto extension.
--
create extension if not exists pgcrypto;

create table if not exists public.calendar_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  title text not null,
  start timestamptz not null,
  "end" timestamptz not null,
  description text default '',
  location text default '',
  attendees jsonb default '[]'::jsonb,
  meta jsonb default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists calendar_events_user_start_idx on public.calendar_events (user_id, start);
create index if not exists calendar_events_user_end_idx on public.calendar_events (user_id, "end");

-- Optional: keep updated_at fresh automatically
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_calendar_events_updated_at on public.calendar_events;
create trigger trg_calendar_events_updated_at
before update on public.calendar_events
for each row
execute function public.set_updated_at();

-- If you use calendar_events from the browser, also run frontend_sync.sql
-- for RLS and related policies (same folder).
