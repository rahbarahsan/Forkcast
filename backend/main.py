# main.py

import sys
from typing import Optional

from fastapi import FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware

# Windows consoles default to cp1252, which cannot encode the emoji used in the
# debug logging below. Without this, a print() raises UnicodeEncodeError, the
# handler re-prints the same characters via format_exc(), and the request dies
# as a 500 that looks nothing like an encoding problem.
for _stream in (sys.stdout, sys.stderr):
    if hasattr(_stream, "reconfigure"):
        _stream.reconfigure(encoding="utf-8", errors="replace")

# Handle imports for both direct execution and module import
try:
    from .models import GroceryRequest, GroceryResponse, Recipe, PantryItem
    from .supabase_client import supabase, client_for_token, user_id_from_token
    from .aggregator import SmartGroceryAggregator
except ImportError:
    from models import GroceryRequest, GroceryResponse, Recipe, PantryItem
    from supabase_client import supabase, client_for_token, user_id_from_token
    from aggregator import SmartGroceryAggregator


def _bearer_token(authorization: Optional[str]) -> Optional[str]:
    """Pull the raw JWT out of an `Authorization: Bearer <token>` header."""
    if not authorization:
        return None
    scheme, _, token = authorization.partition(" ")
    if scheme.lower() != "bearer" or not token.strip():
        return None
    return token.strip()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/api/grocery-list", response_model=GroceryResponse)
async def generate_grocery_list(
    req: GroceryRequest,
    authorization: Optional[str] = Header(default=None),
):
    try:
        recipes = []
        pantry_items = req.pantry_items or []

        print(f"DEBUG: Request: {req}")

        token = _bearer_token(authorization)
        user_id = user_id_from_token(token) if token else None

        # A request claiming to be signed in must prove it. Note the check is on
        # the verified token, not on req.is_guest, which any caller can set.
        if not req.is_guest and user_id is None:
            raise HTTPException(
                status_code=401,
                detail="A valid Authorization bearer token is required for signed-in requests",
            )

        if user_id is not None:
            # Query as the user so RLS returns only their rows. Nothing here
            # filters by a client-supplied id.
            user_db = client_for_token(token)

            plan_response = user_db.table("plans").select("*").execute()
            plan_data = plan_response.data or []
            plan_recipe_ids = set()
            for plan in plan_data:
                plan_recipe_ids.update(plan.get("recipe_ids") or [])

            pantry_response = user_db.table("pantry").select("*").execute()
            pantry_data = pantry_response.data or []
            pantry_items = [
                PantryItem(id=item.get("id"), name=item["name"], quantity=item.get("quantity"))
                for item in pantry_data
            ]

            # Recipes the client explicitly asked for take precedence, so a
            # signed-in user can still build a list from an ad-hoc selection.
            requested_ids = set(req.recipe_ids or []) | set(req.selected_ids or [])
            wanted_ids = requested_ids or plan_recipe_ids

            recipe_response = supabase.table("recipes").select("*").execute()
            all_recipes = recipe_response.data or []
            recipes = [Recipe(**r) for r in all_recipes if r["id"] in wanted_ids]

        else:
            selected_ids = set(req.selected_ids or [])
            plan_ids = set(req.plan_ids or [])
            recipe_ids = set(req.recipe_ids or [])
            print("🧾 selected_ids:", selected_ids)
            print("📦 plan_ids:", plan_ids)
            print("📘 recipe_ids:", recipe_ids)


            if not selected_ids and not plan_ids and not recipe_ids:
                return GroceryResponse(categorized={}, raw={})

            recipe_response = supabase.table("recipes").select("*").execute()
            all_recipes = recipe_response.data or []

            plan_recipe_ids = set()
            if plan_ids:
                # In guest mode, assume planner passed plan -> recipe_ids mapping from memory
                # So don't fetch from Supabase
                print("Guest mode: skipping Supabase plan fetch, expecting frontend to pass recipe_ids")


            all_recipe_ids = selected_ids.union(recipe_ids).union(plan_recipe_ids)
            recipes = [Recipe(**r) for r in all_recipes if r["id"] in all_recipe_ids]

            if recipe_ids and not recipes:
                for recipe_id in recipe_ids:
                    try:
                        recipe_response = supabase.table("recipes").select("*").eq("id", recipe_id).execute()
                        if recipe_response.data:
                            recipes.append(Recipe(**recipe_response.data[0]))
                    except Exception as e:
                        print(f"DEBUG: Error fetching recipe {recipe_id}: {str(e)}")

        for recipe in recipes:
            if not hasattr(recipe, 'ingredients') or not isinstance(recipe.ingredients, list):
                raise ValueError(f"Invalid recipe format: {recipe}. 'ingredients' must be a list.")

        print(f"DEBUG: Pantry items detail: {[{'id': p.id, 'name': p.name, 'quantity': p.quantity} for p in pantry_items]}")
        print(f"DEBUG: Processing {len(recipes)} recipes with IDs: {[r.id for r in recipes if hasattr(r, 'id')]}")

        try:
            # The SmartGroceryAggregator will now fetch pre-processed ingredients from grocery_items_per_recipe table
            aggregator = SmartGroceryAggregator(recipes, pantry_items)
            categorized, raw = aggregator.generate()
        except Exception as agg_error:
            raise ValueError(f"Error in SmartGroceryAggregator: {str(agg_error)}")

        raw_dict = raw if isinstance(raw, dict) else {ingredient: {"kg": 1.0} for ingredient in raw}
        return GroceryResponse(categorized=categorized, raw=raw_dict)

    except HTTPException:
        # Deliberate responses (e.g. the 401 above) must not be rewritten as 500s
        # by the catch-all below.
        raise
    except Exception as e:
        import traceback
        print(f"DEBUG: Error in generate_grocery_list: {str(e)}")
        print(f"DEBUG: Traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/recipes", response_model=list[Recipe])
async def get_recipes():
    try:
        recipe_response = supabase.table("recipes").select("*").execute()
        return recipe_response.data or []
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
