# /ingredient_pipeline/scripts/enrich_ingredients_from_supabase.py

import os
import csv
import json
import time
from datetime import datetime
from typing import List
from dotenv import load_dotenv
import sys
import os

# Add the parent directory to sys.path
parent_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(parent_dir)

# Import from the correct paths
import openai
import json

# Use relative imports
from ..supabase.recipes_fetcher import fetch_recipes
from .parse_ingredients import parse_ingredient_line_local, parse_ingredient_line_api
from ..supabase.ingredient_lookup_fetcher import fetch_ingredient_lookup

# Import shared utilities for enhanced lookup
try:
    from ..utils.ingredient_lookup import find_ingredient_in_lookup_enhanced
    ENHANCED_LOOKUP_AVAILABLE = True
except ImportError:
    ENHANCED_LOOKUP_AVAILABLE = False
    print("⚠️ Enhanced lookup utilities not available, using basic lookup")

# Import caching and logging utilities
try:
    from ..utils.llm_cache import create_ingredient_parsing_cache
    from ..utils.api_logger import create_api_logger
    CACHE_AVAILABLE = True
except ImportError:
    CACHE_AVAILABLE = False
    print("⚠️ Cache and logging utilities not available")

# --- Strict ENV and CONFIG checks ---
SCRIPT_DIR = os.path.dirname(__file__)
CONFIG_PATH = os.path.join(SCRIPT_DIR, "..", "config", "pipeline_config.json")
ENV_PATH = os.path.join(SCRIPT_DIR, "..", "config", ".env")
LOG_DIR = os.path.join(SCRIPT_DIR, "..", "logs")

# Ensure .env exists
if not os.path.exists(ENV_PATH):
    raise FileNotFoundError(f"Missing .env file at {ENV_PATH}!")

load_dotenv(dotenv_path=ENV_PATH)

# Ensure required keys exist
for var in ["SUPABASE_URL", "SUPABASE_KEY"]:
    if not os.getenv(var):
        raise ValueError(f"Missing required environment variable: {var}")

# Ensure config file exists
if not os.path.exists(CONFIG_PATH):
    raise FileNotFoundError(f"Missing pipeline_config.json at {CONFIG_PATH}!")

# Load config
with open(CONFIG_PATH, 'r') as f:
    config = json.load(f)

# Create folders if missing
CSV_DIR = os.path.join(SCRIPT_DIR, "..", "csv")
FINALIZED_CSV_DIR = os.path.join(SCRIPT_DIR, "..", "csv", "finalized_csv")
os.makedirs(CSV_DIR, exist_ok=True)
os.makedirs(FINALIZED_CSV_DIR, exist_ok=True)
os.makedirs(LOG_DIR, exist_ok=True)

# --- CONFIG VALUES ---
parsing_mode = config.get("parsing_mode", "local")
gpt_model = config.get("gpt_model", "gpt-3.5-turbo")
use_full = config.get("use_full_recipe_table", True)
selected_ids = config.get("selected_recipe_ids", [])
save_with_timestamp = config.get("save_with_timestamp", True)
track_api = config.get("track_api_usage", False)
retry_delay = config.get("api_timeout_retry_seconds", 5)
MAX_API_RETRIES = config.get("max_api_retries", 5)
supabase_lookup_table = config.get("supabase_lookup_table", "ingredient_lookup")

# Fetch ingredient lookup data
ingredient_lookup = fetch_ingredient_lookup()

# Setup OpenAI-compatible endpoint for API parsing
openai.api_key = os.getenv("OPENAI_API_KEY")
openai.api_base = os.getenv("OPENAI_BASE_URL", "https://api.openai.com/v1")

# --- Utility: Execute with retry ---
def execute_with_retry(func, max_retries=MAX_API_RETRIES):
    for attempt in range(max_retries):
        try:
            result = func()
            return result
        except Exception as e:
            print(f"Attempt {attempt + 1} failed: {e}")
            if attempt < max_retries - 1:
                time.sleep(retry_delay)
    print(f"Max retries reached. Aborting.")
    return None

def enhanced_ingredient_lookup(canonical, ingredient_lookup):
    """Enhanced lookup function that searches canonical, synonym, and plural columns"""
    if ENHANCED_LOOKUP_AVAILABLE:
        return find_ingredient_in_lookup_enhanced(canonical, ingredient_lookup)
    else:
        # Fallback to basic lookup
        for item in ingredient_lookup:
            if item["canonical"] == canonical:
                return item
        return None

def process_parsed_ingredient(parsed, recipe_id, ingredient_text, ingredient_lookup, parsed_rows, api_logs):
    if not parsed:
        return

    raw_text = parsed.get("raw_text", ingredient_text)
    name = parsed.get("name", "")
    category = parsed.get("category", "")
    canonical = parsed.get("canonical", "")
    plural = ""
    modifiers = parsed.get("modifiers", "")

    needs_attention = False
    if not name or "ERROR" in name:
        needs_attention = True
    
    if canonical:
        # Enhanced lookup using shared utilities - searches canonical, synonym, and plural columns
        lookup_result = enhanced_ingredient_lookup(canonical, ingredient_lookup)
        
        if lookup_result:
            if not category:
                category = lookup_result.get("category", "")
            plural = lookup_result.get("plurals", "")
            print(f"✅ Enhanced lookup found match for '{canonical}' -> canonical: '{lookup_result.get('canonical', '')}'")
        else:
            needs_attention = True
            print(f"❌ Enhanced lookup found no match for '{canonical}' (checked canonical, synonyms, and plurals)")
    else:
        needs_attention = True
    
    if isinstance(modifiers, list):
        needs_attention = True

    # Create row with column names matching Supabase table structure
    parsed_rows.append({
        "recipe_id": recipe_id,
        "raw_text": raw_text,
        "quantity": parsed.get("quantity", ""),
        "unit": parsed.get("unit", ""),
        "name": name,
        "modifiers": modifiers,
        "canonical": canonical,  # Use canonical consistently
        "category": category,
        "synonym_of": parsed.get("synonym_of", ""),
        "plural": plural,
        "needs_attention": needs_attention,  # Use needs_attention to match Supabase column name
    })

# --- Main parsing pipeline ---
def main():
    local_recipe_ids = config.get("selected_recipe_ids", [])
    api_recipe_ids = config.get("api_recipe_ids", [])

    recipe_ids = local_recipe_ids if parsing_mode == "local" else api_recipe_ids
    recipes = fetch_recipes(use_full, recipe_ids)

    print(f"✅ Fetched {len(recipes)} recipes to process.")
    print(f"🔁 Using parsing mode: {parsing_mode}")
    print(f"🤖 Using model: {gpt_model}")
    
    if ENHANCED_LOOKUP_AVAILABLE:
        print("✅ Using enhanced lookup (searches canonical, synonyms, and plurals)")
    else:
        print("⚠️ Using basic lookup (canonical only)")

    # Initialize cache and logger for API mode
    cache = None
    api_logger = None
    
    if parsing_mode == "api" and CACHE_AVAILABLE:
        cache = create_ingredient_parsing_cache()
        api_logger = create_api_logger("enrich_ingredients_from_supabase")
        print("✅ Cache and API logging initialized")
        cache.print_stats()

    parsed_rows = []
    api_logs = []
    total_ingredients = 0
    processed_ingredients = 0

    # Count total ingredients for progress tracking
    for recipe in recipes:
        ingredients = recipe.get("ingredients", [])
        for ingredient_text in ingredients:
            if " or " in ingredient_text:
                total_ingredients += len(ingredient_text.split(" or "))
            elif " and " in ingredient_text:
                total_ingredients += len(ingredient_text.split(" and "))
            else:
                total_ingredients += 1

    print(f"📄 Processing {total_ingredients} ingredient entries from {len(recipes)} recipes...")

    for recipe in recipes:
        recipe_id = recipe["id"]
        ingredients = recipe.get("ingredients", [])

        if not ingredients:
            continue

        for ingredient_text in ingredients:
            # Split ingredient_text based on "or" and "and"
            ingredient_parts = []
            if " or " in ingredient_text:
                ingredient_parts.extend(ingredient_text.split(" or "))
            elif " and " in ingredient_text:
                ingredient_parts.extend(ingredient_text.split(" and "))
            else:
                ingredient_parts.append(ingredient_text)

            for part in ingredient_parts:
                part = part.strip()
                processed_ingredients += 1
                
                # Progress indicator
                if processed_ingredients % 50 == 0:
                    print(f"🔄 Processing {processed_ingredients}/{total_ingredients} ingredients...")
                
                if parsing_mode == "local":
                    parsed_output = parse_ingredient_line_local(part, ingredient_lookup=ingredient_lookup)
                    if isinstance(parsed_output, list):
                        for parsed in parsed_output:
                            process_parsed_ingredient(parsed, recipe_id, part, ingredient_lookup, parsed_rows, api_logs)
                    else:
                        process_parsed_ingredient(parsed_output, recipe_id, part, ingredient_lookup, parsed_rows, api_logs)
                else:
                    # Use enhanced API parsing with caching
                    parsed = execute_with_retry(
                        lambda: parse_ingredient_line_api(
                            part, 
                            ingredient_lookup=ingredient_lookup,
                            cache=cache,
                            api_logger=api_logger
                        )
                    )
                    if not parsed:
                        print(f"❌ Failed to parse ingredient after max retries: {part}")
                        # Create error entry
                        parsed = {
                            "raw_text": part,
                            "quantity": "",
                            "unit": "",
                            "name": f"PARSE_ERROR: {part}",
                            "modifiers": "",
                            "canonical": ""
                        }
                    process_parsed_ingredient(parsed, recipe_id, part, ingredient_lookup, parsed_rows, api_logs)

    # Save parsed CSV
    now = datetime.now().strftime("%Y%m%d_%H%M%S")
    prefix = "api_" if parsing_mode == "api" else ""
    filename = f"{prefix}parsed_ingredients_{now}.csv" if save_with_timestamp else f"{prefix}parsed_ingredients.csv"
    csv_path = os.path.join(CSV_DIR, filename)

    # Define CSV field names to match Supabase table structure
    csv_fieldnames = ["recipe_id", "raw_text", "quantity", "unit", "name", "modifiers", "canonical", "category", "synonym_of", "plural", "needs_attention"]

    with open(csv_path, "w", newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=csv_fieldnames)
        writer.writeheader()
        writer.writerows(parsed_rows)

    finalized_csv_path = os.path.join(FINALIZED_CSV_DIR, filename)

    with open(finalized_csv_path, "w", newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=csv_fieldnames)
        writer.writeheader()
        writer.writerows(parsed_rows)

    print(f"✅ Saved parsed ingredients to {csv_path} and {finalized_csv_path}")
    print(f"✅ Total parsed lines: {len(parsed_rows)}")

    # Count entries needing attention
    needs_attention_count = sum(1 for row in parsed_rows if row.get("needs_attention"))
    print(f"⚠️ Entries needing attention: {needs_attention_count}/{len(parsed_rows)} ({needs_attention_count/len(parsed_rows)*100:.1f}%)")

    # Enhanced API logging (replaces old basic logging)
    if parsing_mode == "api" and api_logger:
        api_logger.print_session_stats()
        api_logger.save_session_summary()
        
        # Export failed calls for debugging
        failed_calls = api_logger.export_failed_calls()
        if failed_calls:
            failed_log_path = os.path.join(LOG_DIR, f"failed_api_calls_{now}.json")
            api_logger.export_failed_calls(failed_log_path)
            print(f"❌ Exported {len(failed_calls)} failed API calls to {failed_log_path}")
    
    if parsing_mode == "api" and cache:
        cache.print_stats()
        
        # Export cache for analysis
        cache_export_path = os.path.join(LOG_DIR, f"cache_export_{now}.json")
        cache.export_cache_entries(cache_export_path)
        print(f"💾 Exported cache entries to {cache_export_path}")

    # Legacy API logging (kept for backward compatibility)
    if track_api and api_logs:
        log_file = os.path.join(LOG_DIR, f"api_usage_{now}.csv")
        with open(log_file, "w", newline='', encoding='utf-8') as f:
            writer = csv.DictWriter(f, fieldnames=["recipe_id", "input", "output", "model", "timestamp"])
            writer.writeheader()
            writer.writerows(api_logs)
        print(f"📊 Saved legacy API usage log to {log_file}")

    print("\n" + "="*60)
    print("📊 PROCESSING SUMMARY")
    print("="*60)
    print(f"Recipes processed: {len(recipes)}")
    print(f"Ingredients processed: {processed_ingredients}")
    print(f"Parsed entries created: {len(parsed_rows)}")
    print(f"Entries needing attention: {needs_attention_count}")
    print(f"Success rate: {(len(parsed_rows)-needs_attention_count)/len(parsed_rows)*100:.1f}%")
    print("="*60)

    # Show sample of parsed results
    print("\n🔍 Sample parsed results:")
    for i, row in enumerate(parsed_rows[:3]):
        print(f"{i+1}. {row['raw_text']} → {row['name']} ({row['quantity']} {row['unit']})")

if __name__ == "__main__":
    main()
