"""Local household API. Start with uvicorn main:app --host 127.0.0.1."""

import logging
import os
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, HTTPException, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

try:
    from .aggregator import SmartGroceryAggregator
    from .database import Database
    from .imports import recipe_preview
    from .kitchen import optimize, pantry_preview, suggestions
    from .models import (
        ActivePlan,
        ExtractInput,
        GroceryRequest,
        GroceryResponse,
        HistoryInput,
        OfferBatch,
        OfferInput,
        OptimizeRequest,
        PantryBatch,
        PantryInput,
        PlanInput,
        RecipeInput,
        TextImport,
    )
    from .providers import ProviderError, configuration, extract
except ImportError:
    from aggregator import SmartGroceryAggregator
    from database import Database
    from imports import recipe_preview
    from kitchen import optimize, pantry_preview, suggestions
    from models import (
        ActivePlan,
        ExtractInput,
        GroceryRequest,
        GroceryResponse,
        HistoryInput,
        OfferBatch,
        OfferInput,
        OptimizeRequest,
        PantryBatch,
        PantryInput,
        PlanInput,
        RecipeInput,
        TextImport,
    )
    from providers import ProviderError, configuration, extract

logger = logging.getLogger(__name__)
ROOT = Path(__file__).resolve().parents[1]


def create_app(database_path=None):
    db = Database(
        database_path or os.getenv("FORKCAST_DATABASE", ROOT / "data/local/forkcast.sqlite3")
    )

    @asynccontextmanager
    async def lifespan(app):
        db.initialize()
        yield

    app = FastAPI(title="Forkcast", version="2.0.0", lifespan=lifespan)
    app.state.db = db
    origins = [
        o.strip()
        for o in os.getenv(
            "FORKCAST_ORIGINS", "http://localhost:8081,http://localhost:19006,http://127.0.0.1:8081"
        ).split(",")
        if o.strip()
    ]
    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_methods=["GET", "POST", "PUT", "DELETE"],
        allow_headers=["Content-Type"],
    )

    @app.middleware("http")
    async def restrict_browser_writes(request: Request, call_next):
        if (
            request.method not in ("GET", "HEAD", "OPTIONS")
            and request.headers.get("origin")
            and request.headers["origin"] not in origins
        ):
            return JSONResponse({"detail": "This browser origin is not allowed"}, status_code=403)
        return await call_next(request)

    @app.exception_handler(Exception)
    async def unexpected(request, exc):
        logger.exception("Request failed: %s %s", request.method, request.url.path)
        return JSONResponse(
            {"detail": "The request could not be completed. Check the server logs."},
            status_code=500,
        )

    def require(kind, record_id):
        record = db.get(kind, record_id)
        if record is None:
            raise HTTPException(404, "Record not found")
        return record

    def validate_recipe_ids(ids):
        known = {r["id"] for r in db.recipes()}
        if set(ids) - known:
            raise HTTPException(422, "One or more recipes no longer exist")

    @app.get("/api/health")
    def health():
        return {"status": "ok", "storage": "sqlite", "version": "2.0.0"}

    @app.get("/api/models/config")
    def model_configuration():
        return configuration()

    @app.post("/api/extract")
    def extract_preview(body: ExtractInput):
        try:
            return extract(body.task, body.text, body.image)
        except ProviderError as exc:
            raise HTTPException(422, str(exc))

    @app.get("/api/recipes")
    def recipes():
        return db.recipes()

    @app.post("/api/recipes", status_code=201)
    def add_recipe(body: RecipeInput):
        return db.save("recipe", body.model_dump())

    @app.post("/api/import/recipe")
    def preview_recipe(body: TextImport):
        try:
            return recipe_preview(body.text).model_dump()
        except (ValueError, KeyError, TypeError, StopIteration, IndexError):
            raise HTTPException(
                422,
                "Cannot parse recipe. Include a title, Ingredients and Instructions headings, or valid recipe JSON.",
            )

    @app.put("/api/recipes/{recipe_id}")
    def edit_recipe(recipe_id: str, body: RecipeInput):
        validate_recipe_ids([recipe_id])
        return db.save("recipe", body.model_dump(), recipe_id)

    @app.delete("/api/recipes/{recipe_id}", status_code=204)
    def delete_recipe(recipe_id: str):
        if not db.delete("recipe", recipe_id):
            raise HTTPException(
                409,
                "Reference recipes are part of the seed catalog; edit to create a personal override",
            )
        if any(r["id"] == recipe_id for r in db.recipes()):
            return Response(status_code=204)
        for plan in db.list("plan"):
            plan["recipeIds"] = [r for r in plan["recipeIds"] if r != recipe_id]
            db.save("plan", plan, plan["id"])
        return Response(status_code=204)

    @app.get("/api/pantry")
    def pantry():
        return db.list("pantry")

    @app.post("/api/pantry", status_code=201)
    def add_pantry(body: PantryInput):
        return db.save("pantry", body.model_dump())

    @app.put("/api/pantry/{item_id}")
    def edit_pantry(item_id: str, body: PantryInput):
        require("pantry", item_id)
        return db.save("pantry", body.model_dump(), item_id)

    @app.delete("/api/pantry/{item_id}", status_code=204)
    def delete_pantry(item_id: str):
        require("pantry", item_id)
        db.delete("pantry", item_id)
        return Response(status_code=204)

    @app.get("/api/plans")
    def plans():
        return db.list("plan")

    @app.post("/api/plans", status_code=201)
    def add_plan(body: PlanInput):
        validate_recipe_ids(body.recipeIds)
        return db.save_plan(body.model_dump(mode="json"))

    @app.put("/api/plans/active")
    def activate_plan(body: ActivePlan):
        if body.id:
            require("plan", body.id)
        db.activate_plan(body.id)
        return db.list("plan")

    @app.put("/api/plans/{plan_id}")
    def edit_plan(plan_id: str, body: PlanInput):
        require("plan", plan_id)
        validate_recipe_ids(body.recipeIds)
        return db.save_plan(body.model_dump(mode="json"), plan_id)

    @app.delete("/api/plans/{plan_id}", status_code=204)
    def delete_plan(plan_id: str):
        require("plan", plan_id)
        db.delete("plan", plan_id)
        return Response(status_code=204)

    @app.post("/api/grocery-list", response_model=GroceryResponse)
    def groceries(body: GroceryRequest):
        ids = set(body.recipe_ids + body.selected_ids)
        for plan_id in body.plan_ids:
            ids.update(require("plan", plan_id)["recipeIds"])
        validate_recipe_ids(ids)
        chosen = [r for r in db.recipes() if r["id"] in ids]
        pantry_items = body.pantry_items if body.pantry_items is not None else db.list("pantry")
        categorized, raw = SmartGroceryAggregator(
            chosen, pantry_items, db.lookup(), db.preprocessed(ids)
        ).generate()
        return {"categorized": categorized, "raw": raw}

    @app.get("/api/history")
    def history():
        return list(reversed(db.list("history")))

    @app.get("/api/suggestions")
    def recipe_suggestions():
        recipes = db.recipes()
        return suggestions(
            recipes, db.list("pantry"), db.lookup(), db.preprocessed([r["id"] for r in recipes])
        )

    @app.get("/api/ingredients/{name}")
    def ingredient_insights(name: str):
        from_name = next((r for r in db.lookup() if r["canonical"] == name), None)
        return {
            "name": name,
            "lookup": from_name,
            "recipes": [
                {
                    "id": r["id"],
                    "title": r["title"],
                    "lines": [line for line in r["ingredients"] if name.lower() in line.lower()],
                }
                for r in db.recipes()
                if any(name.lower() in line.lower() for line in r["ingredients"])
            ],
            "quantity_note": "Weight and volume are kept separate. Pantry presence removes an ingredient entirely.",
        }

    @app.post("/api/import/pantry")
    def preview_pantry(body: TextImport):
        return {"items": pantry_preview(body.text)}

    @app.post("/api/pantry/batch", status_code=201)
    def save_pantry_batch(body: PantryBatch):
        return db.save_many("pantry", [item.model_dump() for item in body.items])

    @app.get("/api/offers")
    def offers():
        return db.list("offer")

    @app.post("/api/offers", status_code=201)
    def add_offer(body: OfferInput):
        return db.save("offer", body.model_dump(mode="json"))

    @app.post("/api/offers/batch", status_code=201)
    def add_offers(body: OfferBatch):
        return db.save_many("offer", [offer.model_dump(mode="json") for offer in body.items])

    @app.delete("/api/offers/{offer_id}", status_code=204)
    def delete_offer(offer_id: str):
        require("offer", offer_id)
        db.delete("offer", offer_id)
        return Response(status_code=204)

    @app.post("/api/optimize")
    def optimize_groceries(body: OptimizeRequest):
        grocery = groceries(GroceryRequest.model_validate(body.model_dump(exclude={"currency"})))
        return optimize(grocery, db.list("offer"), db.lookup(), body.currency)

    @app.post("/api/history", status_code=201)
    def save_history(body: HistoryInput):
        return db.save("history", body.model_dump())

    @app.delete("/api/history/{history_id}", status_code=204)
    def delete_history(history_id: str):
        require("history", history_id)
        db.delete("history", history_id)
        return Response(status_code=204)

    return app


app = create_app()
