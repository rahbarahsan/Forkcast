# Grocery quality

Ingredient interpretation and arithmetic are separate. The model identifies
purchasable foods and aisles; validated local calculations combine compatible
measures, scale quantities and deduct recorded stock. Every purchase retains the
original recipe lines. Weight, volume and count are never joined by guessed
density or piece weight.

The shared catalog contains 50 recipes from nine publishers and 18 cuisine/region
labels. All 933 prepared lines match a recipe ingredient exactly. An independent
reconciliation checks 859 purchase source lines across 235 grocery names. Cooking
water and three reused cooking liquids are excluded. All purchase lines have an
aisle. The check runs without models or network in CI.

The fixed twelve-case interpretation benchmark covers fresh/dried and raw/cooked
forms, whole/ground spices, rice, canned pulses, meat cuts, herb synonyms, amounts
and aisles. The verified Claude subscription run preserved all twelve explicit
measures and returned correct names and aisles for all twelve cases. These are
focused regression checks, not a general accuracy estimate.

An early run dropped “cooked” from cooked basmati rice. The pipeline now retains
explicit source forms and rejects contradictory forms. It also requires exactly
one interpretation for every ingredient index and rejects changed explicit
measures, invented quantities and unsupported reused-liquid claims. Unknown
quantities remain unknown. Source alternatives, range choices and preparation
notes remain visible for review.

Both Codex and Claude subscriptions passed live checks for semantic groceries,
exact pantry deductions and reviewed chatbot tasks. A public Food Fusion video
passed description fetching and recipe interpretation with Codex. Nearby-store
lookup returned actual OpenStreetMap listings, with a working bounded supermarket
search fallback. Generative API adapters and the optional Jev review adapter are
verified with protocol fixtures; no live API-key tests were run.

## Reproduce

- python scripts/validate_catalog.py
- python scripts/evaluate_groceries.py --provider claude
- python scripts/check_intelligence.py --provider codex --youtube
- python -m pytest backend/tests
- npm run test:e2e from app

Live checks use the operator's installed, authenticated CLI. They use disposable
databases and keep evaluation artifacts in ignored local storage. Browser checks
cover real local household persistence on desktop and phone. Model responses and
map listings in the assisted browser scenarios use fixtures; the graph, task
application and adapter contracts have separate backend and live checks.
