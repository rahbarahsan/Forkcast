# Architecture

Forkcast runs as an Expo/React Native app and a local FastAPI service backed by
SQLite. Core behavior makes no external requests and needs no accounts or keys.

## Storage

`datasets/catalog.json` contains the shared recipe catalog, preprocessed ingredient
rows, and canonical ingredient lookup. Startup seeds reference tables idempotently.
Personal recipes and catalog overrides, pantry items, plans, saved lists, and flyer
offers live in separate runtime records in `data/local/forkcast.sqlite3`.

Runtime storage, SQLite sidecars, credentials, and local collaboration files are
ignored by Git. There is no automatic path from personal data to the seed dataset.
Deleting a personal catalog override restores the original reference recipe.

SQLite uses transactions, foreign keys, a busy timeout, and WAL. Each operation
opens and closes its own connection. Application initialization runs in FastAPI's
lifespan. Tests use isolated databases and verify persistence after restart.

## Request path

The frontend uses the local HTTP API for all persistent household data. React
context holds a shared view of recipes, pantry, plans, and history. Writes refresh
that view; failures are shown beside the action. Grocery requests are cancelled
when inputs change, preventing stale responses from replacing a newer selection.

Ingredient aggregation uses validated prepared rows when they match an original
line exactly. Invalid spreadsheet quantities fall back to the deterministic
parser. The lookup resolves synonyms and plurals. Compatible units are combined;
weight, volume, and counts remain separate because density is ingredient-specific.
An ingredient present in the pantry is omitted entirely, regardless of quantity.

Offer comparison matches canonical ingredients and comparable units, excludes
expired offers and other currencies, and selects the lowest whole-pack cost for
each item. It reports unpriced items separately and excludes travel costs and
mixed-size pack combinations.

## Optional extraction

Recipe Scout, photo inventory, and flyer extraction use a configured provider
only after a user requests extraction. OpenAI, Anthropic, and Google API keys stay
on the server. Codex and Claude modes use an installed, authenticated CLI with API
key environment variables removed. Temporary extraction files are isolated under
ignored runtime storage and removed after completion.

Extraction has a timeout and a concurrency limit. Submitted material is treated as
data, tools are restricted, responses are validated against application schemas,
and results are previews. Persistence always requires a separate save action.
The default provider is disabled. A failed provider cannot disable local workflows.

## Deployment boundary

The default installation is one household on a trusted computer. Start the API
bound to `127.0.0.1`. Browser origins are explicitly allowed and untrusted browser
writes are rejected. This is not a public multi-tenant deployment: exposing it
requires a separately designed authentication layer, TLS, and backup policy.
Native devices on a trusted LAN need an explicit bind address, API URL, and allowed
browser origin where applicable.
