# /ingredient_pipeline/supabase/recipes_fetcher.py

import os
import json
from .supabase_client import get_supabase_client
from typing import List

# Get the directory of this file
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
# Path to the config file
CONFIG_PATH = os.path.join(CURRENT_DIR, "..", "config", "pipeline_config.json")

def fetch_recipes(use_full_table: bool, selected_ids: List[str] = None) -> list:
    supabase = get_supabase_client()
    
    # Try to get the table name from config, default to "recipes" if not found
    table_name = "recipes"  # Default value
    try:
        if os.path.exists(CONFIG_PATH):
            with open(CONFIG_PATH, 'r') as f:
                config = json.load(f)
                table_name = config.get("supabase_recipes_table", "recipes")
    except Exception as e:
        print(f"Warning: Could not load config file: {e}. Using default table name 'recipes'.")

    if use_full_table:
        response = supabase.table(table_name).select("id, ingredients").execute()
    else:
        if not selected_ids:
            raise ValueError("selected_ids must be provided if use_full_table is False.")
        response = supabase.table(table_name).select("id, ingredients").in_("id", selected_ids).execute()

    if not hasattr(response, 'data'):
        raise Exception(f"Error fetching recipes: {response}")

    return response.data

# Example usage if you run this file directly
if __name__ == "__main__":
    all_recipes = fetch_recipes(use_full_table=True)
    
    # Try to get the table name for the message
    table_name = "recipes"  # Default value
    try:
        if os.path.exists(CONFIG_PATH):
            with open(CONFIG_PATH, 'r') as f:
                config = json.load(f)
                table_name = config.get("supabase_recipes_table", "recipes")
    except Exception:
        pass
        
    print(f"Fetched {len(all_recipes)} recipes from {table_name} table.")
