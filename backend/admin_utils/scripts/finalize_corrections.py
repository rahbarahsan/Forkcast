# /admin_utils/scripts/finalize_corrections.py

import os
import csv
import json
import logging
import sys
from datetime import datetime
from dotenv import load_dotenv

# Add backend/admin_utils to the Python path
SCRIPT_DIR = os.path.dirname(__file__)

BACKEND_DIR = os.path.abspath(os.path.join(SCRIPT_DIR, "..",".."))
sys.path.append(BACKEND_DIR)
# Import Supabase client
from admin_utils.supabase.supabase_client import get_supabase_client
ADMIN_UTILS_DIR = os.path.abspath(os.path.join(SCRIPT_DIR, ".."))
sys.path.append(ADMIN_UTILS_DIR)
# Import shared utilities
from utils.ingredient_lookup import (
    find_ingredient_in_lookup_enhanced,
    generate_plural,
    split_and_clean,
    join_set
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)

# --- Setup ---
ENV_PATH = os.path.join(SCRIPT_DIR, "..", "config", ".env")
CONFIG_PATH = os.path.join(SCRIPT_DIR, "..", "config", "pipeline_config.json")
CSV_DIR = os.path.join(SCRIPT_DIR, "..", "csv")
FINALIZED_CSV_DIR = os.path.join(CSV_DIR, "finalized_csv")
LOGS_DIR = os.path.join(SCRIPT_DIR, "..", "logs")

load_dotenv(dotenv_path=ENV_PATH)
supabase = get_supabase_client()

# --- Load configuration ---
def load_config():
    """Load configuration from pipeline_config.json"""
    config = {
        "supabase_lookup_table": "ingredient_lookup",
        "allow_category_override": False
    }
    
    try:
        if os.path.exists(CONFIG_PATH):
            with open(CONFIG_PATH, 'r') as f:
                file_config = json.load(f)
                config.update(file_config)
                logging.info(f"Loaded config from {CONFIG_PATH}")
    except Exception as e:
        logging.warning(f"Could not load config file: {e}. Using default values.")
    
    return config

# --- Constants ---
ALLOWED_CATEGORIES = [
    "Vegetables", "Other", "Condiments & Spices", 
    "Meat & Seafood", "Dairy", "Fruits", "Grains & Bakery"
]

# --- Utility functions ---
def get_latest_finalized_csv():
    """Get the latest finalized CSV file"""
    files = [f for f in os.listdir(FINALIZED_CSV_DIR) if f.endswith(".csv")]
    if not files:
        raise FileNotFoundError(f"No CSV files found in '{FINALIZED_CSV_DIR}'")
    files.sort(reverse=True)
    return os.path.join(FINALIZED_CSV_DIR, files[0])

def load_csv(path):
    """Load CSV file and return rows"""
    rows = []
    with open(path, newline='', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            rows.append(row)
    return rows

def fetch_ingredient_lookup(table_name):
    """Fetch all ingredient lookup data from Supabase"""
    try:
        response = supabase.table(table_name).select("*").execute()
        if response.data is None:
            logging.warning("No data returned from Supabase ingredient lookup table")
            return []
        return response.data
    except Exception as e:
        logging.error(f"Error fetching ingredient lookup data: {e}")
        return []

def is_attention_needed(row):
    """Check if a row needs attention"""
    attention_value = row.get("needs_attention", "")
    if isinstance(attention_value, bool):
        return attention_value
    
    attention_str = str(attention_value).lower().strip()
    return attention_str in ["true", "1", "yes", "y"]

def is_valid_category(category):
    """Check if category is in allowed list"""
    return category in ALLOWED_CATEGORIES

def create_log_entry(action, canonical, data):
    """Create a log entry for tracking changes"""
    return {
        "timestamp": datetime.now().isoformat(),
        "action": action,
        "canonical": canonical,
        "data": json.dumps(data)
    }

def save_log(log_entries):
    """Save log entries to CSV file"""
    if not log_entries:
        return
    
    # Ensure logs directory exists
    os.makedirs(LOGS_DIR, exist_ok=True)
    
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    log_filename = f"finalize_corrections_log_{timestamp}.csv"
    log_path = os.path.join(LOGS_DIR, log_filename)
    
    fieldnames = ["timestamp", "action", "canonical", "data"]
    
    with open(log_path, "w", newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(log_entries)
    
    logging.info(f"Log saved to: {log_path}")

def create_comprehensive_entry(row, config):
    """Create rich lookup entry with inflect-powered plurals"""
    name = row.get("name", "").strip()
    canonical = (row.get("canonical") or row.get("normalize", "")).strip().lower()
    category = row.get("category", "").strip()
    synonym_of = row.get("synonym_of") or row.get("synonym", "")
    
    # Generate comprehensive plural data
    plurals = set()
    
    # Add plural of the main name
    if name:
        name_plural = generate_plural(name)
        if name_plural and name_plural.lower() != name.lower():
            plurals.add(name_plural.lower())
    
    # Add plural of canonical name
    if canonical:
        canonical_plural = generate_plural(canonical)
        if canonical_plural and canonical_plural.lower() != canonical.lower():
            plurals.add(canonical_plural.lower())
    
    # Process synonyms and add their plurals too
    synonyms = set()
    if synonym_of:
        for syn in synonym_of.split(','):
            syn = syn.strip()
            if syn:
                synonyms.add(syn.lower())
                # Add plural of each synonym
                syn_plural = generate_plural(syn)
                if syn_plural and syn_plural.lower() != syn.lower():
                    plurals.add(syn_plural.lower())
    
    # Validate category
    if not is_valid_category(category):
        category = ""
    
    return {
        "canonical": canonical,
        "synonym": join_set(synonyms),
        "plurals": join_set(plurals),
        "category": category
    }

def merge_entries_intelligently(existing, new_data, config):
    """Smart merging with inflect-powered plural handling"""
    updated = existing.copy()
    changes = {}
    
    # Merge synonyms
    existing_synonyms = split_and_clean(existing.get("synonym", ""))
    new_synonyms = split_and_clean(new_data.get("synonym", ""))
    
    if new_synonyms:
        merged_synonyms = existing_synonyms.union(new_synonyms)
        
        # Also add plurals of new synonyms
        existing_plurals = split_and_clean(existing.get("plurals", ""))
        for syn in new_synonyms:
            syn_plural = generate_plural(syn)
            if syn_plural and syn_plural != syn:
                existing_plurals.add(syn_plural.lower())
        
        if merged_synonyms != existing_synonyms:
            updated["synonym"] = join_set(merged_synonyms)
            changes["synonym"] = f"Added: {join_set(new_synonyms - existing_synonyms)}"
        
        # Update plurals if we added any
        updated["plurals"] = join_set(existing_plurals)
    
    # Merge plurals intelligently
    existing_plurals = split_and_clean(existing.get("plurals", ""))
    new_plurals = split_and_clean(new_data.get("plurals", ""))
    
    # Add plural of current name being processed
    current_name = new_data.get("name", "")
    if current_name:
        name_plural = generate_plural(current_name)
        if name_plural and name_plural.lower() != current_name.lower():
            new_plurals.add(name_plural.lower())
    
    if new_plurals:
        merged_plurals = existing_plurals.union(new_plurals)
        if merged_plurals != existing_plurals:
            updated["plurals"] = join_set(merged_plurals)
            changes["plurals"] = f"Added: {join_set(new_plurals - existing_plurals)}"
    
    # Handle category - only update if valid and not already set (or override allowed)
    new_category = new_data.get("category", "").strip()
    if is_valid_category(new_category):
        existing_category = existing.get("category", "").strip()
        if not existing_category or config.get("allow_category_override", False):
            if new_category != existing_category:
                updated["category"] = new_category
                changes["category"] = f"Updated from '{existing_category}' to '{new_category}'"
    
    return updated, changes

def process_ingredient_row(row, lookup_table, config, log_entries):
    """Process a single ingredient row"""
    # Skip rows that need attention
    if is_attention_needed(row):
        logging.info(f"Skipping row needing attention: {row.get('name', 'Unknown')}")
        return None
    
    # Get canonical name (try both possible column names)
    canonical = (row.get("canonical") or row.get("normalize", "")).strip().lower()
    if not canonical:
        logging.warning(f"No canonical name found for row: {row.get('name', 'Unknown')}")
        return None
    
    # Use enhanced lookup to find existing entry
    existing_entry = find_ingredient_in_lookup_enhanced(canonical, lookup_table)
    
    if existing_entry:
        # Update existing entry
        new_data = create_comprehensive_entry(row, config)
        updated_entry, changes = merge_entries_intelligently(existing_entry, new_data, config)
        
        if changes:
            log_entries.append(create_log_entry("UPDATE", canonical, changes))
            logging.info(f"Updating entry for: {canonical} - Changes: {changes}")
            return updated_entry
        else:
            logging.debug(f"No changes needed for: {canonical}")
            return None
    else:
        # Create new entry
        new_entry = create_comprehensive_entry(row, config)
        log_entries.append(create_log_entry("INSERT", canonical, new_entry))
        logging.info(f"Creating new entry for: {canonical}")
        return new_entry

def upsert_to_supabase(entries, table_name):
    """Upsert entries to Supabase using the canonical column"""
    if not entries:
        logging.info("No entries to upsert")
        return
    
    try:
        # Use upsert with on_conflict parameter
        response = supabase.table(table_name).upsert(
            entries, 
            on_conflict="canonical"
        ).execute()
        
        logging.info(f"Successfully upserted {len(entries)} entries to {table_name}")
        
    except Exception as e:
        logging.error(f"Error upserting to Supabase: {e}")
        # Try individual inserts/updates as fallback
        logging.info("Attempting individual operations as fallback...")
        
        for entry in entries:
            try:
                canonical = entry["canonical"]
                
                # Check if exists
                existing = supabase.table(table_name).select("canonical").eq("canonical", canonical).execute()
                
                if existing.data:
                    # Update
                    supabase.table(table_name).update(entry).eq("canonical", canonical).execute()
                else:
                    # Insert
                    supabase.table(table_name).insert(entry).execute()
                    
            except Exception as individual_error:
                logging.error(f"Error processing entry {entry.get('canonical', 'Unknown')}: {individual_error}")

def main():
    """Main function to process finalized corrections"""
    logging.info("🔄 Starting finalize corrections process...")
    
    # Load configuration
    config = load_config()
    table_name = config["supabase_lookup_table"]
    
    logging.info(f"Using lookup table: {table_name}")
    
    try:
        # Get the latest finalized CSV
        csv_path = get_latest_finalized_csv()
        logging.info(f"📄 Processing CSV: {csv_path}")
        
        # Load CSV data
        csv_rows = load_csv(csv_path)
        logging.info(f"📦 Loaded {len(csv_rows)} rows from CSV")
        
        # Fetch existing lookup data
        logging.info("📥 Fetching existing ingredient lookup data...")
        lookup_data = fetch_ingredient_lookup(table_name)
        logging.info(f"📊 Loaded {len(lookup_data)} existing lookup entries")
        
        # Process each row
        entries_to_upsert = []
        log_entries = []
        skipped_count = 0
        
        for row in csv_rows:
            processed_entry = process_ingredient_row(row, lookup_data, config, log_entries)
            
            if processed_entry:
                entries_to_upsert.append(processed_entry)
            else:
                skipped_count += 1
        
        logging.info(f"📊 Processing summary:")
        logging.info(f"  - Total rows processed: {len(csv_rows)}")
        logging.info(f"  - Entries to upsert: {len(entries_to_upsert)}")
        logging.info(f"  - Rows skipped: {skipped_count}")
        
        # Upsert to Supabase
        if entries_to_upsert:
            logging.info("📤 Upserting entries to Supabase...")
            upsert_to_supabase(entries_to_upsert, table_name)
        
        # Save log
        if log_entries:
            logging.info("📝 Saving operation log...")
            save_log(log_entries)
        
        logging.info("✅ Finalize corrections process completed successfully!")
        
    except Exception as e:
        logging.error(f"❌ Error in finalize corrections process: {e}")
        raise

if __name__ == "__main__":
    main()
