-- Run once in Supabase SQL Editor: persist profile timezone and per-day schedule preferences.

alter table public.profiles
  add column if not exists timezone text,
  add column if not exists schedule_preferences jsonb;

comment on column public.profiles.schedule_preferences is
  'Per-day profile schedule preferences used by the Profile page sliders and toggles';
