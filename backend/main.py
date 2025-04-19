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

        if not req.is_guest:
            if not req.user_id:
                raise HTTPException(status_code=400, detail="User ID is required for signed-in users")
            
            # Fetch user plans
            plan_response = supabase.table("plans").select("*").eq("user_id", req.user_id).execute()
            plan_data = plan_response.data or []
            plan_recipe_ids = set()
            for plan in plan_data:
                plan_recipe_ids.update(plan.get("recipe_ids", []))

            # Fetch pantry
            pantry_response = supabase.table("pantry").select("*").eq("user_id", req.user_id).execute()
            pantry_data = pantry_response.data or []
            pantry_items = [PantryItem(**item) for item in pantry_data]

            # Fetch recipes
            recipe_response = supabase.table("recipes").select("*").execute()
            all_recipes = recipe_response.data or []
            recipes = [Recipe(**r) for r in all_recipes if r["id"] in plan_recipe_ids]

        else:
            recipe_ids = set(req.selected_ids or [])
            plan_ids = set(req.plan_ids or [])
            if not recipe_ids and not plan_ids:
                return GroceryResponse(categorized={}, raw=[])
            
            recipe_response = supabase.table("recipes").select("*").execute()
            all_recipes = recipe_response.data or []
            recipes = [Recipe(**r) for r in all_recipes if r["id"] in recipe_ids or r["id"] in plan_ids]

        # Run smart aggregation
        aggregator = SmartGroceryAggregator(recipes, pantry_items)
        categorized, raw = aggregator.generate()

        return GroceryResponse(categorized=categorized, raw=raw)

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ✅ New Route Added
@app.get("/api/recipes", response_model=list[Recipe])
async def get_recipes():
    try:
        recipe_response = supabase.table("recipes").select("*").execute()
        return recipe_response.data or []
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
