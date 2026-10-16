# Forkcast

Turn a week of recipes into one sensible shopping list.

Forkcast runs on your computer with a local SQLite database. No Supabase project,
cloud account, or model provider is required for recipes, planning, pantry,
groceries, history, or recorded flyer-price comparisons. After installing the
software, these features work without an internet connection.

## What you can do

- Browse the bundled recipes, create your own, and edit personal copies.
- Import recipe text, JSON, or schema.org Recipe data with a preview before save.
- Build meal plans and share them as text.
- Track pantry ingredients and rank recipes by what you already have.
- Combine ingredients, keep compatible quantities together, and group by aisle.
- Check off groceries, inspect ingredient names and recipe usage, export a list,
  and keep shopping history.
- Review pasted pantry/OCR text and add the selected items in one transaction.
- Record flyer offers and compare whole-pack prices with expiry/currency checks.
- Optionally extract recipes from pasted video transcripts, pantry photos, and
  flyer images using a configured subscription CLI or API provider.

## Start locally

Use Python 3.11+ and Node 22.13+ (or a supported newer LTS). Open two terminals.

Backend:

```sh
cd backend
python -m venv venv
# Windows PowerShell:
.\venv\Scripts\Activate.ps1
# macOS/Linux instead: source venv/bin/activate
python -m pip install -r requirements.txt
python -m uvicorn main:app --host 127.0.0.1 --port 8000
```

Frontend:

```sh
cd app
npm ci
npm run web
```

Open the address printed by Expo, normally `http://localhost:8081`.
No environment files are needed. The API seeds the database automatically.
`GET http://localhost:8000/api/health` checks the backend; `/docs` opens the API
reference. `npm run build:web` creates a static web export in `app/dist`.

For a phone on your trusted LAN, set `EXPO_PUBLIC_API_URL` to your computer's
LAN address plus `:8000/api`, then start the backend bound to that interface.
Configure `FORKCAST_ORIGINS` if using a different browser origin. This is a
single-household application; public hosting needs authentication and TLS.

## Your data and the shared catalog

| Data | Location | Committed? |
|---|---|---|
| Reference recipes, parsed ingredients, lookup | `datasets/catalog.json` | Yes |
| Personal recipes, overrides, pantry, plans, offers, history | `data/local/forkcast.sqlite3` | No |
| Runtime sidecars, extraction scratch files, browser output | Ignored runtime directories | No |
| Environment files and provider credentials | Local environment | No |

The catalog includes six recipes, 90 prepared ingredient rows, and 45 lookup
entries recovered from the original SQL seed. Startup refreshes reference data
without touching personal records. Changes made through the app never update
`datasets/catalog.json`. Deleting a personal override restores the reference
recipe. A database path can be overridden with `FORKCAST_DATABASE`.

Back up the local database with `python scripts/backup.py /path/to/backup.sqlite3`.
Keep backups private: they contain your recipes and household data.

## Optional model extraction

The default provider is `none`. Local text import and all core features continue
to work when extraction is disabled or unavailable.

Set server environment variables before starting the backend:

| Mode | `FORKCAST_MODEL_PROVIDER` | Other configuration |
|---|---|---|
| Codex subscription CLI | `codex` | Install Codex and sign in with your own account |
| Claude subscription CLI | `claude` | Install Claude Code and sign in with your own account |
| OpenAI API | `openai` | `OPENAI_API_KEY`, `FORKCAST_MODEL` |
| Anthropic API | `anthropic` | `ANTHROPIC_API_KEY`, `FORKCAST_MODEL` |
| Google Gemini API | `google` | `GOOGLE_API_KEY`, `FORKCAST_MODEL` |

`FORKCAST_MODEL` is optional for CLI modes and uses the operator's CLI default
when omitted. Model availability and subscription limits come from your provider.
The application does not copy login tokens or turn a subscription into an API key.
API credentials stay on the server; never put them in an `EXPO_PUBLIC_` variable.

Codex and API modes accept JPEG, PNG, and WebP images up to 5 MB. Claude CLI mode
accepts pasted text. Recipe Scout accepts pasted transcripts; it does not fetch
YouTube videos or bypass captions/access controls. Results are validated previews
and require a separate save action. Images and submitted text go to the selected
provider only after you request extraction.

A live subscription smoke check is optional:

```sh
python scripts/check_model.py --provider codex
# or --provider claude
```

Provider integration follows the documented [Codex noninteractive interface](https://learn.chatgpt.com/docs/non-interactive-mode)
and [Claude programmatic interface](https://code.claude.com/docs/en/headless).

## Checks

```sh
cd backend
python -m pip install -r requirements-dev.txt
python -m ruff check . ../scripts
python -m pytest -q

cd ../app
npm ci
npm run typecheck
npm run lint
npm run build:web
npx playwright install chromium
npm run test:e2e
```

Backend tests use isolated SQLite databases and block external HTTP. Browser
tests cover desktop and phone layouts, persistent household flows, imports,
exports, and offer comparisons. They create ignored test databases and use ports
8000 and 8081, which must be free. Set `FORKCAST_TEST_PYTHON` if your Python
interpreter differs from the active shell's `python`.

The app uses Expo SDK 58, React 19.3, and React Native 0.88. Dependency
constraints and the npm lockfile record the verified versions. See
[dependency notes](docs/DEPENDENCIES.md) for the remaining upstream advisories.

## Behavior and limits

Pantry presence removes an ingredient entirely; quantities are not subtracted.
Weight, volume, and counts stay separate rather than guessing food densities.
Spoons/cups use 5/15/240 ml conversions. Ambiguous preparation text may need a
manual recipe edit. These lists are shopping aids, not nutritional calculations.

Price comparison uses only recorded offers in the requested currency. It chooses
the lowest whole-pack cost per ingredient with comparable units, reports missing
prices, and excludes travel costs and combinations of different pack sizes.
No live store prices are invented or fetched automatically.

See [architecture](docs/ARCHITECTURE.md) for storage and request details and
[the reference dataset](datasets/README.md) for catalog provenance.

## License

MIT. See [LICENSE](LICENSE).
