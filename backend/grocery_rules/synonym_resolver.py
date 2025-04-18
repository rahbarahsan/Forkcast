from typing import Optional
from functools import lru_cache

# Handle imports for both direct execution and module import
try:
    # Try relative imports (for when the file is imported as part of a package)
    from ..supabase_client import supabase
except ImportError:
    # Fall back to absolute imports (for when the file is run directly)
    from supabase_client import supabase

@lru_cache
def fetch_lookup_data():
    response = supabase.table("ingredient_lookup").select("*").execute()
    return response.data

def get_canonical_name(ingredient: str) -> Optional[str]:
    lookup = fetch_lookup_data()
    normalized = ingredient.strip().lower()

    for item in lookup:
        synonyms = [s.strip().lower() for s in item.get("synonyms", "").split(",")]
        if normalized in synonyms:
            return item["canonical"]
    return None
