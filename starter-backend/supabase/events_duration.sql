-- Run once in Supabase → SQL Editor so event length survives refresh.
-- Safe to re-run.

-- Preferred: store exact end time (drag-resize uses start + end in the app).
alter table public.events
  add column if not exists end_date timestamptz;

-- Optional fallback if you prefer length in minutes instead of end_date.
alter table public.events
  add column if not exists duration_minutes integer not null default 60;

comment on column public.events.end_date is 'Event end (timestamptz); pair with date for start';
comment on column public.events.duration_minutes is 'Length in minutes when end_date is null';

-- After running: Supabase → Project Settings → API → Reload schema (if updates still fail).
