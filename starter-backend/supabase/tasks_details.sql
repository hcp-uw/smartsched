-- Run once in Supabase SQL Editor: persist the full task edit form.
-- The frontend reads/writes these columns when present and falls back for older schemas.

alter table public.tasks
  add column if not exists duration_minutes integer not null default 30,
  add column if not exists tags text[] not null default '{}',
  add column if not exists category text not null default 'work',
  add column if not exists notes text not null default '';

alter table public.tasks
  drop constraint if exists tasks_duration_minutes_check,
  add constraint tasks_duration_minutes_check check (duration_minutes > 0);

alter table public.tasks
  drop constraint if exists tasks_category_check,
  add constraint tasks_category_check
    check (category in ('work', 'personal', 'meeting', 'focus', 'break'));
