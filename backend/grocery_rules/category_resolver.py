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

def get_category(ingredient: Optional[str]) -> Optional[str]:
    """
    Resolves the category for a normalized ingredient name.
    Returns None if the ingredient is None or no category is found.
    """
    if ingredient is None:
        return None

    lookup = fetch_lookup_data()
    normalized = ingredient.strip().lower()

    for item in lookup:
        synonyms = [s.strip().lower() for s in item.get("synonyms", "").split(",")]
        exceptions = [e.strip().lower() for e in item.get("exceptions", "").split(",")] if item.get("exceptions") else []
        if normalized in synonyms and normalized not in exceptions:
            return item["category"]
    return "Unknown" # Return "Unknown" category if no specific category is found
