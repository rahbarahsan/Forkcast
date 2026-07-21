-- 0001_core_schema.sql
-- Public reference data: recipes and the ingredient-normalisation lookup tables.
--
-- Everything in this file is world-readable by design. The app serves recipe and
-- grocery data to signed-out ("guest") users, so anon needs SELECT. Nothing here
-- grants INSERT/UPDATE/DELETE to anon or authenticated: all writes go through the
-- admin_utils pipeline using the service_role key, which bypasses RLS entirely.

-- ---------------------------------------------------------------------------
-- recipes
-- ---------------------------------------------------------------------------
create table if not exists public.recipes (
  id           uuid primary key default gen_random_uuid(),
  title        text not null,
  cuisine      text,
  image        text,
  ingredients  text[],
  instructions text,
  prep_time    text,
  cook_time    text,
  created_at   timestamptz default timezone('utc'::text, now())
);

-- ---------------------------------------------------------------------------
-- grocery_items_per_recipe
-- Pre-parsed ingredient lines produced offline by admin_utils. The runtime
-- aggregator reads these instead of parsing recipe text on the request path.
-- ---------------------------------------------------------------------------
create table if not exists public.grocery_items_per_recipe (
  id              uuid primary key default gen_random_uuid(),
  recipe_id       uuid not null references public.recipes (id) on delete cascade,
  raw_text        text not null,
  quantity        text,
  unit            text,
  name            text not null,
  modifiers       text,
  category        text,
  plural          text,
  needs_attention boolean not null default true,
  synonym_of      text,
  created_at      timestamptz default now()
);

create index if not exists grocery_items_per_recipe_recipe_id_idx
  on public.grocery_items_per_recipe (recipe_id);

-- ---------------------------------------------------------------------------
-- ingredient_lookup
-- Canonical ingredient names plus their synonyms/plurals, used to collapse
-- "tomatoes", "tamatar" and "tomato" onto one grocery-list entry.
-- ---------------------------------------------------------------------------
create table if not exists public.ingredient_lookup (
  canonical text primary key,
  synonyms  text,
  category  text,
  plurals   text
);

-- ---------------------------------------------------------------------------
-- ingredient_weights / ingredient_exceptions
--
-- NOTE: these two tables are currently unused by application code. The same
-- data is hardcoded in backend/grocery_rules/ (IRREGULAR_PLURALS in
-- plural_resolver.py, UNIT_THRESHOLD_RULES in unit_threshold_rules.py). They
-- are preserved here so a fresh project matches production, but they are a
-- second source of truth and should either be wired up or dropped.
-- ---------------------------------------------------------------------------
create table if not exists public.ingredient_weights (
  item            text primary key,
  grams_per_piece numeric not null
);

create table if not exists public.ingredient_exceptions (
  plural   text primary key,
  singular text not null
);

-- ---------------------------------------------------------------------------
-- features
-- NOTE: also currently unused. HomeScreen.tsx hardcodes its own feature list.
-- ---------------------------------------------------------------------------
create table if not exists public.features (
  id          integer primary key,
  title       text not null,
  icon        text not null,
  description text not null,
  status      text not null,
  tier        text not null,
  image_url   text
);

-- ---------------------------------------------------------------------------
-- Row Level Security: public read, no public write.
-- ---------------------------------------------------------------------------
alter table public.recipes                  enable row level security;
alter table public.grocery_items_per_recipe enable row level security;
alter table public.ingredient_lookup        enable row level security;
alter table public.ingredient_weights       enable row level security;
alter table public.ingredient_exceptions    enable row level security;
alter table public.features                 enable row level security;

do $$
declare
  t text;
begin
  foreach t in array array[
    'recipes',
    'grocery_items_per_recipe',
    'ingredient_lookup',
    'ingredient_weights',
    'ingredient_exceptions',
    'features'
  ] loop
    execute format(
      'drop policy if exists %I on public.%I',
      t || '_public_read', t
    );
    execute format(
      'create policy %I on public.%I for select to anon, authenticated using (true)',
      t || '_public_read', t
    );
  end loop;
end $$;
