-- 0002_user_data.sql
-- Per-user state: pantry contents and meal plans.
--
-- These tables hold real user data, so unlike 0001 every policy is scoped to
-- auth.uid(). A row is only ever visible or writable by the user who owns it.
--
-- user_id defaults to auth.uid() so clients never need to send it. Combined with
-- the WITH CHECK clauses below, this makes it impossible for a caller to create
-- or move a row into another user's account, even if they forge the payload.

-- ---------------------------------------------------------------------------
-- pantry
-- ---------------------------------------------------------------------------
create table if not exists public.pantry (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name       text not null,
  quantity   text,
  created_at timestamptz not null default now()
);

create index if not exists pantry_user_id_idx on public.pantry (user_id);

-- ---------------------------------------------------------------------------
-- plans
-- recipe_ids is a uuid[] rather than a join table: plans are small, always read
-- whole, and the backend already treats them as a flat id list.
-- ---------------------------------------------------------------------------
create table if not exists public.plans (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name       text,
  recipe_ids uuid[] not null default '{}',
  start_date date,
  end_date   date,
  is_active  boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists plans_user_id_idx on public.plans (user_id);

-- ---------------------------------------------------------------------------
-- Row Level Security: owner-only access.
-- ---------------------------------------------------------------------------
alter table public.pantry enable row level security;
alter table public.plans  enable row level security;

do $$
declare
  t text;
begin
  foreach t in array array['pantry', 'plans'] loop
    execute format('drop policy if exists %I on public.%I', t || '_select_own', t);
    execute format('drop policy if exists %I on public.%I', t || '_insert_own', t);
    execute format('drop policy if exists %I on public.%I', t || '_update_own', t);
    execute format('drop policy if exists %I on public.%I', t || '_delete_own', t);

    execute format(
      'create policy %I on public.%I for select to authenticated using (auth.uid() = user_id)',
      t || '_select_own', t
    );
    execute format(
      'create policy %I on public.%I for insert to authenticated with check (auth.uid() = user_id)',
      t || '_insert_own', t
    );
    execute format(
      'create policy %I on public.%I for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id)',
      t || '_update_own', t
    );
    execute format(
      'create policy %I on public.%I for delete to authenticated using (auth.uid() = user_id)',
      t || '_delete_own', t
    );
  end loop;
end $$;
