# /ingredient_pipeline/scripts/push_to_grocery_items.py

import os
import csv
import json
from datetime import datetime
import sys
import os
from dotenv import load_dotenv

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.abspath(os.path.join(SCRIPT_DIR, "..", ".."))
sys.path.append(BACKEND_DIR)

from ingredient_pipeline.supabase.supabase_client import get_supabase_client

# --- Setup ---
SCRIPT_DIR = os.path.dirname(__file__)
ENV_PATH = os.path.join(SCRIPT_DIR, "..", "config", ".env")
CONFIG_PATH = os.path.join(SCRIPT_DIR, "..", "config", "pipeline_config.json")
load_dotenv(dotenv_path=ENV_PATH)


supabase = get_supabase_client()

# --- Setup paths ---
CSV_DIR = os.path.join(SCRIPT_DIR, "..", "csv")
FINALIZED_CSV_DIR = os.path.join(CSV_DIR, "finalized_csv")

# --- Load config ---
GROCERY_TABLE = "grocery_items_per_recipe"  # Default value
PARSING_MODE = "local"  # Default value
SELECTED_RECIPE_IDS = []
API_RECIPE_IDS = []

# Try to get the configuration from config file
try:
    if os.path.exists(CONFIG_PATH):
        with open(CONFIG_PATH, 'r') as f:
            config = json.load(f)
            GROCERY_TABLE = config.get("supabase_grocery_table", GROCERY_TABLE)
            PARSING_MODE = config.get("parsing_mode", PARSING_MODE)
            SELECTED_RECIPE_IDS = config.get("selected_recipe_ids", [])
            API_RECIPE_IDS = config.get("api_recipe_ids", [])
except Exception as e:
    print(f"Warning: Could not load config file: {e}. Using default values.")

# --- Configurable filenames ---
def get_latest_parsed_csv(prefix: str = "parsed_ingredients"):
    files = [f for f in os.listdir(FINALIZED_CSV_DIR) if f.startswith(prefix) and f.endswith(".csv")]
    if not files:
        raise FileNotFoundError(f"No finalized ingredient files found in '{FINALIZED_CSV_DIR}'. Please place the finalized CSV file in this folder.")
    files.sort(reverse=True)
    return os.path.join(FINALIZED_CSV_DIR, files[0])

# --- Validate CSV file ---
def validate_finalized_csv():
    """
    Validates that:
    1. The finalized_csv folder has only one file
    2. The recipe_ids in the CSV match the appropriate IDs based on parsing_mode
    
    Returns:
    - (bool, str): A tuple with validation result and message
    """
    # Check if finalized_csv folder has only one file
    files = [f for f in os.listdir(FINALIZED_CSV_DIR) if f.endswith(".csv")]
    if len(files) != 1:
        return False, f"Error: Expected exactly one CSV file in '{FINALIZED_CSV_DIR}', but found {len(files)} files."
    
    csv_path = os.path.join(FINALIZED_CSV_DIR, files[0])
    
    # Load the CSV and check recipe_ids
    recipe_ids_in_csv = set()
    try:
        with open(csv_path, newline='', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                recipe_id = row.get("recipe_id")
                if recipe_id:
                    recipe_ids_in_csv.add(recipe_id)
    except Exception as e:
        return False, f"Error reading CSV file: {e}"
    
    # Validate recipe_ids based on parsing_mode
    expected_ids = set(SELECTED_RECIPE_IDS if PARSING_MODE == "local" else API_RECIPE_IDS)
    
    if not expected_ids:
        return False, f"No recipe IDs configured for parsing mode '{PARSING_MODE}'. Please check your configuration."
    
    if not recipe_ids_in_csv:
        return False, "No recipe IDs found in the CSV file."
    
    if recipe_ids_in_csv != expected_ids:
        missing_ids = expected_ids - recipe_ids_in_csv
        extra_ids = recipe_ids_in_csv - expected_ids
        
        error_msg = f"Recipe ID mismatch for parsing mode '{PARSING_MODE}':"
        if missing_ids:
            error_msg += f"\n- Missing recipe IDs: {', '.join(missing_ids)}"
        if extra_ids:
            error_msg += f"\n- Unexpected recipe IDs: {', '.join(extra_ids)}"
        
        return False, error_msg
    
    return True, f"Validation successful. Found {len(recipe_ids_in_csv)} recipe IDs matching the configuration."

# --- Push to Supabase ---
def push_to_grocery_table(rows):
    """
    Pushes the rows to the grocery table.
    If recipe_id already exists, deletes existing entries before adding new ones.
    """
    table = GROCERY_TABLE
    
    # Group rows by recipe_id
    rows_by_recipe = {}
    for row in rows:
        recipe_id = row.get("recipe_id")
        if not recipe_id:
            continue
        
        if recipe_id not in rows_by_recipe:
            rows_by_recipe[recipe_id] = []
        
        rows_by_recipe[recipe_id].append(row)
    
    # Process each recipe_id
    for recipe_id, recipe_rows in rows_by_recipe.items():
        print(f"Processing recipe ID: {recipe_id}")
        
        # Check if recipe_id exists in the table
        existing = supabase.table(table).select("id").eq("recipe_id", recipe_id).execute()
        
        # If recipe_id exists, delete all entries for this recipe_id
        if existing.data:
            print(f"Found {len(existing.data)} existing entries for recipe ID {recipe_id}. Deleting...")
            supabase.table(table).delete().eq("recipe_id", recipe_id).execute()
        
        # Insert new rows for this recipe_id
        print(f"Inserting {len(recipe_rows)} new entries for recipe ID {recipe_id}...")
        for row in recipe_rows:
            # Handle both old and new column names for backward compatibility
            
            # Handle needs_attention
            needs_attention = True  # Default value
            if "needs_attention" in row:
                # Handle different possible boolean string representations
                attention_value = str(row.get("needs_attention", "")).lower()
                if attention_value in ["false", "0", "no", "n"]:
                    needs_attention = False
            
            # Create the data object to insert
            data = {
                "recipe_id": recipe_id,
                "raw_text": row.get("raw_text"),
                "quantity": row.get("quantity"),
                "unit": row.get("unit"),
                "name": row.get("name"),
                "modifiers": row.get("modifiers"),
                "category": row.get("category"),
                "plural": row.get("plural"),
                "needs_attention": needs_attention
            }
            
            # Add synonym_of if it exists in the row
            if "synonym_of" in row and row["synonym_of"]:
                data["synonym_of"] = row["synonym_of"]
            
            # Insert the data
            supabase.table(table).insert(data).execute()

# --- Load CSV ---
def load_parsed_csv(path):
    rows = []
    with open(path, newline='', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            rows.append(row)
    return rows

# --- Main ---
def main():
    print("🔍 Validating finalized CSV file...")
    is_valid, message = validate_finalized_csv()
    
    if not is_valid:
        print(f"❌ Validation failed: {message}")
        return
    
    print(f"✅ {message}")
    
    print("📥 Loading the finalized CSV file...")
    csv_path = get_latest_parsed_csv()
    print(f"📄 Found: {csv_path}")

    rows = load_parsed_csv(csv_path)
    print(f"📦 Loaded {len(rows)} rows. Starting Supabase updates...")

    push_to_grocery_table(rows)
    print(f"✅ Supabase {GROCERY_TABLE} table updated successfully.")

if __name__ == "__main__":
    main()
