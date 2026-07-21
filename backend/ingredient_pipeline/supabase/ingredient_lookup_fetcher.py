# /ingredient_pipeline/supabase/ingredient_lookup_fetcher.py

import os
import json
from dotenv import load_dotenv
from supabase import create_client, Client

# --- Load environment and config ---
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.abspath(os.path.join(CURRENT_DIR, "..", ".."))
ENV_PATH = os.path.join(BACKEND_DIR, ".env")
CONFIG_PATH = os.path.join(CURRENT_DIR, "..", "config", "pipeline_config.json")

if not os.path.exists(ENV_PATH):
    raise FileNotFoundError(f"❌ .env file not found at: {ENV_PATH}")
load_dotenv(ENV_PATH)

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
