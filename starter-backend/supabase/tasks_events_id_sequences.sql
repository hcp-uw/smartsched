-- Optional: auto-generate ids so the app never hits duplicate key (tasks_pkey / events_pkey).
-- Run once in Supabase SQL Editor after backing up.

create sequence if not exists public.tasks_id_seq;
select setval(
  'public.tasks_id_seq',
  coalesce((select max(id) from public.tasks), 0) + 1,
  false
);
alter table public.tasks
  alter column id set default nextval('public.tasks_id_seq');

create sequence if not exists public.events_id_seq;
select setval(
  'public.events_id_seq',
  coalesce((select max(id) from public.events), 0) + 1,
  false
);
alter table public.events
  alter column id set default nextval('public.events_id_seq');

-- Then: Project Settings → API → Reload schema
--
-- If you see "duplicate id" when creating tasks/events, resync sequences (run each line):
select setval(
  pg_get_serial_sequence('public.tasks', 'id'),
  coalesce((select max(id) from public.tasks), 0) + 1,
  false
);
select setval(
  pg_get_serial_sequence('public.events', 'id'),
  coalesce((select max(id) from public.events), 0) + 1,
  false
);
