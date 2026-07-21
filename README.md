# Forkcast

**Turn a week of recipes into one sensible shopping list.**

Pick some recipes, tell Forkcast what is already in your kitchen, and it works
out what you actually need to buy — combining the same ingredient across
recipes, subtracting what you have, and grouping the result by aisle.

The interesting part is not the meal planning. It is that "2 cloves garlic,
minced", "1 tbsp garlic paste" and "3 garlic cloves" all have to become one
line on your shopping list.

---

## The problem this actually solves

Recipes are written for humans. An ingredient line is free text with a
quantity, a unit, a name and some preparation notes all run together, and
nothing is spelled consistently:

```
"2 cloves garlic, minced"
"320g Arborio rice"
"1L vegetable or chicken stock, warm"
"1/2 tsp chili powder"
"Salt and pepper to taste"
```

To merge three recipes into one shopping list you have to answer, for every
line: how much, in what unit, of *what* — and is that the same "what" as the
thing in recipe two?

Forkcast answers this in three stages:

**1. Parse.** Split each line into quantity, unit and ingredient. Units are
matched against a known vocabulary rather than guessed at, because a
length-based heuristic mistakes `cloves` for part of the ingredient name and
`eggs` for a unit. Preparation notes after a comma are dropped, glued forms
like `320g` are split, and `1/2` is read as a fraction.

**2. Normalise.** Reduce the ingredient to a canonical name — plurals folded
(`tomatoes` → `tomato`), synonyms resolved through a lookup table that also
covers non-English names (`pyaz` → `onion`), so the same thing written three
ways aggregates into one entry.

**3. Aggregate.** Convert quantities to a comparable weight, sum per
ingredient across every selected recipe, drop anything already in your pantry,
and group by supermarket category.

On that last point: if an ingredient is in your pantry it comes off the list
entirely, rather than having the pantry amount subtracted from what the recipes
need. This is deliberate. Pantry quantities and recipe quantities are rarely in
comparable units — 2kg of flour in the cupboard against 2 tablespoons in a
recipe — so subtracting one from the other produces a confident-looking number
that is simply wrong. "It is in the pantry, so I do not need to buy it" is
coarser, but it is right far more often than a bad unit conversion would be.

Stages 1 and 2 also run offline as a batch pipeline (`backend/admin_utils/`)
that pre-parses recipes with LLM assistance and writes the structured result
to the database, so the request path stays fast and deterministic. The
runtime parser is the fallback for anything not yet pre-processed.

## Features

- **Plan** meals and browse a recipe catalogue
- **Pantry tracking** — what you already own is deducted from the list
- **Smart grocery list** — deduplicated, aggregated, grouped by aisle
- **Works signed out.** Guest mode is a first-class path, not a teaser. An
  account only adds saving across devices.

## Tech

| Layer | Stack |
|---|---|
| App | React Native + Expo (web and native from one codebase) |
| API | FastAPI (Python) |
| Data & auth | Supabase (Postgres, Row Level Security, email/password auth) |
| Offline pipeline | Python + NLTK + LLM via OpenRouter |

Authorisation is enforced by the database, not the application. The API never
accepts a user id from the client: identity comes from a signature-verified
JWT, and the request is executed as that user so Postgres RLS decides what is
visible. A second user who knows the exact row id of your pantry item cannot
read, update or delete it.

## Running it locally

You will need your own Supabase project (free tier is fine), Python 3.11+ and
Node 18+.

**1. Create the database**

In the Supabase SQL editor, run in order:

```
supabase/migrations/0001_core_schema.sql   -- tables + public-read RLS policies
supabase/migrations/0002_user_data.sql     -- pantry & plans, owner-only RLS
supabase/seed.sql                          -- 6 recipes and the lookup tables
```

The seed is idempotent, so re-running it is harmless.

**2. Backend**

```bash
cd backend
python -m venv venv && venv/Scripts/activate     # Linux/macOS: source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env                             # fill in SUPABASE_URL and SUPABASE_KEY
uvicorn main:app --reload --port 8000
```

Use the **publishable** key (`sb_publishable_…`), not the secret one. The
backend deliberately holds no privileged credential — it forwards the user's
token so RLS applies.

**3. Frontend**

```bash
cd web/forkcast-web
npm install
cp .env.example .env                             # set API URL + Supabase URL/anon key
npm run web
```

For local development `EXPO_PUBLIC_API_URL` should be
`http://localhost:8000/api`.

**4. Auth settings**

Under Authentication → Sign In / Providers → Email, turn off "Confirm email"
unless you have configured custom SMTP. Supabase's built-in email service is
rate limited to a few messages per hour and will reject most sign-ups.

## Tests

```bash
cd backend && pytest tests/ -q        # 13 passed, 1 xfailed
cd web/forkcast-web && npx tsc --noEmit
```

## Known limitations

Being honest about the rough edges, since they are visible in the code:

- **Weight estimation is coarse.** Quantities map to broad weight bands, so
  "3 eggs" and "5 eggs" can round to the same estimate.
- **Some pre-parsed data is imperfect.** `1L vegetable or chicken stock`
  yields an ingredient called "vegetable", and stock is filed under Meat &
  Seafood.
- **No live demo yet.** The backend is being moved off its old host.
- Three tables (`ingredient_weights`, `ingredient_exceptions`, `features`) are
  present but unused; equivalent data is currently hardcoded.

## Project layout

```
backend/
  main.py                     FastAPI app: /api/recipes, /api/grocery-list
  smart_grocery_aggregator/   parsing, aggregation, pantry deduction
  grocery_rules/              units, plurals, synonyms, categories
  admin_utils/                offline LLM-assisted parsing pipeline
supabase/
  migrations/                 schema + RLS policies
  seed.sql                    reference data
web/forkcast-web/
  src/screens/                Home, Discover, Planner, Pantry, Groceries, Auth
  src/context/                auth, pantry, planner, recipes
```

## License

MIT — see [LICENSE](LICENSE).
