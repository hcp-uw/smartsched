-- Run once in Supabase SQL Editor: persist My Calendars names + visibility per user.

alter table public.profiles
  add column if not exists calendar_sources jsonb;

comment on column public.profiles.calendar_sources is
  'Array of { id, name, color, visible } for sidebar calendar toggles';
