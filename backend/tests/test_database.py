import json
from pathlib import Path

from database import Database

CATALOG = json.loads(
    (Path(__file__).resolve().parents[2] / "datasets/catalog.json").read_text(encoding="utf8")
)


def test_catalog_refresh_preserves_personal_data(tmp_path):
    db = Database(tmp_path / "catalog.sqlite3")
    db.initialize()
    recipe = db.recipes()[0]
    private = db.save("recipe", {**recipe, "title": "My own version"}, recipe["id"])
    with db.connect() as conn:
        conn.execute(
            "UPDATE catalog_recipes SET data=? WHERE id=?",
            ('{"id":"' + recipe["id"] + '","title":"Outdated reference"}', recipe["id"]),
        )
    db.initialize()
    assert db.get("recipe", private["id"])["title"] == "My own version"
    db.delete("recipe", private["id"])
    assert next(r for r in db.recipes() if r["id"] == recipe["id"])["title"] == recipe["title"]


def test_seed_is_idempotent_and_personal_records_survive_restart(tmp_path):
    path = tmp_path / "household.sqlite3"
    db = Database(path)
    db.initialize()
    assert len(db.recipes()) == len(CATALOG["recipes"])
    personal = db.save("recipe", {"title": "Family dinner", "ingredients": ["2 eggs"]})
    restarted = Database(path)
    restarted.initialize()
    assert len(restarted.recipes()) == len(CATALOG["recipes"]) + 1
    assert restarted.get("recipe", personal["id"])["title"] == "Family dinner"
    assert len(restarted.lookup()) == len(CATALOG["ingredient_lookup"])
    assert restarted.preprocessed([db.recipes()[0]["id"]])


def test_personal_override_does_not_reuse_stale_catalog_ingredients(tmp_path):
    db = Database(tmp_path / "test.sqlite3")
    db.initialize()
    recipe = db.recipes()[0]
    db.save("recipe", {**recipe, "ingredients": ["1 kg rice"]}, recipe["id"])
    assert db.preprocessed([recipe["id"]]) == {}
    assert next(r for r in db.recipes() if r["id"] == recipe["id"])["ingredients"] == ["1 kg rice"]


def test_retiring_reference_catalog_preserves_personal_overrides_and_plan_recipes(tmp_path):
    db = Database(tmp_path / "upgrade.sqlite3")
    db.initialize()
    with db.connect() as conn:
        for identifier in ("referenced", "overridden", "unused"):
            conn.execute(
                "INSERT INTO catalog_recipes VALUES (?,?)",
                (
                    identifier,
                    json.dumps(
                        {
                            "id": identifier,
                            "title": "Old recipe",
                            "ingredients": ["2 eggs"],
                            "instructions": "Cook.",
                        }
                    ),
                ),
            )
    db.save("recipe", {"title": "Personal version", "ingredients": ["3 eggs"]}, "overridden")
    db.save_plan({"name": "Existing plan", "recipeIds": ["referenced"], "isActive": True})
    db.initialize()
    db.initialize()
    assert db.get("recipe", "referenced")["title"] == "Old recipe"
    assert "not been reviewed" in db.get("recipe", "referenced")["halal_notes"]
    assert db.get("recipe", "overridden")["title"] == "Personal version"
    assert not any(recipe["id"] == "unused" for recipe in db.recipes())
    assert db.list("plan")[0]["recipeIds"] == ["referenced"]
