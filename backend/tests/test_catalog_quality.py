import json
from pathlib import Path

from aggregator import IngredientCatalog


def test_catalog_covers_sources_and_prepared_purchase_lines():
    data = json.loads(
        (Path(__file__).resolve().parents[2] / "datasets/catalog.json").read_text(encoding="utf8")
    )
    assert len(data["recipes"]) >= 50
    assert len({recipe["source_name"] for recipe in data["recipes"]}) >= 5
    for recipe in data["recipes"]:
        rows = [row for row in data["grocery_items_per_recipe"] if row["recipe_id"] == recipe["id"]]
        assert sorted(row["index"] for row in rows) == list(range(len(recipe["ingredients"])))
        assert all(row["raw_text"] == recipe["ingredients"][row["index"]] for row in rows)
        assert recipe["source_url"].startswith("https://")
        assert recipe["halal_notes"]


def test_lookup_keeps_distinct_food_forms_and_only_merges_true_synonyms():
    catalog = IngredientCatalog()
    assert catalog.canonical("green onions") == catalog.canonical("scallions")
    assert catalog.canonical("cilantro") == catalog.canonical("coriander leaves")
    assert catalog.canonical("canned chickpeas") != catalog.canonical("dried chickpeas")
    assert catalog.canonical("ground cumin") != catalog.canonical("cumin seeds")
    assert catalog.canonical("cooked white rice") != catalog.canonical("basmati rice")
    assert catalog.canonical("olive oil") != catalog.canonical("mustard oil")
