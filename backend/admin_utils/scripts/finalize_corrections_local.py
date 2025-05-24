# /admin_utils/scripts/finalize_corrections_local.py

import os
import csv
import json
import logging
import time
from datetime import datetime
from dotenv import load_dotenv
import openai
import sys
import os
from supabase import create_client, Client

# Add backend/admin_utils to the Python path
SCRIPT_DIR = os.path.dirname(__file__)
ADMIN_UTILS_DIR = os.path.abspath(os.path.join(SCRIPT_DIR, ".."))
sys.path.append(ADMIN_UTILS_DIR)

# Import shared utilities
from utils.ingredient_lookup import find_ingredient_in_lookup_enhanced

# Import caching and logging utilities
try:
    from utils.llm_cache import create_correction_validation_cache
    from utils.api_logger import create_api_logger
    CACHE_AVAILABLE = True
except ImportError:
    CACHE_AVAILABLE = False
    print("⚠️ Cache and logging utilities not available")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)

# --- Load Supabase environment variables and config ---
BACKEND_DIR = os.path.abspath(os.path.join(SCRIPT_DIR, "..", ".."))
BACKEND_ENV_PATH = os.path.join(BACKEND_DIR, ".env")
CONFIG_PATH = os.path.join(SCRIPT_DIR, "..", "config", "pipeline_config.json")

if os.path.exists(BACKEND_ENV_PATH):
    load_dotenv(BACKEND_ENV_PATH)

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise EnvironmentError("❌ SUPABASE_URL or SUPABASE_KEY not set in .env file")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def fetch_ingredient_lookup():
    # Try to get the table name from config, default to "ingredient_lookup" if not found
    table_name = "ingredient_lookup"  # Default value
    try:
        if os.path.exists(CONFIG_PATH):
            with open(CONFIG_PATH, 'r') as f:
                config = json.load(f)
                table_name = config.get("supabase_lookup_table", "ingredient_lookup")
    except Exception as e:
        print(f"Warning: Could not load config file: {e}. Using default table name 'ingredient_lookup'.")

    try:
        response = supabase.table(table_name).select("*").execute()
        if response.data is None:
            raise Exception("No data returned from Supabase.")
        return response.data
    except Exception as e:
        print(f"❌ Supabase fetch error: {e}")
        return []

# --- Setup ---
SCRIPT_DIR = os.path.dirname(__file__)
CSV_DIR = os.path.join(SCRIPT_DIR, "..", "csv")
FINALIZED_CSV_DIR = os.path.join(SCRIPT_DIR, "..", "csv", "finalized_csv")
LOG_DIR = os.path.join(SCRIPT_DIR, "..", "logs")
ENV_PATH = os.path.join(SCRIPT_DIR, "..", "config", ".env")
load_dotenv(dotenv_path=ENV_PATH)

# Create directories if they don't exist
os.makedirs(LOG_DIR, exist_ok=True)

# --- Fetch ingredient lookup data ---
ingredient_lookup = fetch_ingredient_lookup()

# --- OpenAI API Setup ---
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
OPENAI_BASE_URL = os.getenv("OPENAI_BASE_URL")

# Load gpt_model from pipeline_config.json
GPT_MODEL = None
if os.path.exists(CONFIG_PATH):
    try:
        with open(CONFIG_PATH, 'r') as f:
            config = json.load(f)
        GPT_MODEL = config.get("gpt_model", "openai/chatgpt-4o-latest")
        logging.info(f"✅ Loaded gpt_model from pipeline_config.json: {GPT_MODEL}")
    except Exception as e:
        logging.error(f"❌ Error loading pipeline_config.json: {e}")
        # Fallback to environment variable
        GPT_MODEL = os.getenv("OPENROUTER_MODEL", "anthropic/claude-3-haiku-20240307")
        logging.info(f"⚠️ Falling back to OPENROUTER_MODEL from .env: {GPT_MODEL}")
else:
    # Fallback to environment variable if config file doesn't exist
    GPT_MODEL = os.getenv("OPENROUTER_MODEL", "anthropic/claude-3-haiku-20240307")
    logging.info(f"⚠️ pipeline_config.json not found, using OPENROUTER_MODEL from .env: {GPT_MODEL}")

# Verify OpenAI API credentials
if not OPENAI_API_KEY or not OPENAI_BASE_URL or not GPT_MODEL:
    logging.warning("⚠️ OpenAI API credentials are not fully configured:")
    logging.warning(f"  - API Key: {'Set' if OPENAI_API_KEY else 'Missing'}")
    logging.warning(f"  - Base URL: {'Set' if OPENAI_BASE_URL else 'Missing'}")
    logging.warning(f"  - Model: {'Set' if GPT_MODEL else 'Missing'}")
    logging.warning("⚠️ API enrichment will not work without these credentials.")
else:
    logging.info("✅ OpenAI API credentials are configured.")
    logging.info(f"  - Using model: {GPT_MODEL}")
    logging.info(f"  - Using base URL: {OPENAI_BASE_URL}")

# --- Enhanced utility function using shared lookup utilities ---
def check_ingredient_in_supabase(normalized_name, ingredient_lookup):
    """Enhanced lookup using shared utilities - searches canonical, synonym, and plural columns"""
    return find_ingredient_in_lookup_enhanced(normalized_name, ingredient_lookup)

def enrich_ingredient_data(raw_text, openai_api_key, openai_base_url, openai_model, cache=None, api_logger=None):
    """
    Enrich ingredient data using API with caching and logging support.
    
    Args:
        raw_text: The ingredient text to enrich
        openai_api_key: API key for OpenAI/OpenRouter
        openai_base_url: Base URL for the API
        openai_model: Model to use
        cache: LLMCache instance for caching results
        api_logger: APILogger instance for logging API calls
    """
    logging.info(f"🔄 Attempting to enrich ingredient data for: '{raw_text}'")
    
    if not openai_api_key or not openai_base_url or not openai_model:
        logging.error("❌ Missing OpenAI configuration. Check API key, base URL, and model.")
        return {}
    
    # Check cache first
    if cache and CACHE_AVAILABLE:
        cached_result = cache.get(raw_text, openai_model, "correction_validation")
        if cached_result:
            if api_logger:
                api_logger.log_api_call(
                    input_text=raw_text,
                    output_data=cached_result,
                    model=openai_model,
                    success=True,
                    cache_hit=True
                )
            logging.info(f"🎯 Cache hit for ingredient: '{raw_text}'")
            return cached_result
    
    # Improved prompt for better consistency
    prompt = f"""Parse and validate this ingredient text: "{raw_text}"

Return a JSON object with exactly these keys:
- name: main ingredient name (required)
- unit: measurement unit (empty string if none)
- modifiers: preparation/description terms (empty string if none)
- category: one of [Vegetables, Other, Condiments & Spices, Meat & Seafood, Dairy, Fruits, Grains & Bakery]
- synonym_of: comma-separated synonyms (empty string if none)
- plural: comma-separated plural forms (empty string if none)

Examples:
"2 cups diced tomatoes" → {{"name": "tomatoes", "unit": "cups", "modifiers": "diced", "category": "Vegetables", "synonym_of": "", "plural": "tomato"}}
"salt to taste" → {{"name": "salt", "unit": "", "modifiers": "to taste", "category": "Condiments & Spices", "synonym_of": "", "plural": ""}}

JSON:"""

    start_time = time.time()
    success = False
    error_message = ""
    estimated_cost = 0.003  # Rough estimate for validation requests
    result = {}
    
    try:
        logging.info("📡 Sending request to OpenAI API...")
        
        # For OpenRouter API
        if "openrouter.ai" in openai_base_url:
            # Direct HTTP request for OpenRouter
            import requests
            headers = {
                "Authorization": f"Bearer {openai_api_key}",
                "Content-Type": "application/json"
            }
            data = {
                "model": openai_model,
                "messages": [
                    {"role": "system", "content": "You are a helpful assistant that validates and enriches ingredient data. Always return valid JSON with the exact keys requested."},
                    {"role": "user", "content": prompt}
                ],
                "response_format": {"type": "json_object"},
                "temperature": 0,
                "max_tokens": 200
            }
            response = requests.post(f"{openai_base_url}/chat/completions", headers=headers, json=data)
            response_json = response.json()
            
            response_time_ms = (time.time() - start_time) * 1000
            logging.info(f"📊 Raw API response: {response_json}")
            
            if "choices" in response_json and len(response_json["choices"]) > 0:
                if "message" in response_json["choices"][0] and "content" in response_json["choices"][0]["message"]:
                    content = response_json["choices"][0]["message"]["content"]
                    
                    # Extract JSON object from the content string
                    try:
                        json_start = content.find('{')
                        json_end = content.rfind('}') + 1
                        json_string = content[json_start:json_end]
                        result = json.loads(json_string)
                        success = True
                        logging.info(f"✅ Successfully received API response for '{raw_text}'")
                        logging.info(f"📊 Parsed result: {result}")
                    except json.JSONDecodeError as e:
                        error_message = f"JSON decode error: {e}"
                        logging.error(f"❌ Error decoding JSON: {e}")
                        logging.error(f"❌ Raw content: {content}")
                        result = {}
            else:
                error_message = f"Unexpected API response format: {response_json}"
                logging.error(f"❌ Unexpected API response format: {response_json}")
                result = {}
        else:
            # Standard OpenAI client
            client = openai.OpenAI(
                api_key=openai_api_key,
                base_url=openai_base_url
            )
            
            completion = client.chat.completions.create(
                model=openai_model,
                messages=[
                    {"role": "system", "content": "You are a helpful assistant that validates and enriches ingredient data. Always return valid JSON with the exact keys requested."},
                    {"role": "user", "content": prompt}
                ],
                response_format={"type": "json_object"},
                temperature=0,
                max_tokens=200
            )
            
            response_time_ms = (time.time() - start_time) * 1000
            result = json.loads(completion.choices[0].message.content)
            success = True
            logging.info(f"✅ Successfully received API response for '{raw_text}'")
            logging.info(f"📊 Parsed result: {result}")
            
    except Exception as e:
        success = False
        error_message = str(e)
        response_time_ms = (time.time() - start_time) * 1000
        logging.error(f"❌ Error calling OpenAI API: {e}")
        logging.exception("Detailed error:")
        result = {}
    
    # Log the API call
    if api_logger:
        api_logger.log_api_call(
            input_text=raw_text,
            output_data=result,
            model=openai_model,
            success=success,
            error_message=error_message,
            response_time_ms=response_time_ms,
            estimated_cost=estimated_cost,
            cache_hit=False
        )
    
    # Cache the result if successful
    if cache and CACHE_AVAILABLE and success and result:
        cache.set(raw_text, result, openai_model, "correction_validation", estimated_cost)
    
    return result

# --- Configurable filenames ---
def get_latest_csv(directory, prefix: str = "parsed_ingredients", check_finalized_csv: bool = False):
    if check_finalized_csv:
        files = [f for f in os.listdir(directory) if f.startswith(prefix) and f.endswith(".csv")]
    else:
        files = [f for f in os.listdir(directory) if f.startswith(prefix) and f.endswith(".csv")]
    if not files:
        raise FileNotFoundError(f"No parsed ingredient files found in '{directory}' with prefix '{prefix}'.")
    files.sort(reverse=True)
    return os.path.join(directory, files[0])

def load_csv(path):
    rows = []
    with open(path, newline='', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            rows.append(row)
    return rows

def save_csv(path, fieldnames, rows):
    with open(path, "w", newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)

# --- Main ---
def main():
    print("🔄 Starting local corrections finalization process...")

    # Initialize cache and logger
    cache = None
    api_logger = None
    
    if CACHE_AVAILABLE:
        cache = create_correction_validation_cache()
        api_logger = create_api_logger("finalize_corrections_local")
        print("✅ Cache and API logging initialized")
        cache.print_stats()

    try:
        initial_csv_path = get_latest_csv(FINALIZED_CSV_DIR, check_finalized_csv=True)
        print(f"📄 Found initial CSV: {initial_csv_path}")
        initial_rows = load_csv(initial_csv_path)
    except FileNotFoundError as e:
        print(f"❌ Error: {e}")
        return

    try:
        finalized_csv_path = get_latest_csv(FINALIZED_CSV_DIR)
        print(f"✅ Found finalized CSV: {finalized_csv_path}")
        finalized_rows = load_csv(finalized_csv_path)
    except FileNotFoundError as e:
        print(f"❌ Error: {e}")
        print("Please ensure you have a finalized CSV in the 'final_csv' folder.")
        return

    # Create a dictionary to map recipe_id and name to the finalized row
    finalized_map = { (row["recipe_id"], row["name"]) : row for row in finalized_rows }

    updated_rows = []
    api_enriched_count = 0
    supabase_matched_count = 0
    total_attention_items = 0
    
    print(f"📊 Processing {len(initial_rows)} rows...")

    for i, row in enumerate(initial_rows):
        if i % 100 == 0:  # Progress indicator
            print(f"🔄 Processing {i+1}/{len(initial_rows)} rows...")
            
        if not row.get("recipe_id"):
            print(f"Skipping row due to missing recipe_id: {row.get('raw_text')}")
            continue

        key = (row["recipe_id"], row["name"])
        
        # Check if normalized_name exists in Supabase lookup table using enhanced lookup
        normalized_name = row.get("normalized_name", "")
        supabase_data = check_ingredient_in_supabase(normalized_name, ingredient_lookup)

        # Add debug logging to see the actual value of needs_attention
        attention_value = row.get("needs_attention")
        logging.info(f"🔍 Row '{row.get('raw_text')}' has needs_attention value: '{attention_value}' (type: {type(attention_value).__name__})")
        
        # Check for various representations of True
        if attention_value in ["True", "true", "TRUE", True, "1", "yes", "Yes", "YES"]:
            total_attention_items += 1
            logging.info(f"🚨 Found row needing attention: '{row.get('raw_text')}' (recipe_id: {row.get('recipe_id')})")
            
            if supabase_data:
                supabase_matched_count += 1
                logging.info(f"✅ Found matching data in Supabase for normalized name: '{normalized_name}' using enhanced lookup")
                # Use data from Supabase lookup table
                row["name"] = supabase_data.get("name", row["name"])
                row["unit"] = supabase_data.get("unit", row["unit"])
                row["modifiers"] = supabase_data.get("modifiers", row["modifiers"])
                row["category"] = supabase_data.get("category", "")
                row["plural"] = supabase_data.get("plurals", "")
                row["needs_attention"] = "False"
                logging.info(f"✅ Updated row with Supabase data: name='{row['name']}', unit='{row['unit']}', modifiers='{row['modifiers']}'")
            else:
                logging.info(f"❌ No matching data in Supabase for '{normalized_name}' (checked canonical, synonyms, and plurals). Attempting to enrich with OpenAI API...")
                # Enrich ingredient data using OpenAI API with caching
                enriched_data = enrich_ingredient_data(
                    row["raw_text"], 
                    OPENAI_API_KEY, 
                    OPENAI_BASE_URL, 
                    GPT_MODEL,
                    cache=cache,
                    api_logger=api_logger
                )

                if enriched_data:
                    api_enriched_count += 1
                    logging.info(f"✅ Successfully enriched data for '{row.get('raw_text')}'")
                    # Update the row with enriched data
                    enriched_name = enriched_data.get("name", "")
                    if enriched_name:
                        row["name"] = enriched_name
                    enriched_unit = enriched_data.get("unit", "")
                    if enriched_unit:
                        row["unit"] = enriched_unit
                    enriched_modifiers = enriched_data.get("modifiers", "")
                    if enriched_modifiers:
                        row["modifiers"] = enriched_modifiers
                    row["category"] = enriched_data.get("category", "")
                    row["synonym_of"] = enriched_data.get("synonym_of", "")
                    row["plural"] = enriched_data.get("plural", "")
                    row["needs_attention"] = "False"  # Mark as no longer needing attention
                    logging.info(f"✅ Updated row with API data: name='{row['name']}', unit='{row['unit']}', modifiers='{row['modifiers']}'")
                else:
                    logging.warning(f"⚠️ Failed to enrich data for '{row.get('raw_text')}'. Keeping original values.")
        elif key in finalized_map:
            # Update the initial row with values from the finalized row
            finalized_row = finalized_map[key]
            row["quantity"] = finalized_row["quantity"]
            row["unit"] = finalized_row["unit"]
            row["modifiers"] = finalized_row["modifiers"]
            row["category"] = finalized_row["category"]
            row["synonym_of"] = finalized_row["synonym_of"]
            row["plural"] = finalized_row["plural"]
            row["needs_attention"] = "False" # Mark as no longer needing attention

        updated_rows.append(row)

    # Count how many rows were updated
    attention_count = sum(1 for row in initial_rows if row.get("needs_attention") in ["True", "true", "TRUE", True, "1", "yes", "Yes", "YES"])
    updated_count = sum(1 for row in updated_rows if row.get("needs_attention") == "False" and
                        any(r for r in initial_rows if r.get("recipe_id") == row.get("recipe_id") and
                            r.get("name") == row.get("name") and
                            r.get("needs_attention") in ["True", "true", "TRUE", True, "1", "yes", "Yes", "YES"]))
    
    logging.info(f"📊 Summary: Found {attention_count} rows needing attention, updated {updated_count} rows")
    
    # Save the updated rows to the finalized CSV directory
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    output_filename = f"parsed_ingredients_{timestamp}_api.csv"
    output_path = os.path.join(FINALIZED_CSV_DIR, output_filename)
    save_csv(output_path, fieldnames=initial_rows[0].keys(), rows=updated_rows)

    logging.info(f"✅ Successfully updated and saved finalized CSV to {output_path}")
    print(f"✅ Successfully updated and saved finalized CSV to {output_path}")
    
    # Enhanced reporting and logging
    if api_logger:
        api_logger.print_session_stats()
        api_logger.save_session_summary()
        
        # Export failed calls for debugging
        failed_calls = api_logger.export_failed_calls()
        if failed_calls:
            failed_log_path = os.path.join(LOG_DIR, f"failed_api_calls_{timestamp}.json")
            api_logger.export_failed_calls(failed_log_path)
            print(f"❌ Exported {len(failed_calls)} failed API calls to {failed_log_path}")
    
    if cache:
        cache.print_stats()
        
        # Export cache for analysis
        cache_export_path = os.path.join(LOG_DIR, f"cache_export_{timestamp}.json")
        cache.export_cache_entries(cache_export_path)
        print(f"💾 Exported cache entries to {cache_export_path}")

    print("\n" + "="*60)
    print("📊 FINALIZATION SUMMARY")
    print("="*60)
    print(f"Total rows processed: {len(initial_rows)}")
    print(f"Rows needing attention: {attention_count}")
    print(f"Supabase matches found: {supabase_matched_count}")
    print(f"API enrichments performed: {api_enriched_count}")
    print(f"Total rows updated: {updated_count}")
    print(f"Success rate: {updated_count/attention_count*100:.1f}%" if attention_count > 0 else "N/A")
    print("="*60)

if __name__ == "__main__":
    main()
