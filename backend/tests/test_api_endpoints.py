from fastapi.testclient import TestClient
from main import create_app

RECIPE = {
    "title": "Family rice",
    "ingredients": ["1 kg rice", "2 onions"],
    "instructions": "Cook everything.",
}


def test_local_household_workflow_survives_restart(tmp_path):
    path = tmp_path / "household.sqlite3"
    with TestClient(create_app(path)) as client:
        assert client.get("/api/health").json()["storage"] == "sqlite"
        assert len(client.get("/api/recipes").json()) == 50
        response = client.post("/api/recipes", json=RECIPE)
        assert response.status_code == 201
        recipe = response.json()
        pantry = client.post("/api/pantry", json={"name": "onion", "quantity": "1"}).json()
        plan = client.post(
            "/api/plans", json={"name": "This week", "recipeIds": [recipe["id"]]}
        ).json()
        assert plan["isActive"]
        grocery = client.post("/api/grocery-list", json={"plan_ids": [plan["id"]]}).json()
        assert grocery["raw"] == {"onion": {"pcs": 1.0}, "rice": {"g": 1000.0}}
        saved = client.post(
            "/api/history",
            json={
                "name": "Weekly shop",
                "grocery_list": grocery,
                "recipe_ids": [recipe["id"]],
                "checked": ["rice"],
            },
        )
        assert saved.status_code == 201
    with TestClient(create_app(path)) as client:
        assert len(client.get("/api/recipes").json()) == 51
        assert client.get("/api/pantry").json()[0]["id"] == pantry["id"]
        assert client.get("/api/plans").json()[0]["id"] == plan["id"]
        assert client.get("/api/history").json()[0]["checked"] == ["rice"]
        assert client.delete("/api/recipes/" + recipe["id"]).status_code == 204
        assert client.get("/api/plans").json()[0]["recipeIds"] == []


def test_validation_and_browser_origin_boundary(client):
    assert client.post("/api/recipes", json={**RECIPE, "title": " "}).status_code == 422
    assert client.post("/api/plans", json={"recipeIds": ["unknown"]}).status_code == 422
    assert (
        client.post(
            "/api/plans", json={"startDate": "2026-10-20", "endDate": "2026-10-01"}
        ).status_code
        == 422
    )
    assert (
        client.post(
            "/api/pantry", json={"name": "rice"}, headers={"Origin": "https://untrusted.example"}
        ).status_code
        == 403
    )
    empty = client.post("/api/grocery-list", json={"recipe_ids": []}).json()
    assert empty["categorized"] == {} and empty["raw"] == {} and empty["items"] == []


def test_activating_plan_is_exclusive(client):
    first = client.post("/api/plans", json={"name": "First"}).json()
    second = client.post("/api/plans", json={"name": "Second"}).json()
    plans = client.put("/api/plans/active", json={"id": second["id"]}).json()
    assert [p["id"] for p in plans if p["isActive"]] == [second["id"]]
    assert client.get("/api/plans").json()[0]["id"] == first["id"]


def test_catalog_edits_are_personal_overrides(client):
    original = client.get("/api/recipes").json()[0]
    updated = client.put("/api/recipes/" + original["id"], json=RECIPE)
    assert updated.status_code == 200
    grocery = client.post("/api/grocery-list", json={"recipe_ids": [original["id"]]}).json()
    assert grocery["raw"]["rice"]["g"] == 1000
    assert client.delete("/api/recipes/" + original["id"]).status_code == 204
    assert client.get("/api/recipes").json()[0]["title"] == original["title"]


def test_import_preview_never_persists_until_saved(client):
    text = (
        "Lemon rice\nIngredients\n1 cup rice\n1 lemon\nInstructions\nCook rice, then stir in lemon."
    )
    preview = client.post("/api/import/recipe", json={"text": text})
    assert preview.status_code == 200
    assert preview.json()["ingredients"] == ["1 cup rice", "1 lemon"]
    assert len(client.get("/api/recipes").json()) == 50
    assert client.post("/api/recipes", json=preview.json()).status_code == 201
    assert len(client.get("/api/recipes").json()) == 51
    assert client.post("/api/import/recipe", json={"text": "not a recipe"}).status_code == 422


def test_pantry_scan_review_coverage_and_offer_comparison(client):
    preview = client.post("/api/import/pantry", json={"text": "2 kg rice\n3 tomatoes"}).json()
    assert preview["items"][0] == {"name": "rice", "quantity": "2 kg"}
    assert client.get("/api/pantry").json() == []
    assert client.post("/api/pantry/batch", json=preview).status_code == 201
    assert any(r["coverage"] > 0 for r in client.get("/api/suggestions").json())
    recipe = client.post(
        "/api/recipes",
        json={"title": "Garlic", "ingredients": ["5 cloves garlic"], "instructions": "Roast."},
    ).json()
    offer = {
        "name": "garlic",
        "store": "Market",
        "price": 2.50,
        "quantity": 3,
        "unit": "clove",
        "currency": "CAD",
    }
    assert client.post("/api/offers", json=offer).status_code == 201
    assert (
        client.post(
            "/api/offers",
            json={**offer, "store": "Old deal", "price": 0.5, "valid_until": "2000-01-01"},
        ).status_code
        == 201
    )
    assert (
        client.post("/api/offers", json={**offer, "currency": "USD", "price": 0.1}).status_code
        == 201
    )
    result = client.post(
        "/api/optimize", json={"recipe_ids": [recipe["id"]], "currency": "CAD"}
    ).json()
    assert result["total"] == 5
    assert result["items"][0]["packs"] == 2
    assert result["unpriced"] == []
    assert client.post("/api/offers", json={**offer, "quantity": 0}).status_code == 422
