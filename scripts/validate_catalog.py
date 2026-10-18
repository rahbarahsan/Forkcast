"""Validate the shared catalog and independently reconcile its grocery totals."""

import json
import re
import sys
import tempfile
from collections import defaultdict
from decimal import Decimal
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "backend"))
from database import Database  # noqa: E402
from groceries import CATEGORIES, InterpretedLine, generate  # noqa: E402
from models import RecipeInput  # noqa: E402


def validate():
    catalog = json.loads((ROOT / "datasets/catalog.json").read_text(encoding="utf8"))
    recipes = catalog["recipes"]
    assert len(recipes) >= 50
    assert len({recipe["id"] for recipe in recipes}) == len(recipes)
    assert len({recipe["title"] for recipe in recipes}) == len(recipes)
    assert len({recipe["source_url"] for recipe in recipes}) == len(recipes)
    publishers = {recipe["source_name"] for recipe in recipes}
    cuisines = {recipe["cuisine"] for recipe in recipes}
    assert len(publishers) >= 5 and len(cuisines) >= 8
    lookup = {row["canonical"]: row for row in catalog["ingredient_lookup"]}
    rows = catalog["grocery_items_per_recipe"]
    factors = {
        "kg": (1000, "g"),
        "l": (1000, "ml"),
        "cup": (240, "ml"),
        "tbsp": (15, "ml"),
        "tsp": (5, "ml"),
        "oz": ("28.349523125", "g"),
        "lb": ("453.59237", "g"),
    }
    gold = defaultdict(lambda: defaultdict(Decimal))
    included = 0
    for recipe in recipes:
        RecipeInput.model_validate(
            {key: recipe[key] for key in RecipeInput.model_fields if key in recipe}
        )
        assert recipe["source_url"].startswith("https://")
        assert recipe["source_name"] and recipe["halal_notes"] and recipe["source_notes"]
        assert not re.search(
            r"\b(pork|bacon|lard|vodka|rum|beer)\b", " ".join(recipe["ingredients"]), re.I
        )
        prepared = [row for row in rows if row["recipe_id"] == recipe["id"]]
        assert sorted(row["index"] for row in prepared) == list(range(len(recipe["ingredients"])))
        names = {row["name"] for row in prepared}
        for row in prepared:
            InterpretedLine.model_validate(
                {key: value for key, value in row.items() if key not in {"raw_text", "recipe_id"}}
            )
            assert row["raw_text"] == recipe["ingredients"][row["index"]]
            assert row["name"] in lookup
            assert row["category"] in CATEGORIES
            assert lookup[row["name"]]["category"] == row["category"]
            if row.get("provided_by"):
                assert row["provided_by"] in names and row["provided_by"] != row["name"]
                continue
            if row["name"] == "water":
                continue
            assert row["category"] != "Other", row
            included += 1
            quantity = Decimal(str(row["quantity"] or 0))
            factor, unit = factors.get(row["unit"], (1, row["unit"]))
            if not quantity:
                unit = "unspecified"
            gold[row["name"]][unit] += quantity * Decimal(str(factor))
    expected = {
        name: {unit: round(float(quantity), 4) for unit, quantity in units.items()}
        for name, units in gold.items()
    }
    scratch = ROOT / "data/local/catalog-validation"
    scratch.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(dir=scratch) as directory:
        db = Database(Path(directory) / "catalog.sqlite3")
        db.initialize()
        result = generate(db, db.recipes(), [], "local")
        assert result["raw"] == expected, (
            "Grocery arithmetic differs from the independent dataset reconciliation"
        )
        assert not result["warnings"], result["warnings"]
        assert sum(len(item["sources"]) for item in result["items"]) == included
        for recipe in db.recipes():
            individual = generate(db, [recipe], [], "local")
            assert individual["items"] and not individual["warnings"], recipe["title"]
    return {
        "recipes": len(recipes),
        "publishers": len(publishers),
        "cuisines": len(cuisines),
        "prepared_lines": len(rows),
        "purchase_source_lines": included,
        "distinct_grocery_items": len(expected),
        "arithmetic_reconciled": True,
    }


if __name__ == "__main__":
    print(json.dumps(validate(), indent=2))
