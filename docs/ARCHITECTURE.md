# Architecture

How Forkcast is put together and why. The [README](../README.md) covers what it
does and how to run it; this covers the decisions behind it.

## The shape of the system

```
  app/  (Expo / React Native Web)
    │
    │  1. reads recipes, pantry and plans directly from Supabase
    │  2. POSTs a recipe selection to the API for aggregation
    ▼
  backend/  (FastAPI)
    │
    │  queries as the signed-in user, using their JWT
    ▼
  Supabase (Postgres + Auth + RLS)
    ▲
    │  writes pre-parsed ingredients, offline and by hand
    │
  backend/ingredient_pipeline/  (batch, LLM-assisted)
```

Four pieces, and the fourth is the one people miss: the ingredient pipeline is
**not** on the request path. It runs offline, by hand, and writes its results
into `grocery_items_per_recipe`. The API only ever reads what it produced.

## Why there are two ingredient parsers

There are two paths from an ingredient line to a structured ingredient, and
that is deliberate.

**The offline pipeline** (`ingredient_pipeline/`) is slow and thorough. It uses
NLTK part-of-speech tagging and an LLM to split lines into quantity, unit,
name, modifiers and category, caches the LLM responses, and supports a manual
correction workflow. Its output lands in `grocery_items_per_recipe`.

**The runtime parser** (`aggregator.py`, `parse_ingredient_string`) is fast and
dumb. Pure string handling, no network, no model. It exists only as a fallback
for recipes the pipeline has not processed yet.

The split is what keeps grocery-list generation quick and deterministic while
still allowing an expensive, high-quality parse. The cost is two code paths
that can disagree — the runtime parser will produce a rougher result — so the
pipeline is expected to have processed anything user-facing.

## How a grocery list is built

1. The client sends recipe ids and, for guests, the pantry contents.
2. `SmartGroceryAggregator` fetches pre-parsed rows from
   `grocery_items_per_recipe` for those recipes.
3. Anything missing falls back to `parse_ingredient_string`.
4. Each ingredient is normalised to a canonical name: plurals folded
   (`grocery_rules/plural_resolver.py`), synonyms resolved against
   `ingredient_lookup` (`synonym_resolver.py`).
5. Quantities are converted to an estimated weight
   (`unit_threshold_rules.py`) and summed per canonical ingredient.
6. Anything present in the pantry is dropped entirely — see below.
7. Results are grouped by category (`category_resolver.py`).

### Why pantry matching is all-or-nothing

If an ingredient is in your pantry it is removed from the list, rather than
having the pantry amount subtracted from what the recipes need.

Pantry quantities and recipe quantities are rarely in comparable units. Two
kilograms of flour in the cupboard against two tablespoons in a recipe: any
subtraction produces a confident-looking number that is wrong. Weight
estimation is already coarse — quantities map to broad bands — so compounding
it with unit conversion would make the output worse, not better.

"It is in the pantry, so I do not need to buy it" is a blunter rule that is
right more often. Pinned by `test_pantry_match_removes_ingredient_entirely`.

## Security model

**Authorisation lives in the database, not the API.**

Every table has Row Level Security enabled. Reference data (`recipes`,
`ingredient_lookup`, `grocery_items_per_recipe`) grants `SELECT` to `anon` and
nothing else. Per-user tables (`pantry`, `plans`) are scoped to
`auth.uid() = user_id` for all four verbs, and `user_id` defaults to
`auth.uid()` so a client cannot create a row in someone else's account even by
forging the payload.

The API takes identity from the `Authorization` bearer token only. There is no
`user_id` field on any request model — an earlier version had one and used it
directly to query the pantry, which let any caller read another user's data by
guessing their id. `client_for_token()` builds a per-request Supabase client
carrying the user's JWT, so RLS evaluates `auth.uid()` and Postgres decides
what comes back.

### Three keys, three jobs

| Key | Used by | Can it write? |
|---|---|---|
| publishable (`sb_publishable_…`) | app, backend | No — RLS allows reads only |
| user JWT | backend, per request | Only that user's own rows |
| secret (`sb_secret_…`) | `ingredient_pipeline/` only | Yes — bypasses RLS entirely |

The runtime backend deliberately holds no privileged credential. Giving it the
secret key would bypass the RLS that the whole model rests on and put
authorisation back into application code.

Because the publishable key is shipped to browsers and is public by design,
**RLS is the only thing protecting the data.** A policy mistake is a data
breach, not an inconvenience.

## Guest mode

The app is fully usable signed out, and this is a product decision rather than
an unfinished state. Visitors can try it without an account; signing in adds
persistence across devices.

Practically: guests keep pantry and plans in React state and send them with
each request. Signed-in users read and write `pantry` and `plans` in Supabase
through `PantryContext` and `PlannerContext`, which clear on sign-out so one
account's data cannot leak into the next session.

## Things worth knowing before you change something

- **`WebScreenWrapper` must not be called during render.** Passing
  `component={WebScreenWrapper(Screen)}` inline creates a new component
  identity every render, so React remounts the screen and the navigator resets
  to its initial route. Every tab silently rendered Home until this was fixed.
  The wrapped components are built once at module scope.
- **NLTK corpora are downloaded, not committed.** They used to be vendored
  three times over, about 66MB, for one script.
- **`.gitignore` has path-specific rules.** Several name
  `backend/ingredient_pipeline/` directly, so renaming that package silently
  un-ignores its CSV and log output. Check `git status` after moving it.
- **`**/*config.*` is broad.** A new `metro.config.js` or similar would be
  silently untracked. This is why `@opentelemetry/api` is a real dependency
  rather than a Metro resolver alias.
- **Three tables are unused.** `ingredient_weights`,
  `ingredient_exceptions` and `features` exist but nothing reads them; the
  equivalent data is hardcoded in `grocery_rules/` and `HomeScreen.tsx`.
  Either wire them up or drop them, but do not assume they are live.
