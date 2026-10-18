# Contributing

Use the local setup in [README](README.md). Development dependencies are in
`backend/requirements-dev.txt`; JavaScript dependencies are pinned by
`app/package-lock.json`. Keep personal household data and credentials out of
commits.

## Checks

With the backend environment activated, from the repository root:

```sh
python -m pip install -r backend/requirements-dev.txt
python -m ruff check backend scripts
python -m ruff format --check backend scripts
python -m pytest backend/tests -q
python scripts/validate_catalog.py
python scripts/prepare_recipe_photos.py
```

Then check and export the client:

```sh
cd app
npm ci
npm run typecheck
npm run lint
npm run format:check
npm run build:web
npx playwright install chromium
npm run test:e2e
```

Browser tests start disposable servers on ports 8000 and 8081. Stop development
servers on those ports first. Set `FORKCAST_TEST_PYTHON` to an explicit interpreter
path when needed. Tests use isolated SQLite databases. External HTTP is blocked
in backend tests; assisted browser scenarios use repeatable provider fixtures.
Native device behavior needs separate platform testing.

## Grocery and model changes

Keep interpretation separate from arithmetic. Preserve each original ingredient
line, product form and explicit measure; do not infer densities or package weights.
Validate that model output covers every ingredient index once. Unknown amounts
must remain visible for review. Add regression cases for changed behavior and run
the independent catalog reconciliation.

Optional live checks use the operator's own authenticated CLI and disposable data:

```sh
python scripts/check_model.py --provider codex
python scripts/check_intelligence.py --provider codex --youtube
python scripts/evaluate_groceries.py --provider claude
```

These checks contact the selected provider and, where requested, public sources.
API adapters also have contract tests. Passing fixtures does not establish live
provider access or general model accuracy.

## Catalog and photographs

Reference changes belong in `datasets/catalog.json`; household records must never
be exported into it automatically. Keep original source links and describe recipe
adaptations and halal assumptions. `scripts/validate_catalog.py` checks source
coverage, prepared ingredient lines and grocery totals without model access.

For a photograph, verify the actual dish, author and file-page license. Save a
sized JPEG in `app/assets/recipes/` and update `datasets/photo-credits.json` with
the source, license, description and checksum. Use a `recipe-photo:<slug>` image
key in the catalog, then run:

```sh
python scripts/prepare_recipe_photos.py --write
cd app
npx prettier --write src/data/recipePhotos.ts
```

Run photo validation, client checks and browser image tests afterward. Metro
requires static imports to include these assets in each platform bundle.

## Dependencies

Keep the Expo/React/React Native versions compatible. Review changes to the npm
lockfile and Python constraints together with the relevant test results. Use a
clean environment when updating `backend/constraints.txt`.

Run `npm audit` when changing JavaScript dependencies and inspect the affected
dependency paths. Distinguish shipped runtime code from Metro and native-build
tooling when assessing exposure. Resolve advisories with compatible upstream
updates; check client exports after changing an override. The Xcode tooling pins
UUID 11.1.1 through an override.

## Pull requests

Describe the user-visible problem, resulting behavior and relevant verification.
Update architecture or setup documentation when a change affects those contracts.
Repository checks and CodeQL must pass before merging into main.
