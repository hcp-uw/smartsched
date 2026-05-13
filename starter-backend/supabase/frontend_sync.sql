-- OPTIONAL / LEGACY: extends public.calendar_events + adds a UUID-keyed
-- public.tasks table and RLS. The app in this repo syncs to team tables
-- public.events and public.tasks (integer PKs); skip this unless you use
-- calendar_events from schema.sql.

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Link calendar_events.user_id to auth.users (drops/recreates if re-run)
alter table public.calendar_events
  drop constraint if exists calendar_events_user_id_fkey;

alter table public.calendar_events
  add constraint calendar_events_user_id_fkey
  foreign key (user_id) references auth.users (id) on delete cascade;

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  completed boolean not null default false,
  priority text not null default 'medium',
  tags text[] not null default '{}',
  duration_minutes integer not null default 30,
  due_date date,
  category text not null default 'work',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint tasks_priority_check check (priority in ('low', 'medium', 'high')),
  constraint tasks_category_check check (category in ('work', 'personal', 'meeting', 'focus', 'break'))
);

create index if not exists tasks_user_id_idx on public.tasks (user_id);

drop trigger if exists trg_tasks_updated_at on public.tasks;
create trigger trg_tasks_updated_at
before update on public.tasks
for each row execute function public.set_updated_at();

-- RLS: calendar_events
alter table public.calendar_events enable row level security;

drop policy if exists "calendar_events_select_own" on public.calendar_events;
drop policy if exists "calendar_events_insert_own" on public.calendar_events;
drop policy if exists "calendar_events_update_own" on public.calendar_events;
drop policy if exists "calendar_events_delete_own" on public.calendar_events;

create policy "calendar_events_select_own"
  on public.calendar_events for select
  using (auth.uid() = user_id);

create policy "calendar_events_insert_own"
  on public.calendar_events for insert
  with check (auth.uid() = user_id);

create policy "calendar_events_update_own"
  on public.calendar_events for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "calendar_events_delete_own"
  on public.calendar_events for delete
  using (auth.uid() = user_id);

-- RLS: tasks
alter table public.tasks enable row level security;

drop policy if exists "tasks_select_own" on public.tasks;
drop policy if exists "tasks_insert_own" on public.tasks;
drop policy if exists "tasks_update_own" on public.tasks;
drop policy if exists "tasks_delete_own" on public.tasks;

create policy "tasks_select_own"
  on public.tasks for select
  using (auth.uid() = user_id);

create policy "tasks_insert_own"
  on public.tasks for insert
  with check (auth.uid() = user_id);

create policy "tasks_update_own"
  on public.tasks for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "tasks_delete_own"
  on public.tasks for delete
  using (auth.uid() = user_id);

-- Stamp user_id from JWT on insert so the client does not send it (RLS still enforces ownership).
create or replace function public.set_owner_user_id()
returns trigger as $$
begin
  if auth.uid() is not null then
    new.user_id := auth.uid();
  end if;
  return new;
end;
$$ language plpgsql security definer
set search_path = public;

drop trigger if exists trg_calendar_events_owner on public.calendar_events;
create trigger trg_calendar_events_owner
before insert on public.calendar_events
for each row execute function public.set_owner_user_id();

drop trigger if exists trg_tasks_owner on public.tasks;
create trigger trg_tasks_owner
before insert on public.tasks
for each row execute function public.set_owner_user_id();

-- Optional: multi-device live updates (enable Realtime for these tables in Dashboard if needed)
-- alter publication supabase_realtime add table public.calendar_events;
-- alter publication supabase_realtime add table public.tasks;
