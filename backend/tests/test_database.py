from database import Database


def test_catalog_refresh_preserves_personal_data(tmp_path):
    db = Database(tmp_path / 'catalog.sqlite3')
    db.initialize()
    recipe = db.recipes()[0]
    private = db.save('recipe', {**recipe, 'title': 'My own version'}, recipe['id'])
    with db.connect() as conn:
        conn.execute('UPDATE catalog_recipes SET data=? WHERE id=?', ('{"id":"'+recipe['id']+'","title":"Outdated reference"}', recipe['id']))
    db.initialize()
    assert db.get('recipe', private['id'])['title'] == 'My own version'
    db.delete('recipe', private['id'])
    assert next(r for r in db.recipes() if r['id'] == recipe['id'])['title'] == recipe['title']


def test_seed_is_idempotent_and_personal_records_survive_restart(tmp_path):
    path = tmp_path / "household.sqlite3"
    db = Database(path)
    db.initialize()
    assert len(db.recipes()) == 6
    personal = db.save("recipe", {"title": "Family dinner", "ingredients": ["2 eggs"]})
    restarted = Database(path)
    restarted.initialize()
    assert len(restarted.recipes()) == 7
    assert restarted.get("recipe", personal["id"])["title"] == "Family dinner"
    assert len(restarted.lookup()) == 45
    assert restarted.preprocessed([db.recipes()[0]["id"]])


def test_personal_override_does_not_reuse_stale_catalog_ingredients(tmp_path):
    db = Database(tmp_path / "test.sqlite3")
    db.initialize()
    recipe = db.recipes()[0]
    db.save("recipe", {**recipe, "ingredients": ["1 kg rice"]}, recipe["id"])
    assert db.preprocessed([recipe["id"]]) == {}
    assert next(r for r in db.recipes() if r["id"] == recipe["id"])["ingredients"] == ["1 kg rice"]
