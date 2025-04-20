# main.py

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

# Handle imports for both direct execution and module import
try:
    # Try relative imports (for when the file is imported as part of a package)
    from .models import GroceryRequest, GroceryResponse, Recipe, PantryItem
    from .supabase_client import supabase
    from .smart_grocery_aggregator.smart_grocery_aggregator import SmartGroceryAggregator
except ImportError:
    # Fall back to absolute imports (for when the file is run directly)
    from models import GroceryRequest, GroceryResponse, Recipe, PantryItem
    from supabase_client import supabase
    from smart_grocery_aggregator.smart_grocery_aggregator import SmartGroceryAggregator

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific frontend URL
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
        print(f"DEBUG: Recipe IDs: {req.recipe_ids}")
        print(f"DEBUG: Plan IDs: {req.plan_ids}")
        print(f"DEBUG: Selected IDs: {req.selected_ids}")
        print(f"DEBUG: Pantry Items: {pantry_items}")

        if not req.is_guest:
            if not req.user_id:
                raise HTTPException(status_code=400, detail="User ID is required for signed-in users")
            
            # Fetch user plans
            plan_response = supabase.table("plans").select("*").eq("user_id", req.user_id).execute()
            plan_data = plan_response.data or []
            plan_recipe_ids = set()
            for plan in plan_data:
                plan_recipe_ids.update(plan.get("recipe_ids", []))

            print(f"DEBUG: Plan recipe IDs: {plan_recipe_ids}")

            # Fetch pantry
            pantry_response = supabase.table("pantry").select("*").eq("user_id", req.user_id).execute()
            pantry_data = pantry_response.data or []
            pantry_items = [PantryItem(**item) for item in pantry_data]

            print(f"DEBUG: Pantry items: {pantry_items}")

            # Fetch recipes
            recipe_response = supabase.table("recipes").select("*").execute()
            all_recipes = recipe_response.data or []
            recipes = [Recipe(**r) for r in all_recipes if r["id"] in plan_recipe_ids]

            print(f"DEBUG: Recipes: {recipes}")

        else:
            selected_ids = set(req.selected_ids or [])
            plan_ids = set(req.plan_ids or [])
            recipe_ids = set(req.recipe_ids or [])  # Get recipe_ids from request
            
            if not selected_ids and not plan_ids and not recipe_ids:
                return GroceryResponse(categorized={}, raw={})
            
            print(f"DEBUG: Guest mode - Selected IDs: {selected_ids}, Plan IDs: {plan_ids}, Recipe IDs: {recipe_ids}")
            
            recipe_response = supabase.table("recipes").select("*").execute()
            all_recipes = recipe_response.data or []
            
            # Include recipes from selected_ids, plan_ids, and recipe_ids
            recipes = [Recipe(**r) for r in all_recipes if r["id"] in selected_ids or r["id"] in plan_ids or r["id"] in recipe_ids]

            # If we have recipe_ids but no recipes were found, it might be because the recipe IDs are not in the database
            # In that case, we can try to fetch the recipes directly from the recipe_ids
            if recipe_ids and not recipes:
                print(f"DEBUG: No recipes found for recipe_ids: {recipe_ids}, trying to fetch directly")
                for recipe_id in recipe_ids:
                    try:
                        recipe_response = supabase.table("recipes").select("*").eq("id", recipe_id).execute()
                        if recipe_response.data:
                            recipes.append(Recipe(**recipe_response.data[0]))
                    except Exception as e:
                        print(f"DEBUG: Error fetching recipe {recipe_id}: {str(e)}")

            print(f"DEBUG: Guest mode - Recipes: {recipes}")

        # Validate recipes format
        for recipe in recipes:
            if not hasattr(recipe, 'ingredients') or not isinstance(recipe.ingredients, list):
                print(f"DEBUG: Invalid recipe format: {recipe}")
                raise ValueError(f"Invalid recipe format: {recipe}. 'ingredients' must be a list.")
                
        # Log pantry items for debugging
        print(f"DEBUG: Pantry items detail: {[{'id': p.id, 'name': p.name, 'quantity': p.quantity} for p in pantry_items]}")

        # Run smart aggregation
        try:
            print(f"DEBUG: Creating SmartGroceryAggregator with recipes: {recipes}, pantry_items: {pantry_items}")
            aggregator = SmartGroceryAggregator(recipes, pantry_items)
            print(f"DEBUG: Calling aggregator.generate()")
            categorized, raw = aggregator.generate()
            print(f"DEBUG: Aggregator result - categorized: {categorized}, raw: {raw}")
        except Exception as agg_error:
            print(f"DEBUG: Error in SmartGroceryAggregator: {str(agg_error)}")
            raise ValueError(f"Error in SmartGroceryAggregator: {str(agg_error)}")

        # Convert raw to the expected format if it's not already
        if isinstance(raw, dict):
            # It's already in the right format
            raw_dict = raw
        else:
            # Convert list to dict format
            raw_dict = {ingredient: {"kg": 1.0} for ingredient in raw}

        return GroceryResponse(categorized=categorized, raw=raw_dict)

    except Exception as e:
        print(f"DEBUG: Error in generate_grocery_list: {str(e)}")
        import traceback
        print(f"DEBUG: Traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=str(e))


# ✅ New Route Added
@app.get("/api/recipes", response_model=list[Recipe])
async def get_recipes():
    try:
        recipe_response = supabase.table("recipes").select("*").execute()
        return recipe_response.data or []
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
