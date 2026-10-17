import json

import assistant
import groceries
import providers
import stores


def recipe(client, lines):
    response = client.post(
        "/api/recipes",
        json={"title": "Quality dinner", "ingredients": lines, "instructions": "Cook carefully."},
    )
    assert response.status_code == 201
    return response.json()["id"]


def test_quantity_stock_scaling_and_provenance(client):
    identifier = recipe(
        client, ["500 g rice", "2 onions", "1 tbsp olive oil", "200 ml water", "salt to taste"]
    )
    client.post("/api/pantry", json={"name": "rice", "quantity": "200 g"})
    result = client.post(
        "/api/grocery-list", json={"recipe_ids": [identifier], "scale": {identifier: 2}}
    ).json()
    assert result["raw"]["rice"] == {"g": 800}
    assert result["raw"]["onion"] == {"pcs": 4}
    assert result["raw"]["olive oil"] == {"ml": 30}
    assert "water" not in result["raw"]
    assert (
        next(item for item in result["items"] if item["name"] == "rice")["sources"][0]["line"]
        == "500 g rice"
    )
    assert result["pantry_deductions"][0]["quantity"] == 200
    assert (
        client.post(
            "/api/grocery-list", json={"recipe_ids": [identifier], "scale": {identifier: -1}}
        ).status_code
        == 422
    )


def test_incompatible_stock_never_hides_purchase(client):
    identifier = recipe(client, ["500 g flour"])
    result = client.post(
        "/api/grocery-list",
        json={
            "recipe_ids": [identifier],
            "pantry_items": [{"name": "flour", "quantity": "2 cups"}],
        },
    ).json()
    assert result["raw"]["flour"] == {"g": 500}
    assert result["warnings"]


def test_semantic_interpretation_cache_and_measure_guard(client, monkeypatch):
    identifier = recipe(client, ["2 cloves garlic, minced", "1 tsp ground cumin"])
    monkeypatch.setattr(
        groceries,
        "configuration",
        lambda: {"available": True, "provider": "codex", "model": "test"},
    )
    output = {
        "lines": [
            {"index": 0, "name": "garlic", "quantity": 2, "unit": "clove", "category": "Produce"},
            {
                "index": 1,
                "name": "ground cumin",
                "quantity": 1,
                "unit": "tsp",
                "category": "Spices & seasonings",
            },
        ]
    }
    calls = []
    monkeypatch.setattr(groceries, "complete", lambda *_: calls.append(1) or output)
    first = client.post(
        "/api/grocery-list", json={"recipe_ids": [identifier], "intelligence": "model"}
    ).json()
    assert first["raw"]["ground cumin"] == {"ml": 5}
    assert first["categorized"]["Produce"] == ["garlic"]
    client.post("/api/grocery-list", json={"recipe_ids": [identifier], "intelligence": "model"})
    assert len(calls) == 1
    client.put(
        "/api/recipes/" + identifier,
        json={
            "title": "Edited dinner",
            "ingredients": ["3 cloves garlic"],
            "instructions": "Cook.",
        },
    )
    monkeypatch.setattr(
        groceries,
        "complete",
        lambda *_: {
            "lines": [
                {
                    "index": 0,
                    "name": "garlic",
                    "quantity": 30,
                    "unit": "clove",
                    "category": "Produce",
                }
            ]
        },
    )
    failed = client.post(
        "/api/grocery-list", json={"recipe_ids": [identifier], "intelligence": "model"}
    ).json()
    assert failed["raw"]["garlic"] == {"clove": 3}
    assert any("changed an explicit measure" in warning for warning in failed["warnings"])


def test_model_must_cover_all_lines(client, monkeypatch):
    identifier = recipe(client, ["100 g rice", "2 eggs"])
    monkeypatch.setattr(
        groceries,
        "configuration",
        lambda: {"available": True, "provider": "codex", "model": "test"},
    )
    monkeypatch.setattr(
        groceries,
        "complete",
        lambda *_: {
            "lines": [
                {
                    "index": 0,
                    "name": "rice",
                    "quantity": 100,
                    "unit": "g",
                    "category": "Grains & bakery",
                }
            ]
        },
    )
    result = client.post("/api/grocery-list", json={"recipe_ids": [identifier]}).json()
    assert result["raw"]["egg"] == {"pcs": 2}
    assert result["warnings"]


def test_assistant_review_apply_once_and_cancel(client, monkeypatch):
    monkeypatch.setattr(
        assistant,
        "complete",
        lambda *_: {
            "message": "I prepared your pantry update. Review it below.",
            "actions": [{"tool": "add_pantry", "items": [{"name": "rice", "quantity": "500 g"}]}],
        },
    )
    conversation = client.post("/api/chat", json={"message": "Add 500 g rice to my pantry"}).json()
    task = conversation["messages"][-1]["task_id"]
    assert client.get("/api/pantry").json() == []
    assert client.post("/api/tasks/" + task + "/apply").json()["status"] == "applied"
    assert client.post("/api/tasks/" + task + "/apply").json()["status"] == "applied"
    assert len(client.get("/api/pantry").json()) == 1
    again = client.post(
        "/api/chat", json={"message": "Add rice again", "conversation_id": conversation["id"]}
    ).json()
    pending = again["messages"][-1]["task_id"]
    assert client.post("/api/tasks/" + pending + "/cancel").json()["status"] == "cancelled"
    assert client.post("/api/tasks/" + pending + "/apply").json()["status"] == "cancelled"
    assert len(client.get("/api/pantry").json()) == 1


def test_assistant_rejects_stale_or_unknown_plan(client, monkeypatch):
    identifier = client.get("/api/recipes").json()[0]["id"]
    monkeypatch.setattr(
        assistant,
        "complete",
        lambda *_: {
            "message": "Review plan.",
            "actions": [
                {"tool": "create_plan", "plan": {"name": "Dinner", "recipeIds": [identifier]}}
            ],
        },
    )
    preview = client.post("/api/chat", json={"message": "Plan dinner"}).json()
    client.post("/api/pantry", json={"name": "tomato"})
    assert (
        client.post("/api/tasks/" + preview["messages"][-1]["task_id"] + "/apply").status_code
        == 409
    )
    assert client.get("/api/plans").json() == []
    monkeypatch.setattr(
        assistant,
        "complete",
        lambda *_: {
            "message": "Review plan.",
            "actions": [
                {"tool": "create_plan", "plan": {"name": "Dinner", "recipeIds": ["invented"]}}
            ],
        },
    )
    assert client.post("/api/chat", json={"message": "Plan dinner"}).status_code == 422


def test_store_search_is_cached_and_keeps_evidence(client, monkeypatch):
    calls = []

    def fetch(url, hosts):
        calls.append(url)
        if "nominatim" in url:
            return [{"lat": "43.7", "lon": "-79.4", "display_name": "Toronto, Canada"}]
        return {
            "elements": [
                {
                    "type": "node",
                    "id": 42,
                    "lat": 43.701,
                    "lon": -79.4,
                    "tags": {"name": "Test grocery", "shop": "supermarket"},
                }
            ]
        }

    monkeypatch.setattr(stores, "read_json", fetch)
    result = client.post("/api/stores/search", json={"location": "Toronto, Canada"}).json()
    assert result["stores"][0]["halal"] == "unknown"
    assert result["stores"][0]["distance_km"] > 0
    assert result["stores"][0]["url"] == "https://www.openstreetmap.org/node/42"
    assert client.post("/api/stores/search", json={"location": "Toronto, Canada"}).json()["cached"]
    assert len(calls) == 2


def test_store_ranking_does_not_call_partial_basket_cheapest(client):
    identifier = recipe(client, ["1 kg rice", "2 eggs"])
    for store, name, price, quantity, unit in [
        ("A", "rice", 1, 1000, "g"),
        ("B", "rice", 3, 1000, "g"),
        ("B", "egg", 2, 2, "pcs"),
    ]:
        assert (
            client.post(
                "/api/offers",
                json={
                    "store": store,
                    "name": name,
                    "price": price,
                    "quantity": quantity,
                    "unit": unit,
                },
            ).status_code
            == 201
        )
    result = client.post("/api/stores/recommend", json={"recipe_ids": [identifier]}).json()
    assert result["recommendation"] == "B"
    assert result["stores"][0]["complete"]
    assert result["stores"][1]["unpriced_lines"] == 1


def test_local_model_settings_keep_keys_out_of_storage(client, monkeypatch, tmp_path):
    monkeypatch.delenv("FORKCAST_MODEL_PROVIDER")
    monkeypatch.setattr(providers, "SETTINGS", tmp_path / "models.json")
    result = client.put("/api/models/config", json={"provider": "none", "model": ""})
    assert result.status_code == 200
    assert json.loads(providers.SETTINGS.read_text()) == {"provider": "none", "model": ""}
    assert client.put("/api/models/config", json={"provider": "openrouter"}).status_code == 422
    assert (
        client.put(
            "/api/models/config", json={"provider": "openai", "api_key": "secret"}
        ).status_code
        == 422
    )
