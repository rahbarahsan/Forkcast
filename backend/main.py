# main.py

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

# Handle imports for both direct execution and module import
try:
    from .models import GroceryRequest, GroceryResponse, Recipe, PantryItem
    from .supabase_client import supabase
    from .smart_grocery_aggregator.smart_grocery_aggregator import SmartGroceryAggregator
except ImportError:
    from models import GroceryRequest, GroceryResponse, Recipe, PantryItem
    from supabase_client import supabase
    from smart_grocery_aggregator.smart_grocery_aggregator import SmartGroceryAggregator

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/api/grocery-list", response_model=GroceryResponse)
async def generate_grocery_list(req: GroceryRequest):
    try:
        recipes = []
        pantry_items = req.pantry_items or []

        print(f"DEBUG: Request: {req}")

        if not req.is_guest:
            if not req.user_id:
                raise HTTPException(status_code=400, detail="User ID is required for signed-in users")

            plan_response = supabase.table("plans").select("*").eq("user_id", req.user_id).execute()
            plan_data = plan_response.data or []
            plan_recipe_ids = set()
            for plan in plan_data:
                plan_recipe_ids.update(plan.get("recipe_ids", []))

            pantry_response = supabase.table("pantry").select("*").eq("user_id", req.user_id).execute()
            pantry_data = pantry_response.data or []
            pantry_items = [PantryItem(**item) for item in pantry_data]

            recipe_response = supabase.table("recipes").select("*").execute()
            all_recipes = recipe_response.data or []
            recipes = [Recipe(**r) for r in all_recipes if r["id"] in plan_recipe_ids]

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
